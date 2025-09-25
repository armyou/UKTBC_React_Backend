import { Router } from "express";
import { FooterRepo } from "../repos/footerRepo";

const router = Router();

router.put("/counter", async (req, res) => {
  try {
    const incrementBy = 1;
    const status = 1;
    const updatedCount = await FooterRepo.incrementCount(incrementBy, status);

    res.json({
      message: "Count updated successfully",
      count: updatedCount?.count,
      data: updatedCount,
    });
  } catch (err: any) {
    console.error("Error updating count:", err);
    res.status(500).json({ error: "Failed to update count" });
  }
});

export default router;
