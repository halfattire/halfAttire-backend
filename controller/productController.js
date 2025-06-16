import catchAsyncErrors from "../middleware/catchAsyncErrors.js"
import orderModel from "../model/orderModel.js"
import productModel from "../model/productModel.js"
import shopModel from "../model/shopModel.js"
import ErrorHandler from "../utils/ErrorHandler.js"
import fs from "fs";
import path from "path";
import { promisify } from "util";

const unlinkAsync = promisify(fs.unlink);

// Minimal changes to existing createProduct function
export const createProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const { shopId } = req.body
    const shop = await shopModel.findById(shopId)

    if (!shop) {
      return next(new ErrorHandler("Invalid shop Id", 400))
    }

    const files = req.files
    const imageUrls = files.map((file) => `${file.filename}`)

    const productData = {
      ...req.body,
      images: imageUrls,
      shop: {
        _id: shop._id,
        name: shop.name,
        email: shop.email,
        phoneNumber: shop.phoneNumber,
        address: shop.address,
        description: shop.description,
        zipCode: shop.zipCode,
        role: shop.role,
        avatar: shop.avatar,
        createdAt: shop.createdAt,
      },
    }

    // Handle variable products
    if (req.body.isVariableProduct === "true") {
      productData.isVariableProduct = true

      if (req.body.variations) {
        try {
          const variations = JSON.parse(req.body.variations)

          // Validate variations
          if (!Array.isArray(variations) || variations.length === 0) {
            return next(new ErrorHandler("Variable products must have at least one variation", 400))
          }

          // Validate each variation
          for (const variation of variations) {
            if (!variation.price || variation.price <= 0) {
              return next(new ErrorHandler("Each variation must have a valid price", 400))
            }
            if (variation.stock === undefined || variation.stock < 0) {
              return next(new ErrorHandler("Each variation must have a valid stock quantity", 400))
            }
          }

          productData.variations = variations
        } catch (error) {
          return next(new ErrorHandler("Invalid variations data", 400))
        }
      } else {
        return next(new ErrorHandler("Variable products must have variations", 400))
      }
    } else {
      productData.isVariableProduct = false
      // For simple products, ensure required fields are present
      if (!productData.discountPrice || productData.discountPrice <= 0) {
        return next(new ErrorHandler("Please enter your product price!", 400))
      }
      if (productData.stock === undefined || productData.stock < 0) {
        return next(new ErrorHandler("Please enter your product stock!", 400))
      }
    }

    const product = await productModel.create(productData)

    res.status(201).json({
      success: true,
      product,
    })
  } catch (error) {
    console.error("Product creation error:", error)
    return next(new ErrorHandler(error.message, 400))
  }
})

// Keep all other existing functions unchanged
export const getAllShopProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const products = await productModel.find({ shopId: req.params.id })
    res.status(200).json({
      success: true,
      products,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 400))
  }
})






export const deleteShopProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const productId = req.params.id;

    // console.log(`Attempting to delete product with ID: ${productId}`);

    const product = await productModel.findById(productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 400));
    }

    // Delete associated images from uploads folder
    const uploadsDir = path.join(process.cwd(), "uploads");
    console.log(`Uploads directory: ${uploadsDir}`);

    if (fs.existsSync(uploadsDir)) {
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          const filePath = path.join(uploadsDir, image);
          console.log(`Checking file: ${filePath}`);
          if (fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
          } else {
            console.log(`File not found: ${filePath}`);
          }
        }
      } else {
        console.log("No images to delete for this product");
      }
    } else {
      console.log("Uploads directory does not exist");
    }

    // Delete the product from the database
    const deletedProduct = await productModel.findByIdAndDelete(productId);
    if (!deletedProduct) {
      throw new Error("Failed to delete product from database");
    }

    // console.log(`Product ${productId} deleted from database`);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(`Error in deleteShopProduct: ${error.message}`, error.stack);
    return next(new ErrorHandler(`Failed to delete product: ${error.message}`, 400));
  }
});







export const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const products = await productModel.find().sort({ createdAt: -1 })

    res.status(201).json({
      success: true,
      products,
    })
  } catch (error) {
    return next(new ErrorHandler(error, 404))
  }
})

export const createReview = catchAsyncErrors(async (req, res, next) => {
  try {
    const { user, rating, comment, productId, orderId } = req.body

    const product = await productModel.findById(productId)

    const review = {
      user,
      rating,
      comment,
      productId,
    }

    const isReviewed = product.reviews.find((rev) => rev.user._id === req.user._id)

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user._id === req.user._id) {
          ;(rev.rating = rating), (rev.comment = comment), (rev.user = user)
        }
      })
    } else {
      product.reviews.push(review)
    }

    let avg = 0

    product.reviews.forEach((rev) => {
      avg += rev.rating
    })

    product.ratings = avg / product.reviews.length

    await product.save({ validateBeforeSave: false })

    await orderModel.findByIdAndUpdate(
      orderId,
      { $set: { "cart.$[elem].isReviewed": true } },
      { arrayFilters: [{ "elem._id": productId }], new: true },
    )

    res.status(200).json({
      success: true,
      message: "Reviewed successfully!",
    })
  } catch (error) {
    return next(new ErrorHandler(error, 400))
  }
})


// Get all products (Admin)
export const adminAllProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const products = await productModel.find().sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});