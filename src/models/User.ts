import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    companyName: string;
    companyAddress: string;
    companyCity: string;
    companyCountry: string;
    companyPinCode: string;
}

const UserSchema: Schema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        mobileNumber: { type: String, required: true },
        companyName: { type: String, required: true },
        companyAddress: { type: String, required: true },
        companyCity: { type: String, required: true },
        companyCountry: { type: String, required: true },
        companyPinCode: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
