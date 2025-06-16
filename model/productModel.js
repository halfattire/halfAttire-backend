import mongoose from "mongoose"

// Keep original schema, just add optional fields
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
  },
  category: {
    type: String,
    required: [true, "Please enter your product category!"],
  },
  tags: {
    type: String,
  },
  originalPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
    required: function () {
      return !this.isVariableProduct
    },
    validate: {
      validator: function (value) {
        if (this.isVariableProduct) return true
        return value != null && value > 0
      },
      message: "Please enter your product price!",
    },
  },
  stock: {
    type: Number,
    required: function () {
      return !this.isVariableProduct
    },
    validate: {
      validator: function (value) {
        if (this.isVariableProduct) return true
        return value != null && value >= 0
      },
      message: "Please enter your product stock!",
    },
  },
  // NEW: Optional fields for variations - minimal addition
  isVariableProduct: {
    type: Boolean,
    default: false,
  },
  variations: [
    {
      size: String,
      color: String,
      price: { type: Number, required: true },
      stock: { type: Number, required: true, min: 0 },
    },
  ],
  images: [{ type: String }],
  reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      productId: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
  ratings: {
    type: Number,
  },
  shopId: {
    type: String,
    required: true,
  },
  shop: {
    type: Object,
    required: true,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
})

const productModel = mongoose.model("product", productSchema)
export default productModel
