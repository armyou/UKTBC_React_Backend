// import nodemailer from "nodemailer";
// import config from "../config";
// import pdfService, { ReceiptData } from "./pdfService";
// import fs from "fs";

// // Microsoft SMTP Configuration
// const createTransporter = () => {
//   return nodemailer.createTransport({
//     host: "smtp.office365.com",
//     port: 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//       user: config.EMAIL.USER,
//       pass: config.EMAIL.PASS,
//     },
//     tls: {
//       ciphers: "SSLv3",
//       rejectUnauthorized: false,
//     },
//   });
// };

// // Email templates
// export const emailTemplates = {
//   donationConfirmation: (data: {
//     firstName: string;
//     lastName: string;
//     amount: number;
//     currency: string;
//     paymentReference: string;
//     donationType: string;
//     giftAid: boolean;
//   }) => ({
//     subject: `Thank you for your donation - ${data.paymentReference}`,
//     html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Donation Confirmation</title>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
//           .content { padding: 20px; background-color: #f9f9f9; }
//           .donation-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
//           .amount { font-size: 24px; font-weight: bold; color: #27ae60; }
//           .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
//           .gift-aid { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Thank You for Your Donation!</h1>
//             <p>UKTBC - United Kingdom Trade & Business Council</p>
//           </div>

//           <div class="content">
//             <p>Dear ${data.firstName} ${data.lastName},</p>

//             <p>Thank you for your generous donation to UKTBC. Your support helps us continue our important work in promoting trade and business relationships.</p>

//             <div class="donation-details">
//               <h3>Donation Details</h3>
//               <p><strong>Reference:</strong> ${data.paymentReference}</p>
//               <p><strong>Amount:</strong> <span class="amount">${data.currency.toUpperCase()} ${data.amount.toFixed(
//       2
//     )}</span></p>
//               <p><strong>Type:</strong> ${data.donationType}</p>
//               <p><strong>Date:</strong> ${new Date().toLocaleDateString(
//                 "en-GB"
//               )}</p>
//             </div>

//             ${
//               data.giftAid
//                 ? `
//               <div class="gift-aid">
//                 <h4>Gift Aid Declaration</h4>
//                 <p>Thank you for choosing to Gift Aid your donation. This means UKTBC can claim an extra 25% from the government on your donation at no extra cost to you.</p>
//               </div>
//             `
//                 : ""
//             }

//             <p>Your donation receipt will be sent separately for your records.</p>

//             <p>If you have any questions about your donation, please don't hesitate to contact us.</p>

//             <p>With gratitude,<br>
//             The UKTBC Team</p>
//           </div>

//           <div class="footer">
//             <p>UKTBC - United Kingdom Trade & Business Council</p>
//             <p>This is an automated message. Please do not reply to this email.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `,
//     text: `
//       Thank you for your donation!

//       Dear ${data.firstName} ${data.lastName},

//       Thank you for your generous donation to UKTBC. Your support helps us continue our important work in promoting trade and business relationships.

//       Donation Details:
//       - Reference: ${data.paymentReference}
//       - Amount: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}
//       - Type: ${data.donationType}
//       - Date: ${new Date().toLocaleDateString("en-GB")}
//       ${data.giftAid ? "- Gift Aid: Yes (25% extra from government)" : ""}

//       Your donation receipt will be sent separately for your records.

//       If you have any questions about your donation, please don't hesitate to contact us.

//       With gratitude,
//       The UKTBC Team
//     `,
//   }),

//   paymentFailed: (data: {
//     firstName: string;
//     lastName: string;
//     amount: number;
//     currency: string;
//     paymentReference: string;
//     errorMessage?: string;
//   }) => ({
//     subject: `Payment Issue - ${data.paymentReference}`,
//     html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Payment Issue</title>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
//           .content { padding: 20px; background-color: #f9f9f9; }
//           .donation-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
//           .amount { font-size: 24px; font-weight: bold; color: #e74c3c; }
//           .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Payment Issue</h1>
//             <p>UKTBC - United Kingdom Trade & Business Council</p>
//           </div>

//           <div class="content">
//             <p>Dear ${data.firstName} ${data.lastName},</p>

//             <p>We encountered an issue processing your donation payment. Please try again or contact us for assistance.</p>

//             <div class="donation-details">
//               <h3>Donation Details</h3>
//               <p><strong>Reference:</strong> ${data.paymentReference}</p>
//               <p><strong>Amount:</strong> <span class="amount">${data.currency.toUpperCase()} ${data.amount.toFixed(
//       2
//     )}</span></p>
//               <p><strong>Date:</strong> ${new Date().toLocaleDateString(
//                 "en-GB"
//               )}</p>
//               ${
//                 data.errorMessage
//                   ? `<p><strong>Error:</strong> ${data.errorMessage}</p>`
//                   : ""
//               }
//             </div>

