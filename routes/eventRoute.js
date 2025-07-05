import express from "express";
import {
  createEvent,
  getAllShopEvents,
  deleteEvent,
  getAllEvents,
  adminAllEvents,
} from "../controller/eventController.js";
import { isAdmin, isAuthenticated, isSeller } from "../middleware/auth.js";

const eventRouter = express.Router();

// event routes
eventRouter.post("/create-event", createEvent);
eventRouter.get("/get-all-shop-events/:id", getAllShopEvents);
eventRouter.delete("/delete-shop-event/:id", isSeller, deleteEvent);
eventRouter.get("/get-all-events/", getAllEvents);
// Admin routes
eventRouter.get("/admin-all-events", isAuthenticated, isAdmin, adminAllEvents);
export default eventRouter;
