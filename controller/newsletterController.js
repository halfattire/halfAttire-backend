import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import newsletterModel from "../model/newsletterModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import sendMail from "../utils/sendMail.js";

// Subscribe to newsletter
export const subscribeNewsletter = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new ErrorHandler("Email is required", 400));
        }

        // Check if email already exists
        const existingSubscription = await newsletterModel.findOne({ email });

        if (existingSubscription) {
            if (existingSubscription.status === 'active') {
                return next(new ErrorHandler("Email is already subscribed to our newsletter", 400));
            } else {
                // Reactivate subscription
                existingSubscription.status = 'active';
                existingSubscription.subscribedAt = new Date();
                existingSubscription.unsubscribedAt = undefined;
                await existingSubscription.save();

                res.status(200).json({
                    success: true,
                    message: "Welcome back! Your newsletter subscription has been reactivated.",
                });
                return;
            }
        }

        // Create new subscription
        const subscription = await newsletterModel.create({
            email,
            status: 'active',
            source: 'website'
        });

        await sendMail({
            email: email,
            subject: "Welcome to Our Newsletter! 🎉",
            message: `
Welcome to Our Newsletter! 🎉

Thank you for subscribing!

You're now part of our exclusive community. Here's what to expect:

- 🛍️ Exclusive deals and discounts up to 50% off  
- 🆕 Early access to new products and collections  
- 📱 Special offers for orders above $50  
- 🎁 Birthday surprises and seasonal promotions  
- 📧 Weekly curated product recommendations  

🎊 Special Welcome Offer: Get 15% off your next purchase with code: WELCOME15

We promise to send you only the best content and never spam your inbox.

Start shopping now: ${process.env.FRONTEND_URL || 'http://halfattire.com'}


© 2025 Your Store. All rights reserved.
  `,
        });


    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Unsubscribe from newsletter
export const unsubscribeNewsletter = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new ErrorHandler("Email is required", 400));
        }

        const subscription = await newsletterModel.findOne({ email });

        if (!subscription) {
            return next(new ErrorHandler("Email not found in our newsletter list", 404));
        }

        if (subscription.status === 'unsubscribed') {
            return next(new ErrorHandler("Email is already unsubscribed", 400));
        }

        subscription.status = 'unsubscribed';
        subscription.unsubscribedAt = new Date();
        await subscription.save();

        res.status(200).json({
            success: true,
            message: "Successfully unsubscribed from newsletter",
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get all newsletter subscribers (Admin only)
export const getAllSubscribers = catchAsyncErrors(async (req, res, next) => {
    try {
        const { status = 'active', page = 1, limit = 50 } = req.query;

        const skip = (page - 1) * limit;

        const query = status === 'all' ? {} : { status };

        const subscribers = await newsletterModel
            .find(query)
            .sort({ subscribedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await newsletterModel.countDocuments(query);

        res.status(200).json({
            success: true,
            subscribers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalSubscribers: total,
                hasNext: skip + subscribers.length < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Send newsletter to all active subscribers (Admin only)
export const sendNewsletter = catchAsyncErrors(async (req, res, next) => {
    try {
        const { subject, message, htmlMessage } = req.body;

        if (!subject || (!message && !htmlMessage)) {
            return next(new ErrorHandler("Subject and message are required", 400));
        }

        const activeSubscribers = await newsletterModel.find({ status: 'active' });

        if (activeSubscribers.length === 0) {
            return next(new ErrorHandler("No active subscribers found", 404));
        }

        let successCount = 0;
        let failCount = 0;

        // Send emails in batches to avoid overwhelming the email service
        const batchSize = 50;
        for (let i = 0; i < activeSubscribers.length; i += batchSize) {
            const batch = activeSubscribers.slice(i, i + batchSize);

            const emailPromises = batch.map(async (subscriber) => {
                try {
                    await sendMail({
                        email: subscriber.email,
                        subject: subject,
                        message: htmlMessage || message,
                    });
                    successCount++;
                } catch (error) {
                    console.log(`Failed to send email to ${subscriber.email}:`, error);
                    failCount++;
                }
            });

            await Promise.all(emailPromises);

            // Add delay between batches
            if (i + batchSize < activeSubscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        res.status(200).json({
            success: true,
            message: `Newsletter sent successfully! ${successCount} emails delivered, ${failCount} failed.`,
            stats: {
                totalSubscribers: activeSubscribers.length,
                successCount,
                failCount
            }
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});
