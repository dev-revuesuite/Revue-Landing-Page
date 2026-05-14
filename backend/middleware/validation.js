const { validatePlan, validateEmail } = require('../utils/helpers');
const { ERROR_CODES } = require('../utils/constants');

// Validate order creation request
function validateOrderCreation(req, res, next) {
    const { plan, email } = req.body;

    // Validate plan
    if (!validatePlan(plan)) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid plan type. Must be "freelancer" or "studio"',
                code: ERROR_CODES.INVALID_PLAN,
                statusCode: 400
            }
        });
    }

    // Validate email
    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid email format',
                code: ERROR_CODES.INVALID_EMAIL,
                statusCode: 400
            }
        });
    }

    next();
}

// Validate payment verification request
function validatePaymentVerification(req, res, next) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Check all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
                code: ERROR_CODES.MISSING_FIELDS,
                statusCode: 400
            }
        });
    }

    next();
}

module.exports = {
    validateOrderCreation,
    validatePaymentVerification
};
