import express from "express";
import {
  createOrder,
  getAllUserOrders,
  getAllSellerOrders,
  updateOrderStatus,
  orderRefund,shopRefundOrders,
  adminAllOrders,
  adminOrderDetails,
  adminUpdateOrderStatus
} from "../controller/orderController.js";
import { isAdmin, isAuthenticated, isSeller } from "../middleware/auth.js";

const orderRouter = express.Router();

// TEMPORARY - ALL AUTH MIDDLEWARE REMOVED FOR TESTING
orderRouter.post("/create-order", createOrder);
orderRouter.get("/get-all-orders/:userId", getAllUserOrders);
orderRouter.get("/get-seller-all-orders/:shopId", getAllSellerOrders);
orderRouter.put("/update-order-status/:id", updateOrderStatus);
orderRouter.put("/order-refund/:id", orderRefund);
orderRouter.put("/order-refund-success/:id", shopRefundOrders);
// Admin routes - TEMPORARILY ACCESSIBLE WITHOUT AUTH
orderRouter.get("/admin-all-orders", adminAllOrders);
orderRouter.get("/admin/order/:id", adminOrderDetails)
orderRouter.put("/admin/order/:id", adminUpdateOrderStatus)

export default orderRouter;
