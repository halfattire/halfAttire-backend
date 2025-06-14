import express from "express";
import { isSeller } from "../middleware/auth.js";
import {
  createCoupon,
  getCoupons,
  deleteCoupon,
  getCoupnCode,
} from "../controller/couponCodeController.js";

const couponsCodeRouter = express.Router();

couponsCodeRouter.post("/create-coupon", isSeller, createCoupon);
couponsCodeRouter.get("/get-coupons/:id", isSeller, getCoupons);
couponsCodeRouter.delete("/delete-coupon/:id", isSeller, deleteCoupon);
couponsCodeRouter.get("/get-coupon-value/:name", getCoupnCode);

export default couponsCodeRouter;
