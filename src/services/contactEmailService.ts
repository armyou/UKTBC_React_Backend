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
        scope: "https://outlook.office365.com/.default",
        grant_type: "authorization_code",
        redirect_uri:'http://localhost:3003/smtpweb',
        code:'1.Aa8AEcXT6O-4IEW_084Fn2r-17zODwnYQJZGjes0kGCH3tCvACKvAA.AgABBAIAAABlMNzVhAPUTrARzfQjWPtKAwDs_wUA9P-zXuOYpzB1YUfyxAgROwXfMjiLb57F50jRUkVEZ7ePb98n2UND92IriaTfxVrdJ20yH1GRFFQASHSHRd0YZiz-EUoGwTR3VtObAqikgReSOaFtjUjwRmjNKlvYkuV5oPzNkj0kkR2ktIq-ou1bW3fjw_afgWmk6_dPgNadX-_Gs_rRwt8Uzt22lxdEnYUc3z9srCyoracI5q-gcQ3RxWhScnCqfnzXnc3TQ6FzbydfYI0jYOU5DLKTJ6h4VvkPlLEQBRtNPvMqy8g9yPNueGC4oZx5xoJCLrbCjewOCkBAw022iEFlm3IFAXcbBp5ZDqIR2uLsNS-KzcHn5k_EOHdc2McKIwbzZVUAie9XE49gMNaI5iS4ibtHEdH48wQtWB2kyJmbXfCg8wZRJZO409Omvj3ZzL7yJk6PqjCPMV32T6I2U14A2lFyQTJEI5pslEC9Y0FasSKc4hTkxNU1uMC-uB7hhCX9ucQunLsu-knTiqVH-iudvNkc01bzril12Vf3gZXCiX_40hw4j8aJaaEltTvNY_nJTbq-EcHOVYGo9xvZY310j_qmniNK-UJM2VEJcxrEmy1pvvzHpRlfKm61VA7oi8KTEIQHBexQVDrGn23fej7BUR2N8zxDRu4PviYyjVYEqrSPp_pUXJPDgpxWPHdfH1-LwpWur68i7STp-nqW9JzCgRF3sjXZPM8lJ1xqbkikGauk9Z8nc88lhoTPlYU6gWvCPz4Gxr3Nloto_4rH754VkJw50g'
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

  // ---- Initialize Contact Email Service ----
  async initializeCredentials(): Promise<void> {
    try {
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
      // console.log("Contact Email Service - Access Token acquired:", accessToken);

      // 3. If no access token, stop here
      if (!accessToken) {
        throw new Error("No access token received, aborting contact email setup");
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
        console.log("Contact Email Service - SMTP transporter verified with OAuth2");
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
              <div class="message-box">${contactData.message || "No message provided"}</div>
            </div>
            
            ${contactData.fileName ? `
            <div class="field">
              <div class="label">📎 Attachment:</div>
              <div class="value attachment-info">
                <strong>${contactData.fileName}</strong>
                <br><small style="color: #28a745;">✓ File has been attached to this email</small>
              </div>
            </div>
            ` : ''}
            
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
