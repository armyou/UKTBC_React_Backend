import Payment, { PaymentDocument } from "../models/payments";
import mongoose from "mongoose";

// stripe payment block start
export const savePayment = async (payment: Partial<PaymentDocument>) => {
  const newPayment = new Payment(payment);
  return await newPayment.save();
};
// to update sessionId
export const updatePaymentStatus = async (
  sessionId: string,
  status: string,
  paymentId?: string
) => {
  console.log("🔍 updatePaymentStatus called with:", {
    sessionId,
    status,
    paymentId,
  });

  if (paymentId) {
    // ✅ Ensure ObjectId conversion
    const objectId = new mongoose.Types.ObjectId(paymentId);

    console.log("🔄 Updating by paymentId (ObjectId):", objectId);

    return await Payment.findByIdAndUpdate(
      objectId,
      {
        status,
        stripeSessionId: sessionId,
      },
      { new: true }
    );
  } else {
    // fallback
    console.log("🔄 Updating by sessionId:", sessionId);

    return await Payment.findOneAndUpdate(
      { stripeSessionId: sessionId },
      {
        status,
        stripeSessionId: sessionId,
      },
      { new: true }
    );
  }
};

// Stripe payment block end

// PayPal payment block start

export const PaymentRepo = {
  async createPayment(data: Partial<PaymentDocument>) {
    const payment = new Payment(data);
    return await payment.save();
  },

  async updatePayment(id: string, data: Partial<PaymentDocument>) {
    return await Payment.findByIdAndUpdate(id, data, { new: true });
  },

  async findByPaypalOrder(orderId: string) {
    return await Payment.findOne({ paypalOrderId: orderId });
  },
};
