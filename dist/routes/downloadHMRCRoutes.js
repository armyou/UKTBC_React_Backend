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
const express_1 = require("express");
const exceljs_1 = __importDefault(require("exceljs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dummyDonationsData_1 = require("../resources/dummyDonationsData");
const router = (0, express_1.Router)();
// Ensure assets folder exists
const assetsPath = path_1.default.join(process.cwd(), "assets");
if (!fs_1.default.existsSync(assetsPath)) {
    fs_1.default.mkdirSync(assetsPath);
}
router.get("/generate-donations-excel", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use dummy data instead of database query
        const payments = dummyDonationsData_1.dummyDonationsData.slice(0, 1000); // Limit to 1000 items
        // Calculate total donations from dummy data
        const totalDonations = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const workbook = new exceljs_1.default.Workbook();
        const sheet = workbook.addWorksheet("R68GAD_V1_00_0_EN");
        // --- Top info line ---
        const infoRow = sheet.addRow([
            "The total below is automatically calculated from the amounts you enter in the schedule.",
        ]);
        sheet.mergeCells(`A${infoRow.number}:J${infoRow.number}`);
        infoRow.getCell(1).font = { bold: true };
        infoRow.getCell(1).alignment = { vertical: "middle", horizontal: "right" };
        // --- Total donations line ---
        const totalRow = sheet.addRow([`Total donations:        £${totalDonations.toFixed(2)}`]);
        sheet.mergeCells(`A${totalRow.number}:J${totalRow.number}`);
        totalRow.getCell(1).font = { bold: true, size: 12 };
        totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "right" };
        // Add border styling to the total donations row
        // Border starts from column F (Aggregated donations) to column J (Amount)
        const borderStyle = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        // Apply border to cells F through J (columns 6-10)
        for (let col = 6; col <= 10; col++) {
            const cell = totalRow.getCell(col);
            cell.border = borderStyle;
        }
        // --- Donations schedule table row ---
        const scheduleRow = sheet.addRow(["Donations schedule table"]);
        sheet.mergeCells(`A${scheduleRow.number}:J${scheduleRow.number}`);
        scheduleRow.getCell(1).font = { bold: true, size: 14 };
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
        // Add descriptive row under headers with "(yes/blank)" for Sponsored event column and "(DD/MM/YY)" for Donation date
        const descRow = sheet.addRow([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "(yes/blank)",
            "(DD/MM/YY)",
            "",
        ]);
        // Style the complete descriptive row with black background and white text
        descRow.eachCell((cell, colNumber) => {
            // Apply black background and white text to all cells in the row
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF000000" }, // Black background
            };
            if (colNumber === 8) { // Column H - Sponsored event
                cell.font = { italic: true, color: { argb: "FFFFFFFF" } }; // White italic text
                cell.alignment = { horizontal: "center" };
            }
            else if (colNumber === 9) { // Column I - Donation date
                cell.font = { italic: true, color: { argb: "FFFFFFFF" } }; // White italic text
                cell.alignment = { horizontal: "center" };
            }
            else {
                // For empty cells, just apply white text
                cell.font = { color: { argb: "FFFFFFFF" } }; // White text
            }
        });
        // Add data rows
        payments.forEach((payment, index) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const donationDate = (_a = payment.createdAt) !== null && _a !== void 0 ? _a : new Date();
            const formattedDate = `${String(donationDate.getDate()).padStart(2, "0")}/${String(donationDate.getMonth() + 1).padStart(2, "0")}/${String(donationDate.getFullYear()).slice(-2)}`;
            const row = sheet.addRow([
                index + 1,
                (_b = payment.title) !== null && _b !== void 0 ? _b : "",
                (_c = payment.firstName) !== null && _c !== void 0 ? _c : "",
                (_d = payment.lastName) !== null && _d !== void 0 ? _d : "",
                (_e = payment.house) !== null && _e !== void 0 ? _e : "",
                (_f = payment.postcode) !== null && _f !== void 0 ? _f : "",
                (_g = payment.aggregatedDonations) !== null && _g !== void 0 ? _g : "",
                payment.sponsoredEvent ? "Yes" : "",
                formattedDate,
                payment.amount != null ? payment.amount.toFixed(2) : "0.00",
            ]);
            // Apply black background and white text to the "Item" column cell
            const itemCell = row.getCell(1); // Column A
            itemCell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
            itemCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF000000" }, // Black background
            };
        });
        // Add additional rows up to 1000 if we have fewer payments
        const currentRowCount = payments.length;
        if (currentRowCount < 1000) {
            for (let i = currentRowCount + 1; i <= 1000; i++) {
                const row = sheet.addRow([
                    i,
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "0.00",
                ]);
                // Apply black background and white text to the "Item" column cell
                const itemCell = row.getCell(1); // Column A
                itemCell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
                itemCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF000000" }, // Black background
                };
            }
        }
        // Auto-fit columns based on content
        sheet.columns.forEach((column, index) => {
            let maxLength = 0;
            // Check header length
            if (column.header) {
                maxLength = Math.max(maxLength, column.header.toString().length);
            }
            // Check descriptive row length
            if (index === 7) { // Sponsored event column
                maxLength = Math.max(maxLength, "(yes/blank)".length);
            }
            else if (index === 8) { // Donation date column
                maxLength = Math.max(maxLength, "(DD/MM/YY)".length);
            }
            // Check data rows length
            sheet.eachRow((row, rowNumber) => {
                if (rowNumber > 2) { // Skip header and descriptive rows
                    const cellValue = row.getCell(index + 1).value;
                    if (cellValue !== null && cellValue !== undefined) {
                        const cellLength = cellValue.toString().length;
                        maxLength = Math.max(maxLength, cellLength);
                    }
                }
            });
            // Set column width with some padding
            column.width = Math.max(maxLength + 2, 10); // Minimum width of 10, add 2 for padding
        });
        const filePath = path_1.default.join(assetsPath, "donations.xlsx");
        yield workbook.xlsx.writeFile(filePath);
        res.json({ message: "Excel file generated successfully", path: filePath });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
