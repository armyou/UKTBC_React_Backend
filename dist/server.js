"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("../src/config"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const resourceRoutes_1 = __importDefault(require("./routes/resourceRoutes"));
const vipravaniRoutes_1 = __importDefault(require("./routes/vipravaniRoutes"));
const purohitRoutes_1 = __importDefault(require("./routes/purohitRoutes"));
const madivantaluRoutes_1 = __importDefault(require("./routes/madivantaluRoutes"));
const getDashboardData_1 = __importDefault(require("./routes/getDashboardData"));
const getServices_1 = __importDefault(require("./routes/getServices"));
const getResources_1 = __importDefault(require("./routes/getResources"));
const footerCounter_1 = __importDefault(require("./routes/footerCounter"));
const downloadHMRCRoutes_1 = __importDefault(require("./routes/downloadHMRCRoutes"));
const smtpweb_1 = __importDefault(require("./routes/smtpweb"));
const morgan_1 = __importDefault(require("morgan"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)(":method :url :status :response-time ms"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Health check route
app.get("/", (req, res) => {
    res.json({
        message: "UKTBC API Server",
        status: "running",
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use("/api/payments", paymentRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/events", eventRoutes_1.default);
app.use("/api/projects", projectRoutes_1.default);
app.use("/api/resources", resourceRoutes_1.default);
app.use("/api/vipravani", vipravaniRoutes_1.default);
app.use("/api/purohit", purohitRoutes_1.default);
app.use("/api/madiVantalu", madivantaluRoutes_1.default);
app.use("/api/web/dashboardData", getDashboardData_1.default);
app.use("/api/web/services", getServices_1.default);
app.use("/api/web/resources", getResources_1.default);
app.use("/api/footer", footerCounter_1.default);
app.use("/api/hrmc", downloadHMRCRoutes_1.default);
app.use("/smtpweb", smtpweb_1.default);
// MongoDB Connection
mongoose_1.default
    .connect(config_1.default.mongoUri, {})
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
        error: "Internal server error",
    });
});
// 404 handler
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});
app.listen(config_1.default.port, () => {
    console.log(` Server is running on port ${config_1.default.port}`);
    console.log(` API Base URL: http://localhost:3003/`);
});
