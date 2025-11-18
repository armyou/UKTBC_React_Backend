import { Router } from "express";
import { AdminRepo, getAdminProfileDetails } from "../repos/adminRepo";
import Admin from "../models/admin";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Admin Register (only for initial setup, you can disable in prod)
router.post("/register", async (req, res) => {
  try {
    const { email, password, status } = req.body;

    const existingAdmin = await AdminRepo.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const admin = await AdminRepo.createAdmin({ email, password, status });
    res.json({ message: "Admin registered", admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminRepo.findByEmail(email);
    if (!admin) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      adminId: admin._id,
      email: admin.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// to send admin profile details
router.get("/profile", async (req, res) => {
  try {
    const adminId = req.query.adminId as string;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const adminDetails = await getAdminProfileDetails(adminId);

    if (!adminDetails) {
      return res.status(404).json({ message: "No Admin Found" });
    }

    return res.status(200).json({ adminDetails });
  } catch (error) {
    console.error("Error fetching admin profile details:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

// to change admin password
router.post("/changepassword", async (req, res) => {
  try {
    const { adminId, oldPassword, newPassword } = req.body;
    console.log(adminId, oldPassword, newPassword);

    if (!adminId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify old password
    const isMatch = await admin.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Update with new hashed password
    admin.password = newPassword; // will be hashed automatically by pre-save hook
    await admin.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
export default router;
