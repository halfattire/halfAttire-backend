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

// Protected routes with authentication middleware
// Seller routes
router.post("/create-withdraw-request", isSeller, createWithdrawRequest);
router.get("/get-seller-withdraws", isSeller, getSellerWithdraws);

// Admin routes with authentication
router.get("/get-all-withdraw-request", isAuthenticated, isAdmin, getAllWithdrawRequests);
router.put("/update-withdraw-request/:id", isAuthenticated, isAdmin, updateWithdrawRequest);
router.get("/get-withdraw-stats", isAuthenticated, isAdmin, getWithdrawStats);

export default router;