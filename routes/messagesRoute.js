import express from "express";
import {
  createNewMessage,
  getAllMessages,
} from "../controller/messageController.js";
import multer from "multer";

// image upload engine
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const messageRouter = express.Router();

messageRouter.post(
  "/create-new-message",
  upload.array("images"),
  createNewMessage
);
messageRouter.get("/get-all-messages/:id", getAllMessages);

export default messageRouter;
