import mongoose from "mongoose";

const messagesSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
    },
    text: {
      type: String,
    },
    sender: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

const messageModel = mongoose.model("messages", messagesSchema);
export default messageModel;
