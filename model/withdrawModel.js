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
      enum: ["Processing", "Succeed", "Rejected"],
      default: "Processing",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["Bank Transfer", "PayPal", "Stripe", "Jazz Cash", "Easypaisa"],
    },
    bankAccount: {
      bankName: {
        type: String,
        required: function() {
          return this.paymentMethod === "Bank Transfer";
        }
      },
      accountNumber: {
        type: String,
        required: function() {
          return this.paymentMethod === "Bank Transfer";
        }
      },
      accountTitle: {
        type: String,
        required: function() {
          return this.paymentMethod === "Bank Transfer";
        }
      },
      branchCode: String,
    },
    digitalWallet: {
      walletType: {
        type: String,
        enum: ["PayPal", "Stripe", "Jazz Cash", "Easypaisa"]
      },
      walletId: String,
      phoneNumber: String,
    },
    adminNote: {
      type: String,
      maxlength: [500, "Admin note cannot exceed 500 characters"],
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
withdrawSchema.index({ seller: 1 });
withdrawSchema.index({ status: 1 });
withdrawSchema.index({ createdAt: -1 });
withdrawSchema.index({ transactionId: 1 });

// Virtual populate to get seller details
withdrawSchema.virtual("sellerDetails", {
  ref: "Shop",
  localField: "seller",
  foreignField: "_id",
  justOne: true,
});

// Generate unique transaction ID
withdrawSchema.pre("save", function(next) {
  if (this.isNew) {
    this.transactionId = `WD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  next();
});

const Withdraw = mongoose.model("Withdraw", withdrawSchema);

export default Withdraw;