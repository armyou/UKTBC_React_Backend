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
    // ---- Get Access Token (client_credentials flow) ----
    getAccessToken(clientId, clientSecret, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
                const requestData = new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: "https://outlook.office365.com/.default", //  for SMTP
                    grant_type: "authorization_code",
                    redirect_uri: 'http://localhost:3003/smtpweb',
                    code: '1.Aa8AEcXT6O-4IEW_084Fn2r-17zODwnYQJZGjes0kGCH3tCvACKvAA.AgABBAIAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P9EC6RR08zPVeuMIXG0OQ-mv1h6q6I26Uf1KkRZl2jeFu0tuDcCwWSoAzVJBzsZtgFBpIyOaKzqHu3O8YpsPmQSJ6scJnjJ4ej6Df8osfPMGkBKua6anzM5nLSUPUoVSRWInDSG4H34USjRe5rL_gqvMr5dQb74-o8gisyF8SIK8JVDBQyO2Zu-fkqJeuj6Hgh1IcAOQjNpbemsT7cHZ-BJXmpIFDZjNLfr3-rSSP6BLUuHvo4KL4DT07Fn51HwwhMDDmM4n6oKsBkrBkHIbSZX-niKNCmQv9st3IZovyzOjrzUt_rSE60Xy11zLjdvYwUPPN7eYinbcsmIz4_Wmj7C-1Mtjyb_DZrMYxMXZwNImfSUBaimPHOmxV7iUqdynOEfXAr05zdDhLjsUZr_GFUMNpiujhPPpA3wzWALfIeDvG80kw8nMl56qw6A7kfDhFNhrxk-ysOAaxeMAyn8zr9iq9SN9bQn0m35ZgJBfzA9oYCuMJNfAh0LcqOPR9nZlJ1eWRo3MrgqS6lJmmr7q6je0S6sQjUjH378de_rR6BIh_XUkkLNvjxL7xPAvPyMqkJY0K4T5kWP-Ki0j4_nNUi9Vte8OuaKRqZ41_e1Bhqr_qa8atJ91Gxxq5Eajx0YyvOC3pzRqDv7JVUBBO82A9wwRa0PE4Noivn_O38-jmmRYcw9GlZJ5BI6FLDaWWzIFd7ltxKF08UorzlSPtqa4qniwwRHuV5Ssjp0E3vodwPoQ-mU1syPvcokcA'
                });
                const response = yield axios_1.default.post(tokenUrl, requestData, {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                });
                return response.data.access_token;
            }
            catch (error) {
                console.error("OAuth2 token acquisition failed:", error.message);
                if (error.response) {
                    console.error("Response status:", error.response.status);
                    console.error("Response data:", error.response.data);
                }
                throw new Error("Failed to get OAuth2 access token");
            }
        });
    }
    // Method for testing - allows setting credentials and transporter directly
    setCredentialsAndTransporter(credentials, transporter) {
        this.credentials = credentials;
        this.transporter = transporter;
    }
    initializeCredentials(sessionId, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
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
                // Only OAuth2 init
                yield this.initializeOAuth2();
            }
            catch (error) {
                console.error("Error initializing email credentials:", error);
                throw error;
            }
        });
    }
    // ---- OAuth2 Transporter Setup (only access token) ----
    initializeOAuth2() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config_1.default.OAUTH_CLIENT_ID ||
                !config_1.default.OAUTH_CLIENT_SECRET ||
                !config_1.default.SMTP_FROM_EMAIL ||
                !config_1.default.OAUTH_TENANT_ID) {
                throw new Error("OAuth2 configuration missing");
            }
            const tenantId = config_1.default.OAUTH_TENANT_ID;
            // 1. Generate access token
            const accessToken = yield this.getAccessToken(config_1.default.OAUTH_CLIENT_ID, config_1.default.OAUTH_CLIENT_SECRET, tenantId);
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
                user: config_1.default.SMTP_FROM_EMAIL,
                clientId: config_1.default.OAUTH_CLIENT_ID,
                clientSecret: config_1.default.OAUTH_CLIENT_SECRET,
                tenantId: tenantId,
                accessToken: accessToken,
            };
            this.transporter = nodemailer_1.default.createTransport({
                host: this.credentials.host,
                port: this.credentials.port,
                secure: false,
                auth: {
                    type: "OAuth2",
                    user: "website@UKTBC.org",
                    accessToken: accessToken,
                    clientId: config_1.default.OAUTH_CLIENT_ID,
                    clientSecret: config_1.default.OAUTH_CLIENT_SECRET,
                    // accessToken: accessToken,
                },
                tls: {
                    ciphers: "SSLv3",
                    rejectUnauthorized: false,
                },
            });
            // 5. Verify transporter
            if (this.transporter) {
                yield this.transporter.verify();
                console.log(" SMTP transporter verified with OAuth2 (access token only)");
            }
        });
    }
    // ---- Send Donation Receipt ----
    sendDonationReceipt(payment, toEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                if (!this.transporter) {
                    throw new Error("Email service not initialized");
                }
                // console.log(`giftAid: ${payment.giftAid}`);
                // console.log(`corpDonation: ${payment.corpDonation}`)
                // if (payment.giftAid !== "yes" || payment.corpDonation === "yes") {
                //   console.log(
                //     "Email not sent: giftAid is not 'yes' or corpDonation is 'yes'"
                //   );
                //   return;
                // }
                const pdfBuffer = yield (0, pdfService_1.generateDonationReceiptPDF)(payment);
                const subject = `Donation Receipt - UK Telugu Brahmin Community`;
                const htmlContent = this.generateEmailHTML(payment);
                const logoPath = path_1.default.join(process.cwd(), "src/resources/UKTBC Logo PNG.png");
                console.log(`${(_a = this.credentials) === null || _a === void 0 ? void 0 : _a.user}`);
                const mailOptions = {
                    from: `"UK Telugu Brahmin Community" <${(_b = this.credentials) === null || _b === void 0 ? void 0 : _b.user}>`,
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
                const info = yield this.transporter.sendMail(mailOptions);
                console.log(" Donation receipt email sent!");
                console.log("Message ID:", info.messageId);
            }
            catch (error) {
                console.error("Error sending donation receipt email:", error);
                throw error;
            }
        });
    }
    // ---- Email Template ----
    generateEmailHTML(payment) {
        const giftAidAmount = payment.giftAid === "yes" ? (payment.amount * 0.25).toFixed(2) : "0.00";
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
              <li><strong>Donation Date:</strong> ${new Date().toLocaleDateString("en-GB")}</li>
              <li><strong>Donation for:</strong> ${payment.paymentReference || "General Donation"}</li>
              <li><strong>Mode of transfer:</strong> ${payment.paymentType}</li>
              <li><strong>Donation amount:</strong> £${payment.amount.toFixed(2)}</li>
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
exports.EmailService = EmailService;
exports.emailService = new EmailService();
