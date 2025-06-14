import express from "express";
import {
  createNewMessage,
  getAllMessages,
} from "../controller/messageController.js";

const messageRouter = express.Router();

messageRouter.post("/create-new-message", createNewMessage);
messageRouter.get("/get-all-messages/:id", getAllMessages);

export default messageRouter;
