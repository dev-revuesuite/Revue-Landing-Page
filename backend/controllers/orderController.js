const razorpayService = require('../services/razorpayService');
const { getPlanAmount, getPlanDetails, generateReceiptId } = require('../utils/helpers');
const { CURRENCY, ERROR_CODES } = require('../utils/constants');

// Create order
async function createOrder(req, res, next) {
    try {
        const { plan, email } = req.body;

        // Get plan details
        const planDetails = getPlanDetails(plan);
        if (!planDetails) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid plan type. Must be "freelancer" or "studio"',
                    code: ERROR_CODES.INVALID_PLAN,
                    statusCode: 400
                }
            });
        }

        // Generate receipt ID
        const receipt = generateReceiptId();

        // Prepare order options
        const orderOptions = {
            amount: planDetails.amount,
            currency: CURRENCY,
            receipt: receipt,
            notes: {
                email: email,
                plan: plan,
                planName: planDetails.name,
                timestamp: new Date().toISOString()
            }
        };

        // Create order with Razorpay
        const order = await razorpayService.createOrder(orderOptions);

        // Return success response
        res.status(200).json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create order. Please try again',
                code: ERROR_CODES.ORDER_CREATION_FAILED,
                statusCode: 500
            }
        });
    }
}

module.exports = {
    createOrder
};
