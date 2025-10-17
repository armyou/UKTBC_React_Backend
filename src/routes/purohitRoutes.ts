import { Router } from "express";
import { PurohitRepo } from "../repos/purohitRepo";
import upload from "../middleware/upload";
import fs from "fs/promises";
import path from "path";
import { fileToBase64 } from "../middleware/filetobase64converter";

const router = Router();

// Add Purohit
router.post("/add", upload.single("filePath"), async (req, res) => {
  try {
    const { fullName, serviceLocations, mobile, email, familyName, status } =
      req.body;

    const filePath = req.file ? req.file.path : "";

    const purohit = await PurohitRepo.create({
      fullName,
      serviceLocations: Array.isArray(serviceLocations)
        ? serviceLocations
        : serviceLocations.split(",").map((s: string) => s.trim()), // handle comma separated input
      mobile,
      email,
      familyName,
      filePath,
      status,
    });

    res.json({ message: "Purohit added successfully", purohit });
  } catch (err: any) {
    console.error("Error adding purohit:", err);
    res.status(500).json({ error: "Failed to add purohit" });
  }
});

// Update Purohit
router.put("/update/:id", upload.single("filePath"), async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch existing Purohit
    const existingPurohit = await PurohitRepo.getById(id);
    if (!existingPurohit) {
      return res.status(404).json({ error: "Purohit not found" });
    }

    const updateData: any = { ...req.body };

    // Normalize serviceLocations
    if (updateData.serviceLocations) {
      updateData.serviceLocations = Array.isArray(updateData.serviceLocations)
        ? updateData.serviceLocations
        : updateData.serviceLocations.split(",").map((s: string) => s.trim());
    }

    if (req.file) {
      // Delete old file if it exists
      if (existingPurohit.filePath) {
        const oldFilePath = path.join(process.cwd(), existingPurohit.filePath);
        try {
          await fs.unlink(oldFilePath);
          console.log(" Deleted old file:", oldFilePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            console.error("Failed to delete old file:", err);
          }
        }
      }

      // Save new file path
      updateData.filePath = req.file.path;
    }

    const purohit = await PurohitRepo.update(id, updateData);

    res.json({ message: "Purohit updated successfully", purohit });
  } catch (err) {
    console.error("Error updating purohit:", err);
    res.status(500).json({ error: "Failed to update purohit" });
  }
});

// Delete Purohit
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch Purohit first
    const purohit = await PurohitRepo.getById(id);
    if (!purohit) {
      return res.status(404).json({ error: "Purohit not found" });
    }

    // Delete image/file if exists
    if (purohit.filePath) {
      const filePath = path.join(process.cwd(), purohit.filePath);
      try {
        await fs.unlink(filePath);
        console.log(" Deleted file:", filePath);
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.warn(" File already missing, skipping:", filePath);
        } else {
          console.error(" Failed to delete file:", err);
        }
      }
    }

    // Delete DB record
    await PurohitRepo.delete(id);

    res.json({
      message: purohit.filePath
        ? "Purohit and file deleted successfully"
        : "Purohit deleted successfully (no file found)",
    });
  } catch (err) {
    console.error("Error deleting purohit:", err);
    res.status(500).json({ error: "Failed to delete purohit" });
  }
});

// Get All Purohits
router.get("/", async (req, res) => {
  try {
    const list = await PurohitRepo.getAll();

    const updatedList = list.map((item) => {
      const obj = item.toObject?.() ?? item;

      // Generate accessible file URL
      const fileUrl = obj.filePath
        ? `${req.protocol}://${req.get("host")}/files/${path.basename(
            obj.filePath
          )}`
        : null;

      return {
        ...obj,
        filePath: fileUrl,
      };
    });

    res.json(updatedList);
  } catch (err) {
    console.error("Error fetching purohits:", err);
    res.status(500).json({ error: "Failed to fetch purohit list" });
  }
});

// Get One Purohit
router.get("/:id", async (req, res) => {
  try {
    const purohit = await PurohitRepo.getById(req.params.id);
    if (!purohit) return res.status(404).json({ error: "Purohit not found" });
    res.json(purohit);
  } catch (err) {
    console.error("Error fetching purohit:", err);
    res.status(500).json({ error: "Failed to fetch purohit" });
  }
});

export default router;
