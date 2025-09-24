"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const payments_1 = __importDefault(require("../models/payments"));
const pdfService_1 = require("../services/pdfService");
const config_1 = __importDefault(require("../config"));
const path_1 = __importDefault(require("path"));
class EmailService {
    constructor() {
        this.transporter = null;
        this.credentials = null;
    }
    initializeCredentials(sessionId, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find payment by sessionId or paymentId
                let payment;
                if (paymentId) {
                    payment = yield payments_1.default.findById(paymentId);
                }
                else if (sessionId) {
                    payment = yield payments_1.default.findOne({ stripeSessionId: sessionId });
                }
                if (!payment) {
                    throw new Error("Payment not found");
                }
                // Use config for SMTP credentials
                this.credentials = {
                    smtpHost: config_1.default.smtpHost,
                    smtpPort: config_1.default.smtpPort,
                    smtpUser: config_1.default.smtpUser,
                    smtpPassword: config_1.default.smtpPassword,
                    fromEmail: config_1.default.fromEmail,
                    fromName: config_1.default.fromName
                };
                // Create transporter
                this.transporter = nodemailer_1.default.createTransport({
                    host: this.credentials.smtpHost,
                    port: this.credentials.smtpPort,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: this.credentials.smtpUser,
                        pass: this.credentials.smtpPassword,
                    },
                    tls: {
                        ciphers: 'SSLv3'
                    }
                });
                // Verify connection
                if (this.transporter) {
                    yield this.transporter.verify();
                    console.log("SMTP connection verified successfully");
                }
            }
            catch (error) {
                console.error("Error initializing email credentials:", error);
                throw error;
            }
        });
    }
    sendDonationReceipt(payment) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                if (!this.transporter) {
                    throw new Error("Email service not initialized");
                }
                // Check conditions: giftAid: yes and corpDonation: no
                if (payment.giftAid !== "yes" || payment.corpDonation === "yes") {
                    console.log("Email not sent: giftAid is not 'yes' or corpDonation is 'yes'");
                    return;
                }
                // Generate PDF receipt
                const pdfBuffer = yield (0, pdfService_1.generateDonationReceiptPDF)(payment);
                // Prepare email content
                const subject = `Donation Receipt - UK Telugu Brahmin Community`;
                const htmlContent = this.generateEmailHTML(payment);
                // Prepare logo path
                const logoPath = path_1.default.join(process.cwd(), 'src/resources/UKTBC Logo PNG.png');
                // Send email
                const mailOptions = {
                    from: `"${(_a = this.credentials) === null || _a === void 0 ? void 0 : _a.fromName}" <${(_b = this.credentials) === null || _b === void 0 ? void 0 : _b.fromEmail}>`,
                    to: payment.email,
                    subject: subject,
                    html: htmlContent,
                    attachments: [
                        {
                            filename: `Donation_Receipt_${payment._id}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf'
                        },
                        {
                            filename: 'uktbc-logo.png',
                            path: logoPath,
                            cid: 'logo' // Content ID for embedding in HTML
                        }
                    ]
                };
                const info = yield this.transporter.sendMail(mailOptions);
                console.log("Donation receipt email sent:", info.messageId);
            }
            catch (error) {
                console.error("Error sending donation receipt email:", error);
                throw error;
            }
        });
    }
    generateEmailHTML(payment) {
        const giftAidAmount = payment.giftAid === "yes" ? (payment.amount * 0.25).toFixed(2) : "0.00";
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
              <li><strong>Donation Date:</strong> ${new Date().toLocaleDateString('en-GB')}</li>
              <li><strong>Donation for:</strong> ${payment.paymentReference || 'General Donation'}</li>
              <li><strong>Mode of transfer:</strong> ${payment.paymentType}</li>
              <li><strong>Donation amount:</strong> £${payment.amount.toFixed(2)}</li>
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
exports.EmailService = EmailService;
exports.emailService = new EmailService();
