import { Router, Request, Response } from "express";
import Stripe from "stripe";
import config from "../config.ts";
import {
  savePayment,
  updatePaymentStatus,
  createPayment,
  updatePaypalOrder,
} from "../repos/paymentRepo.ts";
import Payment from "../models/payments.ts";
import nodemailer from "nodemailer";
import { emailService } from "../services/emailService.ts";

const checkoutNodeJssdk: any = require("@paypal/checkout-server-sdk");

const router = Router();

const stripe = new Stripe(config.stripeSecretKey, {});
const { paypalClientId, paypalClientSecret, paypalEnv } = config;

// ______________________Stripe Payment Block Start________________________\\
/**
 * Create a PaymentIntent
 */
router.post(
  "/stripe/create-stripe-payment-intent",
  async (req: Request, res: Response) => {
    try {
      const { amount, currency = "GBP", userId, email } = req.body;

      // 1. Create PaymentIntent in Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        receipt_email: email,
      });

      // 2. Save to MongoDB
      const {
        title = "mr",
        firstName,
        lastName,
        mobile,
        corpDonation,
        companyName,
        postCode,
        addressLine1,
        addressLine2,
        addressLine3,
        city,
        country,
        paymentReference,
        donationType,
        giftAid,
        paymentType,
        status,
      } = req.body;

      await savePayment({
        title,
        firstName,
        lastName,
        email,
        mobile,
        corpDonation,
        companyName,
        postCode,
        addressLine1,
        addressLine2,
        addressLine3,
        city,
        country,
        amount,
        paymentReference,
        donationType,
        giftAid,
        paymentType,
        status,
      });

      // 3. Send response back

      res.status(200).json({
        publishableKey: config.stripePublishableKey,
      });
    } catch (err: any) {
      console.error("Error in /create-stripe-payment-intent:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Confirm payment (frontend will call this after Stripe.js confirms card)
 */
router.post(
  "/stripe/confirm-stripe-payment",
  async (req: Request, res: Response) => {
    try {
      const { paymentIntentId } = req.body;

      // Retrieve paymentIntent to check status
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      // Update in DB
      const updatedPayment = await updatePaymentStatus(
        paymentIntent.id,
        paymentIntent.status
      );

      // Send email receipt if payment is successful
      if (paymentIntent.status === "succeeded" && updatedPayment) {
        try {
          await emailService.initializeCredentials(
            undefined,
            updatedPayment._id?.toString()
          );
          await emailService.sendDonationReceipt(updatedPayment);
          console.log("Donation receipt email sent successfully");
        } catch (emailError) {
          console.error("Error sending donation receipt email:", emailError);
          // Don't fail the payment confirmation if email fails
        }
      }

      // Send response back
      res.status(200).json({ payment: updatedPayment });
    } catch (err: any) {
      console.error("Error in /confirm-stripe-payment:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Create a Stripe Checkout Session
 */
router.post(
  "/stripe/create-checkout-session",
  async (req: Request, res: Response) => {
    try {
      const { amount, email, firstName, lastName, ...otherData } = req.body;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "GBP",
              product_data: { name: `Donation from ${firstName} ${lastName}` },
              unit_amount: Math.round(parseFloat(amount.toString()) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url:
          "http://localhost:5173/donate-now?success=true&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:5173/donate-now?canceled=true",
        customer_email: email,
        metadata: { ...otherData, firstName, lastName, email, amount },
      });
      const savedPayment = await savePayment({
        title: "mr",
        firstName,
        lastName,
        email,
        amount,
        stripeSessionId: session.id, // Only set this for checkout sessions
        ...otherData,
      });

      res.status(200).json({
        sessionId: session.id,
        url: session.url,
        paymentId: savedPayment._id,
      });
    } catch (err: any) {
      console.error("ERROR in /create-checkout-session:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);
/**
 * Check payment status (for success page)
 */
router.get(
  "/stripe/payment-status/:sessionId",
  async (req: Request, res: Response) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.params.sessionId
      );
      const updatedPayment = await updatePaymentStatus(
        session.id,
        session.payment_status
      );

      // Send email receipt if payment is successful
      if (session.payment_status === "paid" && updatedPayment) {
        try {
          await emailService.initializeCredentials(session.id, undefined);
          await emailService.sendDonationReceipt(updatedPayment);
          console.log("Donation receipt email sent successfully");
        } catch (emailError) {
          console.error("Error sending donation receipt email:", emailError);
          // Don't fail the payment status check if email fails
        }
      }

      res.status(200).json({ status: session.payment_status });
    } catch (err: any) {
      console.error("ERROR retrieving session status:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Update payment status
 */
router.post(
  "/stripe/update-payment-status",
  async (req: Request, res: Response) => {
    console.log("🔥 /stripe/update-payment-status called");
    try {
      console.log("Request body:", req.body);

      const { sessionId, status, paymentId, senderEmail } = req.body;
      console.log("Extracted values:", {
        sessionId,
        status,
        paymentId,
        senderEmail,
      });

      let updatedPayment;

      if (paymentId) {
        console.log(`Looking for payment by ID: ${paymentId}`);
        updatedPayment = await Payment.findByIdAndUpdate(
          paymentId,
          {
            status: status,
            stripeSessionId: sessionId,
          },
          { new: true }
        );
        console.log("Payment updated by ID:", updatedPayment?._id);
      } else {
        console.log(`Looking for payment by sessionId: ${sessionId}`);
        updatedPayment = await Payment.findOneAndUpdate(
          { stripeSessionId: sessionId },
          { status: status, stripeSessionId: sessionId },
          { new: true }
        );
        console.log("Payment updated by sessionId:", updatedPayment?._id);
      }

      if (!updatedPayment) {
        console.warn("Payment not found!");
        return res.status(404).json({
          error: "Payment not found",
          sessionId,
          paymentId,
        });
      }

      console.log(`Payment status is now: ${updatedPayment.status}`);

      // Send email receipt if payment is successful
      if (
        status === "paid" ||
        status === "succeeded" ||
        status === "completed"
      ) {
        console.log("Payment is successful, preparing to send email...");

        try {
          console.log("Initializing email service...");
          await emailService.initializeCredentials(sessionId, paymentId);
          console.log("Email service initialized successfully");

          console.log(`Sending donation receipt to: ${senderEmail}`);
          await emailService.sendDonationReceipt(updatedPayment, senderEmail);
          console.log("Donation receipt email sent successfully ✅");
        } catch (emailError) {
          console.error("Error sending donation receipt email:", emailError);
          // Don't fail the payment status update if email fails
        }
      } else {
        console.log("Payment not successful, skipping email sending.");
      }

      console.log("Sending response back to client...");
      res.status(200).json({
        success: true,
        message: "Payment status updated successfully",
        payment: updatedPayment,
      });
      console.log("Response sent ✅");
    } catch (err: any) {
      console.error("ERROR updating payment status:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// _______________________Stripe Payment Block End___________________________\\

// _______________________PayPal Payment Block Start____________________________\\
// src/routes/paypalRoutes.ts

function paypalClient() {
  const env =
    paypalEnv === "sandbox"
      ? new checkoutNodeJssdk.core.SandboxEnvironment(
          paypalClientId.trim()!,
          paypalClientSecret.trim()!
        )
      : new checkoutNodeJssdk.core.LiveEnvironment(
          paypalClientId.trim()!,
          paypalClientSecret.trim()!
        );
  console.log("PayPal ClientId:", paypalClientId);
  console.log("PayPal Secret:", paypalClientSecret);
  console.log("PayPal Env:", paypalEnv);
  return new checkoutNodeJssdk.core.PayPalHttpClient(env);
}

// Create PayPal Order + Save Payment
router.post("/paypal/create-order", async (req, res) => {
  try {
    console.log(req.body);
    const { amount, donor } = req.body;

    const {
      title = "mr",
      firstName,
      lastName,
      email,
      mobile,
      corpDonation,
      companyName,
      postCode,
      addressLine1,
      addressLine2,
      addressLine3,
      city,
      country,
      paymentReference,
      donationType = "I'm donating my own money",
      giftAid = "no",
      paymentType = "web/paypal",
      status = "CREATED",
    } = donor;

    // Create PayPal order
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "GBP",
            value: amount.toString(),
          },
        },
      ],
    });

    const order = await paypalClient().execute(request);

    // Save payment to DB
    await savePayment({
      title,
      firstName,
      lastName,
      email,
      mobile,
      corpDonation,
      companyName,
      postCode,
      addressLine1,
      addressLine2,
      addressLine3,
      city,
      country,
      amount,
      paymentReference,
      donationType,
      giftAid,
      paymentType,
      status,
      paypalOrderId: order.result.id,
    });

    const approvalUrl = order.result.links.find(
      (link: any) => link.rel === "approve"
    )?.href;

    res.json({ id: order.result.id, approvalUrl });
  } catch (err: any) {
    console.error("PayPal create-order error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Capture PayPal Order + Update Payment
router.post("/paypal/capture-order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await paypalClient().execute(request);

    await updatePaypalOrder(orderId, "COMPLETED");

    res.json(capture.result);
  } catch (err: any) {
    console.error("PayPal capture-order error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
