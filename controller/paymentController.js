import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import Stripe from "stripe";
import ErrorHandler from "../utils/ErrorHandler.js";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY
);

export const processPayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "pkr", 
      metadata: {
        company: "eshop",
      },
    });
    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export const stripeApiKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    stripeApiKey: process.env.STRIPE_API_KEY,
  });
});
