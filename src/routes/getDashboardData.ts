import { Router } from "express";
import { EventRepo } from "../repos/eventRepo";
import { ResourceRepo } from "../repos/resourceRepo";
import { fileToBase64 } from "../middleware/filetobase64converter";

const router = Router();

router.get("/latest", async (req, res) => {
  try {
    // Fetch latest 3 events sorted by startDate (string converted to Date)
    const events = await EventRepo.getLatestEvents({
      sortBy: { startDate: 1 }, // ascending
      limit: 3,
      convertStartDate: true, // flag to handle string to Date conversion in repo
    });

    // Fetch latest 3 panchangam of type 'Panchangam' sorted by createdAt
    const panchangam = await ResourceRepo.getLatestPanchangam({
      resourceType: "Panchangam",
      sortBy: { createdAt: -1 },
      limit: 3,
    });

    // Convert event files to base64
    const updatedEvents = await Promise.all(
      events.map(async (event) => {
        const base64File = event.filePath
          ? await fileToBase64(event.filePath)
          : null;
        return {
          ...(event.toObject?.() ?? event),
          filePath: base64File,
        };
      })
    );

    // Convert panchangam files to base64
    const updatedPanchangam = await Promise.all(
      panchangam.map(async (item) => {
        const base64File = item.filePath
          ? await fileToBase64(item.filePath)
          : null;
        return {
          ...(item.toObject?.() ?? item),
          filePath: base64File,
        };
      })
    );

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