//             <p>Please try making your donation again, or contact us if you continue to experience issues.</p>

//             <p>Thank you for your support,<br>
//             The UKTBC Team</p>
//           </div>

//           <div class="footer">
//             <p>UKTBC - United Kingdom Trade & Business Council</p>
//             <p>This is an automated message. Please do not reply to this email.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `,
//     text: `
//       Payment Issue

//       Dear ${data.firstName} ${data.lastName},

//       We encountered an issue processing your donation payment. Please try again or contact us for assistance.

//       Donation Details:
//       - Reference: ${data.paymentReference}
//       - Amount: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}
//       - Date: ${new Date().toLocaleDateString("en-GB")}
//       ${data.errorMessage ? `- Error: ${data.errorMessage}` : ""}

//       Please try making your donation again, or contact us if you continue to experience issues.

//       Thank you for your support,
//       The UKTBC Team
//     `,
//   }),

//   donationReceipt: (data: {
//     firstName: string;
//     lastName: string;
//     amount: number;
//     currency: string;
//     paymentReference: string;
//     donationType: string;
//     giftAid: boolean;
//     paymentDate: Date;
//     transactionId: string;
//     addressLine1?: string;
//     addressLine2?: string;
//     addressLine3?: string;
//     townCity?: string;
//     postCode?: string;
//     paymentMethod?: string;
//   }) => ({
//     subject: `Donation Receipt - ${data.paymentReference}`,
//     html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Donation Receipt</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             line-height: 1.4;
//             color: #000;
//             margin: 0;
//             padding: 0;
//             background-color: #fff;
//           }
//           .container {
//             max-width: 800px;
//             margin: 0 auto;
//             padding: 20px;
//             background-color: #fff;
//           }
//           .logo-section {
//             text-align: center;
//             margin-bottom: 30px;
//           }
//           .logo-circle {
//             width: 120px;
//             height: 120px;
//             border: 3px solid #000;
//             border-radius: 50%;
//             margin: 0 auto 15px;
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//             justify-content: center;
//             position: relative;
//           }
//           .logo-text {
//             font-size: 10px;
//             font-weight: bold;
//             text-align: center;
//             line-height: 1.2;
//             margin: 0;
//           }
//           .om-symbol {
//             font-size: 24px;
//             font-weight: bold;
//             margin: 5px 0;
//           }
//           .uktbc-acronym {
//             font-size: 12px;
//             font-weight: bold;
//             margin: 0;
//           }
//           .org-title {
//             font-size: 24px;
//             font-weight: bold;
//             margin: 10px 0 5px;
//             text-align: center;
//           }
//           .org-subtitle {
//             font-size: 14px;
//             margin: 0 0 20px;
//             text-align: center;
//           }
//           .divider {
//             border-top: 2px solid #000;
//             margin: 20px 0;
//           }
//           .receipt-title {
//             font-size: 20px;
//             font-weight: bold;
//             text-align: center;
//             margin: 20px 0;
//           }
//           .address-section {
//             display: flex;
//             justify-content: space-between;
//             margin: 20px 0;
//           }
//           .donor-address {
//             width: 45%;
//           }
//           .receipt-info {
//             width: 45%;
//             text-align: right;
//           }
//           .address-label {
//             font-weight: bold;
//             margin-bottom: 5px;
//           }
//           .address-field {
//             margin: 3px 0;
//             min-height: 20px;
//             border-bottom: 1px solid #ccc;
//           }
//           .salutation {
//             margin: 20px 0 15px;
//           }
//           .namaste {
//             font-weight: bold;
//           }
//           .gratitude-text {
//             margin: 15px 0;
//           }
//           .donation-details {
//             margin: 20px 0;
//             display: flex;
//             justify-content: space-between;
//           }
//           .details-left {
//             width: 45%;
//           }
//           .details-right {
//             width: 45%;
//             text-align: right;
//           }
//           .detail-row {
//             display: flex;
//             justify-content: space-between;
//             margin: 8px 0;
//             padding: 5px 0;
//             border-bottom: 1px solid #eee;
//           }
//           .detail-label {
//             font-weight: bold;
//           }
//           .detail-value {
//             font-weight: bold;
//             color: #27ae60;
//           }
//           .amount-value {
//             font-size: 18px;
//             font-weight: bold;
//             color: #27ae60;
//           }
//           .gift-aid-value {
//             font-weight: bold;
//             color: #27ae60;
//           }
//           .purpose-note {
//             margin: 20px 0;
//             font-style: italic;
//           }
//           .closing {
//             margin: 20px 0;
//           }
//           .org-signature {
//             margin: 20px 0;
//           }
//           .gift-aid-disclaimer {
//             margin: 30px 0;
//             padding: 20px;
//             background-color: #f9f9f9;
//             border: 1px solid #ddd;
//           }
//           .disclaimer-title {
//             font-weight: bold;
//             margin-bottom: 10px;
//           }
//           .disclaimer-text {
//             margin: 10px 0;
//             font-size: 14px;
//             line-height: 1.4;
//           }
//           .footer {
//             text-align: center;
//             margin: 30px 0 20px;
//             padding-top: 20px;
//             border-top: 1px solid #ccc;
//           }
//           .footer-contact {
//             font-size: 14px;
//             margin: 5px 0;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <!-- Logo Section -->
//           <div class="logo-section">
//             <div class="logo-circle">
//               <div class="logo-text">UK TELUGU<br>BRAHMIN<br>COMMUNITY</div>
//               <div class="om-symbol">ॐ</div>
//               <div class="uktbc-acronym">UKTBC</div>
//             </div>
//             <div class="org-title">UK Telugu Brahmin Community</div>
//             <div class="org-subtitle">Charity registered in England & Wales No. 1205566</div>
//           </div>

