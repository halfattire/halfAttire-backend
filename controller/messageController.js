import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import messageModel from "../model/messagesModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";

export const createNewMessage = catchAsyncErrors(async (req, res, next) => {
  try {
    const messageData = req.body;

    if (req.files) {
      const files = req.files;
      const imageUrls = files.map((file) => `${file.fileName}`);

      messageData.images = imageUrls;
    }

    messageData.conversationId = req.body.conversationId;
    messageData.sender = req.body.sender;
    messageData.text = req.body.text;

    const message = new messageModel({
      conversationId: messageData.conversationId,
      text: messageData.text,
      sender: messageData.sender,
      images: messageData.images ? messageData.images : undefined,
    });

    await message.save();

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message), 500);
  }
});

// get all messages with conversation id
export const getAllMessages = catchAsyncErrors(async (req, res, next) => {
  try {
    const messages = await messageModel.find({
      conversationId: req.params.id,
    });

    res.status(201).json({
      success: true,
      messages,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message), 500);
  }
});
