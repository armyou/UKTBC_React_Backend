import { Router } from "express";
import fs from "fs";

const router = Router();
// Get All Events
router.get("/", async (req, res) => {
  console.log("recived mail request with code" + req.query.code);
  fs.writeFileSync("code.txt", req.query.code as string);
  res.send(
    "Authorization code received. You can close this window and return to the application."
  );
  return true;
});
export default router;
