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
exports.generateDonationReceiptPDF = generateDonationReceiptPDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = __importDefault(require("path"));
function generateDonationReceiptPDF(payment) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ size: "A4", margin: 50 });
                const buffers = [];
                doc.on("data", buffers.push.bind(buffers));
                doc.on("end", () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });
                // ===== Header with logo =====
                const logoPath = path_1.default.join(process.cwd(), "src/resources/UKTBC Logo PNG.png");
                let headerY = 20;
                let logoHeight = 0;
                try {
                    logoHeight = 100; // set the logo height
                    const logoPadding = 2; // space below logo
                    doc.image(logoPath, 225, headerY, { width: 100, height: logoHeight });
                    headerY += logoHeight + logoPadding;
                }
                catch (error) {
                    console.log("Logo not found, using text fallback");
                    doc
                        .fontSize(20)
                        .fillColor("#000")
                        .text("UK Telugu Brahmin Community", { align: "center" });
                    headerY += 40; // approximate text height
                }
                // ===== Title and charity registration =====
                doc
                    .fontSize(20)
                    .fillColor("#000")
                    .text("UK Telugu Brahmin Community", 50, headerY, { align: "center" });
                headerY += 25;
                doc
                    .fontSize(12)
                    .fillColor("#000")
                    .text("Charity registered in England & Wales No. 1205566", 50, headerY, { align: "center" });
                const charityPadding = 15;
                headerY += charityPadding;
                // ===== Top line =====
                const topLineY = headerY + headerY * 0.001; // move downward by 15%
                doc.moveTo(50, topLineY).lineTo(545, topLineY).stroke();
                // ===== Main content starts =====
                let currentY = topLineY + 20;
                const leftX = 50;
                const rightX = 300;
                // Donor address section
                doc.fontSize(12).text("Donor Address:", leftX, currentY);
                doc
                    .fontSize(10)
                    .text(`${payment.title}. ${payment.firstName} ${payment.lastName}`, leftX, currentY + 20)
                    .text(payment.addressLine1, leftX, currentY + 40)
                    .text(payment.addressLine2 || "", leftX, currentY + 55)
                    .text(payment.addressLine3 || "", leftX, currentY + 70)
                    .text(payment.city, leftX, currentY + 85)
                    .text(payment.postCode, leftX, currentY + 100);
                // Receipt details
                doc.fontSize(12).text("Receipt Details:", rightX, currentY);
                doc
                    .fontSize(10)
                    .text(`Date: ${new Date().toLocaleDateString("en-US")}`, rightX, currentY + 20)
                    .text(`Receipt No: ${payment._id.toString().slice(-8).toUpperCase()}`, rightX, currentY + 40);
                currentY += 140;
                // Greeting
                doc
                    .fontSize(12)
                    .text(`Namaste ${payment.firstName},`, leftX, currentY)
                    .moveDown(1)
                    .text("We are grateful for your generous donation in support of our work.", leftX, currentY + 20);
                currentY += 60;
                // Donation details
                doc.fontSize(12).text("Donation Details:", leftX, currentY).moveDown(0.5);
                // Calculate Gift Aid amount and status
                const giftAidAmount = payment.giftAid === "yes" ? (payment.amount * 0.25).toFixed(2) : "0.00";
                const giftAidDisplay = payment.giftAid === "yes" ? `Yes - £${giftAidAmount}` : "No";
                const donationDetails = [
                    `Donation Date: ${new Date().toLocaleDateString("en-GB")}`,
                    `Donation for: ${payment.paymentReference || "General Donation"}`,
                    `Mode of transfer: ${payment.paymentType}`,
                    `Donation amount: £${payment.amount.toFixed(2)}`,
                    `Gift Aid (UK Tax Payer): ${giftAidDisplay}`,
                ];
                doc.fontSize(10);
                donationDetails.forEach((detail, index) => {
                    doc.text(detail, leftX + 20, currentY + 30 + index * 15);
                });
                currentY += 120;
                // Note
                doc
                    .fontSize(10)
                    .text("Please note that all of your donation will be used for the causes we support.", leftX, currentY);
                currentY += 40;
                // Closing
                doc
                    .fontSize(10)
                    .text("Kind Regards,", leftX, currentY)
                    .text("UK Telugu Brahmin Community", leftX, currentY + 15)
                    .text("Finance Team", leftX, currentY + 30)
                    .text("www.uktbc.org", leftX, currentY + 45);
                currentY += 80;
                // Gift Aid declarations
                doc
                    .fontSize(9)
                    .text("I confirm I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay the difference.", leftX, currentY, { width: 500 })
                    .moveDown(1)
                    .text("If I pay Income Tax at the higher or additional rate, I can claim the difference between my rate and the basic rate on my Self Assessment tax return.", leftX, currentY + 40, { width: 500 });
                // Bottom line after Gift Aid
                const pageHeight = 842; // A4
                const bottomMargin = 50;
                const moveUp = (pageHeight - currentY - bottomMargin) * 0.48; // 48% upward
                currentY += 140 - moveUp;
                doc.moveTo(50, currentY).lineTo(545, currentY).stroke();
                currentY += 20;
                // Footer
                doc
                    .fontSize(8)
                    .text("UK Telugu Brahmin Community", { align: "center" })
                    .text("donate@uktbc.org | www.uktbc.org", { align: "center" });
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
