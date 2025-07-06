import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import Order from "../model/orderModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// Admin card details (in production, these should be in environment variables)
const ADMIN_CARD_INFO = {
  cardNumber: "**** **** **** 1234",
  expiryMonth: "12",
  expiryYear: "2025",
  cardHolderName: "ADMIN MERCHANT",
  bankName: "ADMIN BANK"
};

// Get admin card info for display
export const getAdminCardInfo = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    adminCard: ADMIN_CARD_INFO
  });
});

// Verify admin card (simulate card verification)
export const verifyAdminCard = catchAsyncErrors(async (req, res, next) => {
  const { cardNumber, expiryMonth, expiryYear, cvc } = req.body;

  // Simulate card verification logic
  if (!cardNumber || !expiryMonth || !expiryYear || !cvc) {
    return next(new ErrorHandler("All card details are required", 400));
  }

  // In a real implementation, you would verify the card with your payment processor
  // For now, we'll simulate a successful verification
  res.status(200).json({
    success: true,
    message: "Card verified successfully",
    cardInfo: {
      ...ADMIN_CARD_INFO,
      last4: cardNumber.slice(-4)
    }
  });
});

// Process direct card payment
export const processDirectCardPayment = catchAsyncErrors(async (req, res, next) => {
  const { amount, orderId, paymentInfo } = req.body;

  try {
    // Simulate payment processing
    if (!amount || amount <= 0) {
      return next(new ErrorHandler("Invalid payment amount", 400));
    }

    // In a real implementation, you would process the payment with your payment gateway
    // For now, we'll simulate a successful payment
    const paymentResult = {
      id: `direct_${Date.now()}`,
      status: "succeeded",
      amount: amount * 100, // Convert to cents
      currency: "usd",
      payment_method: "card",
      created: Math.floor(Date.now() / 1000),
      description: `Payment for order ${orderId}`,
      metadata: {
        orderId: orderId,
        paymentMethod: "direct_card"
      }
    };

    // Update order with payment info if orderId is provided
    if (orderId) {
      try {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentInfo = {
            id: paymentResult.id,
            status: paymentResult.status,
            type: "direct_card",
            amount: amount
          };
          await order.save();
        }
      } catch (error) {
        console.log("Error updating order payment info:", error);
      }
    }

    res.status(200).json({
      success: true,
      payment: paymentResult,
      message: "Payment processed successfully"
    });

  } catch (error) {
    console.log("Payment processing error:", error);
    return next(new ErrorHandler("Payment processing failed", 500));
  }
});

// Process refund
export const processRefund = catchAsyncErrors(async (req, res, next) => {
  const { paymentId, amount, reason } = req.body;

  try {
    // Simulate refund processing
    const refundResult = {
      id: `refund_${Date.now()}`,
      status: "succeeded",
      amount: amount * 100, // Convert to cents
      currency: "usd",
      payment_intent: paymentId,
      reason: reason || "requested_by_customer",
      created: Math.floor(Date.now() / 1000)
    };

    res.status(200).json({
      success: true,
      refund: refundResult,
      message: "Refund processed successfully"
    });

  } catch (error) {
    console.log("Refund processing error:", error);
    return next(new ErrorHandler("Refund processing failed", 500));
  }
});

// Legacy function for backward compatibility (returns empty since we're not using Stripe)
export const stripeApiKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    stripeApikey: "", // Empty since we're not using Stripe
    message: "Using direct card payment system"
  });
});
