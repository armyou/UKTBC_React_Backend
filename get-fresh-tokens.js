import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// OAuth Configuration
const TENANT_ID = "e8d3c511-b8ef-4520-bfd3-ce059f6afed7";
const CLIENT_ID = "090fcebc-40d8-4696-8deb-34906087ded0";
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET; // Make sure this is set in your .env
const REDIRECT_URI = "http://localhost:3003/smtpweb";

async function getFreshTokens() {
  try {
    console.log("🔄 Getting fresh OAuth tokens...");
    console.log("=====================================");

    // Step 1: Generate authorization URL
    const authUrl =
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=http://localhost:3003/smtpweb&` +
      `response_mode=query&` +
      `scope=https://outlook.office365.com/.default&` +
      `grant_type=authorization_code&` +
      `state=12345`;

    console.log("📋 STEP 1: Visit this URL in your browser:");
    console.log(authUrl);
    console.log("\n📋 STEP 2: Complete the OAuth flow");
    console.log(
      "📋 STEP 3: You'll be redirected to: http://localhost:3003/smtpweb?code=AUTHORIZATION_CODE"
    );
    console.log("📋 STEP 4: Copy the authorization code from the URL");
    console.log("\n📋 STEP 5: Enter the authorization code below:");

    // For now, let's show the URL and wait for manual input
    console.log(
      "\n⏳ Please complete the OAuth flow and get the authorization code..."
    );
    console.log("⏳ Then run this script again with the code as an argument:");
    console.log("⏳ node get-fresh-tokens.js YOUR_AUTHORIZATION_CODE");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function exchangeCodeForTokens(authorizationCode) {
  try {
    console.log("🔄 Exchanging authorization code for tokens...");
    console.log("=============================================");

    if (!CLIENT_SECRET) {
      console.error(
        "❌ OAUTH_CLIENT_SECRET not found in environment variables"
      );
      console.log("💡 Make sure to set OAUTH_CLIENT_SECRET in your .env file");
      return;
    }

    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const requestData = new URLSearchParams([
      ["client_id", CLIENT_ID],
      ["client_secret", CLIENT_SECRET],
      ["scope", "offline_access Mail.Send"],
      ["grant_type", "authorization_code"],
      ["redirect_uri", REDIRECT_URI],
      ["code", authorizationCode],
    ]);

    console.log("📤 Sending request to Microsoft...");
    const response = await axios.post(tokenUrl, requestData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.data && response.data.access_token) {
      console.log("✅ Tokens received successfully!");
      console.log("=====================================");

      const tokens = response.data;
      const expiresAt = Date.now() + tokens.expires_in * 1000;

      console.log("🔑 ACCESS TOKEN:");
      console.log(tokens.access_token);
      console.log("\n🔄 REFRESH TOKEN:");
      console.log(tokens.refresh_token);
      console.log("\n⏰ EXPIRES IN:");
      console.log(
        `${tokens.expires_in} seconds (${Math.round(
          tokens.expires_in / 60
        )} minutes)`
      );
      console.log("\n📅 EXPIRES AT:");
      console.log(new Date(expiresAt).toISOString());
      console.log("\n📝 EXPIRY TIMESTAMP:");
      console.log(expiresAt);

      console.log("\n🔧 UPDATE YOUR .env FILE:");
      console.log("=====================================");
      console.log(`OAUTH_ACCESS_TOKEN=${tokens.access_token}`);
      console.log(`OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log(`OAUTH_TOKEN_EXPIRES_AT=${expiresAt}`);

      console.log(
        "\n✅ Copy the above lines to your .env file and restart your server!"
      );
    } else {
      console.error("❌ No tokens received from Microsoft");
      console.log("Response:", response.data);
    }
  } catch (error) {
    console.error("❌ Error exchanging code for tokens:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Check if authorization code is provided as argument
const authCode = process.argv[2];

if (authCode) {
  exchangeCodeForTokens(authCode);
} else {
  getFreshTokens();
}
