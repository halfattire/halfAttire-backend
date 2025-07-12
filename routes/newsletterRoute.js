import express from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
  sendNewsletter,
} from "../controller/newsletterController.js";
import {isAdmin } from "../middleware/auth.js";

const newsletterRouter = express.Router();

// Public routes
newsletterRouter.post("/subscribe", subscribeNewsletter);
newsletterRouter.post("/unsubscribe", unsubscribeNewsletter);

// Admin routes
newsletterRouter.get("/subscribers", isAdmin, getAllSubscribers);
newsletterRouter.post("/send",isAdmin, sendNewsletter);

export default newsletterRouter;
