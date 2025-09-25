import { Router } from "express";
import { fileToBase64 } from "../middleware/filetobase64converter.ts";
import { MadiVantaluRepo } from "../repos/madiVantaluRepo.ts";
import { PurohitRepo } from "../repos/purohitRepo.ts";

const router = Router();

router.get("/latest", async (req, res) => {
  // getLatestPurohit
  // getLatestMadivantalu
  try {
    const purohits = await PurohitRepo.getLatestPurohit();
    const madiVantalu = await MadiVantaluRepo.getLatestMadivantalu();

    const updatedPurohits = purohits.map((purohit) => {
      const base64File = purohit.filePath
        ? fileToBase64(purohit.filePath)
        : null;
      return {
        ...(purohit.toObject?.() ?? purohit), // handle Mongoose or plain object
        filePath: base64File,
      };
    });
    const updatedMadivantalu = madiVantalu.map((item) => {
      const base64File = item.filePath ? fileToBase64(item.filePath) : null;
      return {
        ...(item.toObject?.() ?? item), // handle Mongoose or plain object
        filePath: base64File,
      };
    });

    res.json({
      purohits: updatedPurohits,
      madiVantalu: updatedMadivantalu,
    });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});
export default router;
