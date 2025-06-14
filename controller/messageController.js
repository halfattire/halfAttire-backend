import catchAsyncErrors from "../middleware/catchAsyncErrors.js"
import messageModel from "../model/messagesModel.js"
import ErrorHandler from "../utils/ErrorHandler.js"
import { cloudinary, isCloudinaryConfigured } from "../server.js"

// Modified to use Cloudinary instead of multer
export const createNewMessage = catchAsyncErrors(async (req, res, next) => {
  try {
    const { conversationId, sender, text, images } = req.body

    if (!conversationId || !sender) {
      return next(new ErrorHandler("Conversation ID and sender are required", 400))
    }

    let imageUrls = []

    // Upload images to Cloudinary if provided
    if (images && Array.isArray(images) && images.length > 0) {
      // Check if Cloudinary is configured
      if (!isCloudinaryConfigured()) {
        return next(new ErrorHandler("Image upload service not configured", 503))
      }

      try {
        console.log(`Uploading ${images.length} message images to Cloudinary...`)
        
        for (const image of images) {
          const result = await cloudinary.uploader.upload(image, {
            folder: "messages",
            quality: "auto",
          })
          imageUrls.push(result.secure_url)
        }
        
        console.log(`Successfully uploaded ${imageUrls.length} message images`)
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError)
        return next(new ErrorHandler(`Failed to upload message images: ${uploadError.message}`, 500))
      }
    }

    const message = new messageModel({
      conversationId,
      text,
      sender,
      images: imageUrls.length > 0 ? imageUrls : undefined,
    })

    await message.save()

    res.status(201).json({
      success: true,
      message,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

// get all messages with conversation id
export const getAllMessages = catchAsyncErrors(async (req, res, next) => {
  try {
    const messages = await messageModel.find({
      conversationId: req.params.id,
    })

    res.status(201).json({
      success: true,
      messages,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})
