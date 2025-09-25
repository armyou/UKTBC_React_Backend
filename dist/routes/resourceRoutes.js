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
const resourceRepo_1 = require("../repos/resourceRepo");
const pdfUpload_1 = __importDefault(require("../middleware/pdfUpload"));
const filetobase64converter_1 = require("../middleware/filetobase64converter");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Add Resource
router.post("/add", pdfUpload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, resourceType, status } = req.body;
        const filePath = req.file ? req.file.path : "";
        const resource = yield resourceRepo_1.ResourceRepo.createResource({
            title,
            resourceType,
            filePath,
            status,
        });
        res.json({ message: "Resource created successfully", resource });
    }
    catch (err) {
        console.error("Error creating resource:", err);
        res.status(500).json({ error: "Failed to create resource" });
    }
}));
// Update Resource
router.put("/update/:id", pdfUpload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Fetch existing resource
        const existingResource = yield resourceRepo_1.ResourceRepo.getResourceById(id);
        if (!existingResource) {
            return res.status(404).json({ error: "Resource not found" });
        }
        const updateData = Object.assign({}, req.body);
        if (req.file) {
            // Delete old file if it exists
            if (existingResource.filePath) {
                const oldFilePath = path_1.default.join(process.cwd(), existingResource.filePath);
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
        const resource = yield resourceRepo_1.ResourceRepo.updateResource(id, updateData);
        res.json({ message: "Resource updated successfully", resource });
    }
    catch (err) {
        console.error("Error updating resource:", err);
        res.status(500).json({ error: "Failed to update resource" });
    }
}));
// Delete Resource
router.delete("/delete/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Fetch resource first
        const resource = yield resourceRepo_1.ResourceRepo.getResourceById(id);
        if (!resource) {
            return res.status(404).json({ error: "Resource not found" });
        }
        // Delete file if exists
        if (resource.filePath) {
            const filePath = path_1.default.join(process.cwd(), resource.filePath);
            try {
                yield promises_1.default.unlink(filePath);
                console.log("✅ Deleted resource file:", filePath);
            }
            catch (err) {
                if (err.code === "ENOENT") {
                    console.warn("⚠️ File already missing, skipping:", filePath);
                }
                else {
                    console.error("❌ Failed to delete resource file:", err);
                }
            }
        }
        // Delete DB record
        yield resourceRepo_1.ResourceRepo.deleteResource(id);
        res.json({
            message: resource.filePath
                ? "Resource and file deleted successfully"
                : "Resource deleted successfully (no file found)",
        });
    }
    catch (err) {
        console.error("Error deleting resource:", err);
        res.status(500).json({ error: "Failed to delete resource" });
    }
}));
// Get All Resources
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resources = yield resourceRepo_1.ResourceRepo.getAllResources();
        const updatedEvents = resources.map((resource) => {
            var _a, _b;
            const base64File = resource.filePath
                ? (0, filetobase64converter_1.fileToBase64)(resource.filePath)
                : null;
            return Object.assign(Object.assign({}, ((_b = (_a = resource.toObject) === null || _a === void 0 ? void 0 : _a.call(resource)) !== null && _b !== void 0 ? _b : resource)), { filePath: base64File });
        });
        res.json(updatedEvents);
    }
    catch (err) {
        console.error("Error fetching resources:", err);
        res.status(500).json({ error: "Failed to fetch resources" });
    }
}));
// Get Single Resource
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const resource = yield resourceRepo_1.ResourceRepo.getResourceById(id);
        if (!resource) {
            return res.status(404).json({ error: "Resource not found" });
        }
        res.json(resource);
    }
    catch (err) {
        console.error("Error fetching resource:", err);
        res.status(500).json({ error: "Failed to fetch resource" });
    }
}));
exports.default = router;
