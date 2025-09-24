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
const purohitRepo_1 = require("../repos/purohitRepo");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
// Add Purohit
router.post("/add", upload_1.default.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, serviceLocations, mobile, email, familyName, status } = req.body;
        const filePath = req.file ? req.file.path : "";
        const purohit = yield purohitRepo_1.PurohitRepo.create({
            fullName,
            serviceLocations: Array.isArray(serviceLocations)
                ? serviceLocations
                : serviceLocations.split(",").map((s) => s.trim()), // handle comma separated input
            mobile,
            email,
            familyName,
            filePath,
            status,
        });
        res.json({ message: "Purohit added successfully", purohit });
    }
    catch (err) {
        console.error("Error adding purohit:", err);
        res.status(500).json({ error: "Failed to add purohit" });
    }
}));
// Update Purohit
router.put("/update/:id", upload_1.default.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = Object.assign({}, req.body);
        if (updateData.serviceLocations) {
            updateData.serviceLocations = Array.isArray(updateData.serviceLocations)
                ? updateData.serviceLocations
                : updateData.serviceLocations.split(",").map((s) => s.trim());
        }
        if (req.file) {
            updateData.filePath = req.file.path;
        }
        const purohit = yield purohitRepo_1.PurohitRepo.update(id, updateData);
        res.json({ message: "Purohit updated successfully", purohit });
    }
    catch (err) {
        console.error("Error updating purohit:", err);
        res.status(500).json({ error: "Failed to update purohit" });
    }
}));
// Delete Purohit
router.delete("/delete/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield purohitRepo_1.PurohitRepo.delete(id);
        res.json({ message: "Purohit deleted successfully" });
    }
    catch (err) {
        console.error("Error deleting purohit:", err);
        res.status(500).json({ error: "Failed to delete purohit" });
    }
}));
// Get All Purohits
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const list = yield purohitRepo_1.PurohitRepo.getAll();
        res.json(list);
    }
    catch (err) {
        console.error("Error fetching purohits:", err);
        res.status(500).json({ error: "Failed to fetch purohit list" });
    }
}));
// Get One Purohit
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const purohit = yield purohitRepo_1.PurohitRepo.getById(req.params.id);
        if (!purohit)
            return res.status(404).json({ error: "Purohit not found" });
        res.json(purohit);
    }
    catch (err) {
        console.error("Error fetching purohit:", err);
        res.status(500).json({ error: "Failed to fetch purohit" });
    }
}));
exports.default = router;
