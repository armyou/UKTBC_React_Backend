import { Router } from "express";
import { fileToBase64 } from "../middleware/filetobase64converter.ts";
import { ResourceRepo } from "../repos/resourceRepo.ts";

const router = Router();
// Get All Events
router.get("/latest", async (req, res) => {
  try {
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

    const panchangamData = panchangamList.map((item) => {
      const base64File = item.filePath ? fileToBase64(item.filePath) : null;
      return {
        ...(item.toObject?.() ?? item), // handle Mongoose or plain object
        filePath: base64File,
      };
    });

    const reportsData = reportsList.map((item) => {
      const base64File = item.filePath ? fileToBase64(item.filePath) : null;
      return {
        ...(item.toObject?.() ?? item), // handle Mongoose or plain object
        filePath: base64File,
      };
    });

    res.json({ panchangam: panchangamData, reports: reportsData });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});
export default router;
