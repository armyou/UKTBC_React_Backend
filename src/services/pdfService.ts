import PDFDocument from "pdfkit";
import Payment from "../models/payments";
import path from "path";

// Helper function to format date as dd/mm/yyyy
function formatDateDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to capitalize first letter of title
function capitalizeTitle(title: string): string {
  if (!title) return title;
  return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
}

export async function generateDonationReceiptPDF(
  payment: any,
  giftAid: string,
  receiptId?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // ===== Header with logo =====
      const logoPath = path.join(
        process.cwd(),
        "src/resources/UKTBC Logo PNG.png"
      );
      let headerY = 20;
      let logoHeight = 0;

      try {
        logoHeight = 100; // set the logo height
        const logoPadding = 2; // space below logo
        doc.image(logoPath, 225, headerY, { width: 100, height: logoHeight });
        headerY += logoHeight + logoPadding;
      } catch (error) {
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
        .text(
          "Charity registered in England & Wales No. 1205566",
          50,
          headerY,
          { align: "center" }
        );
      const charityPadding = 15;
      headerY += charityPadding;
      // ===== Top line =====
      const topLineY = headerY + headerY * 0.001; // move downward by 15%
      doc.moveTo(50, topLineY).lineTo(545, topLineY).stroke();

      // ===== Main content starts =====
      let currentY = topLineY + 20;
      const leftX = 50;
      const rightX = 300;

      // Display name with company name if it's a corporate donation
      const capitalizedTitle = capitalizeTitle(payment.title || "");
      const displayName =
        payment.corpDonation === "yes" && payment.companyName
          ? `${capitalizedTitle}. ${payment.firstName} ${payment.lastName}\n${payment.companyName}`
          : `${capitalizedTitle}. ${payment.firstName} ${payment.lastName}`;

      // Build address lines array, filtering out empty/null values
      const addressLines: string[] = [];
      if (payment.addressLine1 && payment.addressLine1.trim()) addressLines.push(payment.addressLine1.trim());
      if (payment.addressLine2 && payment.addressLine2.trim()) addressLines.push(payment.addressLine2.trim());
      if (payment.addressLine3 && payment.addressLine3.trim()) addressLines.push(payment.addressLine3.trim());

      // Display name
      doc.fontSize(10).text(displayName, leftX, currentY + 20);

      // Display address lines dynamically
      let addressY = currentY + 40;
      addressLines.forEach((line) => {
        doc.text(line, leftX, addressY);
        addressY += 15;
      });

      // Display city and postcode
      if (payment.city && payment.city.trim()) {
        doc.text(payment.city.trim(), leftX, addressY);
        addressY += 15;
      }
      if (payment.postCode && payment.postCode.trim()) {
        doc.text(payment.postCode.trim(), leftX, addressY);
      }

      // Receipt details - aligned with address section
      // Add more white space on the left and reduce width
      const receiptDetailsY = currentY + 20;
      const receiptDetailsX = 350; // More left margin (moved from 300)
      const receiptDetailsWidth = 195; // Reduced width (545 - 350)

      // Receipt details
      doc
        .fontSize(10)
        .text(`Date: ${formatDateDDMMYYYY(new Date())}`, receiptDetailsX, receiptDetailsY, {
          width: receiptDetailsWidth
        })
        .text(
          `Receipt No: ${
            receiptId || payment._id.toString().slice(-8).toUpperCase()
          }`,
          receiptDetailsX,
          receiptDetailsY + 20,
          { width: receiptDetailsWidth }
        );

      currentY += 140;

      // Greeting
      const greetingName =
        payment.corpDonation === "yes" && payment.companyName
          ? `${payment.firstName} (${payment.companyName})`
          : payment.firstName;

      doc
        .fontSize(12)
        .text(`Namaste ${greetingName},`, leftX, currentY)
        .text(
          "We are grateful for your generous donation in support of our work.",
          leftX,
          currentY + 20
        );

      currentY += 60;

      // Donation details title
      doc.fontSize(12).text("Donation Details:", leftX, currentY);

      // Calculate Gift Aid amount and status
      const giftAidAmount =
        giftAid === "yes" ? (payment.amount * 0.25).toFixed(2) : "0.00";
      const giftAidDisplay =
        giftAid === "yes" ? `Yes - £${giftAidAmount}` : "No";

      // Donation details with labels and values
      const donationDetails = [
        { label: "Donation Date:", value: formatDateDDMMYYYY(new Date()) },
        {
          label: "Donation for:",
          value: payment.paymentReference || "General Donation",
        },
        { label: "Mode of transfer:", value: payment.paymentType },
        {
          label: "Donation amount:",
          value: `£${payment.amount.toFixed(2)}`,
        },
        { label: "Gift Aid (UK Tax Payer):", value: giftAidDisplay },
      ];

      // Display donation details below the title
      // Labels aligned left, values aligned left (starting after labels)
      doc.fontSize(10);
      const detailStartY = currentY + 20;
      const labelStartX = leftX + 20;
      const valueStartX = 450; // Start position for values (more space after labels)
      const valueWidth = 125; // Width for values (545 - 350)
      
      donationDetails.forEach((detail, index) => {
        const yPos = detailStartY + index * 15;
        // Label aligned left
        doc.text(detail.label, labelStartX, yPos);
        // Value aligned left - starting after the label
        doc.text(detail.value, valueStartX, yPos, { 
          width: valueWidth,
          align: "left" 
        });
      });

      currentY += 120;

      // Note
      doc
        .fontSize(10)
        .text(
          "Please note that all of your donation will be used for the causes we support.",
          leftX,
          currentY
        );

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
      if (payment.donationType === "fundraising") {
        // Add more space above for fundraising message
        currentY += 20;

        doc
          .fontSize(9)
          .text(
            "Gift Aid has not been claimed on this donation as no Gift Aid declaration was provided.",
            leftX,
            currentY,
            { width: 500, align: "center" }
          );

        // Position after fundraising message - add minimal gap before line
        currentY += 15; // Small gap after the message
      } else {
        doc
          .fontSize(9)
          .text(
            "I confirm I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay the difference.",
            leftX,
            currentY,
            { width: 500, align: "center" }
          )
          .text(
            "If I pay Income Tax at the higher or additional rate, I can claim the difference between my rate and the basic rate on my Self Assessment tax return.",
            leftX,
            currentY + 40,
            { width: 500, align: "center" }
          );

        // Position currentY after the second paragraph
        // Second paragraph starts at currentY + 40, add small gap for text height and spacing
        currentY = currentY + 40 + 20; // End of second paragraph + small gap
      }

      // Bottom line after Gift Aid - draw the line at current position

      doc.moveTo(50, currentY).lineTo(545, currentY).stroke();

      currentY += 20;

      // Footer
      doc
        .fontSize(8)
        .text("UK Telugu Brahmin Community", 50, currentY, { align: "center" })
        .text("donate@uktbc.org | www.uktbc.org", 50, currentY + 15, {
          align: "center",
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
