"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../config"));
const paymentRepo_1 = require("../repos/paymentRepo");
const payments_1 = __importDefault(require("../models/payments"));
const emailService_1 = require("../services/emailService");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(config_1.default.stripeSecretKey, {});
const { paypalClientId, paypalClientSecret, paypalEnv } = config_1.default;
// ______________________Stripe Payment Block Start________________________\\
/**
 * Create a PaymentIntent
 */
router.post("/stripe/create-stripe-payment-intent", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, currency = "GBP", userId, email } = req.body;
        // 1. Create PaymentIntent in Stripe
        const paymentIntent = yield stripe.paymentIntents.create({
            amount,
            currency,
            receipt_email: email,
        });
        // 2. Save to MongoDB
        const { title = "mr", firstName, lastName, mobile, corpDonation, companyName, postCode, addressLine1, addressLine2, addressLine3, city, country, paymentReference, donationType, giftAid, paymentType, status, } = req.body;
        yield (0, paymentRepo_1.savePayment)({
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
            publishableKey: config_1.default.stripePublishableKey,
        });
    }
    catch (err) {
        console.error("Error in /create-stripe-payment-intent:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
/**
 * Confirm payment (frontend will call this after Stripe.js confirms card)
 */
router.post("/stripe/confirm-stripe-payment", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { paymentIntentId } = req.body;
        // Retrieve paymentIntent to check status
        const paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
        // Update in DB
        const updatedPayment = yield (0, paymentRepo_1.updatePaymentStatus)(paymentIntent.id, paymentIntent.status);
        // Send email receipt if payment is successful
        if (paymentIntent.status === "succeeded" && updatedPayment) {
            try {
                yield emailService_1.emailService.initializeCredentials(undefined, (_a = updatedPayment._id) === null || _a === void 0 ? void 0 : _a.toString());
                yield emailService_1.emailService.sendDonationReceipt(updatedPayment);
                console.log("Donation receipt email sent successfully");
            }
            catch (emailError) {
                console.error("Error sending donation receipt email:", emailError);
                // Don't fail the payment confirmation if email fails
            }
        }
        // Send response back
        res.status(200).json({ payment: updatedPayment });
    }
    catch (err) {
        console.error("Error in /confirm-stripe-payment:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
/**
 * Create a Stripe Checkout Session
 */
router.post("/stripe/create-checkout-session", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { amount, email, firstName, lastName } = _a, otherData = __rest(_a, ["amount", "email", "firstName", "lastName"]);
        const session = yield stripe.checkout.sessions.create({
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
            success_url: "http://localhost:5173/donate-now?success=true&session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "http://localhost:5173/donate-now?canceled=true",
            customer_email: email,
            metadata: Object.assign(Object.assign({}, otherData), { firstName, lastName, email, amount }),
        });
        const savedPayment = yield (0, paymentRepo_1.savePayment)(Object.assign({ title: "mr", firstName,
            lastName,
            email,
            amount, stripeSessionId: session.id }, otherData));
        res.status(200).json({
            sessionId: session.id,
            url: session.url,
            paymentId: savedPayment._id,
        });
    }
    catch (err) {
        console.error("ERROR in /create-checkout-session:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
/**
 * Check payment status (for success page)
 */
router.get("/stripe/payment-status/:sessionId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield stripe.checkout.sessions.retrieve(req.params.sessionId);
        const updatedPayment = yield (0, paymentRepo_1.updatePaymentStatus)(session.id, session.payment_status);
        // Send email receipt if payment is successful
        if (session.payment_status === "paid" && updatedPayment) {
            try {
                yield emailService_1.emailService.initializeCredentials(session.id, undefined);
                yield emailService_1.emailService.sendDonationReceipt(updatedPayment);
                console.log("Donation receipt email sent successfully");
            }
            catch (emailError) {
                console.error("Error sending donation receipt email:", emailError);
                // Don't fail the payment status check if email fails
            }
        }
        res.status(200).json({ status: session.payment_status });
    }
    catch (err) {
        console.error("ERROR retrieving session status:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
/**
 * Update payment status
 */
router.post("/stripe/update-payment-status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            updatedPayment = yield payments_1.default.findByIdAndUpdate(paymentId, {
                status: status,
                stripeSessionId: sessionId,
            }, { new: true });
            console.log("Payment updated by ID:", updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment._id);
        }
        else {
            console.log(`Looking for payment by sessionId: ${sessionId}`);
            updatedPayment = yield payments_1.default.findOneAndUpdate({ stripeSessionId: sessionId }, { status: status, stripeSessionId: sessionId }, { new: true });
            console.log("Payment updated by sessionId:", updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment._id);
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
        if (status === "paid" ||
            status === "succeeded" ||
            status === "completed") {
            console.log("Payment is successful, preparing to send email...");
            try {
                console.log("Initializing email service...");
                yield emailService_1.emailService.initializeCredentials(sessionId, paymentId);
                console.log("Email service initialized successfully");
                console.log(`Sending donation receipt to: ${senderEmail}`);
                yield emailService_1.emailService.sendDonationReceipt(updatedPayment, senderEmail);
                console.log("Donation receipt email sent successfully ✅");
            }
            catch (emailError) {
                console.error("Error sending donation receipt email:", emailError);
                // Don't fail the payment status update if email fails
            }
        }
        else {
            console.log("Payment not successful, skipping email sending.");
        }
        console.log("Sending response back to client...");
        res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            payment: updatedPayment,
        });
        console.log("Response sent ✅");
    }
    catch (err) {
        console.error("ERROR updating payment status:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
// _______________________Stripe Payment Block End___________________________\\
// _______________________PayPal Payment Block Start____________________________\\
// src/routes/paypalRoutes.ts
function paypalClient() {
    const env = paypalEnv === "sandbox"
        ? new checkoutNodeJssdk.core.SandboxEnvironment(paypalClientId.trim(), paypalClientSecret.trim())
        : new checkoutNodeJssdk.core.LiveEnvironment(paypalClientId.trim(), paypalClientSecret.trim());
    console.log("PayPal ClientId:", paypalClientId);
    console.log("PayPal Secret:", paypalClientSecret);
    console.log("PayPal Env:", paypalEnv);
    return new checkoutNodeJssdk.core.PayPalHttpClient(env);
}
// Create PayPal Order + Save Payment
router.post("/paypal/create-order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log(req.body);
        const { amount, donor } = req.body;
        const { title = "mr", firstName, lastName, email, mobile, corpDonation, companyName, postCode, addressLine1, addressLine2, addressLine3, city, country, paymentReference, donationType = "I'm donating my own money", giftAid = "no", paymentType = "web/paypal", status = "CREATED", } = donor;
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
        const order = yield paypalClient().execute(request);
        // Save payment to DB
        yield (0, paymentRepo_1.savePayment)({
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
        const approvalUrl = (_a = order.result.links.find((link) => link.rel === "approve")) === null || _a === void 0 ? void 0 : _a.href;
        res.json({ id: order.result.id, approvalUrl });
    }
    catch (err) {
        console.error("PayPal create-order error:", err);
        res.status(500).json({ error: err.message });
    }
}));
// Capture PayPal Order + Update Payment
router.post("/paypal/capture-order/:orderId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const capture = yield paypalClient().execute(request);
        yield (0, paymentRepo_1.updatePaypalOrder)(orderId, "COMPLETED");
        res.json(capture.result);
    }
    catch (err) {
        console.error("PayPal capture-order error:", err);
        res.status(500).json({ error: err.message });
    }
}));
exports.default = router;
