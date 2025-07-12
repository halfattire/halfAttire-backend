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

// Public routes
shopRouter.post("/login-shop", shopLogin)
shopRouter.post("/create-shop", createShop)
shopRouter.post("/seller/activation", activateSellerShop)
shopRouter.get("/get-shop-info/:id", getShopInfo)

// Protected routes with authentication middleware
shopRouter.get("/getSeller", isSeller, loadShop)
shopRouter.get("/logout", logout)
shopRouter.put("/update-shop-avatar", isSeller, updateShopAvatar)
shopRouter.put("/update-seller-info", isSeller, updateSellerInfo)

// Admin routes with authentication
shopRouter.get("/admin-all-sellers", isAuthenticated, isAdmin, getAllSellers);
shopRouter.delete("/admin-delete-seller/:id", isAuthenticated, isAdmin, deleteSeller);

export default shopRouter
