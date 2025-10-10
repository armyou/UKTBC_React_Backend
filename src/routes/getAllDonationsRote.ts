import express from "express";
import { getAllPayments } from "../repos/paymentRepo";

const router = express.Router();

// GET /api/donations - Get all donations
router.get("/getalldonations", async (req, res) => {
  try {
    console.log("Fetching all donations...");

    const donations = await getAllPayments();

    console.log(`Successfully retrieved ${donations.length} donations`);

    res.status(200).json({
      success: true,
      message: "Donations retrieved successfully",
      count: donations.length,
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
