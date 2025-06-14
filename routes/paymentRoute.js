import express from "express";
import { processPayment, stripeApiKey } from "../controller/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/process", processPayment);
paymentRouter.get("/stripeapikey", stripeApiKey);

export default paymentRouter;