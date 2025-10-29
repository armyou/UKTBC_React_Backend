import { Router } from "express";
import { fileToBase64 } from "../middleware/filetobase64converter";
import path from "path";
import { MadiVantaluRepo } from "../repos/madiVantaluRepo";
import { PurohitRepo } from "../repos/purohitRepo";

const router = Router();

router.get("/latest", async (req, res) => {
  try {
    //  Fetch latest Purohits and MadiVantalu
    const purohits = await PurohitRepo.getLatestPurohit();
    const madiVantalu = await MadiVantaluRepo.getLatestMadivantalu();

    //  Helper to convert local path → public URL
    const buildFileUrl = (filePath?: string) =>
      filePath
        ? `https://${req.get("host")}/files/${path.basename(filePath)}`
        : null;

    //  Format purohits with public URLs
    const updatedPurohits = purohits.map((purohit) => {
      const obj = purohit.toObject?.() ?? purohit;
      return {
        ...obj,
        filePath: buildFileUrl(obj.filePath),
      };
    });

    //  Format madiVantalu with public URLs
    const updatedMadivantalu = madiVantalu.map((item) => {
      const obj = item.toObject?.() ?? item;
      return {
        ...obj,
        filePath: buildFileUrl(obj.filePath),
      };
    });

    //  Send response
    res.json({
      purohits: updatedPurohits,
      madiVantalu: updatedMadivantalu,
    });
  } catch (err) {
    console.error("Error fetching latest purohits and madiVantalu:", err);
    res.status(500).json({ error: "Failed to fetch latest data" });
  }
});
export default router;
