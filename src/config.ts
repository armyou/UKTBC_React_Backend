import dotenv from "dotenv";
dotenv.config();

export const config = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/uktbc",
  port: process.env.PORT || 5000,
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  paypalBaseUrl:
    process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com",
  frontendUrl: process.env.FRONT_END_URL,
};

export default config;
