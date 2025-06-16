import ErrorHandler from "../utils/ErrorHandler.js";
import userModel from "../model/userModel.js";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import sendToken from "../utils/jwtToken.js";
import fs from "fs";
import path from "path";
// Add with other imports
import { jwtDecode } from "jwt-decode"; // Named import

// Add this new controller
export const googleAuth = catchAsyncErrors(async (req, res, next) => {
  try {
    const { credential } = req.body;
    const decoded = jwt_decode(credential);
    
    const { email, name, picture, sub: googleId } = decoded;
    
    let user = await userModel.findOne({ email });
    
    if (!user) {
      // Create new user
      user = await userModel.create({
        name,
        email,
        googleId,
        avatar: picture,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
      });
    } else {
      // Update existing user's Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    }
    
    sendToken(user, 200, res);
    
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// register user
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user with the provided email already exists
    const userEmail = await userModel.findOne({ email });
    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    // Check if file is provided
    if (!req.file) {
      return next(new ErrorHandler("Avatar file is required", 400));
    }

    const image_filename = `${req.file.filename}`;

    const user = {
      name,
      email,
      password,
      avatar: image_filename,
    };

    const activationToken = createActivationToken(user);

    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account ${activationUrl}`,
      });
      res.status(200).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    next(new ErrorHandler("Error creating user", 400));
  }
};

// create activationtoken
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

// activate user
export const activateUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body;

    const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);

    if (!newUser) {
      return next(new ErrorHandler("Invalid Token", 400));
    }

    const { name, email, password, avatar } = newUser;

    await userModel.create({
      name,
      email,
      password,
      avatar,
    });

    sendToken(newUser, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// login user
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please provide the all fields!", 400));
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("User doesn't exists!", 400));
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return next(new ErrorHandler("Wrong Cradientials", 400));
    }

    sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// get user
export const getUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// logout
export const Logout = catchAsyncErrors(async (req, res, next) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "Logout Successful!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});



// update user info - simplified to only update name and phone number
export const updateUserInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, phoneNumber } = req.body

    // Ensure the user exists - find by ID from token
    const userId = req.user.id
    const user = await userModel.findById(userId)

    if (!user) {
      return next(new ErrorHandler("User not found", 404))
    }

    // Update only name and phone number
    user.name = name
    user.phoneNumber = phoneNumber

    await user.save()

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



// update user avatar
export const updateUserAvatar = catchAsyncErrors(async (req, res, next) => {
  try {
    const existUser = await userModel.findById(req.user.id);

    if (!existUser) {
      return next(new ErrorHandler("User not found!", 404));
    }

    const existAvatarPath = path.join("uploads", existUser.avatar);

    // Remove existing avatar if it exists
    if (fs.existsSync(existAvatarPath)) {
      fs.unlinkSync(existAvatarPath);
    }

    const fileUrl = req.file.filename;

    existUser.avatar = fileUrl;
    await existUser.save();

    res.status(200).json({
      success: true,
      user: existUser,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update User Address
export const updateUserAddress = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);

    const sameTypeAddress = user.addresses.find(
      (address) => address.addressType === req.body.addressType
    );

    if (sameTypeAddress) {
      return next(new ErrorHandler("Address Type already exists", 400));
    }

    const existAddress = user.addresses.find(
      (address) => address._id === req.body._id
    );

    if (existAddress) {
      Object.assign(existAddress, req.body);
    } else {
      user.addresses.push(req.body);
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// delete User Address
export const deleteUserAddress = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    await userModel.updateOne(
      {
        _id: userId,
      },
      { $pull: { addresses: { _id: addressId } } }
    );

    const user = await userModel.findById(userId);

    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update user password
export const updateUserPassword = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Old password is incorrect!", 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(
        new ErrorHandler("Password doesn't matched with each other!", 400)
      );
    }
    user.password = req.body.newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// find user infoormation with the userId
export const getUserInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export const sendContactForm = async (req, res) => {
  try {
    const { email, subject, directHtml } = req.body;

    // Validate required fields
    if (!email || !subject || !directHtml) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    // Send the email using the sendMail service
    await sendMail({
      email,
      subject,
      html: directHtml,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error in sendContactForm:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to send email" });
  }
};
