import mongoose, { Document, Schema } from "mongoose";
export interface vipravaniDocument extends Document {
  title: string;
  filePath: string;
  status: string;
}
const VipravaniSchema = new Schema<vipravaniDocument>(
  {
    title: { type: String, required: true },
    filePath: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);
export default mongoose.model<vipravaniDocument>("vipravani", VipravaniSchema);
