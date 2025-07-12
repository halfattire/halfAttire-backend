import express from "express";
import { createProduct, getAllShopProducts,deleteShopProduct, getAllProducts,createReview, adminAllProducts } from "../controller/productController.js";
import { isAdmin, isAuthenticated, isSeller } from "../middleware/auth.js";

const productRouter = express.Router();

// product routes
productRouter.post("/create-product", createProduct);
productRouter.get("/get-all-shop-products/:id", getAllShopProducts)
productRouter.delete("/delete-shop-products/:id",isSeller, deleteShopProduct)
productRouter.get("/get-all-products", getAllProducts)
productRouter.put("/create-new-review",createReview);

// Admin routes
productRouter.get("/admin-all-products",isAdmin, adminAllProducts);

export default productRouter;
