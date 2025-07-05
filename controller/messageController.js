import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import messageModel from "../model/messagesModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { cloudinary, isCloudinaryConfigured } from "../server.js";

export const createNewMessage = catchAsyncErrors(async (req, res, next) => {
  try {
    const { conversationId, sender, text, images } = req.body;

    let imageUrls = [];

    // Handle image uploads to Cloudinary
    if (images && images.length > 0 && isCloudinaryConfigured()) {
      try {
        const uploadPromises = images.map(async (image) => {
          const result = await cloudinary.uploader.upload(image, {
            folder: "messages",
            resource_type: "auto",
            quality: "auto",
            fetch_format: "auto",
          });
          return result.secure_url;
        });
        
        imageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return next(new ErrorHandler("Failed to upload images", 500));
      }
    }

    const message = new messageModel({
      conversationId,
      text,
      sender,
      images: imageUrls.length > 0 ? imageUrls : undefined,
    });

    await message.save();

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
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
