import ErrorHandler from "../utils/ErrorHandler.js"
import userModel from "../model/userModel.js"
import jwt from "jsonwebtoken"
import sendMail from "../utils/sendMail.js"
import catchAsyncErrors from "../middleware/catchAsyncErrors.js"
import sendToken from "../utils/jwtToken.js"
import { cloudinary, isCloudinaryConfigured } from "../server.js"

// Google authentication handler
export const googleAuth = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, photo } = req.body

    console.log("Google auth request received:", { name, email, photo })

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }

    const defaultAvatar = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
    const avatarUrl = photo || defaultAvatar

    const user = await userModel.findOne({ email })

    if (user) {
      console.log("Existing user found:", user._id)

      if (photo && user.avatar !== photo) {
        user.avatar = photo
        await user.save()
      }

      const token = user.getJwtToken()

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })

      const { password, ...userData } = user.toObject()

      return res.status(200).json({
        success: true,
        user: userData,
        message: "Login successful",
      })
    } else {
      console.log("Creating new user for:", email)

      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

      const newUser = new userModel({
        name: name || email.split("@")[0],
        email,
        password: generatedPassword,
        avatar: avatarUrl,
        role: "user",
      })

      await newUser.save()
      console.log("New user created with ID:", newUser._id)

      const token = newUser.getJwtToken()

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })

      const { password, ...userData } = newUser.toObject()

      return res.status(201).json({
        success: true,
        user: userData,
        message: "Registration successful",
      })
    }
  } catch (error) {
    console.error("Google auth error:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
})

// Regular user registration with Cloudinary
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body

    console.log("Create user request:", { name, email, hasAvatar: !!avatar })

    const userEmail = await userModel.findOne({ email })
    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400))
    }

    let avatarUrl = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"

    if (avatar && isCloudinaryConfigured()) {
      try {
        console.log("Uploading avatar to Cloudinary...")
        const result = await cloudinary.uploader.upload(avatar, {
          folder: "avatars",
          width: 300,
          height: 300,
          crop: "fill",
        })
        avatarUrl = result.secure_url
        console.log("Avatar uploaded successfully:", avatarUrl)
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError)
        console.log("Using default avatar due to upload failure")
        // Don't fail registration, just use default avatar
      }
    } else if (avatar && !isCloudinaryConfigured()) {
      console.log("Cloudinary not configured, using default avatar")
    }

    const user = {
      name,
      email,
      password,
      avatar: avatarUrl,
    }

    const activationToken = createActivationToken(user)
    const activationUrl = `${process.env.FRONTEND_BASE_URL || "http://localhost:3000"}/activation/${activationToken}`

    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account ${activationUrl}`,
      })
      res.status(200).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account`,
      })
    } catch (error) {
      return next(new ErrorHandler(error.message, 500))
    }
  } catch (error) {
    console.error("Create user error:", error)
    next(new ErrorHandler("Error creating user", 400))
  }
}

const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  })
}

export const activateUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body
    const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET)

    if (!newUser) {
      return next(new ErrorHandler("Invalid Token", 400))
    }

    const { name, email, password, avatar } = newUser

    await userModel.create({
      name,
      email,
      password,
      avatar,
    })

    sendToken(newUser, 201, res)
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

export const loginUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(new ErrorHandler("Please provide the all fields!", 400))
    }

    const user = await userModel.findOne({ email }).select("+password")

    if (!user) {
      return next(new ErrorHandler("User doesn't exists!", 400))
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return next(new ErrorHandler("Wrong Credentials", 400))
    }

    sendToken(user, 201, res)
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

export const getUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id)

    if (!user) {
      return next(new ErrorHandler("User not found", 400))
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

export const Logout = catchAsyncErrors(async (req, res, next) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })

    res.status(200).json({
      success: true,
      message: "Logout Successful!",
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

export const updateUserInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, phoneNumber } = req.body
    const userId = req.user.id

    console.log("Update user info request:", { userId, name, phoneNumber })

    const user = await userModel.findById(userId)

    if (!user) {
      return next(new ErrorHandler("User not found", 404))
    }

    user.name = name
    user.phoneNumber = phoneNumber

    await user.save()

    console.log("User info updated successfully")

    res.status(200).json({
      success: true,
      user,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Error in updateUserInfo:", error)
    return next(new ErrorHandler(error.message || "Failed to update profile", 500))
  }
})

