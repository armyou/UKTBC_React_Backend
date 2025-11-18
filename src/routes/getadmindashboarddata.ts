// total donation amount
// total number of donors
// present month donation amount
// recent 5 donations
import express from "express";
import { getDonationStats } from "../repos/paymentRepo";

const router = express.Router();

router.get("/getdashboarddata", async (req, res) => {
  try {
    console.log("Fetching all donations...");

    const donations = await getDonationStats();

    res.status(200).json({
      success: true,
      message: "Donations retrieved successfully",
      data: donations,
    });
  } catch (error: any) {
    console.error("Error fetching donations:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch donations",
      error: error.message,
    });
  }
});
export default router;
