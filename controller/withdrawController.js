import Withdraw from "../model/withdrawModel.js";
import Shop from "../model/shopModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import sendMail from "../utils/sendMail.js";

// Create withdraw request (Seller)
export const createWithdrawRequest = catchAsyncErrors(async (req, res, next) => {
  try {
    const { amount, paymentMethod, bankAccount, digitalWallet } = req.body;

    // Validate seller
    const seller = await Shop.findById(req.seller._id);
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    // Check available balance
    if (seller.availableBalance < amount) {
      return next(new ErrorHandler("Insufficient balance for withdrawal", 400));
    }

    // Validate minimum withdrawal amount
    if (amount < 100) {
      return next(new ErrorHandler("Minimum withdrawal amount is PKR 100", 400));
    }

    // Prepare withdrawal data
    const withdrawData = {
      seller: req.seller._id,
      amount,
      paymentMethod,
    };

    // Add payment details based on method
    if (paymentMethod === "Bank Transfer") {
      if (!bankAccount || !bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.accountTitle) {
        return next(new ErrorHandler("Complete bank account details are required", 400));
      }
      withdrawData.bankAccount = bankAccount;
    } else if (["PayPal", "Stripe", "Jazz Cash", "Easypaisa"].includes(paymentMethod)) {
      if (!digitalWallet || !digitalWallet.walletId) {
        return next(new ErrorHandler("Wallet details are required", 400));
      }
      withdrawData.digitalWallet = digitalWallet;
    }

    // Create withdrawal request
    const withdraw = await Withdraw.create(withdrawData);

    // Deduct amount from available balance (mark as pending)
    await Shop.findByIdAndUpdate(req.seller._id, {
      $inc: { availableBalance: -amount }
    });

    // Add transaction to seller's record
    const transaction = {
      amount: amount,
      status: "Processing",
      createdAt: new Date(),
      withdrawId: withdraw._id,
      type: "withdrawal"
    };

    await Shop.findByIdAndUpdate(req.seller._id, {
      $push: { transections: transaction }
    });

    // Send notification email
    try {
      await sendMail({
        email: seller.email,
        subject: "Withdrawal Request Submitted",
        message: `Hello ${seller.name},

Your withdrawal request has been submitted successfully!

Request Details:
- Amount: PKR ${amount}
- Payment Method: ${paymentMethod}
- Transaction ID: ${withdraw.transactionId}
- Status: Processing

Your request will be reviewed by our admin team within 24-48 hours. You will receive an email notification once your request is processed.

Thank you for using our platform!

Best regards,
HalfAttire Team`,
      });
    } catch (error) {
      console.error("Email sending failed:", error.message);
    }

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdraw: {
        _id: withdraw._id,
        amount: withdraw.amount,
        status: withdraw.status,
        paymentMethod: withdraw.paymentMethod,
        transactionId: withdraw.transactionId,
        createdAt: withdraw.createdAt,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get seller's withdraw requests
export const getSellerWithdraws = catchAsyncErrors(async (req, res, next) => {
  try {
    const withdraws = await Withdraw.find({ seller: req.seller._id })
      .sort({ createdAt: -1 })
      .select('-bankAccount -digitalWallet'); // Don't send sensitive data

    const seller = await Shop.findById(req.seller._id);

    // Calculate statistics
    const totalWithdrawn = withdraws
      .filter(w => w.status === "Succeed")
      .reduce((sum, w) => sum + w.amount, 0);

    const pendingAmount = withdraws
      .filter(w => w.status === "Processing")
      .reduce((sum, w) => sum + w.amount, 0);

    res.status(200).json({
      success: true,
      withdraws,
      stats: {
        availableBalance: seller.availableBalance,
        totalWithdrawn,
        pendingAmount,
        totalRequests: withdraws.length,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all withdraw requests (Admin)
export const getAllWithdrawRequests = catchAsyncErrors(async (req, res, next) => {
  try {
    const withdraws = await Withdraw.find()
      .populate("seller", "name email phone address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      withdraws,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Update withdraw request (Admin)
export const updateWithdrawRequest = catchAsyncErrors(async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const withdrawId = req.params.id;

    if (!["Succeed", "Rejected"].includes(status)) {
      return next(new ErrorHandler("Invalid status. Must be 'Succeed' or 'Rejected'", 400));
    }

    const withdraw = await Withdraw.findById(withdrawId).populate("seller");
    if (!withdraw) {
      return next(new ErrorHandler("Withdrawal request not found", 404));
    }

    if (withdraw.status !== "Processing") {
      return next(new ErrorHandler("This withdrawal request has already been processed", 400));
    }

    // Update withdrawal status
    withdraw.status = status;
    withdraw.adminNote = adminNote;
    withdraw.processedBy = req.user._id;
    withdraw.processedAt = new Date();
    await withdraw.save();

    const seller = withdraw.seller;

    // Handle different status outcomes
    if (status === "Succeed") {
      // Update seller's transaction record
      await Shop.findOneAndUpdate(
        { 
          _id: seller._id,
          "transections.withdrawId": withdraw._id
        },
        {
          $set: {
            "transections.$.status": "Succeed",
            "transections.$.updatedAt": new Date(),
          }
        }
      );

      // Send success email
      try {
        await sendMail({
          email: seller.email,
          subject: "Withdrawal Request Approved",
          message: `Hello ${seller.name},

Great news! Your withdrawal request has been approved and processed.

Transaction Details:
- Amount: PKR ${withdraw.amount}
- Transaction ID: ${withdraw.transactionId}
- Payment Method: ${withdraw.paymentMethod}
- Status: Completed

${adminNote ? `Admin Note: ${adminNote}` : ''}

The amount will be transferred to your provided payment method within 3-7 business days depending on your bank/payment provider.

Thank you for using our platform!

Best regards,
HalfAttire Team`,
        });
      } catch (error) {
        console.error("Email sending failed:", error.message);
      }

    } else if (status === "Rejected") {
      // Refund the amount back to seller's available balance
      await Shop.findByIdAndUpdate(seller._id, {
        $inc: { availableBalance: withdraw.amount }
      });

      // Update seller's transaction record
      await Shop.findOneAndUpdate(
        { 
          _id: seller._id,
          "transections.withdrawId": withdraw._id
        },
        {
          $set: {
            "transections.$.status": "Rejected",
            "transections.$.updatedAt": new Date(),
          }
        }
      );

      // Send rejection email
      try {
        await sendMail({
          email: seller.email,
          subject: "Withdrawal Request Rejected",
          message: `Hello ${seller.name},

We regret to inform you that your withdrawal request has been rejected.

Transaction Details:
- Amount: PKR ${withdraw.amount}
- Transaction ID: ${withdraw.transactionId}
- Status: Rejected

${adminNote ? `Reason: ${adminNote}` : ''}

The amount has been refunded back to your available balance. You can submit a new withdrawal request after addressing the mentioned concerns.

If you have any questions, please contact our support team.

Best regards,
HalfAttire Team`,
        });
      } catch (error) {
        console.error("Email sending failed:", error.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Withdrawal request ${status.toLowerCase()} successfully`,
      withdraw,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get withdrawal statistics (Admin)
export const getWithdrawStats = catchAsyncErrors(async (req, res, next) => {
  try {
    const stats = await Withdraw.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const totalStats = await Withdraw.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats,
      totalStats: totalStats[0] || { totalRequests: 0, totalAmount: 0 },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});