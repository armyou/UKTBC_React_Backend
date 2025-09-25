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
const axios_1 = __importDefault(require("axios"));
class EmailService {
    constructor() {
        this.transporter = null;
        this.credentials = null;
    }
    getAccessToken(clientId, clientSecret, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("🔐 [getAccessToken] Starting OAuth2 token acquisition...");
            console.log("🔐 [getAccessToken] Client ID:", clientId);
            console.log("🔐 [getAccessToken] Tenant ID:", tenantId);
            console.log("🔐 [getAccessToken] Client Secret (first 10 chars):", clientSecret.substring(0, 10) + "...");
            try {
                const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
                console.log("🔐 [getAccessToken] Token URL:", tokenUrl);
                const requestData = new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: "https://outlook.office365.com/.default",
                    grant_type: "client_credentials",
                });
                console.log("🔐 [getAccessToken] Request data prepared");
                console.log("🔐 [getAccessToken] Making POST request to Microsoft OAuth2 endpoint...");
                const response = yield axios_1.default.post(tokenUrl, requestData, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                });
                console.log("🔐 [getAccessToken] Response status:", response.status);
                console.log("🔐 [getAccessToken] Access token received successfully");
                console.log("🔐 [getAccessToken] Token (first 20 chars):", response.data.access_token.substring(0, 20) + "...");
                return response.data.access_token;
            }
            catch (error) {
                console.error("❌ [getAccessToken] Error getting access token:", error);
                if (error.response) {
                    console.error("❌ [getAccessToken] Response status:", error.response.status);
                    console.error("❌ [getAccessToken] Response data:", error.response.data);
                }
                throw new Error("Failed to get OAuth2 access token");
            }
        });
    }
    // Method for testing - allows setting credentials and transporter directly
    setCredentialsAndTransporter(credentials, transporter) {
        console.log("🔧 [setCredentialsAndTransporter] Setting credentials and transporter for testing");
        console.log("🔧 [setCredentialsAndTransporter] Credentials host:", credentials.host);
        console.log("🔧 [setCredentialsAndTransporter] Credentials port:", credentials.port);
        console.log("🔧 [setCredentialsAndTransporter] Credentials user:", credentials.user);
        this.credentials = credentials;
        this.transporter = transporter;
        console.log("🔧 [setCredentialsAndTransporter] Credentials and transporter set successfully");
    }
    initializeCredentials(sessionId, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 [initializeCredentials] Starting email credentials initialization...");
            console.log("🚀 [initializeCredentials] Session ID:", sessionId);
            console.log("🚀 [initializeCredentials] Payment ID:", paymentId);
            try {
                let payment;
                console.log("🔍 [initializeCredentials] Looking up payment in database...");
                if (paymentId) {
                    console.log(`🔍 [initializeCredentials] Finding payment by ID: ${paymentId}`);
                    payment = yield payments_1.default.findById(paymentId);
                    console.log("🔍 [initializeCredentials] Payment lookup by ID completed");
                }
                else if (sessionId) {
                    console.log(`🔍 [initializeCredentials] Finding payment by sessionId: ${sessionId}`);
                    payment = yield payments_1.default.findOne({ stripeSessionId: sessionId });
                    console.log("🔍 [initializeCredentials] Payment lookup by sessionId completed");
                }
                if (!payment) {
                    console.error("❌ [initializeCredentials] Payment not found during email initialization");
                    throw new Error("Payment not found");
                }
                console.log("✅ [initializeCredentials] Payment found:", payment._id);
                console.log("✅ [initializeCredentials] Payment email:", payment.email);
                console.log("✅ [initializeCredentials] Payment giftAid:", payment.giftAid);
                console.log("✅ [initializeCredentials] Payment corpDonation:", payment.corpDonation);
                // Validate OAuth2 configuration
                console.log("🔧 [initializeCredentials] Validating OAuth2 configuration...");
                console.log("🔧 [initializeCredentials] OAUTH_CLIENT_ID:", config_1.default.OAUTH_CLIENT_ID ? "✅ Set" : "❌ Missing");
                console.log("🔧 [initializeCredentials] OAUTH_CLIENT_SECRET:", config_1.default.OAUTH_CLIENT_SECRET ? "✅ Set" : "❌ Missing");
                console.log("🔧 [initializeCredentials] SMTP_FROM_EMAIL:", config_1.default.SMTP_FROM_EMAIL ? "✅ Set" : "❌ Missing");
                console.log("🔧 [initializeCredentials] OAUTH_TENANT_ID:", config_1.default.OAUTH_TENANT_ID ? "✅ Set" : "❌ Missing");
                if (!config_1.default.OAUTH_CLIENT_ID ||
                    !config_1.default.OAUTH_CLIENT_SECRET ||
                    !config_1.default.SMTP_FROM_EMAIL ||
                    !config_1.default.OAUTH_TENANT_ID) {
                    console.error("❌ [initializeCredentials] One or more OAuth2 email configuration values are missing");
                    throw new Error("One or more OAuth2 email configuration values are missing or undefined");
                }
                const tenantId = config_1.default.OAUTH_TENANT_ID;
                console.log("✅ [initializeCredentials] OAuth2 configuration validation passed");
                console.log("🔐 [initializeCredentials] Getting OAuth2 access token...");
                const accessToken = yield this.getAccessToken(config_1.default.OAUTH_CLIENT_ID, config_1.default.OAUTH_CLIENT_SECRET, tenantId);
                console.log("✅ [initializeCredentials] OAuth2 access token received");
                console.log("🔧 [initializeCredentials] Creating credentials object...");
                this.credentials = {
                    host: "smtp.office365.com",
                    port: 587,
                    type: "OAuth2",
                    user: config_1.default.SMTP_FROM_EMAIL,
                    clientId: config_1.default.OAUTH_CLIENT_ID,
                    clientSecret: config_1.default.OAUTH_CLIENT_SECRET,
                    tenantId: tenantId,
                    accessToken: accessToken,
                };
                console.log("✅ [initializeCredentials] Credentials object created");
                console.log("🔧 [initializeCredentials] SMTP Host:", this.credentials.host);
                console.log("🔧 [initializeCredentials] SMTP Port:", this.credentials.port);
                console.log("🔧 [initializeCredentials] SMTP User:", this.credentials.user);
                console.log("📧 [initializeCredentials] Creating Nodemailer transporter...");
                this.transporter = nodemailer_1.default.createTransport({
                    host: this.credentials.host,
                    port: this.credentials.port,
                    secure: false, // 587 uses TLS, not SSL
                    auth: {
                        type: "OAuth2",
                        user: this.credentials.user,
                        clientId: this.credentials.clientId,
                        clientSecret: this.credentials.clientSecret,
                        accessToken: this.credentials.accessToken,
                    },
                    tls: {
                        ciphers: "TLSv1.2",
                        rejectUnauthorized: false,
                    },
                });
                console.log("✅ [initializeCredentials] Nodemailer transporter created");
                if (this.transporter) {
                    console.log("🔍 [initializeCredentials] Verifying SMTP connection...");
                    yield this.transporter.verify();
                    console.log("✅ [initializeCredentials] SMTP connection verified successfully");
                }
                console.log("🎉 [initializeCredentials] Email credentials initialization completed successfully");
            }
            catch (error) {
                console.error("❌ [initializeCredentials] Error initializing email credentials:", error);
                throw error;
            }
        });
    }
    sendDonationReceipt(payment, toEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log("📧 [sendDonationReceipt] Starting donation receipt email process...");
            console.log("📧 [sendDonationReceipt] Payment ID:", payment._id);
            console.log("📧 [sendDonationReceipt] Target email:", toEmail || payment.email);
            console.log("📧 [sendDonationReceipt] Payment amount:", payment.amount);
            console.log("📧 [sendDonationReceipt] Payment giftAid:", payment.giftAid);
            console.log("📧 [sendDonationReceipt] Payment corpDonation:", payment.corpDonation);
            try {
                console.log("🔍 [sendDonationReceipt] Checking if transporter is initialized...");
                if (!this.transporter) {
                    console.error("❌ [sendDonationReceipt] Email service not initialized");
                    throw new Error("Email service not initialized");
                }
                console.log("✅ [sendDonationReceipt] Transporter is initialized");
                console.log("🔍 [sendDonationReceipt] Checking email eligibility conditions...");
                if (payment.giftAid !== "yes" || payment.corpDonation === "yes") {
                    console.log("⚠️ [sendDonationReceipt] Email not sent: giftAid is not 'yes' or corpDonation is 'yes'");
                    console.log("⚠️ [sendDonationReceipt] giftAid:", payment.giftAid);
                    console.log("⚠️ [sendDonationReceipt] corpDonation:", payment.corpDonation);
                    return;
                }
                console.log("✅ [sendDonationReceipt] Email eligibility conditions met");
                console.log("📄 [sendDonationReceipt] Generating PDF receipt...");
                const pdfBuffer = yield (0, pdfService_1.generateDonationReceiptPDF)(payment);
                console.log("✅ [sendDonationReceipt] PDF receipt generated successfully");
                console.log("📄 [sendDonationReceipt] PDF buffer size:", pdfBuffer.length, "bytes");
                console.log("📝 [sendDonationReceipt] Preparing email content...");
                const subject = `Donation Receipt - UK Telugu Brahmin Community`;
                console.log("📝 [sendDonationReceipt] Email subject:", subject);
                const htmlContent = this.generateEmailHTML(payment);
                console.log("✅ [sendDonationReceipt] Email HTML content generated");
                console.log("📝 [sendDonationReceipt] HTML content length:", htmlContent.length, "characters");
                console.log("🖼️ [sendDonationReceipt] Preparing logo attachment...");
                const logoPath = path_1.default.join(process.cwd(), "src/resources/UKTBC Logo PNG.png");
                console.log("🖼️ [sendDonationReceipt] Logo path:", logoPath);
                console.log("📦 [sendDonationReceipt] Preparing email attachments...");
                const mailOptions = {
                    from: `"UK Telugu Brahmin Community" <${(_a = this.credentials) === null || _a === void 0 ? void 0 : _a.user}>`,
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
                console.log("✅ [sendDonationReceipt] Email options prepared");
                console.log("📦 [sendDonationReceipt] Number of attachments:", mailOptions.attachments.length);
                console.log("📦 [sendDonationReceipt] From address:", mailOptions.from);
                console.log("📦 [sendDonationReceipt] To address:", mailOptions.to);
                console.log(`📤 [sendDonationReceipt] Sending email to: ${toEmail || payment.email}...`);
                const info = yield this.transporter.sendMail(mailOptions);
                console.log("🎉 [sendDonationReceipt] Donation receipt email sent successfully!");
                console.log("📧 [sendDonationReceipt] Message ID:", info.messageId);
                console.log("📧 [sendDonationReceipt] Response:", info.response);
            }
            catch (error) {
                console.error("❌ [sendDonationReceipt] Error sending donation receipt email:", error);
                throw error;
            }
        });
    }
    generateEmailHTML(payment) {
        console.log("📝 [generateEmailHTML] Starting HTML email content generation...");
        console.log("📝 [generateEmailHTML] Payment data:", {
            firstName: payment.firstName,
            amount: payment.amount,
            giftAid: payment.giftAid,
            paymentReference: payment.paymentReference,
            paymentType: payment.paymentType
        });
        const giftAidAmount = payment.giftAid === "yes" ? (payment.amount * 0.25).toFixed(2) : "0.00";
        console.log("📝 [generateEmailHTML] Gift Aid amount calculated:", giftAidAmount);
        console.log("📝 [generateEmailHTML] Donation date:", new Date().toLocaleDateString("en-GB"));
        const htmlContent = `
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
              <li><strong>Donation Date:</strong> ${new Date().toLocaleDateString("en-GB")}</li>
              <li><strong>Donation for:</strong> ${payment.paymentReference || "General Donation"}</li>
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
        console.log("✅ [generateEmailHTML] HTML content generated successfully");
        console.log("📝 [generateEmailHTML] HTML content length:", htmlContent.length, "characters");
        console.log("📝 [generateEmailHTML] HTML content preview (first 200 chars):", htmlContent.substring(0, 200) + "...");
        return htmlContent;
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
