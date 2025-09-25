// src/repos/eventRepo.ts
import EventModel, { eventDocument } from "../models/events.ts";

export class EventRepo {
  static async createEvent(data: Partial<eventDocument>) {
    const event = new EventModel(data);
    return event.save();
  }

  static async getAllEvents() {
    return EventModel.find().sort({ createdAt: -1 });
  }

  static async getEventById(id: string) {
    return EventModel.findById(id);
  }

  static async updateEvent(id: string, data: Partial<eventDocument>) {
    return EventModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteEvent(id: string) {
    return EventModel.findByIdAndDelete(id);
  }
  static async getLatestEvents({
    sortBy,
    limit,
    convertStartDate,
  }: {
    sortBy: { startDate: number };
    limit: number;
    convertStartDate: boolean;
  }) {
    const now = new Date();

    return EventModel.aggregate([
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
  }
  // to get upcoming events
  static async getAllUpcomingEvents() {
    const now = new Date();

    return EventModel.aggregate([
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
  }
  // to get all past events
  static async getAllPastEvents() {
    const now = new Date();

    return EventModel.aggregate([
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
  }
}
