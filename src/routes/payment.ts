import express, { Request, Response } from "express";
import Stripe from "stripe";
import User from "../models/User";
import Payment from "../models/Payment";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-06-20" as any,
});



// Create Payment Intent + Save User + Payment record
router.post("/donate", async (req: Request, res: Response) => {
    try {
        const {
            firstName,
            lastName,
            email,
            mobileNumber,
            companyName,
            companyAddress,
            companyCity,
            companyCountry,
            companyPinCode,
            password,
            donationAmount,
            currency
        } = req.body;

        // Save user (or find existing)
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                firstName,
                lastName,
                email,
                mobileNumber,
                companyName,
                companyAddress,
                companyCity,
                companyCountry,
                companyPinCode,
                password
            });
        }

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: donationAmount * 100,
            currency: currency || "usd",
            metadata: { email, userId: user.id.toString() },
            automatic_payment_methods: { enabled: true }
        });

        // Save Payment record
        const payment = await Payment.create({
            userId: user._id,
            stripePaymentId: paymentIntent.id,
            amount: donationAmount,
            currency: currency || "usd",
            status: "initiated"
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentId: payment._id,
            stripePaymentId: paymentIntent.id,
            userId: user._id
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Stripe Webhook - update payment status
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
        const sig = req.headers["stripe-signature"] as string;

        let event;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET as string
            );
        } catch (err: any) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === "payment_intent.processing") {
            const pi = event.data.object as Stripe.PaymentIntent;
            await Payment.findOneAndUpdate(
                { stripePaymentId: pi.id },
                { $set: { status: "processing" } }
            );
        }

        if (event.type === "payment_intent.succeeded") {
            const pi = event.data.object as Stripe.PaymentIntent;
            await Payment.findOneAndUpdate(
                { stripePaymentId: pi.id },
                { $set: { status: "received" } }
            );
        }

        if (event.type === "payment_intent.payment_failed") {
            const pi = event.data.object as Stripe.PaymentIntent;
            await Payment.findOneAndUpdate(
                { stripePaymentId: pi.id },
                { $set: { status: "failed" } }
            );
        }

        res.json({ received: true });
    }
);

export default router;
