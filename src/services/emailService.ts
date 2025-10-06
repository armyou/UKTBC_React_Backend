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

  // ---- Get Access Token (client_credentials flow) ----
  private async getAccessToken(
    clientId: string,
    clientSecret: string,
    tenantId: string
  ): Promise<string> {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

      const requestData = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://outlook.office365.com/.default", //  for SMTP
        grant_type: "authorization_code",
        redirect_uri:'http://localhost:3003/smtpweb',
        code:'1.Aa8AEcXT6O-4IEW_084Fn2r-17zODwnYQJZGjes0kGCH3tCvACKvAA.AgABBAIAAABlMNzVhAPUTrARzfQjWPtKAwDs_wUA9P8hNlnOyvfugq3fF25kc-SN2hUDyKwbjYn9YKxZA7L3CgOPBNPMrOA24tIYLlVZQ9wCOoTwr3aDiQytGPicu_uIbXM10gYOhQgKwxYfi7lzNgjD4PywYPrPHkSNimqHs-8Rz5BWzVy0eR8fDJIO_iF5k-HcDtbgZ5Ah4aQkdbEwk99_FXbfJ5IDeWDecLJ5u1QDWQTmA6CZL0Rr9Z4K44gqMADODqlk4-Hl9XOGFa3Lw7IKBnrjbyggXeK1LtT4WkKXzgEWpu4GFWfJHUKX39aa8Zi6bUlnonMMIEMiQxsmw_HORIdVvytPsKMx0X2mHG6_svg5bOXxlvOvpi9l-oKdE5NAGJV-ti0gVvY09AmbHbq8AdXXkHRP82wnDIv1Z_RdibiLK3ViaOn3uFcN0jrsZW2yFDnd13qj4d3sExQz6PU1GYAEYsldzktViW0rhgvYWAO0_1xMXvCadruwf2VsmGqY3gpJTliyQ5Abn_6Z8cNVTztU0C1wjjat1dhUgQQ5W2nH7slC28XuT8gOswwe-gZmWSl_3Ec10WUpjnbcSkD_VNpd5Jdq7o-q-guk_Q65SVg1gjirkE1qZPP0wKh1olUW05JwPhTE8sS__1mj63WpoAniz42bL3BIwJDovf3rMIJCFtNxZmcthu2PWPOMYknH1_1d-PbOjRajZ3cB5EKmvXMvBk_LYvmSoMrD3qs8zhYIP7BysP24r0_8r5GPS-TPnwXAekemOzXlnaZBNQVfZNhTYbnJDaI'
      });

      const response = await axios.post(tokenUrl, requestData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      return response.data.access_token;
    } catch (error: any) {
      console.error("OAuth2 token acquisition failed:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      throw new Error("Failed to get OAuth2 access token");
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
    paymentId?: string
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

    // 1. Generate access token
    const accessToken = await this.getAccessToken(
      config.OAUTH_CLIENT_ID,
      config.OAUTH_CLIENT_SECRET,
      tenantId
    );

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

  // ---- Send Donation Receipt ----
  async sendDonationReceipt(payment: any, toEmail?: string): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error("Email service not initialized");
      }

      if (payment.giftAid !== "yes" || payment.corpDonation === "yes") {
        console.log(
          "Email not sent: giftAid is not 'yes' or corpDonation is 'yes'"
        );
        return;
      }

      const pdfBuffer = await generateDonationReceiptPDF(payment);
      const subject = `Donation Receipt - UK Telugu Brahmin Community`;
      const htmlContent = this.generateEmailHTML(payment);

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
  generateEmailHTML(payment: any): string {
    const giftAidAmount =
      payment.giftAid === "yes" ? (payment.amount * 0.25).toFixed(2) : "0.00";
    const giftAidStatus = payment.giftAid === "yes" ? "Yes" : "No";
    const giftAidDisplay = payment.giftAid === "yes" ? `Yes - £${giftAidAmount}` : "No";

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
            <img src="cid:logo" alt="UK Telugu Brahmin Community" style="width: 150px; height: 60px; margin-bottom: 10px;">
            <div class="logo">UK Telugu Brahmin Community</div>
            <p>Charity registered in England & Wales No. 1205566</p>
          </div>
          
          <div class="content">
            <h2>Donation Receipt</h2>
            <p>Namaste ${payment.firstName},</p>
            <p>We are grateful for your generous donation in support of our work.</p>
            
            <h3>Donation Details:</h3>
            <ul>
              <li><strong>Donation Date:</strong> ${new Date().toLocaleDateString(
                "en-GB"
              )}</li>
              <li><strong>Donation for:</strong> ${
                payment.paymentReference || "General Donation"
              }</li>
              <li><strong>Mode of transfer:</strong> ${payment.paymentType}</li>
              <li><strong>Donation amount:</strong> £${payment.amount.toFixed(
                2
              )}</li>
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
