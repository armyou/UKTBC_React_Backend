import mongoose, { Document, Schema } from "mongoose";
export interface usersDocument extends Document {
  title: string;
  resourceType: string;
  filePath: string;
  previewImage: string;
  status: string;
}
const usersSchema = new Schema<usersDocument>(
  {
    title: { type: String, required: true },
    resourceType: { type: String, required: true },
    filePath: { type: String, required: true },
    previewImage: { type: String },
    status: { type: String, required: true, default: "1" },
  },
  { timestamps: true }
);
export default mongoose.model<usersDocument>("users", usersSchema);
