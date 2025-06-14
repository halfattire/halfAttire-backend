import express from "express"
import { createEvent, deleteEvent, getAllEvents, getAllShopEvents } from "../controller/eventController.js"
import { isSeller } from "../middleware/auth.js"

const router = express.Router()

router.post("/create-event", isSeller, createEvent)
router.get("/get-all-shop-events/:id", getAllShopEvents)
router.delete("/delete-shop-event/:id", isSeller, deleteEvent)
router.get("/get-all-events", getAllEvents)

export default router
