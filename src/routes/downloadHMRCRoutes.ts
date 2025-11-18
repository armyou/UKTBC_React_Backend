import { Router } from "express";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { loadDonationsData } from "../resources/dummyDonationsData";
import { upload } from "../middleware/multerMiddleware";

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
  country?: string;
}
router.get("/download", upload.none(), async (req, res, next) => {
  try {
    // Use dummy
    //  data instead of database query
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };
    console.log(
      `Received request with startDate: ${startDate}, endDate: ${endDate}`
    );
    if (
      !startDate ||
      !endDate ||
      ["", "undefined", "null"].includes(startDate) ||
      ["", "undefined", "null"].includes(endDate)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid or missing startDate and endDate parameters" });
    } else {
      const allPayments = await loadDonationsData(startDate, endDate);

      // Separate donations > £20 and ≤ £20
      const highValueDonations = allPayments
        .filter((payment) => (payment.amount || 0) > 20)
        .map((payment) => ({
          ...payment,
          aggregatedDonations: "", // Override to blank for high value donations
        }));
      const lowValueDonations = allPayments.filter(
        (payment) => (payment.amount || 0) <= 20
      );
      // Aggregate low value donations by grouping individual donations
      const maxAmountPerGroup = 1000; // Maximum amount per group
      const aggregatedLowValueArray = [];
      if (lowValueDonations.length > 0) {
        // Sort by date to get the latest date
        const sortedLowValueDonations = lowValueDonations.sort((a, b) => {
          const dateA = a.createdAt || new Date();
          const dateB = b.createdAt || new Date();
          return dateB.getTime() - dateA.getTime(); // Latest date first
        });
        const latestDate = sortedLowValueDonations[0].createdAt || new Date(); // Latest date
        // Group donations by adding them one by one until we reach ~1000
        let currentGroup = [];
        let currentGroupAmount = 0;
        for (const donation of sortedLowValueDonations) {
          const donationAmount = donation.amount || 0;
          // If adding this donation would exceed 1000, create a group with current donations
          if (
            currentGroupAmount + donationAmount > maxAmountPerGroup &&
            currentGroup.length > 0
          ) {
            // Create group with current donations
            aggregatedLowValueArray.push({
              title: "",
              firstName: "",
              lastName: "",
              house: "",
              postcode: "",
              aggregatedDonations: "One off Gift Aid donations",
              sponsoredEvent: false,
              createdAt: latestDate,
              amount: currentGroupAmount,
            });
            // Start new group with this donation
            currentGroup = [donation];
            currentGroupAmount = donationAmount;
          } else {
            // Add donation to current group
            currentGroup.push(donation);
            currentGroupAmount += donationAmount;
          }
        }
        // Add the last group if it has donations
        if (currentGroup.length > 0) {
          aggregatedLowValueArray.push({
            title: "",
            firstName: "",
            lastName: "",
            house: "",
            postcode: "",
            aggregatedDonations: "One off Gift Aid donations",
            sponsoredEvent: false,
            createdAt: latestDate,
            amount: currentGroupAmount,
          });
        }
      }
      // Combine high value donations with aggregated low value donations
      const processedPayments = [
        ...highValueDonations,
        ...aggregatedLowValueArray,
      ];
      const maxRowsPerSheet = 1000; // Maximum rows per sheet
      const totalSheets = Math.ceil(processedPayments.length / maxRowsPerSheet); // Calculate number of sheets needed
      // Calculate total donations from all data
      const totalDonations = allPayments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      );
      const workbook = new ExcelJS.Workbook();
      // Create multiple sheets if data exceeds 1000 rows
      for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
        const startIndex = sheetIndex * maxRowsPerSheet;
        const endIndex = Math.min(
          startIndex + maxRowsPerSheet,
          processedPayments.length
        );
        const payments = processedPayments.slice(startIndex, endIndex);
        const sheetName =
          totalSheets === 1
            ? "R68GAD_V1_00_0_EN"
            : `R68GAD_V1_00_0_EN_Sheet${sheetIndex + 1}`;
        const sheet = workbook.addWorksheet(sheetName);
        // Calculate sheet-specific totals
        const sheetTotalDonations = payments.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        );

        // --- Top info line ---
        const infoRow = sheet.addRow([
          "The total below is automatically calculated from the amounts you enter in the schedule.",
        ]);
        sheet.mergeCells(`A${infoRow.number}:J${infoRow.number}`);
        infoRow.getCell(1).font = { bold: true };
        infoRow.getCell(1).alignment = {
          vertical: "middle",
          horizontal: "right",
        };

        // --- Total donations line (sheet-specific) ---
        const totalRow = sheet.addRow([
          `Total donations:        £${sheetTotalDonations.toFixed(2)}`,
        ]);
        sheet.mergeCells(`A${totalRow.number}:J${totalRow.number}`);
        totalRow.getCell(1).font = { bold: true, size: 12 };
        totalRow.getCell(1).alignment = {
          vertical: "middle",
          horizontal: "right",
        };

        // Add border styling to the total donations row
        // Border starts from column F (Aggregated donations) to column J (Amount)
        const borderStyle = {
          top: { style: "thin" as const, color: { argb: "FF000000" } },
          bottom: { style: "thin" as const, color: { argb: "FF000000" } },
          left: { style: "thin" as const, color: { argb: "FF000000" } },
          right: { style: "thin" as const, color: { argb: "FF000000" } },
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
        scheduleRow.getCell(1).alignment = {
          vertical: "middle",
          horizontal: "left",
        };

        // Add header row with black background and white text (with empty column before Item)
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
          const formattedDate = `${String(donationDate.getDate()).padStart(
            2,
            "0"
          )}/${String(donationDate.getMonth() + 1).padStart(2, "0")}/${String(
            donationDate.getFullYear()
          ).slice(-2)}`;

          // Apply character limits to column values
          const title = (payment.title ?? "").substring(0, 4);
          const firstName = (payment.firstName ?? "")
            .replace(/\s/g, "")
            .substring(0, 35);
          const lastName = (payment.lastName ?? "").substring(0, 35);
          const house = (payment.house ?? "").substring(0, 40);
          // Use the aggregatedDonations field from the payment (already set correctly for both types)
          // High value donations have blank, low value aggregated donations have "One off Gift Aid donations"
          const aggregatedDonations = (
            payment.aggregatedDonations ?? ""
          ).substring(0, 35);

          const row = sheet.addRow([
            index + 1,
            title,
            firstName,
            lastName,
            house,
            payment.country !== "United Kingdom" ? "X" : payment.postcode ?? "",
            aggregatedDonations,
            "", // Always leave sponsored event blank
            formattedDate,
            payment.amount != null ? payment.amount.toFixed(2) : "0.00",
          ]);

          // Apply black background and white text to the "Item" column cell
          const itemCell = row.getCell(1); // Column A (Item column)
          itemCell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
          itemCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF000000" }, // Black background
          };
        });

        // Ensure we always have exactly 1000 rows total (data + empty rows)
        // If we have more than 1000 data records, we only use the first 1000
        // If we have fewer than 1000 data records, we fill the remaining with empty rows
        const currentRowCount = payments.length;
        const maxRows = 1000;

        // Add additional empty rows if we have fewer than 1000 data records
        if (currentRowCount < maxRows) {
          for (let i = currentRowCount + 1; i <= maxRows; i++) {
            // Apply character limits to empty rows as well
            const title = "".substring(0, 4);
            const firstName = "".replace(/\s/g, "").substring(0, 35);
            const lastName = "".substring(0, 35);
            const house = "".substring(0, 40);
            const aggregatedDonations = ""; // Always leave blank for empty rows

            const row = sheet.addRow([
              i,
              title,
              firstName,
              lastName,
              house,
              "",
              aggregatedDonations,
              "", // Always leave sponsored event blank
              "",
              "", // Blank amount for empty rows
            ]);

            // Apply black background and white text to the "Item" column cell
            const itemCell = row.getCell(1); // Column A (Item column)
            itemCell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
            itemCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF000000" }, // Black background
            };
          }
        }

        // Log the sheet-specific row count for verification
        console.log(
          `Sheet ${sheetIndex + 1}: ${Math.min(
            currentRowCount,
            maxRows
          )} data rows and ${maxRows} total rows`
        );

        // Auto-fit columns based on content
        sheet.columns.forEach((column, index) => {
          let maxLength = 0;

          // Check header length
          if (column.header) {
            maxLength = Math.max(maxLength, column.header.toString().length);
          }

          // Check data rows length
          sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
              // Skip header rows
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
      }

      // Log overall summary
      console.log(
        `HMRC Excel generated with ${totalSheets} sheet(s) containing ${processedPayments.length} processed records`
      );
      console.log(
        `High value donations (>£20): ${highValueDonations.length} individual records`
      );
      console.log(
        `Low value donations (≤£20): ${
          lowValueDonations.length
        } donations (total: £${lowValueDonations
          .reduce((sum, p) => sum + (p.amount || 0), 0)
          .toFixed(2)}) aggregated into ${
          aggregatedLowValueArray.length
        } groups (max £1000 per group)`
      );
      const fileName = `donations_${startDate}_${endDate}.xlsx`;
      const filePath = path.join(
        assetsPath,
        `donations${startDate}${endDate}.xlsx`
      );
      await workbook.xlsx.writeFile(filePath);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          next(err);
        } else {
          setTimeout(() => fs.unlinkSync(filePath), 3000);
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
