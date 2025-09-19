import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import config from "../config";
import { savePayment, updatePaymentStatus } from "../repos/paymentRepo";
import { PaymentRepo } from "../repos/paymentRepo";
import Payment from "../models/payments";
const router = Router();

const stripe = new Stripe(config.stripeSecretKey, {});

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
    try {
      const { sessionId, status, paymentId } = req.body;

      let updatedPayment;

      if (paymentId) {
        // If paymentId is provided, update by document ID (preferred)
        updatedPayment = await Payment.findByIdAndUpdate(
          paymentId,
          {
            status: status,
            stripeSessionId: sessionId, // Update stripeSessionId with the actual session ID
          },
          { new: true }
        );
      } else {
        updatedPayment = await Payment.findOneAndUpdate(
          {
            $or: [{ stripeSessionId: sessionId }],
          },
          {
            status: status,
            stripeSessionId: sessionId,
          },
          { new: true }
        );
      }

      if (!updatedPayment) {
        return res.status(404).json({
          error: "Payment not found",
          sessionId,
          paymentId,
        });
      }

      res.status(200).json({
        success: true,
        message: "Payment status updated successfully",
        payment: updatedPayment,
      });
    } catch (err: any) {
      console.error("ERROR updating payment status:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// _______________________Stripe Payment Block End___________________________\\

// _______________________PayPal Payment Block Start____________________________\\
// router.post("/paypal/create-order", async (req, res) => {
//   try {
//     console.log("STAGE 1: Received request to /paypal/create-order");
//     console.log("STAGE 2: Request body:", req.body);

//     const { amount, donor } = req.body;
//     console.log("STAGE 3: Extracted data:", { amount, donor });

//     // Get PayPal access token
//     console.log("STAGE 4: Getting PayPal access token...");
//     const auth = Buffer.from(
//       `${config.paypalClientId}:${config.paypalClientSecret}`
//     ).toString("base64");

//     const tokenRes = await fetch(`${config.frontendUrl}/v1/oauth2/token`, {
//       method: "POST",
//       headers: {
//         Authorization: `Basic ${auth}`,
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body: "grant_type=client_credentials",
//     });
//     const tokenData = await tokenRes.json();
//     const accessToken = tokenData.access_token;
//     console.log("STAGE 5: PayPal access token obtained");

//     // Create PayPal order
//     console.log("STAGE 6: Creating PayPal order...");
//     const orderRes = await fetch(`${config.frontendUrl}/v2/checkout/orders`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         intent: "CAPTURE",
//         purchase_units: [
//           {
//             amount: {
//               currency_code: "GBP",
//               value: amount.toString(),
//             },
//             description: `Donation from ${donor.firstName} ${donor.lastName}`,
//           },
//         ],
//         application_context: {
//           return_url: `${config.frontendUrl}/donate-now?success=true&order_id={ORDER_ID}`,
//           cancel_url: `${config.frontendUrl}/donate-now?canceled=true`,
//         },
//       }),
//     });
//     const orderData = await orderRes.json();
//     console.log("STAGE 7: PayPal order created:", orderData.id);

//     // Save payment to database
//     console.log("STAGE 8: Saving payment to database...");
//     const savedPayment = await savePayment({
//       title: "mr",
//       firstName: donor.firstName,
//       lastName: donor.lastName,
//       email: donor.email,
//       mobile: donor.mobile,
//       corpDonation: donor.corpDonation,
//       companyName: donor.companyName,
//       postCode: donor.postCode,
//       addressLine1: donor.addressLine1,
//       addressLine2: donor.addressLine2,
//       addressLine3: donor.addressLine3,
//       city: donor.city,
//       country: donor.country,
//       amount: amount,
//       paymentReference: donor.paymentReference,
//       donationType: donor.donationType,
//       giftAid: donor.giftAidClaim,
//       paymentType: "web/paypal",
//       paypalOrderId: orderData.id,
//       status: "pending",
//     });
//     console.log(
//       "STAGE 9: Payment saved to database with ID:",
//       savedPayment._id
//     );

//     // Send response back
//     console.log("STAGE 10: Sending response to frontend");
//     res.status(200).json({
//       orderId: orderData.id,
//       approvalUrl: orderData.links.find((config.paypalBaseUrl) => config.paypalBaseUrl === "approve").href,
//       paymentId: savedPayment._id,
//     });
//     console.log("STAGE 11: Response sent successfully");
//   } catch (err: any) {
//     console.error("ERROR in /paypal/create-order:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

export default router;
