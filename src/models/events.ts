import mongoose, { Document, Schema } from "mongoose";
export interface eventDocument extends Document {
  eventName: string;
  startDate: string;
  startTime: string;
  description: string;
  eventLocation: string;
  ticketPrice: string;
  availableTickets: string;
  preRequisites: string[];
  registrationDetails: string;
  filePath: string;
  status: string;
}
const EventSchema = new Schema<eventDocument>(
  {
    eventName: { type: String, required: true },
    startDate: { type: String, required: true },
    startTime: { type: String, required: true },
    description: { type: String, required: true },
    eventLocation: { type: String, required: true },
    ticketPrice: { type: String, required: true },
    availableTickets: { type: String, required: true },
    preRequisites: [{ type: String, required: true }],
    registrationDetails: { type: String, required: true },
    filePath: { type: String, required: true },
    status: { type: String, required: true, default: "1" },
  },
  { timestamps: true }
);
export default mongoose.model<eventDocument>("events", EventSchema);
