import { Router } from "express";
import { VipravaniRepo } from "../repos/vipravaniRepo";
import upload from "../middleware/upload";

const router = Router();

// Add Vipravani
router.post("/add", upload.single("file"), async (req, res) => {
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
router.put("/update/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (req.file) {
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
    await VipravaniRepo.delete(id);
    res.json({ message: "Vipravani deleted successfully" });
  } catch (err) {
    console.error("Error deleting vipravani:", err);
    res.status(500).json({ error: "Failed to delete vipravani" });
  }
});

// Get All Vipravani
router.get("/", async (req, res) => {
  try {
    const vipravaniList = await VipravaniRepo.getAll();
    res.json(vipravaniList);
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
