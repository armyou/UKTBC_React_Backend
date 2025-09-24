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
router.post("/add", upload_1.default.single("filePath"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("File: ", req.file);
    try {
        const { projectTitle, tagline, description, vision, projectType, highlights, status, } = req.body;
        console.log(req.body);
        const impactPoints = normalizeToArray(req.body.impactPoints);
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
// Update Project
router.put("/update/:id", upload_1.default.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = Object.assign({}, req.body);
        if (req.body.events) {
            updateData.events = JSON.parse(req.body.events);
        }
        if (req.file) {
            updateData.filePath = req.file.path;
        }
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
        yield projectRepo_1.ProjectRepo.deleteProject(id);
        res.json({ message: "Project deleted successfully" });
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
        res.json(projects);
    }
    catch (err) {
        console.error("Error fetching projects:", err);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
}));
// Get Single Project
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const project = yield projectRepo_1.ProjectRepo.getProjectById(id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(project);
    }
    catch (err) {
        console.error("Error fetching project:", err);
        res.status(500).json({ error: "Failed to fetch project" });
    }
}));
exports.default = router;
