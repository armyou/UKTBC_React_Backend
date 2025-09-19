import { Router } from "express";
import { ProjectRepo } from "../repos/projectRepo";
import upload from "../middleware/upload";

const router = Router();

// Create Project
router.post("/add", upload.single("file"), async (req, res) => {
  try {
    const {
      projectTitle,
      tagline,
      description,
      vision,
      impactPoints,
      projectType,
      highlights,
      events,
      status,
    } = req.body;

    const filePath = req.file ? req.file.path : "";

    const project = await ProjectRepo.createProject({
      projectTitle,
      tagline,
      description,
      vision,
      impactPoints,
      projectType,
      highlights,
      events: events ? JSON.parse(events) : [],
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
router.put("/update/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (req.body.events) {
      updateData.events = JSON.parse(req.body.events);
    }

    if (req.file) {
      updateData.filePath = req.file.path;
    }

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
    await ProjectRepo.deleteProject(id);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Get All Projects
router.get("/", async (req, res) => {
  try {
    const projects = await ProjectRepo.getAllProjects();
    res.json(projects);
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
    res.json(project);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

export default router;
