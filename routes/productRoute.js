import express from "express";
import multer from "multer";
import { createProduct, getAllShopProducts,deleteShopProduct, getAllProducts,createReview, adminAllProducts } from "../controller/productController.js";
import { isAdmin, isAuthenticated, isSeller } from "../middleware/auth.js";

const productRouter = express.Router();

// image upload engine
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// product routes
productRouter.post("/create-product", upload.array("images"), createProduct);
productRouter.get("/get-all-shop-products/:id", getAllShopProducts)
productRouter.delete("/delete-shop-products/:id",isSeller, deleteShopProduct)
productRouter.get("/get-all-products", getAllProducts)
productRouter.put("/create-new-review",isAuthenticated, createReview)

// Admin routes
productRouter.get("/admin-all-products", isAuthenticated, isAdmin, adminAllProducts);

export default productRouter;
