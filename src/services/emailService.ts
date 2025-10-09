import nodemailer from "nodemailer";
import Payment from "../models/payments";
import { generateDonationReceiptPDF } from "../services/pdfService";
import config from "../config";
import path from "path";
import axios from "axios";

interface EmailCredentials {
  host: string;
  port: number;
  type: string;
  user: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  accessToken?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private credentials: EmailCredentials | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  // ---- Set Tokens from Config ----
  private setTokensFromConfig(): void {
    // Get tokens from config (you can add these to your .env file)
    this.accessToken = process.env.OAUTH_ACCESS_TOKEN || null;
    this.refreshToken = process.env.OAUTH_REFRESH_TOKEN || null;
    this.tokenExpiresAt = process.env.OAUTH_TOKEN_EXPIRES_AT
      ? parseInt(process.env.OAUTH_TOKEN_EXPIRES_AT)
      : null;

    console.log("Tokens loaded from config:", {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      expiresAt: this.tokenExpiresAt
        ? new Date(this.tokenExpiresAt).toISOString()
        : null,
    });

    // Check if tokens are expired
    if (this.tokenExpiresAt) {
      const now = Date.now();
      const timeUntilExpiry = this.tokenExpiresAt - now;
      const isExpired = now >= this.tokenExpiresAt;

      console.log("Token status:", {
        isExpired,
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60), // minutes
        currentTime: new Date(now).toISOString(),
        tokenExpiry: new Date(this.tokenExpiresAt).toISOString(),
      });
    }
  }

  // ---- Refresh Access Token ----
  private async refreshAccessToken(): Promise<string> {
    try {
      // Check if we're using client credentials flow (no refresh token)
      if (
        !this.refreshToken ||
        this.refreshToken === "client_credentials_flow"
      ) {
        console.log(
          "Email Service - Using client credentials flow, getting new token..."
        );
        return await this.getClientCredentialsToken();
      }

      console.log("Refreshing access token...");

      const tenantId = config.OAUTH_TENANT_ID;
      const clientId = config.OAUTH_CLIENT_ID;
      const clientSecret = config.OAUTH_CLIENT_SECRET;

      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

      const requestData = new URLSearchParams([
        ["client_id", clientId || ""],
        ["client_secret", clientSecret || ""],
        ["scope", "offline_access Mail.Send"],
        ["grant_type", "refresh_token"],
        ["refresh_token", this.refreshToken],
      ]);

      const response = await axios.post(tokenUrl, requestData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.refreshToken =
          response.data.refresh_token || this.refreshToken || ""; // Keep existing if not provided
        this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

        console.log("Access token refreshed successfully");
        console.log(
          "New access token expires at:",
          new Date(this.tokenExpiresAt).toISOString()
        );

        return this.accessToken || "";
      } else {
        throw new Error("No tokens received from refresh");
      }
    } catch (error: any) {
      console.error("Failed to refresh access token:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);

        // Check for OAuth-specific errors
        if (error.response.status === 400 || error.response.status === 401) {
          const errorData = error.response.data;
          if (
            errorData.error === "invalid_grant" ||
            errorData.error === "invalid_client" ||
            errorData.error === "unauthorized_client" ||
            errorData.error_description?.includes("refresh token") ||
            errorData.error_description?.includes("expired")
          ) {
            console.log("\n🚨 OAUTH AUTHORIZATION FAILED 🚨");
            console.log("=====================================");
            console.log("Please get new SMTP tokens:");
            console.log("1. Run: node get-smtp-tokens.js");
            console.log("2. Copy the new tokens to your .env file");
            console.log("3. Restart your server");
            console.log("=====================================\n");
          }
        }
      }
      throw new Error("Failed to refresh access token - please re-authorize");
    }
  }

  private async getClientCredentialsToken(): Promise<string> {
    try {
      const tenantId = config.OAUTH_TENANT_ID;
      const clientId = config.OAUTH_CLIENT_ID;
      const clientSecret = config.OAUTH_CLIENT_SECRET;

      console.log("Email Service - Getting new client credentials token...");

      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

      const requestData = new URLSearchParams([
        ["client_id", clientId || ""],
        ["client_secret", clientSecret || ""],
        ["scope", "https://outlook.office365.com/.default"],
        ["grant_type", "client_credentials"],
      ]);

      const response = await axios.post(tokenUrl, requestData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.refreshToken = "client_credentials_flow";
        this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

        console.log("Email Service - New client credentials token obtained");
        console.log(
          "Email Service - Token expires at:",
          new Date(this.tokenExpiresAt).toISOString()
        );

        return this.accessToken;
      } else {
        throw new Error("No tokens received from client credentials flow");
      }
    } catch (error: any) {
      console.error(
        "Email Service - Failed to get client credentials token:",
        error.message
      );
      throw error;
    }
  }

  // ---- Get Valid Access Token ----
  private async getValidAccessToken(): Promise<string> {
    try {
      console.log("Email Service - getValidAccessToken called");

      // Load tokens from config if not already loaded
      if (!this.accessToken) {
        console.log("Email Service - No access token, loading from config...");
        this.setTokensFromConfig();
      } else {
        console.log("Email Service - Access token already loaded");
      }

      // Check if we have tokens
      if (!this.accessToken) {
        console.log("\n🚨 NO ACCESS TOKEN AVAILABLE 🚨");
        console.log("=================================");
        console.log("Please authorize and get tokens:");
        console.log(
          "1. Visit: https://login.microsoftonline.com/e8d3c511-b8ef-4520-bfd3-ce059f6afed7/oauth2/v2.0/authorize?client_id=090fcebc-40d8-4696-8deb-34906087ded0&response_type=code&redirect_uri=http://localhost:3003/smtpweb&response_mode=query&scope=offline_access%20Mail.Send&state=12345"
        );
        console.log("2. Complete the OAuth flow");
        console.log("3. Get the authorization code from the redirect URL");
        console.log("4. Exchange the code for access_token and refresh_token");
        console.log("5. Update your .env file with:");
        console.log("   OAUTH_ACCESS_TOKEN=your_access_token");
        console.log("   OAUTH_REFRESH_TOKEN=your_refresh_token");
        console.log("   OAUTH_TOKEN_EXPIRES_AT=expiry_timestamp");
        console.log("=================================\n");
        throw new Error(
          "No access token available. Please set OAUTH_ACCESS_TOKEN in config."
        );
      }

      // FIRST: Check if access token is expired (with 5 minute buffer)
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      const isExpired =
        this.tokenExpiresAt && now >= this.tokenExpiresAt - bufferTime;

      console.log("Email Service - Token expiry check:", {
        currentTime: new Date(now).toISOString(),
        tokenExpiry: this.tokenExpiresAt
          ? new Date(this.tokenExpiresAt).toISOString()
          : null,
        isExpired: isExpired,
        timeUntilExpiry: this.tokenExpiresAt
          ? Math.round((this.tokenExpiresAt - now) / 1000 / 60)
          : null, // minutes
      });

      if (isExpired) {
        console.log(
          "Email Service - Access token expired or expiring soon, refreshing..."
        );
        try {
          return await this.refreshAccessToken();
        } catch (refreshError: any) {
          console.error(
            "Email Service - Token refresh failed:",
            refreshError.message
          );
          console.log("\n🚨 EMAIL SERVICE - TOKEN REFRESH FAILED 🚨");
          console.log("===========================================");
          console.log("Please get new SMTP tokens:");
          console.log("1. Run: node get-smtp-tokens.js");
          console.log("2. Copy the new tokens to your .env file");
          console.log("3. Restart your server");
          console.log("===========================================\n");
          throw new Error("Token refresh failed - please re-authorize");
        }
      } else {
        console.log(
          "Email Service - Access token is still valid, using existing token"
        );
        return this.accessToken;
      }
    } catch (error: any) {
      console.error("Failed to get valid access token:", error.message);
      throw new Error("Failed to get valid access token");
    }
  }

  // Method for testing - allows setting credentials and transporter directly
  setCredentialsAndTransporter(
    credentials: EmailCredentials,
    transporter: nodemailer.Transporter
  ) {
    this.credentials = credentials;
    this.transporter = transporter;
  }

  async initializeCredentials(
    sessionId?: string,
    paymentId?: string,
    giftAid?: any
  ): Promise<void> {
    try {
      let payment;
      if (paymentId) {
        payment = await Payment.findById(paymentId);
      } else if (sessionId) {
        payment = await Payment.findOne({ stripeSessionId: sessionId });
      }

      if (!payment) {
        throw new Error("Payment not found");
      }

      // Only OAuth2 init
      await this.initializeOAuth2();
    } catch (error) {
      console.error("Error initializing email credentials:", error);
      throw error;
    }
  }

  // ---- OAuth2 Transporter Setup (only access token) ----
  private async initializeOAuth2(): Promise<void> {
    if (
      !config.OAUTH_CLIENT_ID ||
      !config.OAUTH_CLIENT_SECRET ||
      !config.SMTP_FROM_EMAIL ||
      !config.OAUTH_TENANT_ID
    ) {
      throw new Error("OAuth2 configuration missing");
    }

    const tenantId = config.OAUTH_TENANT_ID;

    // 1. Get valid access token (with automatic refresh if needed)
    const accessToken = await this.getValidAccessToken();

    // 2. Print access token (for debug)
    console.log(" Access Token acquired:", accessToken);

    // 3. If no access token, stop here
    if (!accessToken) {
      throw new Error(" No access token received, aborting email setup");
    }

    // 4. Continue with credentials and transporter setup
    this.credentials = {
      host: "smtp.office365.com",
      port: 587,
      type: "OAuth2",
      user: config.SMTP_FROM_EMAIL,
      clientId: config.OAUTH_CLIENT_ID,
      clientSecret: config.OAUTH_CLIENT_SECRET,
      tenantId: tenantId,
      accessToken: accessToken,
    };

    this.transporter = nodemailer.createTransport({
      host: this.credentials.host,
      port: this.credentials.port,
      secure: false,
      auth: {
        type: "OAuth2",
        user: "website@UKTBC.org",
        clientId: config.OAUTH_CLIENT_ID,
        clientSecret: config.OAUTH_CLIENT_SECRET,
        accessToken: accessToken,
        refreshToken: this.refreshToken,
        expires: this.tokenExpiresAt,
      },
      tls: {
        ciphers: "TLSv1.2",
        rejectUnauthorized: false,
      },
    });

    // 5. Verify transporter
    if (this.transporter) {
      await this.transporter.verify();
      console.log(" SMTP transporter verified with OAuth2 (access token only)");
    }
  }

  // ---- Get Sender Email ----
  getSenderEmail(): string {
    if (!this.credentials) {
      throw new Error("Email service not initialized");
    }
    return this.credentials.user;
  }

  // ---- Generic Email Sending Method ----
  async sendEmail(mailOptions: any): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error("Email service not initialized");
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully!");
      console.log("Message ID:", info.messageId);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  // ---- Send Donation Receipt ----
  async sendDonationReceipt(
    payment: any,
    toEmail?: string,
    giftAid?: any,
    receiptId?: string
  ): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error("Email service not initialized");
      }
      const pdfBuffer = await generateDonationReceiptPDF(
        payment,
        giftAid,
        receiptId
      );
      const subject = `Donation Receipt - UK Telugu Brahmin Community`;
      const htmlContent = this.generateEmailHTML(payment, giftAid, receiptId);

      const logoPath = path.join(
        process.cwd(),
        "src/resources/UKTBC Logo PNG.png"
      );

      const mailOptions = {
        from: `"UK Telugu Brahmin Community" <${this.credentials?.user}>`,
        to: toEmail || payment.email,
        subject: subject,
        html: htmlContent,
        attachments: [
          {
            filename: `Donation_Receipt_${payment._id}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
          {
            filename: "uktbc-logo.png",
            path: logoPath,
            cid: "logo",
          },
        ],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(" Donation receipt email sent!");
      console.log("Message ID:", info.messageId);
    } catch (error) {
      console.error("Error sending donation receipt email:", error);
      throw error;
    }
  }

  // ---- Email Template ----
  generateEmailHTML(payment: any, giftAid: string, receiptId?: string): string {
    // Debug logging
    console.log("Payment data in generateEmailHTML:", {
      amount: payment.amount,
      amountType: typeof payment.amount,
      giftAid: giftAid,
      giftAidType: typeof giftAid,
    });

    // Ensure amount is a number
    const amount = parseFloat(payment.amount) || 0;
    const giftAidAmount =
      giftAid === "yes" ? (amount * 0.25).toFixed(2) : "0.00";
    const giftAidStatus = giftAid === "yes" ? "Yes" : "No";
    const giftAidDisplay = giftAid === "yes" ? `Yes - £${giftAidAmount}` : "No";

    console.log("Calculated values:", {
      amount,
      giftAidAmount,
      giftAidDisplay,
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Donation Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #ff6600; }
          .content { margin-bottom: 20px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:logo" alt="UK Telugu Brahmin Community" style="width: 150px; height: 150px; margin-bottom: 10px;">
            <div class="logo">UK Telugu Brahmin Community</div>
            <p>Charity registered in England & Wales No. 1205566</p>
          </div>
          
          <div class="content">
            <h2>Donation Receipt</h2>
            <p>Namaste ${payment.firstName},</p>
            <p>We are grateful for your generous donation in support of our work.</p>
            
            <h3>Donation Details:</h3>
            <ul>
              <li><strong>Receipt ID:</strong> ${receiptId || "N/A"}</li>
              <li><strong>Donation Date:</strong> ${new Date().toLocaleDateString(
                "en-GB"
              )}</li>
              <li><strong>Donation for:</strong> ${
                payment.paymentReference || "General Donation"
              }</li>
              <li><strong>Mode of transfer:</strong> ${payment.paymentType}</li>
              <li><strong>Donation amount:</strong> £${amount.toFixed(2)}</li>
              <li><strong>Gift Aid (UK Tax Payer):</strong> ${giftAidDisplay}</li>
            </ul>
            
            <p><strong>Please note that all of your donation will be used for the causes we support.</strong></p>
            
            <p>Kind Regards,<br>
            UK Telugu Brahmin Community<br>
            Finance Team<br>
            <a href="https://www.uktbc.org">www.uktbc.org</a></p>
          </div>
          
          <div class="footer">
            <p>Please find your official donation receipt attached as a PDF.</p>
            <p>UK Telugu Brahmin Community | donate@uktbc.org | www.uktbc.org</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
