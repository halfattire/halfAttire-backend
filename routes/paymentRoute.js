import express from "express";
import { 
  processDirectCardPayment, 
  getAdminCardInfo, 
  verifyAdminCard, 
  processRefund,
  stripeApiKey 
} from "../controller/paymentController.js";

const paymentRouter = express.Router();

// Direct card payment routes
paymentRouter.post("/process-direct", processDirectCardPayment);
paymentRouter.get("/admin-card-info", getAdminCardInfo);
paymentRouter.post("/verify-admin-card", verifyAdminCard);
paymentRouter.post("/refund", processRefund);

// Legacy route for backward compatibility
paymentRouter.get("/stripeapikey", stripeApiKey);

export default paymentRouter;