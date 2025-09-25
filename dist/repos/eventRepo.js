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
exports.EventRepo = void 0;
// src/repos/eventRepo.ts
const events_1 = __importDefault(require("../models/events"));
class EventRepo {
    static createEvent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = new events_1.default(data);
            return event.save();
        });
    }
    static getAllEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            return events_1.default.find().sort({ createdAt: -1 });
        });
    }
    static getEventById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return events_1.default.findById(id);
        });
    }
    static updateEvent(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return events_1.default.findByIdAndUpdate(id, data, { new: true });
        });
    }
    static deleteEvent(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return events_1.default.findByIdAndDelete(id);
        });
    }
    static getLatestEvents(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sortBy, limit, convertStartDate, }) {
            const now = new Date();
            return events_1.default.aggregate([
                {
                    $addFields: {
                        startDateConverted: { $toDate: "$startDate" }, // convert string to Date
                    },
                },
                {
                    $addFields: {
                        diff: { $abs: { $subtract: ["$startDateConverted", now] } }, // now safe
                    },
                },
                { $sort: { diff: 1 } }, // closest to current date first
                { $limit: limit }, // latest 3 events
            ]);
        });
    }
    // to get upcoming events
    static getAllUpcomingEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            return events_1.default.aggregate([
                {
                    $addFields: {
                        startDateConverted: { $toDate: "$startDate" },
                    },
                },
                {
                    $match: {
                        startDateConverted: { $gte: now },
                    },
                },
                {
                    $sort: { startDateConverted: 1 },
                },
            ]);
        });
    }
    // to get all past events
    static getAllPastEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            return events_1.default.aggregate([
                {
                    $addFields: {
                        startDateConverted: { $toDate: "$startDate" },
                    },
                },
                {
                    $match: {
                        startDateConverted: { $lt: now },
                    },
                },
                {
                    $sort: { startDateConverted: -1 },
                },
                {
                    $project: {
                        eventId: "$_id",
                        filePath: 1,
                        _id: 0,
                    },
                },
            ]);
        });
    }
}
exports.EventRepo = EventRepo;
