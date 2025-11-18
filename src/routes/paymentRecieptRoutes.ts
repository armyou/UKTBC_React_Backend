import { Router } from "express";
import path from "path";
import fs from "fs";
import Payment from "../models/payments";
import { generateDonationReceiptPDF } from "../services/pdfService";

const router = Router();

// Ensure assets folder exists
const assetsPath = path.join(process.cwd(), "assets");
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath);
}

// to genereate a payment receipt
router.get("/generate/payment-receipt", async (req, res) => {
  try {
    // Get payment ID from query params
    const { paymentId } = req.query;

    if (!paymentId || typeof paymentId !== "string") {
      return res.status(400).json({
        error: "Payment ID is required in query params",
        message: "Please provide paymentId as query parameter",
      });
    }

    // Fetch payment from database
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found",
        message: `Payment with ID ${paymentId} does not exist`,
      });
    }

    // Generate receipt ID
    const paymentIdString = payment._id?.toString() || payment._id;
    const receiptId =
      typeof paymentIdString === "string"
        ? paymentIdString.slice(-8).toUpperCase()
        : String(paymentIdString).slice(-8).toUpperCase();

    // Generate PDF
    console.log("Generating PDF for payment:", paymentIdString);
    const pdfBuffer = await generateDonationReceiptPDF(
      payment,
      payment.giftAid || "no",
      receiptId
    );

    // Generate unique filename
    const fileName = `receipt_${paymentIdString}_${Date.now()}.pdf`;
    const filePath = path.join(assetsPath, fileName);

    // Save PDF to assets folder
    fs.writeFileSync(filePath, pdfBuffer);
    console.log("PDF saved to:", filePath);

    // Send the PDF file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up: Delete file after streaming completes
    fileStream.on("end", () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("PDF file deleted:", fileName);
          }
        } catch (deleteError) {
          console.error("Error deleting PDF file:", deleteError);
        }
      }, 1000); // Wait 1 second after stream ends before deletion
    });

    fileStream.on("error", (streamError) => {
      console.error("Error streaming PDF file:", streamError);

      // Try to delete file even if streaming fails
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error(
            "Error deleting PDF file after stream error:",
            deleteError
          );
        }
      }, 1000);

      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to stream PDF file",
          message: streamError.message,
        });
      }
    });
  } catch (error: any) {
    console.error("Error generating payment receipt:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to generate payment receipt",
        message: error.message,
      });
    }
  }
});

export default router;
