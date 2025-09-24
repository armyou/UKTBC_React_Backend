import dotenv from "dotenv";
dotenv.config();

export const config = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/uktbc",
  port: process.env.PORT || 5000,
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  paypalBaseUrl: "https://api-m.sandbox.paypal.com",
  paypalEnv: process.env.PAYPAL_ENV,
  frontendUrl: process.env.FRONT_END_URL,
  // SMTP Configuration
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || "587"),
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  fromEmail: process.env.FROM_EMAIL || "donate@uktbc.org",
  fromName: process.env.FROM_NAME || "UK Telugu Brahmin Community",
};

export default config;
