import express from "express";
import {
  createEvent,
  getAllShopEvents,
  deleteEvent,
  getAllEvents,
  adminAllEvents,
  createEventReview,
} from "../controller/eventController.js";
import { isAdmin, isAuthenticated, isSeller } from "../middleware/auth.js";

const eventRouter = express.Router();

// TEMPORARY - ALL AUTH MIDDLEWARE REMOVED FOR TESTING
eventRouter.post("/create-event", createEvent);
eventRouter.get("/get-all-shop-events/:id", getAllShopEvents);
eventRouter.delete("/delete-shop-event/:id", deleteEvent);
eventRouter.get("/get-all-events/", getAllEvents);
eventRouter.put("/create-new-review", createEventReview);
// Admin routes - TEMPORARILY ACCESSIBLE WITHOUT AUTH
eventRouter.get("/admin-all-events", adminAllEvents);
eventRouter.delete("/admin-delete-event/:id", deleteEvent);
export default eventRouter;
