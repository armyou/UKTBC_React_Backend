import { Router } from "express";
import { fileToBase64 } from "../middleware/filetobase64converter";
import { ResourceRepo } from "../repos/resourceRepo";

const router = Router();
// Get All Events
router.get("/", async (req, res) => {
  console.log('recived mail request and response is'+res.json);
  return true;
});
export default router;
