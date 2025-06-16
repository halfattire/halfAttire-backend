import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Seller reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Withdrawal amount is required"],
      min: [1, "Withdrawal amount must be at least 1"],
    },
    status: {
      type: String,
      enum: ["Processing", "Succeed", "Failed"],
      default: "Processing",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    bankAccount: {
      type: Object,
      required: [true, "Bank account details are required"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
withdrawSchema.index({ seller: 1 });
withdrawSchema.index({ status: 1 });
withdrawSchema.index({ createdAt: -1 });

// Virtual populate to get seller details
withdrawSchema.virtual("sellerDetails", {
  ref: "Shop",
  localField: "seller",
  foreignField: "_id",
  justOne: true,
});

// Pre-save hook to validate withdrawal amount
withdrawSchema.pre("save", async function (next) {
  const shop = await mongoose.model("Shop").findById(this.seller);
  if (shop.availableBalance < this.amount) {
    throw new Error("Insufficient balance for withdrawal");
  }
  next();
});

// Post-save hook to update seller's balance
withdrawSchema.post("save", async function (doc) {
  if (doc.status === "Processing") {
    await mongoose.model("Shop").findByIdAndUpdate(doc.seller, {
      $inc: { availableBalance: -doc.amount },
    });
  }
});

const Withdraw = mongoose.model("Withdraw", withdrawSchema);

export default Withdraw;