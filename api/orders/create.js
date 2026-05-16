const razorpayService = require('../../backend/services/razorpayService');
const { getPlanDetails, generateReceiptId } = require('../../backend/utils/helpers');
const { CURRENCY, ERROR_CODES } = require('../../backend/utils/constants');
const { handlePreflight } = require('../../backend/utils/vercelCors');

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) {
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED', statusCode: 405 }
        });
    }

    try {
        const { plan, email, name, gstin } = req.body;

        // Validate plan and email
        if (!plan || !email) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Plan and email are required',
                    code: ERROR_CODES.VALIDATION_ERROR,
                    statusCode: 400
                }
            });
        }

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
                timestamp: new Date().toISOString(),
                ...(name ? { name: String(name).trim() } : {}),
                ...(gstin ? { gstin: String(gstin).trim() } : {})
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
};
