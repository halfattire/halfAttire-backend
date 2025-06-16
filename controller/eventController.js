import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import eventModel from "../model/eventModel.js";
import shopModel from "../model/shopModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import fs from "fs";
import path from "path";
import { promisify } from "util";
const unlinkAsync = promisify(fs.unlink);

// create event
export const createEvent = catchAsyncErrors(async (req, res, next) => {
  try {
    const { shopId } = req.body;
    // console.log("Received Shop ID:", shopId);
    const shop = await shopModel.findById(shopId);

    if (!shop) {
      return next(new ErrorHandler("Invalid shop Id", 400));
    }

    const files = req.files;
    const imageUrls = files.map((file) => `${file.filename}`);

    const eventData = {
      ...req.body,
      images: imageUrls,
      shop: shop._id,
    };

    // console.log(eventData);

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

    // console.log(`Attempting to delete event with ID: ${eventId}`);

    const event = await eventModel.findById(eventId);

    if (!event) {
      return next(new ErrorHandler("Event not found", 400));
    }

    // Delete associated images from uploads folder
    const uploadsDir = path.join(process.cwd(), "uploads");

    if (fs.existsSync(uploadsDir)) {
      if (event.images && event.images.length > 0) {
        for (const image of event.images) {
          const filePath = path.join(uploadsDir, image);
          console.log(`Checking file: ${filePath}`);
          if (fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
          } else {
            console.log(`File not found: ${filePath}`);
          }
        }
      } else {
        console.log("No images to delete for this event");
      }
    } else {
      console.log("Uploads directory does not exist");
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
    const events = await eventModel.find();
    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 404));
  }
});

// Get all events (Admin)
export const adminAllEvents = catchAsyncErrors(async (req, res, next) => {
  try {
    const events = await eventModel.find().sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
