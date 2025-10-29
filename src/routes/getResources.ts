import { Router } from "express";
import path from "path";
import { fileToBase64 } from "../middleware/filetobase64converter";
import { ResourceRepo } from "../repos/resourceRepo";

const router = Router();
// Get All Events
router.get("/latest", async (req, res) => {
  try {
    // Fetch latest Panchangam and Report resources
    const panchangamList = await ResourceRepo.getLatestPanchangam({
      resourceType: "Panchangam",
      sortBy: { createdAt: -1 },
      limit: 3,
    });

    const reportsList = await ResourceRepo.getLatestReports({
      resourceType: "Report",
      sortBy: { createdAt: -1 },
      limit: 3,
    });

    // Helper to build full file URL (used for both filePath and previewImage)
    const buildFileUrl = (filePath?: string) =>
      filePath
        ? `https://${req.get("host")}/files/${path.basename(filePath)}`
        : null;

    // Common function to format resource data
    const formatResourceData = (list: any[]) =>
      list.map((item) => {
        const obj = item.toObject?.() ?? item;
        return {
          ...obj,
          filePath: buildFileUrl(obj.filePath),
          previewImage: buildFileUrl(obj.previewImage), // ✅ Now uses same logic
        };
      });

    // Format Panchangam and Report data
    const panchangamData = formatResourceData(panchangamList);
    const reportsData = formatResourceData(reportsList);

    // Send both lists
    res.json({
      panchangam: panchangamData,
      reports: reportsData,
    });
  } catch (err) {
    console.error("Error fetching latest resources:", err);
    res.status(500).json({ error: "Failed to fetch latest resources" });
  }
});
export default router;
