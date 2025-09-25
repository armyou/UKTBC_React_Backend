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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventRepo_1 = require("../repos/eventRepo");
const resourceRepo_1 = require("../repos/resourceRepo");
const filetobase64converter_1 = require("../middleware/filetobase64converter");
const router = (0, express_1.Router)();
router.get("/latest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch latest 3 events sorted by startDate (string converted to Date)
        const events = yield eventRepo_1.EventRepo.getLatestEvents({
            sortBy: { startDate: 1 }, // ascending
            limit: 3,
            convertStartDate: true, // flag to handle string to Date conversion in repo
        });
        // Fetch latest 3 panchangam of type 'Panchangam' sorted by createdAt
        const panchangam = yield resourceRepo_1.ResourceRepo.getLatestPanchangam({
            resourceType: "Panchangam",
            sortBy: { createdAt: -1 },
            limit: 3,
        });
        // Convert event files to base64
        const updatedEvents = yield Promise.all(events.map((event) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const base64File = event.filePath
                ? yield (0, filetobase64converter_1.fileToBase64)(event.filePath)
                : null;
            return Object.assign(Object.assign({}, ((_b = (_a = event.toObject) === null || _a === void 0 ? void 0 : _a.call(event)) !== null && _b !== void 0 ? _b : event)), { filePath: base64File });
        })));
        // Convert panchangam files to base64
        const updatedPanchangam = yield Promise.all(panchangam.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const base64File = item.filePath
                ? yield (0, filetobase64converter_1.fileToBase64)(item.filePath)
                : null;
            return Object.assign(Object.assign({}, ((_b = (_a = item.toObject) === null || _a === void 0 ? void 0 : _a.call(item)) !== null && _b !== void 0 ? _b : item)), { filePath: base64File });
        })));
        res.json({
            events: updatedEvents,
            panchangam: updatedPanchangam,
        });
    }
    catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
}));
exports.default = router;
