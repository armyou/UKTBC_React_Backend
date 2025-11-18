import nodemailer from "nodemailer";
import config from "../config";
import axios from "axios";
import path from "path";

interface ContactEmailCredentials {
  host: string;
  port: number;
  type: string;
  user: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  accessToken?: string;
}

export class ContactEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private credentials: ContactEmailCredentials | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  // ---- Set Tokens from Config ----
  private setTokensFromConfig(): void {
    console.log("Contact Email - Loading tokens from environment variables...");
    console.log(
      "Contact Email - OAUTH_ACCESS_TOKEN exists:",
      !!config.OAUTH_ACCESS_TOKEN
    );
    console.log(
      "Contact Email - OAUTH_REFRESH_TOKEN exists:",
      !!config.OAUTH_REFRESH_TOKEN
    );
    console.log(
      "Contact Email - OAUTH_TOKEN_EXPIRES_AT exists:",
      !!config.OAUTH_TOKEN_EXPIRES_AT
    );

    this.accessToken = config.OAUTH_ACCESS_TOKEN || null;
    this.refreshToken = config.OAUTH_REFRESH_TOKEN || null;
    this.tokenExpiresAt = config.OAUTH_TOKEN_EXPIRES_AT
      ? parseInt(config.OAUTH_TOKEN_EXPIRES_AT)
      : null;

    console.log("Contact Email - Tokens loaded from config:", {
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

      console.log("Contact Email - Token status:", {
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
          "Contact Email - Using client credentials flow, getting new token..."
        );
        return await this.getClientCredentialsToken();
      }

      console.log("Contact Email - Refreshing access token...");
      console.log(
        "Contact Email - Using refresh token:",
        this.refreshToken?.substring(0, 20) + "..."
      );

      const tenantId = config.OAUTH_TENANT_ID;
      const clientId = config.OAUTH_CLIENT_ID;
      const clientSecret = config.OAUTH_CLIENT_SECRET;

      console.log("Contact Email - OAuth config:", {
        tenantId,
        clientId: clientId?.substring(0, 10) + "...",
        hasClientSecret: !!clientSecret,
      });

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
      console.log("response to get tokens: ", response.data);
      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.refreshToken =
          response.data.refresh_token || this.refreshToken || ""; // Keep existing if not provided
        this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

        console.log("Contact Email - Access token refreshed successfully");
        console.log(
          "Contact Email - New access token expires at:",
          new Date(this.tokenExpiresAt).toISOString()
        );

        return this.accessToken || "";
      } else {
        throw new Error("No tokens received from refresh");
      }
    } catch (error: any) {
      console.error(
        "Contact Email - Failed to refresh access token:",
        error.message
      );
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
            console.log("\n🚨 CONTACT EMAIL - OAUTH AUTHORIZATION FAILED 🚨");
            console.log("==================================================");
            console.log("Please get new SMTP tokens:");
            console.log("1. Run: node get-smtp-tokens.js");
            console.log("2. Copy the new tokens to your .env file");
            console.log("3. Restart your server");
            console.log("==================================================\n");
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

      console.log("Contact Email - Getting new client credentials token...");

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

        console.log("Contact Email - New client credentials token obtained");
        console.log(
          "Contact Email - Token expires at:",
          new Date(this.tokenExpiresAt).toISOString()
        );

        return response.data.access_token;
      } else {
        throw new Error("No tokens received from client credentials flow");
      }
    } catch (error: any) {
      console.error(
        "Contact Email - Failed to get client credentials token:",
        error.message
      );
      throw error;
    }
  }

  // ---- Get Valid Access Token ----
  private async getValidAccessToken(): Promise<string> {
    try {
      console.log("Contact Email - getValidAccessToken called");

      // Load tokens from config if not already loaded
      if (!this.accessToken) {
        console.log("Contact Email - No access token, loading from config...");
        this.setTokensFromConfig();
      } else {
        console.log("Contact Email - Access token already loaded");
      }

      // Check if we have tokens
      if (!this.accessToken) {
        console.log("\n🚨 CONTACT EMAIL - NO ACCESS TOKEN AVAILABLE 🚨");
        console.log("================================================");
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
        console.log("================================================\n");
        throw new Error(
          "No access token available. Please set OAUTH_ACCESS_TOKEN in config."
        );
      }

      // FIRST: Check if access token is expired (with 5 minute buffer)
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      const isExpired =
        this.tokenExpiresAt && now >= this.tokenExpiresAt - bufferTime;

      console.log("Contact Email - Token expiry check:", {
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
          "Contact Email - Access token expired or expiring soon, refreshing..."
        );
        try {
          return await this.refreshAccessToken();
        } catch (refreshError: any) {
          console.error(
            "Contact Email - Token refresh failed:",
            refreshError.message
          );
          console.log("\n🚨 CONTACT EMAIL - TOKEN REFRESH FAILED 🚨");
          console.log("=============================================");
          console.log("Please re-authorize and get new tokens:");
          console.log(
            "1. Visit: https://login.microsoftonline.com/e8d3c511-b8ef-4520-bfd3-ce059f6afed7/oauth2/v2.0/authorize?client_id=090fcebc-40d8-4696-8deb-34906087ded0&response_type=code&redirect_uri=http://localhost:3003/smtpweb&response_mode=query&scope=offline_access%20Mail.Send&state=12345"
          );
          console.log("2. Complete the OAuth flow");
          console.log("3. Get the authorization code from the redirect URL");
          console.log(
            "4. Exchange the code for new access_token and refresh_token"
          );
          console.log("5. Update your .env file with:");
          console.log("   OAUTH_ACCESS_TOKEN=new_access_token");
          console.log("   OAUTH_REFRESH_TOKEN=new_refresh_token");
          console.log("   OAUTH_TOKEN_EXPIRES_AT=expiry_timestamp");
          console.log("=============================================\n");
          throw new Error("Token refresh failed - please re-authorize");
        }
      } else {
        console.log(
          "Contact Email - Access token is still valid, using existing token"
        );
        return this.accessToken as string;
      }
    } catch (error: any) {
      console.error(
        "Contact Email - Failed to get valid access token:",
        error.message
      );
      throw new Error("Failed to get valid access token");
    }
  }

  // ---- Initialize Contact Email Service ----
  async initializeCredentials(): Promise<void> {
    try {
      console.log("Contact Email - initializeCredentials called");

      if (
        !config.OAUTH_CLIENT_ID ||
        !config.OAUTH_CLIENT_SECRET ||
        !config.SMTP_FROM_EMAIL ||
        !config.OAUTH_TENANT_ID
      ) {
        console.log("Contact Email - OAuth2 configuration missing:", {
          hasClientId: !!config.OAUTH_CLIENT_ID,
          hasClientSecret: !!config.OAUTH_CLIENT_SECRET,
          hasFromEmail: !!config.SMTP_FROM_EMAIL,
          hasTenantId: !!config.OAUTH_TENANT_ID,
        });
        throw new Error("OAuth2 configuration missing");
      }

      const tenantId = config.OAUTH_TENANT_ID;

      // 1. Get valid access token (with automatic refresh if needed)
      const accessToken = await this.getValidAccessToken();

      // 2. Print access token (for debug)
      console.log(
        "Contact Email Service - Access Token acquired:",
        accessToken?.substring(0, 20) + "..."
      );

      // 3. If no access token, stop here
      if (!accessToken) {
        throw new Error(
          "No access token received, aborting contact email setup"
        );
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
          accessToken: config.OAUTH_ACCESS_TOKEN,
          refreshToken: config.OAUTH_REFRESH_TOKEN,
          expires: config.OAUTH_TOKEN_EXPIRES_AT
            ? parseInt(config.OAUTH_TOKEN_EXPIRES_AT)
            : undefined,
        },
        tls: {
          ciphers: "TLSv1.2",
          rejectUnauthorized: false,
        },
      });

      // 5. Verify transporter
      if (this.transporter) {
        try {
          await this.transporter.verify();
          console.log(
            "Contact Email Service - SMTP transporter verified with OAuth2"
          );
        } catch (verifyError: any) {
          console.error(
            "Contact Email - SMTP verification failed:",
            verifyError.message
          );
          if (
            verifyError.message.includes("OAuth2") ||
            verifyError.message.includes("auth")
          ) {
            console.log("\n🚨 CONTACT EMAIL - OAUTH2 AUTHENTICATION FAILED 🚨");
            console.log("==================================================");
            console.log("The access token may be invalid or expired.");
            console.log("Please re-authorize and get new tokens:");
            console.log(
              "1. Visit: https://login.microsoftonline.com/e8d3c511-b8ef-4520-bfd3-ce059f6afed7/oauth2/v2.0/authorize?client_id=090fcebc-40d8-4696-8deb-34906087ded0&response_type=code&redirect_uri=http://localhost:3003/smtpweb&response_mode=query&scope=offline_access%20Mail.Send&state=12345"
            );
            console.log("2. Complete the OAuth flow");
            console.log("3. Get the authorization code from the redirect URL");
            console.log(
              "4. Exchange the code for new access_token and refresh_token"
            );
            console.log("5. Update your .env file with:");
            console.log("   OAUTH_ACCESS_TOKEN=new_access_token");
            console.log("   OAUTH_REFRESH_TOKEN=new_refresh_token");
            console.log("   OAUTH_TOKEN_EXPIRES_AT=expiry_timestamp");
            console.log("==================================================\n");
          }
          throw verifyError;
        }
      }
    } catch (error) {
      console.error("Error initializing contact email credentials:", error);
      throw error;
    }
  }

  // ---- Get Sender Email ----
  getSenderEmail(): string {
    if (!this.credentials) {
      throw new Error("Contact email service not initialized");
    }
    return this.credentials.user;
  }

  // ---- Send Contact Form Email ----
  async sendContactEmail(mailOptions: any): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error("Contact email service not initialized");
      }

      // logo attachment to mail options
      const logoPath = path.join(
        process.cwd(),
        "src/resources/UKTBC Logo PNG.png"
      );

      // Check mailOptions has attachments array
      if (!mailOptions.attachments) {
        mailOptions.attachments = [];
      }

      // Add logo to attachments
      mailOptions.attachments.push({
        filename: "uktbc-logo.png",
        path: logoPath,
        cid: "logo",
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Contact form email sent successfully!");
      console.log("Message ID:", info.messageId);
    } catch (error) {
      console.error("Error sending contact form email:", error);
      throw error;
    }
  }

  // ---- Generate Contact Form HTML ----
  generateContactEmailHTML(contactData: any): string {
    console.log("Generating contact email HTML with data:", contactData);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #ff6600; }
          .content { margin-bottom: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-top: 5px; padding: 10px; background-color: #f9f9f9; border-radius: 4px; }
          .message-box { padding: 15px; background-color: #f0f8ff; border-left: 4px solid #ff6600; }
          .attachment-info { background-color: #e8f5e8; border-left: 4px solid #28a745; }
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
            <h2>Contact Form Details</h2>
            
            <div class="field">
              <div class="label">Name:</div>
              <div class="value">${contactData.name || "Not provided"}</div>
            </div>
            
            <div class="field">
              <div class="label">Mobile:</div>
              <div class="value">${contactData.mobile || "Not provided"}</div>
            </div>
            
            <div class="field">
              <div class="label">Email:</div>
              <div class="value">${contactData.email || "Not provided"}</div>
            </div>
            
            <div class="field">
              <div class="label">Category:</div>
              <div class="value">${contactData.category || "Not provided"}</div>
            </div>
            
            <div class="field">
              <div class="label">Subject:</div>
              <div class="value">${contactData.subject || "Not provided"}</div>
            </div>
            
            <div class="field">
              <div class="label">Message:</div>
              <div class="message-box">${
                contactData.message || "No message provided"
              }</div>
            </div>
            
            ${
              contactData.fileName
                ? `
            <div class="field">
              <div class="label">📎 Attachment:</div>
              <div class="value attachment-info">
                <strong>${contactData.fileName}</strong>
                <br><small style="color: #28a745;">✓ File has been attached to this email</small>
              </div>
            </div>
            `
                : ""
            }
            
            <div class="field">
              <div class="label">Submission Date:</div>
              <div class="value">${new Date().toLocaleString("en-GB")}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent from the UK Telugu Brahmin Community contact form.</p>
            <p>UK Telugu Brahmin Community | www.uktbc.org</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ---- Get Recipient Email Based on Category ----
  getRecipientEmail(category: unknown): string {
    if (typeof category !== "string") {
      return "info@uktbc.org";
    }

    switch (category.toLowerCase()) {
      case "general inquiry":
      case "support":
        return "info@uktbc.org";
      case "donation":
        return "donate@uktbc.org";
      case "event":
        return "volunteer@uktbc.org";
      default:
        return "info@uktbc.org";
    }
  }
}

export const contactEmailService = new ContactEmailService();
