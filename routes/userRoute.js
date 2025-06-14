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
} from "../controller/userController.js"
import { isAuthenticated } from "../middleware/auth.js"

const userRouter = express.Router()

// No multer needed - pure Cloudinary with base64
userRouter.post("/create-user", createUser)
userRouter.post("/activation", activateUser)
userRouter.post("/login", loginUser)
userRouter.post("/google", googleAuth)
userRouter.get("/getuser", isAuthenticated, getUser)
userRouter.get("/logout", Logout)
userRouter.put("/update-user-info", isAuthenticated, updateUserInfo)
userRouter.put("/update-avatar", isAuthenticated, updateUserAvatar)
userRouter.put("/update-user-addresses", isAuthenticated, updateUserAddress)
userRouter.delete("/delete-user-address/:id", isAuthenticated, deleteUserAddress)
userRouter.put("/update-user-password", isAuthenticated, updateUserPassword)
userRouter.get("/user-info/:id", getUserInfo)
userRouter.post("/send-email", sendContactForm)

export default userRouter
