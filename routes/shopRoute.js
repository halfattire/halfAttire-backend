import express from "express"
import multer from "multer"
import {
  activateSellerShop,
  createShop,
  loadShop,
  logout,
  shopLogin,
  getShopInfo,
  updateShopAvatar,
  updateSellerInfo,
  getAllSellers,
  deleteSeller,
} from "../controller/shopController.js"
import { isAdmin, isSeller, isAuthenticated } from "../middleware/auth.js"

const shopRouter = express.Router()

// Image upload engine
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${file.originalname}`)
  },
})

const upload = multer({ storage: storage })

// Modified route - removed isAdmin middleware from login
shopRouter.post("/login-shop", shopLogin)

// Fixed route - ensure isAuthenticated runs before isAdmin
shopRouter.post("/create-shop", isAuthenticated, isAdmin, upload.single("file"), createShop)

shopRouter.post("/seller/activation", activateSellerShop)
shopRouter.get("/getSeller", isSeller, loadShop)
shopRouter.get("/logout", isSeller, logout)
shopRouter.get("/get-shop-info/:id", getShopInfo)
shopRouter.put("/update-shop-avatar", isSeller, upload.single("file"), updateShopAvatar)
shopRouter.put("/update-seller-info", isSeller, updateSellerInfo)

// Admin routes
shopRouter.get("/admin-all-sellers", isAuthenticated, isAdmin, getAllSellers);
shopRouter.delete("/admin-delete-seller/:id", isAuthenticated, isAdmin, deleteSeller);

export default shopRouter
