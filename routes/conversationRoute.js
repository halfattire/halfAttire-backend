import express from "express";
import {
  createNewConversation,
  getAllSellerConversation,
  getAllUserConversation,
  updateLastMessage,
} from "../controller/conversationController.js";
import { isAuthenticated, isSeller } from "../middleware/auth.js";

const conversationRouter = express.Router();

// TEMPORARY - ALL AUTH MIDDLEWARE REMOVED FOR TESTING
conversationRouter.post("/create-new-conversation", createNewConversation);
conversationRouter.get(
  "/get-all-conversation-seller/:id",
  getAllSellerConversation
);
conversationRouter.get(
  "/get-all-conversation-user/:id",
  getAllUserConversation
);
conversationRouter.put("/update-last-message/:id", updateLastMessage);

export default conversationRouter;
