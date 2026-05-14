const razorpayService = require('../../backend/services/razorpayService');
const { getPlanDetails, generateReceiptId } = require('../../backend/utils/helpers');
const { CURRENCY, ERROR_CODES } = require('../../backend/utils/constants');
const { validateOrderCreation } = require('../../backend/middleware/validation');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
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
        const { plan, email } = req.body;

        // Validate input
        const validation = validateOrderCreation(req, res, () => { });
        if (validation === false) return; // Validation middleware already sent response

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
};
