import { Router } from "express";
import { EventRepo } from "../repos/eventsRepo";
import upload from "../middleware/upload";

const router = Router();

// Create Event
router.post("/add", upload.single("file"), async (req, res) => {
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
      status,
    } = req.body;

    const filePath = req.file ? req.file.path : "";

    const event = await EventRepo.createEvent({
      eventName,
      startDate,
      startTime,
      description,
      ticketPrice,
      availableTickets,
      preRequisites: JSON.parse(preRequisites || "[]"),
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

//  Get All Events
router.get("/", async (req, res) => {
  try {
    const events = await EventRepo.getAllEvents();
    res.json(events);
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
    res.json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

export default router;
