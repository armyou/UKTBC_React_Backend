import { Router } from "express";
import { EventRepo } from "../repos/eventRepo";
import { ResourceRepo } from "../repos/resourceRepo";
import path from "path";
import { fileToBase64 } from "../middleware/filetobase64converter";

const router = Router();

router.get("/latest", async (req, res) => {
  try {
    // Fetch latest 3 events
    const events = await EventRepo.getLatestEvents({
      sortBy: { startDate: 1 },
      limit: 3,
      convertStartDate: true,
    });

    // Fetch latest 3 Panchangam resources
    const panchangam = await ResourceRepo.getLatestPanchangam({
      resourceType: "Panchangam",
      sortBy: { createdAt: -1 },
      limit: 3,
    });

    // Helper to build full public file URL
    const buildFileUrl = (filePath?: string) =>
      filePath
        ? `https://${req.get("host")}/files/${path.basename(filePath)}`
        : null;

    // Map events to include full file URLs
    const updatedEvents = events.map((event) => {
      const obj = event.toObject?.() ?? event;
      return {
        ...obj,
        filePath: buildFileUrl(obj.filePath),
      };
    });

    // Map Panchangam to include full file URLs
    const updatedPanchangam = panchangam.map((item) => {
      const obj = item.toObject?.() ?? item;
      return {
        ...obj,
        filePath: buildFileUrl(obj.filePath),
      };
    });

    // Send combined dashboard data
    res.json({
      events: updatedEvents,
      panchangam: updatedPanchangam,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
