import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import eventModel from "../model/eventModel.js";
import shopModel from "../model/shopModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { cloudinary, isCloudinaryConfigured } from "../server.js";

// create event
export const createEvent = catchAsyncErrors(async (req, res, next) => {
  try {
    const { shopId, images } = req.body;
    const shop = await shopModel.findById(shopId);

    if (!shop) {
      return next(new ErrorHandler("Invalid shop Id", 400));
    }

    let imageUrls = [];

    // Handle image uploads to Cloudinary
    if (images && images.length > 0 && isCloudinaryConfigured()) {
      try {
        const uploadPromises = images.map(async (image) => {
          const result = await cloudinary.uploader.upload(image, {
            folder: "events",
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

    const eventData = {
      ...req.body,
      images: imageUrls,
      shopId: shop._id,
      shop: {
        _id: shop._id,
        name: shop.name,
        email: shop.email,
        address: shop.address,
        avatar: shop.avatar
      },
    };

    const event = await eventModel.create(eventData);

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get all shop events
export const getAllShopEvents = catchAsyncErrors(async (req, res, next) => {
  try {
    const events = await eventModel.find({ shopId: req.params.id });
    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});







export const deleteEvent = catchAsyncErrors(async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const event = await eventModel.findById(eventId);

    if (!event) {
      return next(new ErrorHandler("Event not found", 400));
    }

    // Delete the event from the database
    const deletedEvent = await eventModel.findByIdAndDelete(eventId);
    if (!deletedEvent) {
      throw new Error("Failed to delete event from database");
    }

    // console.log(`Event ${eventId} deleted from database`);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error(`Error in deleteEvent: ${error.message}`, error.stack);
    return next(new ErrorHandler(`Failed to delete event: ${error.message}`, 400));
  }
});







// get all events
export const getAllEvents = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log("getAllEvents: Starting request...");
    const events = await eventModel.find().sort({ createdAt: -1 });
    console.log(`getAllEvents: Found ${events.length} events`);
    
    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("getAllEvents: Error occurred:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all events (Admin)
export const adminAllEvents = catchAsyncErrors(async (req, res, next) => {
  try {
    // Get all events, populate shop data from shopId, and sort by creation date
    const events = await eventModel
      .find()
      .populate('shopId', 'name email address avatar')
      .sort({ createdAt: -1 });
    
    // Process events to ensure shop data is consistently structured
    const eventsWithShopNames = events.map((event) => {
      const eventObj = event.toObject();
      
      // If populate worked, use the populated shop data
      if (eventObj.shopId && eventObj.shopId.name) {
        eventObj.shop = {
          _id: eventObj.shopId._id,
          name: eventObj.shopId.name,
          email: eventObj.shopId.email,
          address: eventObj.shopId.address,
          avatar: eventObj.shopId.avatar
        };
      }
      // If shop name already exists in shop object, keep it
      else if (eventObj.shop && eventObj.shop.name) {
        // Shop data is already good
      }
      // Fallback: try to find shop manually
      else {
        eventObj.shop = {
          _id: eventObj.shopId || "unknown",
          name: eventObj.shop?.name || `Shop ${(eventObj.shopId || "unknown").toString().slice(-6)}`,
          email: eventObj.shop?.email || "unknown@shop.com",
          address: eventObj.shop?.address || "Unknown Address"
        };
      }
      
      return eventObj;
    });
    
    res.status(200).json({
      success: true,
      events: eventsWithShopNames,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
