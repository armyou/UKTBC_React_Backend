import { Router } from "express";
import { EventRepo } from "../repos/eventRepo.ts";
import upload from "../middleware/upload.ts";
import { fileToBase64 } from "../middleware/filetobase64converter.ts";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Create Event
function normalizeToArray(input: any): string[] {
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
      return [input];
    } catch {
      return [input];
    }
  }
  return [];
}
router.post("/add", upload.single("filePath"), async (req, res) => {
  console.log("Body:", req.body);
  console.log("File:", req.file);
  try {
    const {
      eventName,
      startDate,
      startTime,
      description,
      ticketPrice,
      availableTickets,
      registrationDetails,
    } = req.body;

    let { status } = req.body;
    if (status === undefined || status === null || status === "") {
      status = 1;
    }

    const preRequisites = normalizeToArray(req.body.prerequisites);
    console.log("preRequisites: ", preRequisites);

    const filePath = req.file ? req.file.path : "";

    const event = await EventRepo.createEvent({
      eventName,
      startDate,
      startTime,
      description,
      ticketPrice,
      availableTickets,
      preRequisites,
      registrationDetails,
      filePath,
      status,
    });

    res.json({ message: "Event created successfully", event });
  } catch (err: any) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Update Event
router.put("/update/:id", upload.single("filePath"), async (req, res) => {
  console.log(req.body);
  try {
    const { id } = req.params;

    // Fetch existing event
    const existingEvent = await EventRepo.getEventById(id);
    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updateData: any = {
      ...req.body,
      preRequisites: normalizeToArray(req.body.prerequisites),
    };

    if (req.file) {
      // Delete old file if exists
      if (existingEvent.filePath) {
        const oldFilePath = path.join(process.cwd(), existingEvent.filePath);
        try {
          await fs.unlink(oldFilePath);
          console.log("✅ Deleted old file:", oldFilePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            console.error("❌ Failed to delete old file:", err);
          }
        }
      }

      // Save new file path
      updateData.filePath = req.file.path;
    }

    const event = await EventRepo.updateEvent(id, updateData);

    res.json({ message: "Event updated successfully", event });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete Event
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch event first
    const event = await EventRepo.getEventById(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Delete image file if exists
    if (event.filePath) {
      const filePath = path.resolve(event.filePath);
      try {
        await fs.unlink(filePath);
        console.log("Deleted event image:", filePath);
      } catch (err) {
        console.error("Failed to delete event image:", err);
      }
    }

    // Delete DB record
    await EventRepo.deleteEvent(id);

    res.json({ message: "Event and image deleted successfully" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// Get All Events
router.get("/", async (req, res) => {
  try {
    const events = await EventRepo.getAllEvents();

    const updatedEvents = events.map((event) => {
      const base64File = event.filePath ? fileToBase64(event.filePath) : null;
      return {
        ...(event.toObject?.() ?? event), // handle Mongoose or plain object
        filePath: base64File,
      };
    });

    res.json(updatedEvents);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get Upcoming and Past Events
router.get("/categorisedEvents", async (req, res) => {
  try {
    // Fetch upcoming and past events
    const upcomingEventsList = await EventRepo.getAllUpcomingEvents();
    const pastEventsList = await EventRepo.getAllPastEvents();

    // Convert file paths to base64
    const upcomingEventsData = upcomingEventsList.map((event) => {
      const base64File = event.filePath ? fileToBase64(event.filePath) : null;
      return {
        ...event,
        filePath: base64File,
      };
    });

    const pastEventsData = pastEventsList.map((event) => {
      const base64File = event.filePath ? fileToBase64(event.filePath) : null;
      return {
        ...event,
        filePath: base64File,
      };
    });

    // Respond with categorized events
    res.json({
      upcomingEvents: upcomingEventsData,
      pastEvents: pastEventsData,
    });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get Single Event
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const event = await EventRepo.getEventById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const base64File = event.filePath ? fileToBase64(event.filePath) : null;

    res.json({
      ...(event.toObject?.() ?? event),
      banner: base64File,
    });
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

export default router;
