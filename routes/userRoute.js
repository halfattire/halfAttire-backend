import express from "express"
import {
  activateUser,
  createUser,
  getUser,
  loginUser,
  Logout,
  updateUserInfo,
  updateUserAvatar,
  updateUserAddress,
  deleteUserAddress,
  updateUserPassword,
  getUserInfo,
  sendContactForm,
  googleAuth,
  adminAllUsers,
  adminDeleteUser,
} from "../controller/userController.js"
import { isAdmin, isAuthenticated } from "../middleware/auth.js"

const userRouter = express.Router()

// No multer needed - pure Cloudinary with base64
userRouter.post("/create-user", createUser)
userRouter.post("/activation", activateUser)
userRouter.post("/login", loginUser)
userRouter.post("/google", googleAuth)
userRouter.post("/google-test", (req, res) => {
  console.log("Google test endpoint hit:", req.body)
  res.json({ success: true, message: "Google test endpoint working", body: req.body })
})
// TEMPORARY - ALL AUTH MIDDLEWARE REMOVED FOR TESTING
userRouter.get("/getuser", getUser)
userRouter.get("/logout", Logout)
userRouter.put("/update-user-info", updateUserInfo)
userRouter.put("/update-avatar", updateUserAvatar)
userRouter.put("/update-user-addresses", updateUserAddress)
userRouter.delete("/delete-user-address/:id", deleteUserAddress)
userRouter.put("/update-user-password", updateUserPassword)
userRouter.get("/user-info/:id", getUserInfo)
userRouter.post("/send-email", sendContactForm)
// Admin routes - TEMPORARILY ACCESSIBLE WITHOUT AUTH
userRouter.get("/admin-all-users", adminAllUsers);
userRouter.delete("/admin-delete-user/:id", adminDeleteUser);

export default userRouter
