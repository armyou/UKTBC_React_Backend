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
const eventRepo_1 = require("../repos/eventRepo");
const upload_1 = __importDefault(require("../middleware/upload"));
const filetobase64converter_1 = require("../middleware/filetobase64converter");
const router = (0, express_1.Router)();
// Create Event
function normalizeToArray(input) {
    if (Array.isArray(input))
        return input;
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed))
                return parsed;
            return [input];
        }
        catch (_a) {
            return [input];
        }
    }
    return [];
}
router.post("/add", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Body:", req.body);
    console.log("File:", req.file);
    try {
        const { eventName, startDate, startTime, description, ticketPrice, availableTickets, registrationDetails, } = req.body;
        let { status } = req.body;
        if (status === undefined || status === null || status === "") {
            status = 1;
        }
        const preRequisites = normalizeToArray(req.body.prerequisites);
        console.log("preRequisites: ", preRequisites);
        const filePath = req.file ? req.file.path : "";
        const event = yield eventRepo_1.EventRepo.createEvent({
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
    }
    catch (err) {
        console.error("Error creating event:", err);
        res.status(500).json({ error: "Failed to create event" });
    }
}));
// Update Event
router.put("/update/:id", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    try {
        const { id } = req.params;
        const updateData = Object.assign(Object.assign({}, req.body), { preRequisites: normalizeToArray(req.body.prerequisites) });
        if (req.file) {
            updateData.filePath = req.file.path;
        }
        const event = yield eventRepo_1.EventRepo.updateEvent(id, updateData);
        res.json({ message: "Event updated successfully", event });
    }
    catch (err) {
        console.error("Error updating event:", err);
        res.status(500).json({ error: "Failed to update event" });
    }
}));
// Delete Event
router.delete("/delete/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield eventRepo_1.EventRepo.deleteEvent(id);
        res.json({ message: "Event deleted successfully" });
    }
    catch (err) {
        console.error("Error deleting event:", err);
        res.status(500).json({ error: "Failed to delete event" });
    }
}));
// Get All Events
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield eventRepo_1.EventRepo.getAllEvents();
        const updatedEvents = events.map((event) => {
            var _a, _b;
            const base64File = event.filePath ? (0, filetobase64converter_1.fileToBase64)(event.filePath) : null;
            return Object.assign(Object.assign({}, ((_b = (_a = event.toObject) === null || _a === void 0 ? void 0 : _a.call(event)) !== null && _b !== void 0 ? _b : event)), { filePath: base64File });
        });
        res.json(updatedEvents);
    }
    catch (err) {
        console.error("Error fetching events:", err);
        res.status(500).json({ error: "Failed to fetch events" });
    }
}));
// Get Single Event
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const event = yield eventRepo_1.EventRepo.getEventById(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        const base64File = event.filePath ? (0, filetobase64converter_1.fileToBase64)(event.filePath) : null;
        res.json(Object.assign(Object.assign({}, ((_b = (_a = event.toObject) === null || _a === void 0 ? void 0 : _a.call(event)) !== null && _b !== void 0 ? _b : event)), { banner: base64File }));
    }
    catch (err) {
        console.error("Error fetching event:", err);
        res.status(500).json({ error: "Failed to fetch event" });
    }
}));
exports.default = router;
