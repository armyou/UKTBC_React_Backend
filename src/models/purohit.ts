import mongoose, { Document, Schema } from "mongoose";
export interface purohitDocument extends Document {
  fullName: string;
  serviceLocations: string[];
  mobile: string;
  email: string;
  familyName: string;
  filePath: string;
  status: string;
}
const PurohitSchema = new Schema<purohitDocument>(
  {
    fullName: { type: String, required: true },
    serviceLocations: [{ type: String, required: true }],
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    familyName: { type: String, required: true },
    filePath: { type: String, required: true },
    status: { type: String, required: true, default: "1" },
  },
  { timestamps: true }
);
export default mongoose.model<purohitDocument>("purohit", PurohitSchema);
