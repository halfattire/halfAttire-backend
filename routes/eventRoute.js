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

// event routes
eventRouter.post("/create-event", isSeller, createEvent);
eventRouter.get("/get-all-shop-events/:id",isSeller, getAllShopEvents);
eventRouter.delete("/delete-shop-event/:id", isSeller, deleteEvent);
eventRouter.get("/get-all-events/", isSeller, getAllEvents);
eventRouter.put("/create-new-review", isSeller,createEventReview);
// Admin routes
eventRouter.get("/admin-all-events", isAdmin, adminAllEvents);
eventRouter.delete("/admin-delete-event/:id", isAdmin, deleteEvent);
export default eventRouter;
