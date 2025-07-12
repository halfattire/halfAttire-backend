import ErrorHandler from "../utils/ErrorHandler.js"
import catchAsyncErrors from "./catchAsyncErrors.js"
import jwt from "jsonwebtoken"
import userModel from "../model/userModel.js"
import shopModel from "../model/shopModel.js"
import admin from "firebase-admin"

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  let token = null;

  console.log("🔍 Auth middleware - Request URL:", req.originalUrl);
  console.log("🔍 Auth middleware - Headers:", {
    authorization: req.headers.authorization ? "Present" : "Missing",
    cookie: req.headers.cookie ? "Present" : "Missing"
  });

  // Try to get token from multiple sources
  // 1. Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("✅ Token found in Authorization header:", token.substring(0, 20) + "...");
  }
  // 2. Cookie (fallback)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("✅ Token found in cookies:", token.substring(0, 20) + "...");
  }

  if (!token) {
    console.log("❌ No token found in request");
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  let decoded;
  try {
    // Verify JWT token
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("✅ Token decoded successfully. User ID:", decoded.id);
  } catch (jwtError) {
    // Handle different JWT errors with detailed logging
    console.log("❌ JWT Error:", jwtError.name, jwtError.message);
    
    if (jwtError.name === 'TokenExpiredError') {
      return next(new ErrorHandler("Your session has expired, please login again", 401));
    } else if (jwtError.name === 'JsonWebTokenError') {
      return next(new ErrorHandler("Invalid authentication token, please login again", 401));
    } else {
      return next(new ErrorHandler("Authentication failed, please try again", 401));
    }
  }

  // Verify user exists in database
  const user = await userModel.findById(decoded.id);

  if (!user) {
    console.log("❌ User not found in database for ID:", decoded.id);
    return next(new ErrorHandler("User account no longer exists", 401));
  }

  console.log("✅ User found:", { id: user._id, email: user.email, role: user.role });

  // Check if user is active (optional additional security)
  if (user.status === 'inactive' || user.status === 'banned') {
    console.log("❌ User account is inactive/banned:", user.status);
    return next(new ErrorHandler("Your account has been deactivated", 401));
  }

  req.user = user;
  next();
});

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
  // Ensure user is authenticated first
  if (!req.user) {
    console.log("❌ isAdmin: No user in request object");
    return next(new ErrorHandler("Authentication required to access admin resources", 401));
  }

  console.log("🔍 isAdmin check - User:", { id: req.user._id, email: req.user.email, role: req.user.role });

  // Check if user has admin role (case-insensitive)
  if (!req.user.role || req.user.role.toLowerCase() !== "admin") {
    console.log("❌ isAdmin: User does not have admin role. Current role:", req.user.role);
    return next(new ErrorHandler("Admin access required - insufficient privileges", 403));
  }

  console.log("✅ isAdmin: Admin access granted");
  next();
});

export const isSeller = catchAsyncErrors(async (req, res, next) => {
  let token = null;

  // Try to get token from multiple sources
  // 1. Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2. seller_token cookie (fallback)
  else if (req.cookies && req.cookies.seller_token) {
    token = req.cookies.seller_token;
  }

  if (!token) {
    return next(new ErrorHandler("Seller authentication required", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (jwtError) {
    if (jwtError.name === 'TokenExpiredError') {
      return next(new ErrorHandler("Seller token has expired, please login again", 401));
    } else if (jwtError.name === 'JsonWebTokenError') {
      return next(new ErrorHandler("Invalid seller token, please login again", 401));
    } else {
      return next(new ErrorHandler("Seller authentication failed", 401));
    }
  }

  const seller = await shopModel.findById(decoded.id);

  if (!seller) {
    return next(new ErrorHandler("Seller account not found", 401));
  }

  // Check if seller account is active
  if (seller.status === 'inactive' || seller.status === 'banned') {
    return next(new ErrorHandler("Seller account is inactive", 401));
  }

  req.seller = seller;
  next();
});

// Debug middleware for authentication issues (can be enabled temporarily)
export const debugAuth = catchAsyncErrors(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG_AUTH === 'true') {
    console.log('=== AUTH DEBUG ===');
    console.log('Headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      cookie: req.headers.cookie ? 'Present' : 'Missing',
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer
    });
    console.log('Cookies:', Object.keys(req.cookies || {}));
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('=================');
  }
  next();
});

// Production-safe authentication middleware with enhanced error handling
export const isAuthenticatedProd = catchAsyncErrors(async (req, res, next) => {
  let token = null;
  
  // Enhanced token extraction for production environment
  try {
    // 1. Try Authorization header first (most reliable for production)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // 2. Try cookies as fallback
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 3. Try custom header (for some proxy configurations)
    else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      return next(new ErrorHandler("Authentication token required", 401));
    }

    // Enhanced JWT verification with production considerations
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      // Check token expiration buffer (5 minutes before actual expiry)
      const now = Math.floor(Date.now() / 1000);
      const expiryBuffer = 300; // 5 minutes
      
      if (decoded.exp && (decoded.exp - now) < expiryBuffer) {
        return next(new ErrorHandler("Token expires soon, please refresh", 401));
      }
      
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new ErrorHandler("Session expired, please login again", 401));
      } else if (jwtError.name === 'JsonWebTokenError') {
        return next(new ErrorHandler("Invalid authentication token", 401));
      } else if (jwtError.name === 'NotBeforeError') {
        return next(new ErrorHandler("Token not active yet", 401));
      } else {
        return next(new ErrorHandler("Authentication failed", 401));
      }
    }

    // Verify user exists and is active
    const user = await userModel.findById(decoded.id).select('+status');
    
    if (!user) {
      return next(new ErrorHandler("User account not found", 401));
    }

    // Additional production security checks
    if (user.status && ['inactive', 'suspended', 'banned', 'deleted'].includes(user.status)) {
      return next(new ErrorHandler("Account is not active", 401));
    }

    // Set user in request for downstream middleware
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return next(new ErrorHandler("Authentication system error", 500));
  }
});
