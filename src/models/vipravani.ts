import mongoose, { Document, Schema } from "mongoose";
export interface vipravaniDocument extends Document {
  title: string;
  filePath: string;
  previewImage: string;
  status: string;
}
const VipravaniSchema = new Schema<vipravaniDocument>(
  {
    title: { type: String, required: true },
    filePath: { type: String, required: true },
    previewImage: { type: String },
    status: { type: String, required: true, default: "1" },
  },
  { timestamps: true }
);
export default mongoose.model<vipravaniDocument>("vipravani", VipravaniSchema);
