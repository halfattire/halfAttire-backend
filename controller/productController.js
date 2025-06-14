import catchAsyncErrors from "../middleware/catchAsyncErrors.js"
import orderModel from "../model/orderModel.js"
import productModel from "../model/productModel.js"
import shopModel from "../model/shopModel.js"
import ErrorHandler from "../utils/ErrorHandler.js"
import { cloudinary, isCloudinaryConfigured } from "../server.js"

// Modified to use Cloudinary instead of multer
export const createProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log("Create product request body:", req.body)
    const { shopId, images } = req.body

    const shop = await shopModel.findById(shopId)

    if (!shop) {
      return next(new ErrorHandler("Invalid shop Id", 400))
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return next(new ErrorHandler("Image upload service not configured", 503))
    }

    // Check if images are provided
    if (!images || !Array.isArray(images) || images.length === 0) {
      return next(new ErrorHandler("Product images are required", 400))
    }

    // Upload images to Cloudinary
    const imageUrls = []
    try {
      console.log(`Uploading ${images.length} product images to Cloudinary...`)

      for (const image of images) {
        const result = await cloudinary.uploader.upload(image, {
          folder: "products",
          width: 800,
          crop: "scale",
          quality: "auto",
        })
        imageUrls.push(result.secure_url)
      }

      console.log(`Successfully uploaded ${imageUrls.length} product images`)
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError)
      return next(new ErrorHandler(`Failed to upload product images: ${uploadError.message}`, 500))
    }

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

    console.log("Creating product with data:", productData)
    const product = await productModel.create(productData)
    console.log("Product created successfully:", product._id)

    res.status(201).json({
      success: true,
      product,
    })
  } catch (error) {
    console.error("Product creation error:", error)
    return next(new ErrorHandler(error.message, 400))
  }
})

// get all shop products
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

// delete product route
export const deleteShopProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const productId = req.params.id
    const product = await productModel.findById(productId)

    if (!product) {
      return next(new ErrorHandler("Product not found", 400))
    }

    // Delete product images from Cloudinary if they exist
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        if (imageUrl && imageUrl.includes("cloudinary.com")) {
          try {
            // Extract public_id from URL
            const urlParts = imageUrl.split("/")
            const publicIdWithExtension = urlParts[urlParts.length - 1]
            const publicId = `products/${publicIdWithExtension.split(".")[0]}`

            console.log("Deleting product image with public_id:", publicId)
            await cloudinary.uploader.destroy(publicId)
          } catch (deleteError) {
            console.log("Could not delete product image (continuing anyway):", deleteError.message)
            // Don't fail the request if image deletion fails
          }
        }
      }
    }

    await productModel.findByIdAndDelete(productId)

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// get all products
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

// review for a product
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
