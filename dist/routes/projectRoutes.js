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
const projectRepo_1 = require("../repos/projectRepo");
const upload_1 = __importDefault(require("../middleware/upload"));
const filetobase64converter_1 = require("../middleware/filetobase64converter");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Create Project
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
function normalizeEvents(input) {
    if (!input)
        return [];
    if (Array.isArray(input))
        return input;
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed))
                return parsed;
            return [parsed];
        }
        catch (_a) {
            return [];
        }
    }
    return [];
}
router.post("/add", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Body: ", req.body);
    console.log("File: ", req.file);
    try {
        const { projectTitle, tagline, description, vision, projectType, status } = req.body;
        console.log(req.body);
        const impactPoints = normalizeToArray(req.body.impactPoints);
        const highlights = normalizeToArray(req.body.highlights);
        const events = normalizeEvents(req.body.events);
        const filePath = req.file ? req.file.path : "";
        const project = yield projectRepo_1.ProjectRepo.createProject({
            projectTitle,
            tagline,
            description,
            vision,
            impactPoints,
            projectType,
            highlights,
            events,
            filePath,
            status,
        });
        res.json({ message: "Project created successfully", project });
    }
    catch (err) {
        console.error("Error creating project:", err);
        res.status(500).json({ error: "Failed to create project" });
    }
}));
// Update Project
router.put("/update/:id", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Body: ", req.body);
    try {
        const { id } = req.params;
        // Normalize incoming data
        const impactPoints = normalizeToArray(req.body.impactPoints);
        const highlights = normalizeToArray(req.body.highlights);
        const events = normalizeEvents(req.body.events);
        // Prepare update data
        const updateData = Object.assign(Object.assign({}, req.body), { impactPoints,
            highlights,
            events });
        // Fetch old project before update
        const existingProject = yield projectRepo_1.ProjectRepo.getProjectById(id);
        if (!existingProject) {
            return res.status(404).json({ error: "Project not found" });
        }
        if (req.file) {
            // Delete old file if it exists
            if (existingProject.filePath) {
                const oldPath = path_1.default.resolve(existingProject.filePath);
                try {
                    yield promises_1.default.unlink(oldPath);
                    console.log("Old file deleted:", oldPath);
                }
                catch (err) {
                    console.error("Failed to delete old file:", err);
                }
            }
            // Save new file path
            updateData.filePath = req.file.path;
        }
        // Update project
        const project = yield projectRepo_1.ProjectRepo.updateProject(id, updateData);
        res.json({ message: "Project updated successfully", project });
    }
    catch (err) {
        console.error("Error updating project:", err);
        res.status(500).json({ error: "Failed to update project" });
    }
}));
// Delete Project
router.delete("/delete/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Fetch project first
        const project = yield projectRepo_1.ProjectRepo.getProjectById(id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        // Delete image file if exists
        if (project.filePath) {
            // Ensure absolute path from project root
            const filePath = path_1.default.join(process.cwd(), project.filePath);
            try {
                yield promises_1.default.unlink(filePath);
                console.log("✅ Deleted image:", filePath);
            }
            catch (err) {
                if (err.code === "ENOENT") {
                    console.warn("⚠️ Image file not found, skipping:", filePath);
                }
                else {
                    console.error("❌ Failed to delete image:", err);
                }
            }
        }
        // Delete DB record
        yield projectRepo_1.ProjectRepo.deleteProject(id);
        res.json({
            message: project.filePath
                ? "Project and image deleted successfully"
                : "Project deleted successfully (no image found)",
        });
    }
    catch (err) {
        console.error("Error deleting project:", err);
        res.status(500).json({ error: "Failed to delete project" });
    }
}));
// Get All Projects
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield projectRepo_1.ProjectRepo.getAllProjects();
        const projectsData = projects.map((list) => {
            var _a, _b;
            const base64File = list.filePath ? (0, filetobase64converter_1.fileToBase64)(list.filePath) : null;
            return Object.assign(Object.assign({}, ((_b = (_a = list.toObject) === null || _a === void 0 ? void 0 : _a.call(list)) !== null && _b !== void 0 ? _b : list)), { filePath: base64File });
        });
        res.json(projectsData);
    }
    catch (err) {
        console.error("Error fetching projects:", err);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
}));
// Get Single Project
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const project = yield projectRepo_1.ProjectRepo.getProjectById(id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        // Convert to base64 if filePath exists
        const base64File = project.filePath
            ? yield (0, filetobase64converter_1.fileToBase64)(project.filePath)
            : null;
        const projectDetails = Object.assign(Object.assign({}, ((_b = (_a = project.toObject) === null || _a === void 0 ? void 0 : _a.call(project)) !== null && _b !== void 0 ? _b : project)), { filePath: base64File });
        res.json(projectDetails);
    }
    catch (err) {
        console.error("Error fetching project:", err);
        res.status(500).json({ error: "Failed to fetch project" });
    }
}));
exports.default = router;
