import { Router } from "express";
import { ResourceRepo } from "../repos/resourceRepo.ts";
import upload from "../middleware/pdfUpload.ts";
import { fileToBase64 } from "../middleware/filetobase64converter.ts";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Add Resource
router.post("/add", upload.single("filePath"), async (req, res) => {
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

router.put("/update/:id", upload.single("filePath"), async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch existing resource
    const existingResource = await ResourceRepo.getResourceById(id);
    if (!existingResource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const updateData: any = { ...req.body };

    if (req.file) {
      // Delete old file if it exists
      if (existingResource.filePath) {
        const oldFilePath = path.join(process.cwd(), existingResource.filePath);
        try {
          await fs.unlink(oldFilePath);
          console.log("✅ Deleted old file:", oldFilePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            console.error("❌ Failed to delete old file:", err);
          }
        }
      }

      // Save new file path
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

    // Fetch resource first
    const resource = await ResourceRepo.getResourceById(id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Delete file if exists
    if (resource.filePath) {
      const filePath = path.join(process.cwd(), resource.filePath);
      try {
        await fs.unlink(filePath);
        console.log("✅ Deleted resource file:", filePath);
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.warn("⚠️ File already missing, skipping:", filePath);
        } else {
          console.error("❌ Failed to delete resource file:", err);
        }
      }
    }

    // Delete DB record
    await ResourceRepo.deleteResource(id);

    res.json({
      message: resource.filePath
        ? "Resource and file deleted successfully"
        : "Resource deleted successfully (no file found)",
    });
  } catch (err) {
    console.error("Error deleting resource:", err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

// Get All Resources
router.get("/", async (req, res) => {
  try {
    const resources = await ResourceRepo.getAllResources();
    const updatedEvents = resources.map((resource) => {
      const base64File = resource.filePath
        ? fileToBase64(resource.filePath)
        : null;
      return {
        ...(resource.toObject?.() ?? resource), // handle Mongoose or plain object
        filePath: base64File,
      };
    });
    res.json(updatedEvents);
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
