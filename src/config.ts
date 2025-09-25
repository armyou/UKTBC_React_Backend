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
  SMTP_SERVER: process.env.SMTP_SERVER,
  SMTP_PORT: process.env.SMTP_PORT,
  OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET,
  OAUTH_APP_ID_URI: process.env.OAUTH_APP_ID_URI,
  OAUTH_TENANT_ID: process.env.OAUTH_TENANT_ID,
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
};
export const msalConfig = {
  auth: {
    clientId: process.env.OAUTH_CLIENT_ID, // Application (client) ID
    authority: "https://login.microsoftonline.com/"+process.env.OAUTH_TENANT_ID, // Tenant ID or "common"
    redirectUri: "http://localhost:3003/smtp", // Your app URL
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  }
};

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "User.Read",
    "https://outlook.office365.com/SMTP.Send" // Scope for SMTP send permission
  ],
};
export default config;
