import { Router } from "express";
import { ProjectRepo } from "../repos/projectRepo";
import upload from "../middleware/upload";
import { fileToBase64 } from "../middleware/filetobase64converter";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Create Project
function normalizeToArray(input: any): string[] {
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
      return [input];
    } catch {
      return [input];
    }
  }
  return [];
}
function normalizeEvents(input: any): any[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      return [];
    }
  }
  return [];
}
router.post("/add", upload.single("filePath"), async (req, res) => {
  console.log("Body: ", req.body);
  console.log("File: ", req.file);
  try {
    const { projectTitle, tagline, description, vision, projectType, status } =
      req.body;
    console.log(req.body);
    const impactPoints = normalizeToArray(req.body.impactPoints);
    const highlights = normalizeToArray(req.body.highlights);
    const events = normalizeEvents(req.body.events);

    const filePath = req.file ? req.file.path : "";

    const project = await ProjectRepo.createProject({
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
  } catch (err: any) {
    console.error("Error creating project:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update Project
router.put("/update/:id", upload.single("filePath"), async (req, res) => {
  console.log("Body: ", req.body);

  try {
    const { id } = req.params;

    // Normalize incoming data
    const impactPoints = normalizeToArray(req.body.impactPoints);
    const highlights = normalizeToArray(req.body.highlights);
    const events = normalizeEvents(req.body.events);

    // Prepare update data
    const updateData: any = {
      ...req.body,
      impactPoints,
      highlights,
      events,
    };

    // Fetch old project before update
    const existingProject = await ProjectRepo.getProjectById(id);
    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (req.file) {
      // Delete old file if it exists
      if (existingProject.filePath) {
        const oldPath = path.resolve(existingProject.filePath);
        try {
          await fs.unlink(oldPath);
          console.log("Old file deleted:", oldPath);
        } catch (err) {
          console.error("Failed to delete old file:", err);
        }
      }

      // Save new file path
      updateData.filePath = req.file.path;
    }

    // Update project
    const project = await ProjectRepo.updateProject(id, updateData);

    res.json({ message: "Project updated successfully", project });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete Project
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch project first
    const project = await ProjectRepo.getProjectById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Delete image file if exists
    if (project.filePath) {
      // Ensure absolute path from project root
      const filePath = path.join(process.cwd(), project.filePath);
      try {
        await fs.unlink(filePath);
        console.log(" Deleted image:", filePath);
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.warn(" Image file not found, skipping:", filePath);
        } else {
          console.error("Failed to delete image:", err);
        }
      }
    }

    // Delete DB record
    await ProjectRepo.deleteProject(id);

    res.json({
      message: project.filePath
        ? "Project and image deleted successfully"
        : "Project deleted successfully (no image found)",
    });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Get All Projects
router.get("/", async (req, res) => {
  try {
    const projects = await ProjectRepo.getAllProjects();
    const projectsData = projects.map((list) => {
      const base64File = list.filePath ? fileToBase64(list.filePath) : null;
      return {
        ...(list.toObject?.() ?? list), // handle Mongoose or plain object
        filePath: base64File,
      };
    });
    res.json(projectsData);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get Single Project
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await ProjectRepo.getProjectById(id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Convert to base64 if filePath exists
    const base64File = project.filePath
      ? await fileToBase64(project.filePath)
      : null;

    const projectDetails = {
      ...(project.toObject?.() ?? project), // handle Mongoose doc or plain object
      filePath: base64File,
    };

    res.json(projectDetails);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

export default router;
