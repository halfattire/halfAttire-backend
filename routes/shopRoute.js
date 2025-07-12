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

// TEMPORARY - ALL AUTH MIDDLEWARE REMOVED FOR TESTING
shopRouter.post("/create-shop", createShop)

shopRouter.post("/seller/activation", activateSellerShop)
shopRouter.get("/getSeller", loadShop)
shopRouter.get("/logout", logout)
shopRouter.get("/get-shop-info/:id", getShopInfo)
shopRouter.put("/update-shop-avatar", updateShopAvatar)
shopRouter.put("/update-seller-info", updateSellerInfo)

// Admin routes - TEMPORARILY ACCESSIBLE WITHOUT AUTH
shopRouter.get("/admin-all-sellers", getAllSellers);
shopRouter.delete("/admin-delete-seller/:id", deleteSeller);

export default shopRouter
