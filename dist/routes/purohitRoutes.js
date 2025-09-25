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
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const filetobase64converter_1 = require("../middleware/filetobase64converter");
const router = (0, express_1.Router)();
// Add Purohit
router.post("/add", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.put("/update/:id", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Fetch existing Purohit
        const existingPurohit = yield purohitRepo_1.PurohitRepo.getById(id);
        if (!existingPurohit) {
            return res.status(404).json({ error: "Purohit not found" });
        }
        const updateData = Object.assign({}, req.body);
        // Normalize serviceLocations
        if (updateData.serviceLocations) {
            updateData.serviceLocations = Array.isArray(updateData.serviceLocations)
                ? updateData.serviceLocations
                : updateData.serviceLocations.split(",").map((s) => s.trim());
        }
        if (req.file) {
            // Delete old file if it exists
            if (existingPurohit.filePath) {
                const oldFilePath = path_1.default.join(process.cwd(), existingPurohit.filePath);
                try {
                    yield promises_1.default.unlink(oldFilePath);
                    console.log("✅ Deleted old file:", oldFilePath);
                }
                catch (err) {
                    if (err.code !== "ENOENT") {
                        console.error("❌ Failed to delete old file:", err);
                    }
                }
            }
            // Save new file path
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
        // Fetch Purohit first
        const purohit = yield purohitRepo_1.PurohitRepo.getById(id);
        if (!purohit) {
            return res.status(404).json({ error: "Purohit not found" });
        }
        // Delete image/file if exists
        if (purohit.filePath) {
            const filePath = path_1.default.join(process.cwd(), purohit.filePath);
            try {
                yield promises_1.default.unlink(filePath);
                console.log("✅ Deleted file:", filePath);
            }
            catch (err) {
                if (err.code === "ENOENT") {
                    console.warn("⚠️ File already missing, skipping:", filePath);
                }
                else {
                    console.error("❌ Failed to delete file:", err);
                }
            }
        }
        // Delete DB record
        yield purohitRepo_1.PurohitRepo.delete(id);
        res.json({
            message: purohit.filePath
                ? "Purohit and file deleted successfully"
                : "Purohit deleted successfully (no file found)",
        });
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
        const updatedlist = list.map((item) => {
            var _a, _b;
            const base64File = item.filePath ? (0, filetobase64converter_1.fileToBase64)(item.filePath) : null;
            return Object.assign(Object.assign({}, ((_b = (_a = item.toObject) === null || _a === void 0 ? void 0 : _a.call(item)) !== null && _b !== void 0 ? _b : item)), { filePath: base64File });
        });
        res.json(updatedlist);
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
