import express from "express";
import {
  createWithdrawRequest,
  getSellerWithdraws,
  getAllWithdrawRequests,
  updateWithdrawRequest,
  getWithdrawStats,
} from "../controller/withdrawController.js";
import { isSeller, isAuthenticated, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// TEMPORARY - ALL AUTH MIDDLEWARE REMOVED FOR TESTING
// Seller routes
router.post("/create-withdraw-request", createWithdrawRequest);
router.get("/get-seller-withdraws", getSellerWithdraws);

// Admin routes - TEMPORARILY ACCESSIBLE WITHOUT AUTH
router.get("/get-all-withdraw-request", getAllWithdrawRequests);
router.put("/update-withdraw-request/:id", updateWithdrawRequest);
router.get("/get-withdraw-stats", getWithdrawStats);

export default router;