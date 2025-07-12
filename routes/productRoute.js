import express from "express";
import { createProduct, getAllShopProducts,deleteShopProduct, getAllProducts,createReview, adminAllProducts } from "../controller/productController.js";
import { isAdmin, isAuthenticated, isSeller } from "../middleware/auth.js";

const productRouter = express.Router();

// TEMPORARY - ALL AUTH MIDDLEWARE REMOVED FOR TESTING
productRouter.post("/create-product", createProduct);
productRouter.get("/get-all-shop-products/:id", getAllShopProducts)
productRouter.delete("/delete-shop-products/:id", deleteShopProduct)
productRouter.get("/get-all-products", getAllProducts)
productRouter.put("/create-new-review", createReview);

// Admin routes - TEMPORARILY ACCESSIBLE WITHOUT AUTH
productRouter.get("/admin-all-products", adminAllProducts);

export default productRouter;
