# UK Telugu Brahmin Community (UKTBC) Backend API

A comprehensive backend API for the UK Telugu Brahmin Community platform, handling donations, events, projects, resources, and administrative functions.

## 🚀 Features

- **Payment Processing**

  - Stripe integration for card payments
  - PayPal integration for online payments
  - Payment receipt generation (PDF)
  - Gift Aid management

- **Content Management**

  - Events management
  - Projects management
  - Resources management
  - Vipravani (announcements)
  - Purohit (priest) directory
  - Madi Vantalu (wedding services)

- **Administrative Features**

  - Admin authentication and authorization
  - Dashboard analytics
  - Donation tracking and reporting
  - Contact form handling
  - Email service integration

- **Document Generation**
  - PDF receipt generation for donations
  - Excel export for donation reports
  - HMRC document downloads

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Payment Gateways**: Stripe, PayPal
- **Email Service**: Nodemailer with OAuth2
- **PDF Generation**: PDFKit
- **File Upload**: Multer
- **Authentication**: JWT, bcrypt

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd UKTBC_React_Backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/uktbc

   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # PayPal Configuration
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_ENV=sandbox

   # Frontend URL
   FRONT_END_URL=http://localhost:5173

   # Email Service Configuration
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_user
   SMTP_PASSWORD=your_smtp_password
   FROM_EMAIL=donate@uktbc.org
   FROM_NAME=UK Telugu Brahmin Community

   # OAuth2 Configuration (for email service)
   OAUTH_CLIENT_ID=your_oauth_client_id
   OAUTH_CLIENT_SECRET=your_oauth_client_secret
   OAUTH_APP_ID_URI=your_oauth_app_id_uri
   OAUTH_TENANT_ID=your_oauth_tenant_id
   SMTP_FROM_EMAIL=your_smtp_from_email
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Run the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
UKTBC_React_Backend/
├── src/
│   ├── config.ts              # Configuration settings
│   ├── const.ts               # Constants
│   ├── server.ts              # Express server setup
│   ├── models/                # MongoDB models
│   │   ├── admin.ts
│   │   ├── payments.ts
│   │   ├── events.ts
│   │   ├── projects.ts
│   │   └── ...
│   ├── routes/                # API routes
│   │   ├── paymentRoutes.ts
│   │   ├── adminRoutes.ts
│   │   ├── eventRoutes.ts
│   │   └── ...
│   ├── repos/                 # Repository layer
│   ├── services/              # Business logic services
│   │   ├── emailService.ts
│   │   └── pdfService.ts
│   └── middleware/            # Express middleware
├── assets/                    # Uploaded files
├── dist/                      # Compiled JavaScript
└── package.json
```

## 🔌 API Routes

### Payment Routes

- `POST /api/payments/stripe/create-stripe-payment-intent` - Create Stripe payment intent
- `POST /api/payments/stripe/confirm-stripe-payment` - Confirm Stripe payment
- `POST /api/payments/stripe/create-checkout-session` - Create Stripe checkout session
- `GET /api/payments/stripe/payment-status/:sessionId` - Get payment status
- `POST /api/payments/stripe/update-payment-status` - Update payment status
- `POST /api/payments/paypal/create-order` - Create PayPal order
- `POST /api/payments/paypal/capture-order/:orderId` - Capture PayPal order

### Admin Routes

- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile

### Other Routes

- `GET /api/events` - Get all events
- `GET /api/projects` - Get all projects
- `GET /api/resources` - Get all resources
- `GET /api/dashboard` - Get dashboard data
- `GET /api/generate/payment-receipt` - Generate payment receipt PDF

## 🗄️ Database Setup

### MongoDB Connection

The application connects to MongoDB using the connection string specified in `MONGO_URI` environment variable.

### Insert Admin User

To insert the default admin user into MongoDB, use the following query:

```javascript
db.admins.insertOne({
  _id: ObjectId("68cbee12a3b1c791bba2fa05"),
  email: "admin@test.com",
  password: "$2b$10$Irn7Oo2W/MtVYygGj2uYnODPFHF64Xityfeklqe0NuZG6TzlQXFi.",
  status: "active",
  createdAt: ISODate("2025-09-18T11:33:38.025Z"),
  updatedAt: ISODate("2025-10-13T10:24:32.063Z"),
  __v: 0,
});
```

**Using MongoDB Shell:**

```bash
mongosh
use uktbc
db.admins.insertOne({
  _id: ObjectId("68cbee12a3b1c791bba2fa05"),
  email: "admin@test.com",
  password: "$2b$10$Irn7Oo2W/MtVYygGj2uYnODPFHF64Xityfeklqe0NuZG6TzlQXFi.",
  status: "active",
  createdAt: ISODate("2025-09-18T11:33:38.025Z"),
  updatedAt: ISODate("2025-10-13T10:24:32.063Z"),
  __v: 0
})
```

**Using MongoDB Compass or any MongoDB client:**

1. Connect to your MongoDB instance
2. Select the `uktbc` database
3. Navigate to the `admins` collection
4. Insert the document with the above structure

**Note:** The password is already hashed using bcrypt. The default password for this admin account should be set during initial setup. If you need to reset the password, use the admin password reset functionality or create a new admin user through the application.

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Admin routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## 📧 Email Service

The application includes an email service for sending donation receipts and notifications. The email service supports:

- SMTP configuration
- OAuth2 authentication
- HTML email templates
- PDF attachments

For detailed email service configuration, refer to `EMAIL_SERVICE_README.md`.

## 📄 PDF Generation

The application generates PDF receipts for donations using PDFKit. Features include:

- Custom branding with logo
- Donor information
- Donation details
- Gift Aid declarations
- Corporate donation support

## 🧪 Development

### Running in Development Mode

```bash
npm run dev
```

This will start the server with hot-reload using `ts-node-dev`.

### Building for Production

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Running Production Build

```bash
npm start
```

## 📝 Environment Variables

Make sure to set all required environment variables in your `.env` file. Refer to the Installation section for the complete list of required variables.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and inquiries, contact the development team or refer to the project documentation.

---

**Note:** This README does not include actual API keys, passwords, or sensitive credentials. Always keep your `.env` file secure and never commit it to version control.
