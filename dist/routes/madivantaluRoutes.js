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
const madiVantaluRepo_1 = require("../repos/madiVantaluRepo");
const upload_1 = __importDefault(require("../middleware/upload"));
const filetobase64converter_1 = require("../middleware/filetobase64converter");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Add Caterer
function normalizeToArray(input) {
    if (Array.isArray(input))
        return input;
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed))
                return parsed;
            return [input];
        }
        catch (_a) {
            return [input];
        }
    }
    return [];
}
router.post("/add", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Body:", req.body);
    console.log("File:", req.file);
    try {
        console.log(req.body);
        const { catererName, mobile, status } = req.body;
        const filePath = req.file ? req.file.path : "";
        const serviceLocations = normalizeToArray(req.body.serviceLocations);
        console.log("serviceLocations: ", serviceLocations);
        const madiVantalu = yield madiVantaluRepo_1.MadiVantaluRepo.create({
            catererName,
            serviceLocations,
            mobile,
            filePath,
            status,
        });
        res.json({ message: "Caterer added successfully", madiVantalu });
    }
    catch (err) {
        console.error("Error adding caterer:", err);
        res.status(500).json({ error: "Failed to add caterer" });
    }
}));
// Update Caterer
router.put("/update/:id", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Fetch existing caterer
        const existingCaterer = yield madiVantaluRepo_1.MadiVantaluRepo.getById(id);
        if (!existingCaterer) {
            return res.status(404).json({ error: "Caterer not found" });
        }
        // Spread request body and normalize serviceLocations
        const updateData = Object.assign(Object.assign({}, req.body), { serviceLocations: normalizeToArray(req.body.serviceLocations) });
        if (req.file) {
            // Delete old file if it exists
            if (existingCaterer.filePath) {
                const oldFilePath = path_1.default.join(process.cwd(), existingCaterer.filePath);
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
        const madiVantalu = yield madiVantaluRepo_1.MadiVantaluRepo.update(id, updateData);
        res.json({ message: "Caterer updated successfully", madiVantalu });
    }
    catch (err) {
        console.error("Error updating caterer:", err);
        res.status(500).json({ error: "Failed to update caterer" });
    }
}));
// Delete Caterer
router.delete("/delete/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Fetch caterer before deleting
        const caterer = yield madiVantaluRepo_1.MadiVantaluRepo.getById(id);
        if (!caterer) {
            return res.status(404).json({ error: "Caterer not found" });
        }
        // Delete file if exists
        if (caterer.filePath) {
            const filePath = path_1.default.resolve(caterer.filePath);
            try {
                yield promises_1.default.unlink(filePath);
                console.log("Deleted caterer file:", filePath);
            }
            catch (err) {
                console.error("Failed to delete caterer file:", err);
            }
        }
        // Delete DB record
        yield madiVantaluRepo_1.MadiVantaluRepo.delete(id);
        res.json({ message: "Caterer and file deleted successfully" });
    }
    catch (err) {
        console.error("Error deleting caterer:", err);
        res.status(500).json({ error: "Failed to delete caterer" });
    }
}));
// Get All Caterers
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lists = yield madiVantaluRepo_1.MadiVantaluRepo.getAll();
        const madiVantalu = lists.map((list) => {
            var _a, _b;
            const base64File = list.filePath ? (0, filetobase64converter_1.fileToBase64)(list.filePath) : null;
            return Object.assign(Object.assign({}, ((_b = (_a = list.toObject) === null || _a === void 0 ? void 0 : _a.call(list)) !== null && _b !== void 0 ? _b : list)), { filePath: base64File });
        });
        res.json(madiVantalu);
    }
    catch (err) {
        console.error("Error fetching caterers:", err);
        res.status(500).json({ error: "Failed to fetch caterers" });
    }
}));
// Get One Caterer
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const madiVantalu = yield madiVantaluRepo_1.MadiVantaluRepo.getById(req.params.id);
        if (!madiVantalu)
            return res.status(404).json({ error: "Caterer not found" });
        res.json(madiVantalu);
    }
    catch (err) {
        console.error("Error fetching caterer:", err);
        res.status(500).json({ error: "Failed to fetch caterer" });
    }
}));
exports.default = router;
