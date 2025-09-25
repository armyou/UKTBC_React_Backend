import mongoose, { Document, Schema } from "mongoose";
export interface footerDocument extends Document {
  count: number;
  status: string;
}
const FooterSchema = new Schema<footerDocument>(
  {
    count: { type: Number },
    status: { type: String, default: "1" },
  },
  { timestamps: true }
);
export default mongoose.model<footerDocument>("footer", FooterSchema);
