import { Router } from "express";
import { VipravaniRepo } from "../repos/vipravaniRepo";
import upload from "../middleware/pdfUpload";
import { fileToBase64 } from "../middleware/filetobase64converter";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Add Vipravani
router.post("/add", upload.single("filePath"), async (req, res) => {
  try {
    const { title, status } = req.body;
    const filePath = req.file ? req.file.path : "";

    const vipravani = await VipravaniRepo.create({
      title,
      filePath,
      status,
    });

    res.json({ message: "Vipravani created successfully", vipravani });
  } catch (err: any) {
    console.error("Error creating vipravani:", err);
    res.status(500).json({ error: "Failed to create vipravani" });
  }
});

// Update Vipravani
router.put("/update/:id", upload.single("filePath"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    // Fetch the existing Vipravani first
    const existingVipravani = await VipravaniRepo.getById(id);
    if (!existingVipravani) {
      return res.status(404).json({ error: "Vipravani not found" });
    }

    if (req.file) {
      // Delete old file if it exists
      if (existingVipravani.filePath) {
        const oldFilePath = path.join(
          process.cwd(),
          existingVipravani.filePath
        );
        try {
          await fs.unlink(oldFilePath);
          console.log("Deleted old file:", oldFilePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            console.error("Failed to delete old file:", err);
          }
        }
      }

      // Save new file path
      updateData.filePath = req.file.path;
    }

    const vipravani = await VipravaniRepo.update(id, updateData);

    res.json({ message: "Vipravani updated successfully", vipravani });
  } catch (err) {
    console.error("Error updating vipravani:", err);
    res.status(500).json({ error: "Failed to update vipravani" });
  }
});

// Delete Vipravani
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch vipravani first
    const vipravani = await VipravaniRepo.getById(id);
    if (!vipravani) {
      return res.status(404).json({ error: "Vipravani not found" });
    }

    // Delete file if exists
    if (vipravani.filePath) {
      const filePath = path.join(process.cwd(), vipravani.filePath);
      try {
        await fs.unlink(filePath);
        console.log("✅ Deleted vipravani file:", filePath);
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.warn(
            "⚠️ Vipravani file already missing, skipping:",
            filePath
          );
        } else {
          console.error("❌ Failed to delete vipravani file:", err);
        }
      }
    }

    // Delete DB record
    await VipravaniRepo.delete(id);

    res.json({
      message: vipravani.filePath
        ? "Vipravani and file deleted successfully"
        : "Vipravani deleted successfully (no file found)",
    });
  } catch (err) {
    console.error("Error deleting vipravani:", err);
    res.status(500).json({ error: "Failed to delete vipravani" });
  }
});

// Get All Vipravani
router.get("/", async (req, res) => {
  try {
    const vipravaniLists = await VipravaniRepo.getAll();
    const vipravani = vipravaniLists.map((list) => {
      const base64File = list.filePath ? fileToBase64(list.filePath) : null;
      return {
        ...(list.toObject?.() ?? list), // handle Mongoose or plain object
        filePath: base64File,
      };
    });
    res.json(vipravani);
  } catch (err) {
    console.error("Error fetching vipravani:", err);
    res.status(500).json({ error: "Failed to fetch vipravani list" });
  }
});

// Get Single Vipravani
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const vipravani = await VipravaniRepo.getById(id);
    if (!vipravani) {
      return res.status(404).json({ error: "Vipravani not found" });
    }
    res.json(vipravani);
  } catch (err) {
    console.error("Error fetching vipravani:", err);
    res.status(500).json({ error: "Failed to fetch vipravani" });
  }
});

export default router;
