"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminRepo_1 = require("../repos/adminRepo");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
// Admin Register (only for initial setup, you can disable in prod)
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, status } = req.body;
        const existingAdmin = yield adminRepo_1.AdminRepo.findByEmail(email);
        if (existingAdmin) {
            return res.status(400).json({ error: "Admin already exists" });
        }
        const admin = yield adminRepo_1.AdminRepo.createAdmin({ email, password, status });
        res.json({ message: "Admin registered", admin });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed" });
    }
}));
// Admin Login
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const admin = yield adminRepo_1.AdminRepo.findByEmail(email);
        if (!admin) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const isMatch = yield admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
            expiresIn: "1d",
        });
        res.json({ message: "Login successful", token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
}));
exports.default = router;
