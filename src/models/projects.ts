import mongoose, { Document, Schema } from "mongoose";

export interface Event {
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  registrationLink: string;
}

export interface ProjectsDocument extends Document {
  projectTitle: string;
  tagline: string;
  description: string;
  vision: string;
  impactPoints: string[];
  projectType: string;
  highlights: string[];
  benificiaries: string;
  events: Event[]; // Array of event sub-documents
  filePath: string;
  status: string;
}

const EventSchema = new Schema<Event>(
  {
    eventTitle: { type: String, required: true },
    eventDescription: { type: String, required: false },
    eventDate: { type: String, required: true },
    eventTime: { type: String, required: true },
    registrationLink: { type: String, required: false },
  },
  { _id: false } // optional: prevent Mongo from creating _id for each event
);

const ProjectsSchema = new Schema<ProjectsDocument>(
  {
    projectTitle: { type: String, required: true },
    tagline: { type: String },
    description: { type: String },
    vision: { type: String },
    impactPoints: [{ type: String }],
    projectType: { type: String },
    highlights: [{ type: String }],
    benificiaries: { type: String },
    events: [EventSchema], // Array of event objects
    filePath: { type: String },
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ProjectsDocument>("projects", ProjectsSchema);
