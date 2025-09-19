// src/repos/eventRepo.ts
import EventModel, { eventDocument } from "../models/events";

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
}
