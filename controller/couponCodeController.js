import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import couponsCodeModel from "../model/couponCodeModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// create coupoun code
export const createCoupon = catchAsyncErrors(async (req, res, next) => {
  try {
    const isCoupounCodeExists = await couponsCodeModel.findOne({
      name: req.body.name,
    });

    if (isCoupounCodeExists) {
      return next(new ErrorHandler("Coupoun code already exists!", 400));
    }

    const coupounCode = await couponsCodeModel.create(req.body);

    res.status(201).json({
      success: true,
      coupounCode,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 404));
  }
});

// get all coupons of a shop
export const getCoupons = catchAsyncErrors(async (req, res, next) => {
  try {
    const couponCodes = await couponsCodeModel.find({ shopId: req.seller.id });
    res.status(201).json({
      success: true,
      couponCodes,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// delete coupoun code of a shop
export const deleteCoupon = catchAsyncErrors(async (req, res, next) => {
  try {
    const couponCode = await couponsCodeModel.findByIdAndDelete(req.params.id);

    if (!couponCode) {
      return next(new ErrorHandler("Coupon code dosen't exists!", 400));
    }
    res.status(201).json({
      success: true,
      message: "Coupon code deleted successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// get coupon code value by its name
export const getCoupnCode = catchAsyncErrors(async (req, res, next) => {
  try {
    const couponCode = await couponsCodeModel.findOne({
      name: req.params.name,
    });

    if (!couponCode) {
      return next(new ErrorHandler("Coupon Code not exists", 404));
    }

    res.status(200).json({
      success: true,
      couponCode,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});
