import Withdraw from "../model/withdraw.js";
import Shop from "../model/shop.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import sendMail from "../utils/sendMail.js";

// Create withdraw request (Seller)
export const createWithdrawRequest = catchAsyncErrors(async (req, res, next) => {
  try {
    const { amount } = req.body;

    const data = {
      seller: req.seller,
      amount,
    };

    try {
      await sendMail({
        email: req.seller.email,
        subject: "Withdraw Request",
        message: `Hello ${req.seller.name}, Your withdraw request of ${amount}$ is processing. It will take 3days to 7days to processing!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }

    const withdraw = await Withdraw.create(data);
    const shop = await Shop.findById(req.seller._id);

    shop.availableBalance = shop.availableBalance - amount;
    await shop.save();

    res.status(201).json({
      success: true,
      withdraw,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all withdraw requests (Admin)
export const getAllWithdrawRequests = catchAsyncErrors(async (req, res, next) => {
  try {
    const withdraws = await Withdraw.find().sort({ createdAt: -1 });
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
    const { sellerId } = req.body;

    const withdraw = await Withdraw.findByIdAndUpdate(
      req.params.id,
      {
        status: "succeed",
        updatedAt: Date.now(),
      },
      { new: true }
    );

    const seller = await Shop.findById(sellerId);

    const transaction = {
      _id: withdraw._id,
      amount: withdraw.amount,
      updatedAt: withdraw.updatedAt,
      status: withdraw.status,
    };

    seller.transactions = [...seller.transactions, transaction];
    await seller.save();

    try {
      await sendMail({
        email: seller.email,
        subject: "Payment confirmation",
        message: `Hello ${seller.name}, Your withdraw request of ${withdraw.amount}$ is on the way. Delivery time depends on your bank's rules it usually takes 3days to 7days.`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }

    res.status(200).json({
      success: true,
      withdraw,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});