import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import config from "../src/config";
import paymentRoutes from "./routes/paymentRoutes";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes";
import eventsRoutes from "./routes/eventRoutes";
import projectsRoutes from "./routes/projectRoutes";
import resourceRoutes from "./routes/resourceRoutes";
import vipravaniRoutes from "./routes/vipravaniRoutes";
import purohitRoutes from "./routes/purohitRoutes";
import madiVantaluRoutes from "./routes/madivantaluRoutes";
import dashboardRoutes from "./routes/getDashboardData";
import servicesRoutes from "./routes/getServices";
import resourcesRoutes from "./routes/getResources";
import footerCounterRoutes from "./routes/footerCounter";
import hrmcRoutes from "./routes/downloadHMRCRoutes";
import smtpweb from "./routes/smtpweb";
import contactUsRoutes from "./routes/contactUsRoute";
import morgan from "morgan";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan(":method :url :status :response-time ms"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "UKTBC API Server",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes

app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/vipravani", vipravaniRoutes);
app.use("/api/purohit", purohitRoutes);
app.use("/api/madiVantalu", madiVantaluRoutes);
app.use("/api/web/dashboardData", dashboardRoutes);
app.use("/api/web/services", servicesRoutes);
app.use("/api/web/resources", resourcesRoutes);
app.use("/api/footer", footerCounterRoutes);
app.use("/api/hrmc",hrmcRoutes);
app.use("/smtpweb",smtpweb);
app.use("/api/contactUs", contactUsRoutes);
// MongoDB Connection
mongoose
  .connect(config.mongoUri, {})
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
);

// 404 handler
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.listen(config.port, () => {
  console.log(` Server is running on port ${config.port}`);
  console.log(` API Base URL: http://localhost:3003/`);
});
