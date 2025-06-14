import catchAsyncErrors from "../middleware/catchAsyncErrors.js"
import shopModel from "../model/shopModel.js"
import ErrorHandler from "../utils/ErrorHandler.js"
import sendMail from "../utils/sendMail.js"
import jwt from "jsonwebtoken"
import sendShopToken from "../utils/ShopToken.js"
import { cloudinary, isCloudinaryConfigured } from "../server.js"

// Modified to use Cloudinary instead of multer
export const createShop = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber, address, zipCode, avatar } = req.body

    // Check if user with the provided email already exists
    const shopEmail = await shopModel.findOne({ email })
    if (shopEmail) {
      return next(new ErrorHandler("User already exists", 400))
    }

    // Check if avatar is provided
    if (!avatar) {
      return next(new ErrorHandler("Avatar is required", 400))
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return next(new ErrorHandler("Image upload service not configured", 503))
    }

    // Upload avatar to Cloudinary
    let avatarUrl = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
    try {
      console.log("Uploading shop avatar to Cloudinary...")
      const result = await cloudinary.uploader.upload(avatar, {
        folder: "shops",
        width: 300,
        height: 300,
        crop: "fill",
      })
      avatarUrl = result.secure_url
      console.log("Shop avatar uploaded successfully:", avatarUrl)
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError)
      return next(new ErrorHandler(`Failed to upload avatar: ${uploadError.message}`, 500))
    }

    const seller = {
      name,
      email,
      password,
      phoneNumber,
      address,
      zipCode,
      avatar: avatarUrl,
    }

    const activationToken = createActivationToken(seller)
    const activationUrl = `${process.env.FRONTEND_BASE_URL || "http://localhost:3000"}/seller/activation/${activationToken}`

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
    const seller = await shopModel.findById(req.seller.id)

    if (!seller) {
      return next(new ErrorHandler("Shop not found", 400))
    }

    res.status(200).json({
      success: true,
      seller,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

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
    const shop = await shopModel.findById(req.params.id)
    res.status(201).json({
      success: true,
      shop,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

// update shop avatar - Modified to use Cloudinary
export const updateShopAvatar = catchAsyncErrors(async (req, res, next) => {
  try {
    const existSeller = await shopModel.findById(req.seller._id)

    if (!existSeller) {
      return next(new ErrorHandler("Seller not found!", 404))
    }

    const { avatar } = req.body

    if (!avatar) {
      return next(new ErrorHandler("Avatar is required", 400))
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return next(new ErrorHandler("Image upload service not configured", 503))
    }

    // Delete old avatar from Cloudinary if it exists and is not a default image
    if (existSeller.avatar && existSeller.avatar.includes("cloudinary.com") && !existSeller.avatar.includes("demo")) {
      try {
        // Extract public_id from URL
        const urlParts = existSeller.avatar.split("/")
        const publicIdWithExtension = urlParts[urlParts.length - 1]
        const publicId = `shops/${publicIdWithExtension.split(".")[0]}`

        console.log("Deleting old shop avatar with public_id:", publicId)
        await cloudinary.uploader.destroy(publicId)
        console.log("Old shop avatar deleted successfully")
      } catch (deleteError) {
        console.log("Could not delete old avatar (continuing anyway):", deleteError.message)
        // Don't fail the request if old image deletion fails
      }
    }

    // Upload new avatar to Cloudinary
    let result
    try {
      console.log("Starting Cloudinary upload for shop avatar...")
      result = await cloudinary.uploader.upload(avatar, {
        folder: "shops",
        width: 300,
        height: 300,
        crop: "fill",
        quality: "auto",
      })
      console.log("Shop avatar uploaded successfully:", result.secure_url)
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError)
      return next(new ErrorHandler(`Failed to upload avatar: ${uploadError.message}`, 500))
    }

    // Update seller avatar
    existSeller.avatar = result.secure_url
    await existSeller.save()

    res.status(200).json({
      success: true,
      seller: existSeller,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

// update seller info
export const updateSellerInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, description, address, phoneNumber, zipCode } = req.body

    const shop = await shopModel.findOne(req.seller._id)

    if (!shop) {
      return next(new ErrorHandler("User not found", 400))
    }

    shop.name = name
    shop.description = description
    shop.address = address
    shop.phoneNumber = phoneNumber
    shop.zipCode = zipCode

    await shop.save()

    res.status(201).json({
      success: true,
      shop,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})
