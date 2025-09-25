import mongoose, { Document, Schema } from "mongoose";
export interface madiVantaluDocument extends Document {
  catererName: string;
  serviceLocations: string[];
  mobile: string;
  filePath: string;
  status: string;
}
const MadiVantaluSchema = new Schema<madiVantaluDocument>(
  {
    catererName: { type: String, required: true },
    serviceLocations: [{ type: String, required: true }],
    mobile: { type: String, required: true },
    filePath: { type: String, required: true },
    status: { type: String, required: true, default: "1" },
  },
  { timestamps: true }
);
export default mongoose.model<madiVantaluDocument>(
  "madiVantalu",
  MadiVantaluSchema
);
