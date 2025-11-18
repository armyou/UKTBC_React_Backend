import { Router } from "express";
import { ResourceRepo } from "../repos/resourceRepo";
import { upload } from "../middleware/pdfUpload";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Add Resource
router.post(
  "/add",
  upload.fields([
    { name: "filePath", maxCount: 1 },
    { name: "previewImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, resourceType, status } = req.body;
      const filePath =
        req.files && (req.files as any).filePath
          ? (req.files as any).filePath[0].path
          : "";
      const previewImage =
        req.files && (req.files as any).previewImage
          ? (req.files as any).previewImage[0].path
          : "";

      const resource = await ResourceRepo.createResource({
        title,
        resourceType,
        filePath,
        previewImage,
        status,
      });

      res.json({ message: "Resource created successfully", resource });
    } catch (err: any) {
      console.error("Error creating resource:", err);
      res.status(500).json({ error: "Failed to create resource" });
    }
  }
);

// Update Resource

router.put(
  "/update/:id",
  upload.fields([
    { name: "filePath", maxCount: 1 },
    { name: "previewImage", maxCount: 1 },
  ]),
  async (req, res) => {
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
          const oldFilePath = path.join(
            process.cwd(),
            existingResource.filePath
          );
          try {
            await fs.unlink(oldFilePath);
            console.log(" Deleted old file:", oldFilePath);
          } catch (err: any) {
            if (err.code !== "ENOENT") {
              console.error(" Failed to delete old file:", err);
            }
          }
        }

        // Save new file path
        updateData.filePath = req.file.path;
      }
      if (req.files && (req.files as any).previewImage) {
        const newPreview = (req.files as any).previewImage[0];

        // Delete old previewImage if it exists
        if (existingResource.previewImage) {
          const oldPreviewPath = path.join(
            process.cwd(),
            existingResource.previewImage
          );
          try {
            await fs.unlink(oldPreviewPath);
            console.log(" Deleted old previewImage:", oldPreviewPath);
          } catch (err: any) {
            if (err.code !== "ENOENT") {
              console.error(" Failed to delete old previewImage:", err);
            }
          }
        }

        updateData.previewImage = newPreview.path;
      }
      const resource = await ResourceRepo.updateResource(id, updateData);

      res.json({ message: "Resource updated successfully", resource });
    } catch (err) {
      console.error("Error updating resource:", err);
      res.status(500).json({ error: "Failed to update resource" });
    }
  }
);
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
        console.log(" Deleted resource file:", filePath);
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.warn(" File already missing, skipping:", filePath);
        } else {
          console.error("Failed to delete resource file:", err);
        }
      }
    }
    if (resource.previewImage) {
      const previewPath = path.join(process.cwd(), resource.previewImage);
      try {
        await fs.unlink(previewPath);
        console.log("Deleted resource previewImage:", previewPath);
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.warn(
            "Resource previewImage already missing, skipping:",
            previewPath
          );
        } else {
          console.error("Failed to delete resource previewImage:", err);
        }
      }
    }
    // Delete DB record
    await ResourceRepo.deleteResource(id);

    res.json({
      message:
        resource.filePath || resource.previewImage
          ? "Resource and associated files deleted successfully"
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

    const updatedResources = resources.map((resource) => {
      const obj = resource.toObject?.() ?? resource;

      return {
        ...obj,
        filePath: obj.filePath ? `/files/${path.basename(obj.filePath)}` : null,
        previewImage: obj.previewImage
          ? `/files/${path.basename(obj.previewImage)}`
          : null,
      };
    });

    res.json(updatedResources);
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

    const obj = resource.toObject?.() ?? resource;

    res.json({
      ...obj,
      filePath: obj.filePath ? `/files/${path.basename(obj.filePath)}` : null,
      previewImage: obj.previewImage
        ? `/files/${path.basename(obj.previewImage)}`
        : null,
    });
  } catch (err) {
    console.error("Error fetching resource:", err);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

export default router;
