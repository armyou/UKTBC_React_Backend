import { Router } from "express";
import { AdminRepo } from "../repos/adminRepo.ts";
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

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
