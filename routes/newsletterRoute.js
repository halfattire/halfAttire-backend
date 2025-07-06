import express from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
  sendNewsletter,
} from "../controller/newsletterController.js";
import { isAuthenticated, isAdmin } from "../middleware/auth.js";

const newsletterRouter = express.Router();

// Public routes
newsletterRouter.post("/subscribe", subscribeNewsletter);
newsletterRouter.post("/unsubscribe", unsubscribeNewsletter);

// Admin routes
newsletterRouter.get("/subscribers", isAuthenticated, isAdmin, getAllSubscribers);
newsletterRouter.post("/send", isAuthenticated, isAdmin, sendNewsletter);

export default newsletterRouter;
