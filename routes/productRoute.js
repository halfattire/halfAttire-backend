import express from "express"
import {
  createProduct,
  getAllShopProducts,
  deleteShopProduct,
  getAllProducts,
  createReview,
} from "../controller/productController.js"
import { isAuthenticated, isSeller } from "../middleware/auth.js"

const router = express.Router()

router.post("/create-product", isSeller, createProduct)
router.get("/get-all-shop-products/:id", getAllShopProducts)
router.delete("/delete-shop-products/:id", isSeller, deleteShopProduct)
router.get("/get-all-products", getAllProducts)
router.put("/create-new-review", isAuthenticated, createReview)

export default router
