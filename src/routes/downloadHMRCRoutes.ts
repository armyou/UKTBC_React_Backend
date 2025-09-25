import { Router } from "express";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import Payment, { PaymentDocument } from "../models/payments"; // Adjust import if needed

const router = Router();

// Ensure assets folder exists
const assetsPath = path.join(process.cwd(), "assets");
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath);
}

interface PaymentType {
  title?: string;
  firstName?: string;
  lastName?: string;
  house?: string;
  postcode?: string;
  aggregatedDonations?: string;
  sponsoredEvent?: boolean;
  createdAt?: Date;
  amount?: number;
}

router.get("/generate-donations-excel", async (req, res, next) => {
  try {
    const payments: PaymentDocument[] = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(1000);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("R68GAD_V1_00_0_EN");


// --- Top info line ---
const infoRow = sheet.addRow([
  "The total below is automatically calculated from the amounts you enter in the schedule.",
]);
sheet.mergeCells(`A${infoRow.number}:J${infoRow.number}`);
infoRow.getCell(1).font = { bold: true };
infoRow.getCell(1).alignment = { vertical: "middle", horizontal: "right" };

// --- Total donations line ---
const totalRow = sheet.addRow(["Total donations:        £0.00"]);
sheet.mergeCells(`A${totalRow.number}:J${totalRow.number}`);
totalRow.getCell(1).font = { bold: true };
totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "right" };

// --- Donations schedule table row ---
const scheduleRow = sheet.addRow(["Donations schedule table"]);
sheet.mergeCells(`A${scheduleRow.number}:J${scheduleRow.number}`);
scheduleRow.getCell(1).font = { bold: true };
scheduleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };

    // Add header row with black background and white text
    const headerRow = sheet.addRow([
      "Item",
      "Title",
      "First name",
      "Last name",
      "House name or number",
      "Postcode",
      "Aggregated donations",
      "Sponsored event",
      "Donation date",
      "Amount",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF000000" }, // Black background
      };
    });

    // Add data rows
    payments.forEach((payment: PaymentType, index: number) => {
      const donationDate = payment.createdAt ?? new Date();
      const formattedDate = `${String(donationDate.getDate()).padStart(2, "0")}/${String(
        donationDate.getMonth() + 1
      ).padStart(2, "0")}/${String(donationDate.getFullYear()).slice(-2)}`;

      const row = sheet.addRow([
        index + 1,
        payment.title ?? "",
        payment.firstName ?? "",
        payment.lastName ?? "",
        payment.house ?? "",
        payment.postcode ?? "",
        payment.aggregatedDonations ?? "",
        payment.sponsoredEvent ? "Yes" : "",
        formattedDate,
        payment.amount != null ? payment.amount.toFixed(2) : "0.00",
      ]);

      // Apply same style to the "Item" column cell
      const itemCell = row.getCell(1); // Column A
      itemCell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
      itemCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF000000" }, // Black background
      };
    });

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      column.width = column.header ? column.header.toString().length + 5 : 15;
    });

    const filePath = path.join(assetsPath, "donations.xlsx");
    await workbook.xlsx.writeFile(filePath);

    res.json({ message: "Excel file generated successfully", path: filePath });
  } catch (error) {
    next(error);
  }
});

export default router;