// Update avatar with Cloudinary - FIXED
export const updateUserAvatar = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log("=== Avatar Update Request Started ===")
    console.log("Cloudinary configuration check:", {
      configured: isCloudinaryConfigured(),
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
    })

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.error("❌ Cloudinary not configured - missing environment variables")
      return next(
        new ErrorHandler(
          "Image upload service not configured. Please contact administrator.",
          503, // Service Unavailable
        ),
      )
    }

    const existUser = await userModel.findById(req.user.id)

    if (!existUser) {
      console.error("User not found for ID:", req.user.id)
      return next(new ErrorHandler("User not found!", 404))
    }

    const { avatar } = req.body

    if (!avatar) {
      console.error("No avatar provided in request")
      return next(new ErrorHandler("Please provide an image", 400))
    }

    console.log("Current user avatar:", existUser.avatar)
    console.log("New avatar data length:", avatar.length)

    // Validate base64 format
    if (!avatar.startsWith("data:image/")) {
      console.error("Invalid image format")
      return next(new ErrorHandler("Invalid image format", 400))
    }

    // Upload new avatar to Cloudinary
    let result
    try {
      console.log("🚀 Starting Cloudinary upload...")

      result = await cloudinary.uploader.upload(avatar, {
        folder: "avatars",
        width: 300,
        height: 300,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
      })

      console.log("✅ Cloudinary upload successful:", result.secure_url)
    } catch (uploadError) {
      console.error("❌ Cloudinary upload error:", uploadError)
      console.error("Error details:", {
        message: uploadError.message,
        http_code: uploadError.http_code,
        error: uploadError.error,
      })
      return next(new ErrorHandler(`Failed to upload avatar: ${uploadError.message}`, 500))
    }

    // Delete old avatar from Cloudinary if it exists and is not a default image
    if (existUser.avatar && existUser.avatar.includes("cloudinary.com") && !existUser.avatar.includes("demo")) {
      try {
        // Extract public_id from URL
        const urlParts = existUser.avatar.split("/")
        const publicIdWithExtension = urlParts[urlParts.length - 1]
        const publicId = `avatars/${publicIdWithExtension.split(".")[0]}`

        console.log("🗑️ Deleting old avatar with public_id:", publicId)
        await cloudinary.uploader.destroy(publicId)
        console.log("✅ Old avatar deleted successfully")
      } catch (deleteError) {
        console.log("⚠️ Could not delete old avatar (continuing anyway):", deleteError.message)
        // Don't fail the request if old image deletion fails
      }
    }

    // Update user avatar
    existUser.avatar = result.secure_url
    await existUser.save()

    console.log("✅ User avatar updated successfully")
    console.log("=== Avatar Update Request Completed ===")

    res.status(200).json({
      success: true,
      user: existUser,
      message: "Avatar updated successfully",
    })
  } catch (error) {
    console.error("❌ Avatar update error:", error)
    return next(new ErrorHandler(`Avatar update failed: ${error.message}`, 500))
  }
})

export const updateUserAddress = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id)

    const sameTypeAddress = user.addresses.find((address) => address.addressType === req.body.addressType)

    if (sameTypeAddress) {
      return next(new ErrorHandler("Address Type already exists", 400))
    }

    const existAddress = user.addresses.find((address) => address._id === req.body._id)

    if (existAddress) {
      Object.assign(existAddress, req.body)
    } else {
      user.addresses.push(req.body)
    }

    await user.save()

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

export const deleteUserAddress = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user._id
    const addressId = req.params.id

    await userModel.updateOne(
      {
        _id: userId,
      },
      { $pull: { addresses: { _id: addressId } } },
    )

    const user = await userModel.findById(userId)

    res.status(200).json({ success: true, user })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

export const updateUserPassword = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select("+password")

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword)

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Old password is incorrect!", 400))
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(new ErrorHandler("Password doesn't matched with each other!", 400))
    }
    user.password = req.body.newPassword

    await user.save()

    res.status(200).json({
      success: true,
      message: "Password updated successfully!",
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

export const getUserInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id)

    res.status(201).json({
      success: true,
      user,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500))
  }
})

export const sendContactForm = async (req, res) => {
  try {
    const { email, subject, directHtml } = req.body

    if (!email || !subject || !directHtml) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" })
    }

    await sendMail({
      email,
      subject,
      html: directHtml,
    })

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    })
  } catch (error) {
    console.error("Error in sendContactForm:", error)
    res.status(500).json({ success: false, message: error.message || "Failed to send email" })
  }
}