//           <div class="divider"></div>

//           <!-- Receipt Title -->
//           <div class="receipt-title">Donation Receipt</div>

//           <!-- Address and Receipt Info -->
//           <div class="address-section">
//             <div class="donor-address">
//               <div class="address-label">Title. Full Name</div>
//               <div class="address-field">${data.firstName} ${data.lastName}</div>
//               <div class="address-label">Address Line 1</div>
//               <div class="address-field">${data.addressLine1 || ''}</div>
//               <div class="address-label">Address Line 2</div>
//               <div class="address-field">${data.addressLine2 || ''}</div>
//               <div class="address-label">Address Line 3</div>
//               <div class="address-field">${data.addressLine3 || ''}</div>
//               <div class="address-label">City / Town</div>
//               <div class="address-field">${data.townCity || ''}</div>
//               <div class="address-label">Postcode</div>
//               <div class="address-field">${data.postCode || ''}</div>
//             </div>
//             <div class="receipt-info">
//               <div class="address-label">Date: mm/dd/yyyy</div>
//               <div class="address-field">${data.paymentDate.toLocaleDateString("en-GB")}</div>
//               <div class="address-label">Receipt No: &lt;coded&gt;</div>
//               <div class="address-field">${data.paymentReference}</div>
//             </div>
//           </div>

//           <!-- Salutation -->
//           <div class="salutation">
//             <span class="namaste">Namaste</span> ${data.firstName},
//           </div>

//           <!-- Gratitude Message -->
//           <div class="gratitude-text">
//             We are grateful for your generous donation in support of our work.
//           </div>

//           <!-- Donation Details -->
//           <div class="donation-details">
//             <div class="details-left">
//               <div class="detail-row">
//                 <span class="detail-label">Donation Date:</span>
//                 <span class="detail-value">${data.paymentDate.toLocaleDateString("dd/mm/yyyy")}</span>
//               </div>
//               <div class="detail-row">
//                 <span class="detail-label">Donation for:</span>
//                 <span class="detail-value">${data.paymentReference}</span>
//               </div>
//               <div class="detail-row">
//                 <span class="detail-label">Mode of transfer:</span>
//                 <span class="detail-value">${data.paymentMethod || 'Bank transfer / Paypal / Stripe'}</span>
//               </div>
//               <div class="detail-row">
//                 <span class="detail-label">Donation amount</span>
//                 <span class="detail-value amount-value">${data.currency.toUpperCase()} ${data.amount.toFixed(2)}</span>
//               </div>
//               ${data.giftAid ? `
//               <div class="detail-row">
//                 <span class="detail-label">Gift Aid (UK Tax Payer):</span>
//                 <span class="detail-value gift-aid-value">Yes - 25% of donation amount</span>
//               </div>
//               ` : ''}
//             </div>
//           </div>

//           <!-- Purpose Note -->
//           <div class="purpose-note">
//             Please note that all of your donation will be used for the causes we support.
//           </div>

//           <!-- Closing -->
//           <div class="closing">
//             Kind Regards,<br>
//             <strong>UK Telugu Brahmin Community</strong><br>
//             Finance Team<br>
//             <a href="https://www.uktbc.org">www.uktbc.org</a>
//           </div>

