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

// Protected routes with authentication middleware
orderRouter.post("/create-order", isAuthenticated, createOrder);
orderRouter.get("/get-all-orders/:userId", isAuthenticated, getAllUserOrders);
orderRouter.get("/get-seller-all-orders/:shopId", isSeller, getAllSellerOrders);
orderRouter.put("/update-order-status/:id", isSeller, updateOrderStatus);
orderRouter.put("/order-refund/:id", isAuthenticated, orderRefund);
orderRouter.put("/order-refund-success/:id", isSeller, shopRefundOrders);
// Admin routes with authentication
orderRouter.get("/admin-all-orders", isAuthenticated, isAdmin, adminAllOrders);
orderRouter.get("/admin/order/:id", isAuthenticated, isAdmin, adminOrderDetails)
orderRouter.put("/admin/order/:id", isAuthenticated, isAdmin, adminUpdateOrderStatus)

export default orderRouter;
