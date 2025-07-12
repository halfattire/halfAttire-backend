import express from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
  sendNewsletter,
} from "../controller/newsletterController.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.js";

const newsletterRouter = express.Router();

// Public routes
newsletterRouter.post("/subscribe", subscribeNewsletter);
newsletterRouter.post("/unsubscribe", unsubscribeNewsletter);

// Admin routes - require authentication first, then admin privileges
newsletterRouter.get("/subscribers", isAuthenticated, isAdmin, getAllSubscribers);
newsletterRouter.post("/send", isAuthenticated, isAdmin, sendNewsletter);

export default newsletterRouter;
