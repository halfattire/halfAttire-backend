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

// Seller routes
router.post("/create-withdraw-request", isSeller, createWithdrawRequest);
router.get("/get-seller-withdraws", isSeller, getSellerWithdraws);

// Admin routes
router.get("/get-all-withdraw-request",  isAdmin, getAllWithdrawRequests);
router.put("/update-withdraw-request/:id",  isAdmin, updateWithdrawRequest);
router.get("/get-withdraw-stats",  isAdmin, getWithdrawStats);

export default router;