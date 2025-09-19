import { Router } from "express";
import { MadiVantaluRepo } from "../repos/madiVantaluRepo";
import upload from "../middleware/upload";

const router = Router();

// Add Caterer
router.post("/add", upload.single("file"), async (req, res) => {
  try {
    const { catererName, serviceLocations, mobile, status } = req.body;
    const filePath = req.file ? req.file.path : "";

    const madiVantalu = await MadiVantaluRepo.create({
      catererName,
      serviceLocations: Array.isArray(serviceLocations)
        ? serviceLocations
        : serviceLocations.split(",").map((s: string) => s.trim()),
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
router.put("/update/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (updateData.serviceLocations) {
      updateData.serviceLocations = Array.isArray(updateData.serviceLocations)
        ? updateData.serviceLocations
        : updateData.serviceLocations.split(",").map((s: string) => s.trim());
    }

    if (req.file) {
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
    await MadiVantaluRepo.delete(id);
    res.json({ message: "Caterer deleted successfully" });
  } catch (err) {
    console.error("Error deleting caterer:", err);
    res.status(500).json({ error: "Failed to delete caterer" });
  }
});

// Get All Caterers
router.get("/", async (req, res) => {
  try {
    const list = await MadiVantaluRepo.getAll();
    res.json(list);
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