//           ${data.giftAid ? `
//           <!-- Gift Aid Disclaimer -->
//           <div class="gift-aid-disclaimer">
//             <div class="disclaimer-title">Gift Aid Declaration</div>
//             <div class="disclaimer-text">
//               I confirm I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay the difference.
//             </div>
//             <div class="disclaimer-text">
//               If I pay Income Tax at the higher or additional rate, I can claim the difference between my rate and the basic rate on my Self Assessment tax return.
//             </div>
//           </div>
//           ` : ''}

//           <div class="divider"></div>

//           <!-- Footer -->
//           <div class="footer">
//             <div class="footer-contact"><strong>UK Telugu Brahmin Community</strong></div>
//             <div class="footer-contact">donate@uktbc.org | www.uktbc.org</div>
//           </div>
//         </div>
//       </body>
//       </html>
//     `,
//     text: `
//       UK TELUGU BRAHMIN COMMUNITY
//       Charity registered in England & Wales No. 1205566

//       DONATION RECEIPT

//       Donor Details:
//       ${data.firstName} ${data.lastName}
//       ${data.addressLine1 || ''}
//       ${data.addressLine2 || ''}
//       ${data.addressLine3 || ''}
//       ${data.townCity || ''}
//       ${data.postCode || ''}

//       Receipt Details:
//       Date: ${data.paymentDate.toLocaleDateString("en-GB")}
//       Receipt No: ${data.paymentReference}

//       Namaste ${data.firstName},

//       We are grateful for your generous donation in support of our work.

//       Donation Details:
//       - Donation Date: ${data.paymentDate.toLocaleDateString("dd/mm/yyyy")}
//       - Donation for: ${data.paymentReference}
//       - Mode of transfer: ${data.paymentMethod || 'Bank transfer / Paypal / Stripe'}
//       - Donation amount: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}
//       ${data.giftAid ? '- Gift Aid (UK Tax Payer): Yes - 25% of donation amount' : ''}

//       Please note that all of your donation will be used for the causes we support.

//       Kind Regards,
//       UK Telugu Brahmin Community
//       Finance Team
//       www.uktbc.org

//       ${data.giftAid ? `
//       GIFT AID DECLARATION:

//       I confirm I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay the difference.

//       If I pay Income Tax at the higher or additional rate, I can claim the difference between my rate and the basic rate on my Self Assessment tax return.
//       ` : ''}

//       UK Telugu Brahmin Community
//       donate@uktbc.org | www.uktbc.org
//     `,
//   }),
// };

// // Email service class
// export class EmailService {
//   private transporter: nodemailer.Transporter;

//   constructor() {
//     this.transporter = createTransporter();
//   }

//   // Test email connection
//   async testConnection(): Promise<boolean> {
//     try {
//       await this.transporter.verify();
//       console.log("Email service connected successfully");
//       return true;
//     } catch (error) {
//       console.error("Email service connection failed:", error);
//       return false;
//     }
//   }

//   // Send donation confirmation email
//   async sendDonationConfirmation(data: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     amount: number;
//     currency: string;
//     paymentReference: string;
//     donationType: string;
//     giftAid: boolean;
//   }): Promise<boolean> {
//     try {
//       const template = emailTemplates.donationConfirmation(data);

//       const mailOptions = {
//         from: config.EMAIL.FROM,
//         to: data.email,
//         subject: template.subject,
//         html: template.html,
//         text: template.text,
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       console.log("Donation confirmation email sent:", result.messageId);
//       return true;
//     } catch (error) {
//       console.error("Failed to send donation confirmation email:", error);
//       return false;
//     }
//   }

//   // Send payment failed email
//   async sendPaymentFailed(data: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     amount: number;
//     currency: string;
//     paymentReference: string;
//     errorMessage?: string;
//   }): Promise<boolean> {
//     try {
//       const template = emailTemplates.paymentFailed(data);

//       const mailOptions = {
//         from: config.EMAIL.FROM,
//         to: data.email,
//         subject: template.subject,
//         html: template.html,
//         text: template.text,
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       console.log("Payment failed email sent:", result.messageId);
//       return true;
//     } catch (error) {
//       console.error("Failed to send payment failed email:", error);
//       return false;
//     }
//   }

//   // Send donation receipt as PDF
//   async sendDonationReceiptPDF(data: ReceiptData & { email: string }): Promise<boolean> {
//     try {
//       // Generate PDF
//       const pdfPath = await pdfService.generateReceipt(data);

//       // Read PDF file
//       const pdfBuffer = fs.readFileSync(pdfPath);

