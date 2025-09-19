import { Router } from "express";
import { EventRepo } from "../repos/eventRepo";
import upload from "../middleware/upload";
import { fileToBase64 } from "../middleware/filetobase64converter";

const router = Router();

// Create Event
router.post("/add", upload.single("banner"), async (req, res) => {
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
      preRequisites,
      registrationDetails,
    } = req.body;

    let { status } = req.body;
    if (status === undefined || status === null || status === "") {
      status = 1;
    }

    const parsedPreReqs = Array.isArray(preRequisites)
      ? preRequisites
      : JSON.parse(preRequisites || "[]");

    const filePath = req.file ? req.file.path : "";

    const event = await EventRepo.createEvent({
      eventName,
      startDate,
      startTime,
      description,
      ticketPrice,
      availableTickets,
      preRequisites: parsedPreReqs,
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
router.put("/update/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (req.body.preRequisites) {
      updateData.preRequisites = JSON.parse(req.body.preRequisites);
    }

    if (req.file) {
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
    await EventRepo.deleteEvent(id);
    res.json({ message: "Event deleted successfully" });
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
        banner: base64File,
      };
    });

    res.json(updatedEvents);
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
