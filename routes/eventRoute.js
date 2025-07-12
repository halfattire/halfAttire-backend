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

// Protected routes with authentication middleware
eventRouter.post("/create-event", isSeller, createEvent);
eventRouter.get("/get-all-shop-events/:id", getAllShopEvents);
eventRouter.delete("/delete-shop-event/:id", isSeller, deleteEvent);
eventRouter.get("/get-all-events/", getAllEvents);
eventRouter.put("/create-new-review", isAuthenticated, createEventReview);
// Admin routes with authentication
eventRouter.get("/admin-all-events", isAuthenticated, isAdmin, adminAllEvents);
eventRouter.delete("/admin-delete-event/:id", isAuthenticated, isAdmin, deleteEvent);
export default eventRouter;
