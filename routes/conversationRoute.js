import express from "express";
import {
  createNewConversation,
  getAllSellerConversation,
  getAllUserConversation,
  updateLastMessage,
} from "../controller/conversationController.js";
import { isAuthenticated, isSeller } from "../middleware/auth.js";

const conversationRouter = express.Router();

// Protected routes with authentication middleware
conversationRouter.post("/create-new-conversation", isAuthenticated, createNewConversation);
conversationRouter.get(
  "/get-all-conversation-seller/:id",
  isSeller,
  getAllSellerConversation
);
conversationRouter.get(
  "/get-all-conversation-user/:id",
  isAuthenticated,
  getAllUserConversation
);
conversationRouter.put("/update-last-message/:id", isAuthenticated, updateLastMessage);

export default conversationRouter;
