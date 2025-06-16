import ErrorHandler from "../utils/ErrorHandler.js"
import catchAsyncErrors from "./catchAsyncErrors.js"
import jwt from "jsonwebtoken"
import userModel from "../model/userModel.js"
import shopModel from "../model/shopModel.js"
import admin from "firebase-admin"

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  // Get token from multiple possible sources
  const token =
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : null)

  // console.log("Auth middleware - Cookies:", req.cookies)
  // console.log("Auth middleware - Token:", token ? "Present" : "Missing")
  // console.log("Auth middleware - Headers:", req.headers.authorization)

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401))
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
    // console.log("Token decoded successfully, user ID:", decoded.id)
  } catch (jwtError) {
    console.error("JWT verification error:", jwtError.message)
    return next(new ErrorHandler("Invalid or expired token", 401))
  }

  const user = await userModel.findById(decoded.id)

  if (!user) {
    console.error("User not found for ID:", decoded.id)
    return next(new ErrorHandler("User not found", 404))
  }

  // console.log("User authenticated successfully:", user.email)
  req.user = user

  next()
})

// Optional: Firebase token verification middleware
export const verifyFirebaseToken = catchAsyncErrors(async (req, res, next) => {
  const { idToken } = req.body

  if (!idToken) {
    return next(new ErrorHandler("Firebase token is required", 400))
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    req.firebaseUser = decodedToken
    next()
  } catch (error) {
    return next(new ErrorHandler("Invalid Firebase token", 401))
  }
})

export const isAdmin = catchAsyncErrors(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler("User not authenticated", 401))
  }

  if (req.user.role !== "admin") {
    return next(new ErrorHandler("Admin access only", 403))
  }
  next()
})

export const isSeller = catchAsyncErrors(async (req, res, next) => {
  const { seller_token } = req.cookies

  if (!seller_token) {
    return next(new ErrorHandler("UnAuthorized User", 401))
  }

  const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY)

  req.seller = await shopModel.findById(decoded.id)

  if (!req.seller) {
    return next(new ErrorHandler("Seller not found", 401))
  }

  next()
})
