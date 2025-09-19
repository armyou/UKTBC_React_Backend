import { Router } from "express";
import { ResourceRepo } from "../repos/resourceRepo";
import upload from "../middleware/upload";

const router = Router();

// Add Resource
router.post("/add", upload.single("file"), async (req, res) => {
  try {
    const { title, resourceType, status } = req.body;
    const filePath = req.file ? req.file.path : "";

    const resource = await ResourceRepo.createResource({
      title,
      resourceType,
      filePath,
      status,
    });

    res.json({ message: "Resource created successfully", resource });
  } catch (err: any) {
    console.error("Error creating resource:", err);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

// Update Resource
router.put("/update/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (req.file) {
      updateData.filePath = req.file.path;
    }

    const resource = await ResourceRepo.updateResource(id, updateData);

    res.json({ message: "Resource updated successfully", resource });
  } catch (err) {
    console.error("Error updating resource:", err);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

// Delete Resource
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ResourceRepo.deleteResource(id);
    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    console.error("Error deleting resource:", err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

// Get All Resources
router.get("/", async (req, res) => {
  try {
    const resources = await ResourceRepo.getAllResources();
    res.json(resources);
  } catch (err) {
    console.error("Error fetching resources:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Get Single Resource
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await ResourceRepo.getResourceById(id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    res.json(resource);
  } catch (err) {
    console.error("Error fetching resource:", err);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

export default router;
