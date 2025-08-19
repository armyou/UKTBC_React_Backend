import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    stripePaymentId: string;
    amount: number;
    status: "initiated" | "processing" | "pending" | "received" | "failed";
    currency: string;
}

const PaymentSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        stripePaymentId: { type: String, required: true },
        amount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["initiated", "processing", "pending", "received", "failed"],
            default: "initiated"
        },
        currency: { type: String, required: true }
    },
    { timestamps: true }
);

export default mongoose.model<IPayment>("Payment", PaymentSchema);
