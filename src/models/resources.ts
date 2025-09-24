import mongoose, { Document, Schema } from "mongoose";
export interface resourcesDocument extends Document {
  title: string;
  resourceType: string;
  filePath: string;
  status: string;
}
const ResourcesSchema = new Schema<resourcesDocument>(
  {
    title: { type: String, required: true },
    resourceType: { type: String, required: true },
    filePath: { type: String, required: true },
    status: { type: String, required: true, default: "1" },
  },
  { timestamps: true }
);
export default mongoose.model<resourcesDocument>("resources", ResourcesSchema);
