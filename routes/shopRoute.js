import express from "express"
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

// Modified route - removed isAdmin middleware from login
shopRouter.post("/login-shop", shopLogin)

// Fixed route - ensure isAuthenticated runs before isAdmin
shopRouter.post("/create-shop", isAuthenticated, isAdmin, createShop)

shopRouter.post("/seller/activation", activateSellerShop)
shopRouter.get("/getSeller", isSeller, loadShop)
shopRouter.get("/logout", isSeller, logout)
shopRouter.get("/get-shop-info/:id", getShopInfo)
shopRouter.put("/update-shop-avatar", isSeller, updateShopAvatar)
shopRouter.put("/update-seller-info", isSeller, updateSellerInfo)

// Admin routes
shopRouter.get("/admin-all-sellers",  isAdmin, getAllSellers);
shopRouter.delete("/admin-delete-seller/:id",  isAdmin, deleteSeller);

export default shopRouter
