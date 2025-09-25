# Email Service Implementation

## Overview
This implementation adds Microsoft SMTP email functionality to send PDF donation receipts after successful Stripe payments.

## Features
- Sends PDF donation receipts via Microsoft SMTP
- Only sends emails when `giftAid: "yes"` and `corpDonation: "no"`
- Generates professional PDF receipts matching the provided design
- Integrates with existing Stripe payment flow

## Required Environment Variables

Add these to your `.env` file:

```env
# Microsoft SMTP Configuration
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_microsoft_email@outlook.com
SMTP_PASSWORD=your_microsoft_app_password_here
FROM_EMAIL=donate@uktbc.org
FROM_NAME=UK Telugu Brahmin Community
```

## Microsoft SMTP Setup

1. **Create Microsoft App Password:**
   - Go to Microsoft Account Security settings
   - Enable 2-factor authentication
   - Generate an app password for this application
   - Use the app password (not your regular password) in `SMTP_PASSWORD`

2. **SMTP Settings:**
   - Host: `smtp-mail.outlook.com`
   - Port: `587`
   - Security: `STARTTLS`
   - Authentication: Required

## Files Added/Modified

### New Files:
- `src/services/emailService.ts` - Email service with Microsoft SMTP
- `src/services/pdfService.ts` - PDF generation for donation receipts

### Modified Files:
- `src/routes/paymentRoutes.ts` - Added email sending to Stripe success handlers
- `src/config.ts` - Added SMTP configuration

## Integration Points

The email service is integrated into these Stripe payment endpoints:
- `/stripe/confirm-stripe-payment` - When payment status is "succeeded"
- `/stripe/payment-status/:sessionId` - When payment status is "paid"
- `/stripe/update-payment-status` - When status is "paid" or "succeeded"

## Email Conditions

Emails are only sent when:
- `giftAid === "yes"`
- `corpDonation !== "yes"` (or is "no")

## PDF Receipt Features

The generated PDF includes:
- UK Telugu Brahmin Community logo from `src/resources/UKTBC Logo PNG.png`
- Charity registration number
- Donor address information
- Donation details (amount, date, reference)
- Gift Aid calculation (25% of donation amount)
- Professional formatting matching the provided design

## Logo Integration

- **PDF Receipts**: Logo is embedded at the top of the PDF
- **Email Templates**: Logo is included as an embedded image in HTML emails
- **Fallback**: If logo file is not found, text fallback is used
- **Location**: Logo file should be placed in `src/resources/UKTBC Logo PNG.png`

## Error Handling

- Email failures don't affect payment processing
- Errors are logged but don't interrupt the payment flow
- SMTP connection is verified before sending emails
