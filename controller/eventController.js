import catchAsyncErrors from "../middleware/catchAsyncErrors.js"
import eventModel from "../model/eventModel.js"
import shopModel from "../model/shopModel.js"
import ErrorHandler from "../utils/ErrorHandler.js"
import { cloudinary, isCloudinaryConfigured } from "../server.js"

// Modified to use Cloudinary instead of multer
export const createEvent = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log("Create event request body:", req.body)
    const { shopId, images } = req.body

    const shop = await shopModel.findById(shopId)

    if (!shop) {
      return next(new ErrorHandler("Invalid shop Id", 400))
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return next(new ErrorHandler("Image upload service not configured", 503))
    }

    // Check if images are provided
    if (!images || !Array.isArray(images) || images.length === 0) {
      return next(new ErrorHandler("Event images are required", 400))
    }

    // Upload images to Cloudinary
    const imageUrls = []
    try {
      console.log(`Uploading ${images.length} event images to Cloudinary...`)

      for (const image of images) {
        const result = await cloudinary.uploader.upload(image, {
          folder: "events",
          width: 800,
          crop: "scale",
          quality: "auto",
        })
        imageUrls.push(result.secure_url)
      }

      console.log(`Successfully uploaded ${imageUrls.length} event images`)
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError)
      return next(new ErrorHandler(`Failed to upload event images: ${uploadError.message}`, 500))
    }

    const eventData = {
      ...req.body,
      images: imageUrls,
      shop: shop._id,
    }

    console.log("Creating event with data:", eventData)
    const event = await eventModel.create(eventData)
    console.log("Event created successfully:", event._id)

    res.status(201).json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Event creation error:", error)
    return next(new ErrorHandler(error.message, 400))
  }
})

// get all shop events
export const getAllShopEvents = catchAsyncErrors(async (req, res, next) => {
  try {
    const events = await eventModel.find({ shopId: req.params.id })
    res.status(200).json({
      success: true,
      events,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// delete event route
export const deleteEvent = catchAsyncErrors(async (req, res, next) => {
  try {
    const eventId = req.params.id
    const event = await eventModel.findById(eventId)

    if (!event) {
      return next(new ErrorHandler("Event not found", 400))
    }

    // Delete event images from Cloudinary if they exist
    if (event.images && event.images.length > 0) {
      for (const imageUrl of event.images) {
        if (imageUrl && imageUrl.includes("cloudinary.com")) {
          try {
            // Extract public_id from URL
            const urlParts = imageUrl.split("/")
            const publicIdWithExtension = urlParts[urlParts.length - 1]
            const publicId = `events/${publicIdWithExtension.split(".")[0]}`

            console.log("Deleting event image with public_id:", publicId)
            await cloudinary.uploader.destroy(publicId)
          } catch (deleteError) {
            console.log("Could not delete event image (continuing anyway):", deleteError.message)
            // Don't fail the request if image deletion fails
          }
        }
      }
    }

    await eventModel.findByIdAndDelete(eventId)

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// get all events
export const getAllEvents = catchAsyncErrors(async (req, res, next) => {
  try {
    const events = await eventModel.find()
    res.status(200).json({
      success: true,
      events,
    })
  } catch (error) {
    return next(new ErrorHandler(error, 404))
  }
})
