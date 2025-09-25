# Microsoft OAuth2 Email Setup for UKTBC

This document explains how to set up Microsoft OAuth2 authentication for sending emails via SMTP.

## Prerequisites

1. Microsoft Azure App Registration
2. Office 365 tenant with SMTP permissions
3. Environment variables configured

## Azure App Registration Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in the details:
   - **Name**: UKTBC Email Service
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Leave blank for now
5. Click "Register"

## Configure App Permissions

1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Application permissions"
5. Add these permissions:
   - `Mail.Send` - Send mail as any user
   - `User.Read.All` - Read all users' full profiles
6. Click "Add permissions"
7. Click "Grant admin consent" (requires admin privileges)

## Generate Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add a description: "Email Service Secret"
4. Choose expiration (recommend 24 months)
5. Click "Add"
6. **IMPORTANT**: Copy the secret value immediately (it won't be shown again)

## Environment Variables

Add these to your `.env` file:

```env
# Microsoft OAuth2 Configuration
OAUTH_CLIENT_ID=your_app_client_id_here
OAUTH_CLIENT_SECRET=your_client_secret_here
OAUTH_TENANT_ID=your_tenant_id_here
SMTP_FROM_EMAIL=donate@uktbc.org
```

## Finding Your Tenant ID

1. In Azure Portal, go to "Azure Active Directory"
2. Click "Overview"
3. Copy the "Tenant ID" value

## Testing the Setup

Run the test script to verify OAuth2 authentication:

```bash
node test-oauth-email.js
```

## How It Works

1. **Token Acquisition**: The service requests an access token from Microsoft using client credentials flow
2. **SMTP Authentication**: Uses the access token to authenticate with Office 365 SMTP
3. **Email Sending**: Sends donation receipts with PDF attachments

## API Endpoint

The token request is made to:
```
POST https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
```

With these parameters:
- `client_id`: Your app's client ID
- `client_secret`: Your app's client secret
- `scope`: `https://outlook.office365.com/.default`
- `grant_type`: `client_credentials`

## Security Notes

- Store client secrets securely
- Rotate secrets regularly
- Use environment variables, never hardcode credentials
- Monitor token usage and expiration

## Troubleshooting

### Common Issues

1. **"Invalid client"**: Check client ID and secret
2. **"Insufficient privileges"**: Ensure admin consent is granted
3. **"Invalid scope"**: Verify the scope is correct
4. **"Token expired"**: Tokens are automatically refreshed

### Debug Steps

1. Check environment variables are loaded
2. Verify Azure app permissions
3. Test token acquisition separately
4. Check SMTP connection logs

## Support

For issues with this implementation, check:
1. Azure app registration configuration
2. Network connectivity to Microsoft endpoints
3. Office 365 SMTP server status
