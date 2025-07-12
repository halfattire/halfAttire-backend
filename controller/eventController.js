import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import eventModel from "../model/eventModel.js";
import shopModel from "../model/shopModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { cloudinary, isCloudinaryConfigured } from "../server.js";

// create event
export const createEvent = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log("Create event request body:", req.body);
    const { shopId, images, name, description, category, discountPrice, stock, start_Date, finish_Date } = req.body;
    
    // Validate required fields
    if (!shopId) {
      return next(new ErrorHandler("Shop ID is required", 400));
    }
    
    if (!name) {
      return next(new ErrorHandler("Event name is required", 400));
    }
    
    if (!description) {
      return next(new ErrorHandler("Event description is required", 400));
    }
    
    if (!category) {
      return next(new ErrorHandler("Event category is required", 400));
    }
    
    if (!discountPrice) {
      return next(new ErrorHandler("Event price is required", 400));
    }
    
    if (!stock) {
      return next(new ErrorHandler("Event stock is required", 400));
    }
    
    if (!start_Date) {
      return next(new ErrorHandler("Event start date is required", 400));
    }
    
    if (!finish_Date) {
      return next(new ErrorHandler("Event finish date is required", 400));
    }
    
    const shop = await shopModel.findById(shopId);

    if (!shop) {
      return next(new ErrorHandler("Invalid shop Id", 400));
    }

    let imageUrls = [];

    // Handle image uploads to Cloudinary or use base64 images
    if (images && images.length > 0) {
      if (isCloudinaryConfigured()) {
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
      } else {
        // If Cloudinary is not configured, use the base64 images directly
        imageUrls = images;
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

// Create new review for event
export const createEventReview = catchAsyncErrors(async (req, res, next) => {
  try {
    const { rating, comment, productId } = req.body;
    const user = req.user;

    if (!rating || rating < 1 || rating > 5) {
      return next(new ErrorHandler("Rating must be between 1 and 5", 400));
    }

    if (!comment || comment.trim() === "") {
      return next(new ErrorHandler("Comment is required", 400));
    }

    if (!productId) {
      return next(new ErrorHandler("Event ID is required", 400));
    }

    const event = await eventModel.findById(productId);

    if (!event) {
      return next(new ErrorHandler("Event not found", 404));
    }

    const review = {
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      },
      rating: Number(rating),
      comment: comment.trim(),
      productId,
      createdAt: new Date(),
    };

    const isReviewed = event.reviews.find(
      (rev) => rev.user._id.toString() === user._id.toString()
    );

    if (isReviewed) {
      // Update existing review
      event.reviews.forEach((rev) => {
        if (rev.user._id.toString() === user._id.toString()) {
          rev.rating = Number(rating);
          rev.comment = comment.trim();
          rev.createdAt = new Date();
        }
      });
    } else {
      // Add new review
      event.reviews.push(review);
    }

    // Calculate average rating
    let avg = 0;
    event.reviews.forEach((rev) => {
      avg += rev.rating;
    });
    event.ratings = avg / event.reviews.length;

    await event.save();

    res.status(200).json({
      success: true,
      message: "Review added successfully!",
      event,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
