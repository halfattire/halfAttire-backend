import express from "express";
import {
  createWithdrawRequest,
  getAllWithdrawRequests,
  updateWithdrawRequest,
} from "../controller/withdrawController.js";
import { isSeller, isAuthenticated, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Seller routes
router.post("/create-withdraw-request", isSeller, createWithdrawRequest);

// Admin routes
router.get("/get-all-withdraw-request", isAuthenticated, isAdmin, getAllWithdrawRequests);
router.put("/update-withdraw-request/:id", isAuthenticated, isAdmin, updateWithdrawRequest);

export default router;