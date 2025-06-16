import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import shopModel from "../model/shopModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import sendMail from "../utils/sendMail.js";
import jwt from "jsonwebtoken";
import sendShopToken from "../utils/ShopToken.js";
import path from "path";
import fs from "fs";  


// Modified to fix the token issue
export const createShop = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber, address, zipCode } = req.body

    // Check if user with the provided email already exists
    const shopEmail = await shopModel.findOne({ email })
    if (shopEmail) {
      return next(new ErrorHandler("User already exists", 400))
    }

    // Check if file is provided
    if (!req.file) {
      return next(new ErrorHandler("Avatar file is required", 400))
    }

    const image_filename = `${req.file.filename}`
    const seller = {
      name,
      email,
      password,
      phoneNumber,
      address,
      zipCode,
      avatar: image_filename,
    }

    const activationToken = createActivationToken(seller)

    const activationUrl = `http://localhost:3000/seller/activation/${activationToken}`

    try {
      await sendMail({
        email: seller.email,
        subject: "Activate your Shop",
        message: `Hello ${seller.name}, please click on the link to activate your shop ${activationUrl}`,
      })
      res.status(200).json({
        success: true,
        message: `please check your email:- ${seller.email} to activate your shop`,
      })
    } catch (error) {
      return next(new ErrorHandler(error.message, 500))
    }
  } catch (error) {
    console.error("Create Shop Error:", error)
    next(new ErrorHandler("Error creating shop: " + error.message, 400))
  }
})

// create activationtoken
const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  })
}

// activate shop - FIXED with better error handling
export const activateSellerShop = catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body
    if (!activation_token) {
      console.error("No activation token provided")
      return next(new ErrorHandler("Activation token is required", 400))
    }

    let seller
    try {
      seller = jwt.verify(activation_token, process.env.ACTIVATION_SECRET)
    } catch (jwtError) {
      console.error("JWT Verification Error:", jwtError.message)
      return next(new ErrorHandler("Invalid or expired activation token", 400))
    }

    if (!seller) {
      console.error("Invalid token - no seller data")
      return next(new ErrorHandler("Invalid Token", 400))
    }

    const { name, email, password, avatar, zipCode, address, phoneNumber } = seller

    // Check if seller already exists
    const existingSeller = await shopModel.findOne({ email })
    if (existingSeller) {
      return next(new ErrorHandler("Seller already exists", 400))
    }

    try {
      // Create the new seller with all required fields
      const newSeller = new shopModel({
        name,
        email,
        password,
        phoneNumber,
        address,
        zipCode,
        avatar,
        role: "seller",
      })

      // Save the seller to the database
      await newSeller.save()
      // Send the token
      sendShopToken(newSeller, 201, res)
    } catch (dbError) {
      console.error("Database Error:", dbError)
      return next(new ErrorHandler(`Error saving seller: ${dbError.message}`, 500))
    }
  } catch (error) {
    console.error("Activation Error:", error.message)
    return next(new ErrorHandler(error.message, 500))
  }
})




// shop login
export const shopLogin = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(new ErrorHandler("Please provide all fields!", 400))
    }

    // Find the shop with email and include the password field
    const shop = await shopModel.findOne({ email }).select("+password")

    if (!shop) {
      return next(new ErrorHandler("Shop doesn't exist!", 400))
    }

    // Compare passwords
    const isPasswordValid = await shop.comparePassword(password)

    if (!isPasswordValid) {
      return next(new ErrorHandler("Please provide the correct information", 400))
    }

    // Generate token directly
    const token = shop.getJwtToken()

    // Set cookie options
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax", // Changed from "none" to "lax" for local development
      secure: process.env.NODE_ENV === "production", // Only secure in production
    }


    // Set cookie and send response
    res.status(200).cookie("seller_token", token, options).json({
      success: true,
      shop,
      token,
    })
  } catch (error) {
    console.error("Shop Login Error:", error)
    return next(new ErrorHandler(error.message, 500))
  }
})


export const loadShop = catchAsyncErrors(async (req, res, next) => {
  try {
    const seller = await shopModel.findById(req.seller.id);

    if (!seller) {
      return next(new ErrorHandler("Shop not found", 400));
    }

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// logout from shop
export const logout = catchAsyncErrors(async (req, res, next) => {
  try {
    // Set cookie options to match the ones used when setting the cookie
    const options = {
      expires: new Date(0), // Set to epoch time (1970) to ensure immediate expiration
      httpOnly: true,
      sameSite: "lax", // Match the setting used when creating the cookie
      secure: process.env.NODE_ENV === "production", // Only secure in production
      path: "/", // Ensure the cookie path matches
    }
    // Clear the seller_token cookie
    res.cookie("seller_token", null, options)

    // Also clear any localStorage items in the client
    res.status(200).json({
      success: true,
      message: "Logout Successful!",
    })
  } catch (error) {
    console.error("Shop logout error:", error)
    return next(new ErrorHandler(error.message, 500))
  }
})




// get shop info
export const getShopInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const shop = await shopModel.findById(req.params.id);
    res.status(201).json({
      success: true,
      shop,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update shop avatar
export const updateShopAvatar = catchAsyncErrors(async (req, res, next) => {
  try {
    const existSeller = await shopModel.findById(req.seller._id);

    if (!existSeller) {
      return next(new ErrorHandler("User not found!", 404));
    }

    const existAvatarPath = path.join("uploads", existSeller.avatar);

    // Remove existing avatar if it exists
    if (fs.existsSync(existAvatarPath)) {
      fs.unlinkSync(existAvatarPath);
    }

    const fileUrl = req.file.filename;

    existSeller.avatar = fileUrl;
    await existSeller.save();

    res.status(200).json({
      success: true,
      seller: existSeller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update seller info
export const updateSellerInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, description, address, phoneNumber, zipCode } = req.body;

    const shop = await shopModel.findOne(req.seller._id);

    if (!shop) {
      return next(new ErrorHandler("User not found", 400));
    }

    shop.name = name;
    shop.description = description;
    shop.address = address;
    shop.phoneNumber = phoneNumber;
    shop.zipCode = zipCode;

    await shop.save();

    res.status(201).json({
      success: true,
      shop,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});



// Admibn Functionality

// Get all sellers (Admin)
export const getAllSellers = catchAsyncErrors(async (req, res, next) => {
  try {
    const sellers = await shopModel.find().sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      sellers,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Delete seller (Admin)
export const deleteSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const seller = await shopModel.findById(req.params.id);
    if (!seller) {
      return next(
        new ErrorHandler(`Seller not available with id: ${req.params.id}!`, 400)
      );
    }
    await shopModel.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Seller deleted successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Update seller payment methods
export const updatePaymentMethods = catchAsyncErrors(async (req, res, next) => {
  try {
    const { withdrawMethod } = req.body;
    const seller = await shopModel.findByIdAndUpdate(
      req.seller._id,
      { withdrawMethod },
      { new: true }
    );
    res.status(201).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});