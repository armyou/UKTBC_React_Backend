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
    //  Ensure ObjectId conversion
    const objectId = new mongoose.Types.ObjectId(paymentId);

    console.log("Updating by paymentId (ObjectId):", objectId);

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
    console.log(" Updating by sessionId:", sessionId);

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

export const createPayment = async (data: Partial<PaymentDocument>) => {
  const payment = new Payment(data);
  return await payment.save();
};

export const updatePaypalOrder = async (
  paypalOrderId: string,
  status: string
) => {
  return await Payment.findOneAndUpdate(
    { paypalOrderId },
    { status },
    { new: true }
  );
};
// to get all donations
export const getAllPayments = async (): Promise<PaymentDocument[]> => {
  return await Payment.find().sort({ createdAt: -1 });
};

// to get the total amount of donations
export const getAllPaymentAmount = async (): Promise<{
  totalDonationAmount: number;
}> => {
  const result = await Payment.aggregate([
    { $group: { _id: null, totalDonationAmount: { $sum: "$amount" } } },
  ]);

  return {
    totalDonationAmount: result[0]?.totalDonationAmount || 0,
  };
};

// to get total number of donors
export interface DonorInfo {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export interface DonationStats {
  totalDonationAmount: number;
  totalDonors: number;
  currentMonthDonationAmount: number;
  lastFiveDonors: DonorInfo[];
}

export const getDonationStats = async (): Promise<DonationStats> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [overallResult, monthResult, lastFiveDonors] = await Promise.all([
    // Total donation amount + unique donors
    Payment.aggregate<{
      _id: null;
      totalDonationAmount: number;
      totalDonors: number;
    }>([
      { $match: { email: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: { email: { $toLower: "$email" } },
          totalAmountByDonor: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: null,
          totalDonationAmount: { $sum: "$totalAmountByDonor" },
          totalDonors: { $sum: 1 },
        },
      },
    ]),

    // Current month donation total
    Payment.aggregate<{ _id: null; currentMonthDonationAmount: number }>([
      { $match: { createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
      {
        $group: {
          _id: null,
          currentMonthDonationAmount: { $sum: "$amount" },
        },
      },
    ]),

    // Last 5 donor records
    Payment.find(
      {},
      {
        firstName: 1,
        lastName: 1,
        email: 1,
        mobile: 1,
        amount: 1,
        status: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<DonorInfo[]>(), // tell TS this is an array of DonorInfo
  ]);

  return {
    totalDonationAmount: overallResult[0]?.totalDonationAmount ?? 0,
    totalDonors: overallResult[0]?.totalDonors ?? 0,
    currentMonthDonationAmount: monthResult[0]?.currentMonthDonationAmount ?? 0,
    lastFiveDonors: lastFiveDonors ?? [],
  };
};

// to get the hmrc excel data
export class PaymentRepo {
  static async getAllSuccessfulPayments(
    startDate?: string,
    endDate?: string
  ): Promise<PaymentDocument[]> {
    try {
      // Match all forms of "completed" (case-insensitive)
      const filter: any = { status: { $regex: /^completed$/i } };

      //  Normalize input date strings (trim & slice to yyyy-mm-dd)
      const cleanStart = startDate?.trim().slice(0, 10);
      const cleanEnd = endDate?.trim().slice(0, 10);

      // Default endDate to today's date
      const today = new Date();
      const defaultEnd = today.toISOString().slice(0, 10);

      const start = cleanStart || "1970-01-01"; // fallback to very early date
      const end = cleanEnd || defaultEnd;

      console.log("startDate:", start);
      console.log("endDate:", end);

      // Filter using createdDate (string compare)
      if (start || end) {
        filter.createdDate = {
          $gte: start,
          $lte: end,
        };
      }

      console.log("Final Filter:", filter);

      const payments = await Payment.find<PaymentDocument>(filter).lean();

      console.log("Payments Found:", payments.length);
      // Optional: log all createdDate values to debug
      payments.forEach((p) => console.log("createdDate:", p.createdDate));

      return payments;
    } catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
  }
}
