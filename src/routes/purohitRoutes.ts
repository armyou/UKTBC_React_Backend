import { Router } from "express";
import { PurohitRepo } from "../repos/purohitRepo";
import upload from "../middleware/upload";

const router = Router();

// Add Purohit
router.post("/add", upload.single("file"), async (req, res) => {
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
    await PurohitRepo.delete(id);
    res.json({ message: "Purohit deleted successfully" });
  } catch (err) {
    console.error("Error deleting purohit:", err);
    res.status(500).json({ error: "Failed to delete purohit" });
  }
});

// Get All Purohits
router.get("/", async (req, res) => {
  try {
    const list = await PurohitRepo.getAll();
    res.json(list);
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
