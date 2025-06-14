import express from "express";
import {
  createOrder,
  getAllUserOrders,
  getAllSellerOrders,
  updateOrderStatus,
  orderRefund,shopRefundOrders
} from "../controller/orderController.js";
import { isSeller } from "../middleware/auth.js";

const orderRouter = express.Router();

orderRouter.post("/create-order", createOrder);
orderRouter.get("/get-all-orders/:userId", getAllUserOrders);
orderRouter.get("/get-seller-all-orders/:shopId", getAllSellerOrders);
orderRouter.put("/update-order-status/:id", isSeller, updateOrderStatus);
orderRouter.put("/order-refund/:id", orderRefund);
orderRouter.put("/order-refund-success/:id", isSeller,shopRefundOrders);

export default orderRouter;
