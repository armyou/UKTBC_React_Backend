import nodemailer from "nodemailer";
import Payment from "../models/payments";
import { generateDonationReceiptPDF } from "../services/pdfService";
import config from "../config";
import path from "path";

interface EmailCredentials {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private credentials: EmailCredentials | null = null;

  async initializeCredentials(
    sessionId?: string,
    paymentId?: string
  ): Promise<void> {
    console.log("Initializing email credentials...");
    try {
      let payment;
      if (paymentId) {
        console.log(`Finding payment by ID: ${paymentId}`);
        payment = await Payment.findById(paymentId);
      } else if (sessionId) {
        console.log(`Finding payment by sessionId: ${sessionId}`);
        payment = await Payment.findOne({ stripeSessionId: sessionId });
      }

      if (!payment) {
        console.error("Payment not found during email initialization");
        throw new Error("Payment not found");
      }
      console.log("Payment found:", payment._id);

      if (
        !config.smtpHost ||
        !config.smtpPort ||
        !config.smtpUser ||
        !config.smtpPassword ||
        !config.fromEmail ||
        !config.fromName
      ) {
        throw new Error(
          "One or more email configuration values are missing or undefined"
        );
      }

      this.credentials = {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        smtpPassword: config.smtpPassword,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
      };
      console.log("this.credentials: ", this.credentials);
      console.log("SMTP credentials loaded from config");

      if (!this.credentials) {
        throw new Error("Email credentials not initialized");
      }
      this.transporter = nodemailer.createTransport({
        host: this.credentials.smtpHost,
        port: this.credentials.smtpPort,
        secure: false,
        auth: {
          user: this.credentials.smtpUser,
          pass: this.credentials.smtpPassword,
        },
        tls: {
          ciphers: "TLSv1.2",
          rejectUnauthorized: false,
        },
      });

      this.transporter.verify(function (error, success) {
        console.log("verify block");
        if (error) {
          console.log("SMTP connection/auth failed:", error);
        } else {
          console.log("Server is ready to take our messages");
        }
      });

      console.log("Nodemailer transporter created");

      if (this.transporter) {
        await this.transporter.verify();
        console.log("SMTP connection verified successfully");
      }
    } catch (error) {
      console.error("Error initializing email credentials:", error);
      throw error;
    }
  }

  async sendDonationReceipt(payment: any, toEmail?: string): Promise<void> {
    console.log("Starting sendDonationReceipt...");
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

      console.log("Generating PDF receipt...");
      const pdfBuffer = await generateDonationReceiptPDF(payment);
      console.log("PDF receipt generated successfully");

      const subject = `Donation Receipt - UK Telugu Brahmin Community`;
      const htmlContent = this.generateEmailHTML(payment);
      console.log("Email HTML content generated");

      const logoPath = path.join(
        process.cwd(),
        "src/resources/UKTBC Logo PNG.png"
      );

      const mailOptions = {
        from: `"${this.credentials?.fromName}" <${this.credentials?.fromEmail}>`,
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

      console.log(`Sending email to: ${toEmail || payment.email}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Donation receipt email sent successfully!");
      console.log("Message ID:", info.messageId);
    } catch (error) {
      console.error("Error sending donation receipt email:", error);
      throw error;
    }
  }

  private generateEmailHTML(payment: any): string {
    console.log("Generating email HTML...");
    const giftAidAmount =
      payment.giftAid === "yes" ? (payment.amount * 0.25).toFixed(2) : "0.00";

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
              <li><strong>Gift Aid (UK Tax Payer):</strong> Yes - £${giftAidAmount}</li>
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
