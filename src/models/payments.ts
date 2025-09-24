import mongoose, { Document, Schema } from "mongoose";

export interface PaymentDocument extends Document {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: number;
  corpDonation: string;
  companyName: string;
  postCode: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  country: string;
  amount: number;
  paymentReference: string;
  donationType: string;
  giftAid: string;
  paymentType: string;
  stripeSessionId: string;
  paypalOrderId: string; // NEW
  status: string;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    title: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: Number, required: true },

    corpDonation: { type: String, required: true },
    companyName: { type: String, required: false },
    postCode: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, required: false },
    addressLine3: { type: String, required: false },
    city: { type: String, required: true },
    country: { type: String, required: true },

    amount: { type: Number, required: true },
    paymentReference: { type: String, required: false },

    donationType: {
      type: String,
      required: false,
      default: "I'm donating my own money",
    },
    giftAid: { type: String, required: false, default: "no" },
    paymentType: { type: String, required: true },

    stripeSessionId: { type: String, required: false, default: "" },
    paypalOrderId: { type: String, required: false, default: "" },

    status: { type: String, required: true, default: "1" },
  },
  { timestamps: true }
);

export default mongoose.model<PaymentDocument>("Payment", PaymentSchema);