//       const mailOptions = {
//         from: config.EMAIL.FROM,
//         to: data.email,
//         subject: `Donation Receipt - ${data.paymentReference}`,
//         html: `
//           <!DOCTYPE html>
//           <html>
//           <head>
//             <meta charset="utf-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Donation Receipt</title>
//             <style>
//               body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//               .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//               .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
//               .content { padding: 20px; background-color: #f9f9f9; }
//               .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
//             </style>
//           </head>
//           <body>
//             <div class="container">
//               <div class="header">
//                 <h1>Donation Receipt</h1>
//                 <p>UKTBC - United Kingdom Trade & Business Council</p>
//               </div>

//               <div class="content">
//                 <p>Dear ${data.firstName} ${data.lastName},</p>

//                 <p>Please find your official donation receipt attached as a PDF file. This receipt is valid for tax purposes and should be kept for your records.</p>

//                 <p><strong>Receipt Details:</strong></p>
//                 <ul>
//                   <li><strong>Reference:</strong> ${data.paymentReference}</li>
//                   <li><strong>Amount:</strong> ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}</li>
//                   <li><strong>Date:</strong> ${data.paymentDate.toLocaleDateString("en-GB")}</li>
//                   <li><strong>Type:</strong> ${data.donationType}</li>
//                   ${data.giftAid ? '<li><strong>Gift Aid:</strong> Yes (25% extra from government)</li>' : ''}
//                 </ul>

//                 <p>Thank you for your generous support of UKTBC.</p>

//                 <p>Best regards,<br>
//                 The UKTBC Team</p>
//               </div>

//               <div class="footer">
//                 <p>UKTBC - United Kingdom Trade & Business Council</p>
//                 <p>This receipt is valid for tax purposes.</p>
//               </div>
//             </div>
//           </body>
//           </html>
//         `,
//         text: `
//           Donation Receipt

//           Dear ${data.firstName} ${data.lastName},

//           Please find your official donation receipt attached as a PDF file. This receipt is valid for tax purposes and should be kept for your records.

//           Receipt Details:
//           - Reference: ${data.paymentReference}
//           - Amount: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}
//           - Date: ${data.paymentDate.toLocaleDateString("en-GB")}
//           - Type: ${data.donationType}
//           ${data.giftAid ? '- Gift Aid: Yes (25% extra from government)' : ''}

//           Thank you for your generous support of UKTBC.

//           Best regards,
//           The UKTBC Team
//         `,
//         attachments: [
//           {
//             filename: `receipt_${data.paymentReference}.pdf`,
//             content: pdfBuffer,
//             contentType: 'application/pdf'
//           }
//         ]
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       console.log("Donation receipt PDF sent:", result.messageId);

//       // Clean up PDF file after sending
//       try {
//         fs.unlinkSync(pdfPath);
//       } catch (cleanupError) {
//         console.warn("Failed to clean up PDF file:", cleanupError);
//       }

//       return true;
//     } catch (error) {
//       console.error("Failed to send donation receipt PDF:", error);
//       return false;
//     }
//   }

//   // Send donation receipt (HTML version - kept for backward compatibility)
//   async sendDonationReceipt(data: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     amount: number;
//     currency: string;
//     paymentReference: string;
//     donationType: string;
//     giftAid: boolean;
//     paymentDate: Date;
//     transactionId: string;
//     addressLine1?: string;
//     addressLine2?: string;
//     addressLine3?: string;
//     townCity?: string;
//     postCode?: string;
//     paymentMethod?: string;
//   }): Promise<boolean> {
//     try {
//       const template = emailTemplates.donationReceipt(data);

//       const mailOptions = {
//         from: config.EMAIL.FROM,
//         to: data.email,
//         subject: template.subject,
//         html: template.html,
//         text: template.text,
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       console.log("Donation receipt sent:", result.messageId);
//       return true;
//     } catch (error) {
//       console.error("Failed to send donation receipt:", error);
//       return false;
//     }
//   }

//   // Send custom email
//   async sendEmail(
//     to: string,
//     subject: string,
//     html: string,
//     text?: string
//   ): Promise<boolean> {
//     try {
//       const mailOptions = {
//         from: config.EMAIL.FROM,
//         to,
//         subject,
//         html,
//         text: text || html.replace(/<[^>]*>/g, ""), // Convert HTML to text if not provided
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       console.log("Custom email sent:", result.messageId);
//       return true;
//     } catch (error) {
//       console.error("Failed to send custom email:", error);
//       return false;
//     }
//   }
// }

// // Export singleton instance
// export const emailService = new EmailService();
// export default emailService;
