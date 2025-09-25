import { Router } from "express";
import { MadiVantaluRepo } from "../repos/madiVantaluRepo.ts";
import upload from "../middleware/upload.ts";
import { fileToBase64 } from "../middleware/filetobase64converter.ts";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Add Caterer
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
router.post("/add", upload.single("filePath"), async (req, res) => {
  console.log("Body:", req.body);
  console.log("File:", req.file);
  try {
    console.log(req.body);
    const { catererName, mobile, status } = req.body;
    const filePath = req.file ? req.file.path : "";
    const serviceLocations = normalizeToArray(req.body.serviceLocations);
    console.log("serviceLocations: ", serviceLocations);

    const madiVantalu = await MadiVantaluRepo.create({
      catererName,
      serviceLocations,
      mobile,
      filePath,
      status,
    });

    res.json({ message: "Caterer added successfully", madiVantalu });
  } catch (err) {
    console.error("Error adding caterer:", err);
    res.status(500).json({ error: "Failed to add caterer" });
  }
});

// Update Caterer
router.put("/update/:id", upload.single("filePath"), async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch existing caterer
    const existingCaterer = await MadiVantaluRepo.getById(id);
    if (!existingCaterer) {
      return res.status(404).json({ error: "Caterer not found" });
    }

    // Spread request body and normalize serviceLocations
    const updateData: any = {
      ...req.body,
      serviceLocations: normalizeToArray(req.body.serviceLocations),
    };

    if (req.file) {
      // Delete old file if it exists
      if (existingCaterer.filePath) {
        const oldFilePath = path.join(process.cwd(), existingCaterer.filePath);
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

    const madiVantalu = await MadiVantaluRepo.update(id, updateData);

    res.json({ message: "Caterer updated successfully", madiVantalu });
  } catch (err) {
    console.error("Error updating caterer:", err);
    res.status(500).json({ error: "Failed to update caterer" });
  }
});

// Delete Caterer
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch caterer before deleting
    const caterer = await MadiVantaluRepo.getById(id);
    if (!caterer) {
      return res.status(404).json({ error: "Caterer not found" });
    }

    // Delete file if exists
    if (caterer.filePath) {
      const filePath = path.resolve(caterer.filePath);
      try {
        await fs.unlink(filePath);
        console.log("Deleted caterer file:", filePath);
      } catch (err) {
        console.error("Failed to delete caterer file:", err);
      }
    }

    // Delete DB record
    await MadiVantaluRepo.delete(id);

    res.json({ message: "Caterer and file deleted successfully" });
  } catch (err) {
    console.error("Error deleting caterer:", err);
    res.status(500).json({ error: "Failed to delete caterer" });
  }
});

// Get All Caterers
router.get("/", async (req, res) => {
  try {
    const lists = await MadiVantaluRepo.getAll();
    const madiVantalu = lists.map((list) => {
      const base64File = list.filePath ? fileToBase64(list.filePath) : null;
      return {
        ...(list.toObject?.() ?? list), // handle Mongoose or plain object
        filePath: base64File,
      };
    });
    res.json(madiVantalu);
  } catch (err) {
    console.error("Error fetching caterers:", err);
    res.status(500).json({ error: "Failed to fetch caterers" });
  }
});

// Get One Caterer
router.get("/:id", async (req, res) => {
  try {
    const madiVantalu = await MadiVantaluRepo.getById(req.params.id);
    if (!madiVantalu)
      return res.status(404).json({ error: "Caterer not found" });
    res.json(madiVantalu);
  } catch (err) {
    console.error("Error fetching caterer:", err);
    res.status(500).json({ error: "Failed to fetch caterer" });
  }
});

export default router;
