import { Router, Request, Response } from "express";
import { contactEmailService } from "../services/contactEmailService";
import {
  fileUploadMiddleware,
  cleanupFile,
} from "../middleware/fileUploadMiddleware";

const router = Router();

// Get recipient email based on category
function getRecipientEmail(category: unknown): string {
  if (typeof category !== "string") {
    return "info@uktbc.org";
  }

  switch (category.toLowerCase()) {
    case "general inquiry":
    case "support":
      return "info@uktbc.org";
    case "donation":
      return "donate@uktbc.org";
    case "event":
      return "volunteer@uktbc.org";
    default:
      return "info@uktbc.org";
  }
}

// Contact form submission endpoint
router.post(
  "/submit",
  fileUploadMiddleware,
  async (req: Request, res: Response) => {
    try {
      console.log("Contact form submission received");
      console.log("Request body:", req.body);
      console.log("Request body keys:", Object.keys(req.body));
      console.log("File:", req.file);
      console.log(
        "File details:",
        req.file
          ? {
              fieldname: req.file.fieldname,
              originalname: req.file.originalname,
              filename: req.file.filename,
              mimetype: req.file.mimetype,
              size: req.file.size,
            }
          : "No file"
      );

      const { name, mobile, email, category, subject, message } = req.body;

      // Clean up subject field if it's "undefined" string
      const cleanSubject =
        subject === "undefined" || subject === undefined
          ? "No Subject"
          : subject;

      // Validate required fields
      if (!name || !email || !category || !cleanSubject || !message) {
        // Clean up uploaded file on validation error
        if (req.file) {
          cleanupFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: name, email, category, subject, and message are required",
        });
      }

      // Prepare contact data
      const contactData = {
        name: name || "",
        mobile: mobile || "",
        email: email || "",
        category: category || "",
        subject: cleanSubject || "",
        message: message || "",
        fileName: req.file ? req.file.originalname : null,
        filePath: req.file ? req.file.path : null,
      };

      // Get recipient email based on category
      const recipientEmail = contactEmailService.getRecipientEmail(category);
      console.log(
        `Sending email to: ${recipientEmail} for category: ${category}`
      );

      // Generate HTML content
      console.log("data from contact us route: ", contactData);
      const htmlContent =
        contactEmailService.generateContactEmailHTML(contactData);

      // Initialize contact email service
      console.log("Initializing contact email service...");
      await contactEmailService.initializeCredentials();
      console.log("Contact email service initialized successfully");

      // Prepare email options with file attachment
      const mailOptions = {
        from: contactEmailService.getSenderEmail(),
        to: recipientEmail,
        subject: `Contact Form: ${subject} - ${category}`,
        html: htmlContent,
        attachments: req.file
          ? [
              {
                filename: req.file.originalname,
                path: req.file.path,
                contentType: req.file.mimetype,
              },
            ]
          : [],
      };

      console.log("Email options prepared:", {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasAttachments: mailOptions.attachments.length > 0,
        attachmentFile: req.file ? req.file.originalname : "None",
      });

      // Send email
      console.log(`Sending contact form email to: ${recipientEmail}`);
      await contactEmailService.sendContactEmail(mailOptions);
      console.log("Contact form email sent successfully");

      // Clean up uploaded file after sending email
      if (req.file) {
        cleanupFile(req.file.path);
      }

      res.status(200).json({
        success: true,
        message: "Contact form submitted successfully",
        recipientEmail: recipientEmail,
        category: category,
        fileUploaded: req.file
          ? {
              originalName: req.file.originalname,
              fileName: req.file.filename,
              size: req.file.size,
              mimetype: req.file.mimetype,
            }
          : null,
      });
    } catch (error: any) {
      console.error("Error processing contact form:", error);

      // Clean up uploaded file in case of error
      if (req.file) {
        cleanupFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: "Failed to process contact form submission",
        details: error.message,
      });
    }
  }
);

// Test endpoint to verify email service
router.post(
  "/mail",
  fileUploadMiddleware,
  async (req: Request, res: Response) => {
    try {
      console.log("Testing contact form email service...");
      console.log("Request body:", req.body);

      const { name, mobile, email, category, subject, message } = req.body;

      // Clean up subject field if it's "undefined" string
      const cleanSubject =
        subject === "undefined" || subject === undefined
          ? "Test Contact Form"
          : subject;

      const testData = {
        name: name || "Test User",
        mobile: mobile || "1234567890",
        email: email || "test@example.com",
        category: category || "General Inquiry",
        subject: cleanSubject || "Test Contact Form",
        message:
          message ||
          "This is a test message for the contact form email service.",
        fileName: req.file ? req.file.originalname : null,
        filePath: req.file ? req.file.path : null,
      };

      const htmlContent =
        contactEmailService.generateContactEmailHTML(testData);
      const recipientEmail = contactEmailService.getRecipientEmail(
        testData.category
      );

      await contactEmailService.initializeCredentials();

      const mailOptions = {
        from: contactEmailService.getSenderEmail(),
        to: recipientEmail,
        subject: `Test Contact Form: ${testData.subject}`,
        html: htmlContent,
        attachments: req.file
          ? [
              {
                filename: req.file.originalname,
                path: req.file.path,
                contentType: req.file.mimetype,
              },
            ]
          : [],
      };

      await contactEmailService.sendContactEmail(mailOptions);
      console.log("Test email sent successfully");

      // Clean up uploaded file after sending email
      if (req.file) {
        cleanupFile(req.file.path);
      }

      res.status(200).json({
        success: true,
        message: "Test email sent successfully",
        recipientEmail: recipientEmail,
        fileUploaded: req.file
          ? {
              originalName: req.file.originalname,
              fileName: req.file.filename,
              size: req.file.size,
              mimetype: req.file.mimetype,
            }
          : null,
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);

      // Clean up uploaded file in case of error
      if (req.file) {
        cleanupFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: "Failed to send test email",
        details: error.message,
      });
    }
  }
);

export default router;
