import express from "express";
import {
  createNewMessage,
  getAllMessages,
} from "../controller/messageController.js";
import { isAuthenticated } from "../middleware/auth.js";

const messageRouter = express.Router();

// Protected routes with authentication middleware
messageRouter.post(
  "/create-new-message",
  isAuthenticated,
  createNewMessage
);
messageRouter.get("/get-all-messages/:id", isAuthenticated, getAllMessages);

export default messageRouter;