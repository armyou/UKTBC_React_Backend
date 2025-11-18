import { generateDonationReceiptPDF } from "./src/services/pdfService";
import fs from "fs";
import path from "path";

async function generateTestPDF() {
  try {
    // Test payment data - Corporate donation with company name
    const testPayment = {
      _id: { toString: () => "TEST12345678" },
      title: "mr",
      firstName: "David",
      lastName: "Johnson",
      email: "david.johnson@company.com",
      mobile: 1234567890,
      corpDonation: "yes",
      companyName: "ABC Corporation Ltd",
      postCode: "EC1A 1BB",
      addressLine1: "456 Business Avenue",
      addressLine2: "Suite 200",
      addressLine3: "",
      city: "Manchester",
      country: "United Kingdom",
      amount: 500.0,
      paymentReference: "Corporate Sponsorship",
      donationType: "I'm donating my own money",
      giftAid: "yes",
      paymentType: "web/stripe",
      status: "paid",
    };

    const receiptId = "GA2025CORP005678";

    console.log("Generating test PDF...");
    const pdfBuffer = await generateDonationReceiptPDF(
      testPayment,
      testPayment.giftAid,
      receiptId
    );

    // Save to file in the root directory
    const outputPath = path.join(process.cwd(), "test-receipt-preview.pdf");
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`PDF generated successfully!`);
    console.log(`File location: ${outputPath}`);
    console.log(`\nYou can now open the PDF file to preview it.\n`);
  } catch (error: any) {
    console.error(" Error generating PDF:", error);
    process.exit(1);
  }
}

// Run the function
generateTestPDF();
