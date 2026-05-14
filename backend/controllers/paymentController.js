const crypto = require('crypto');
const { ERROR_CODES } = require('../utils/constants');

// Verify payment signature
function verifyPaymentSignature(orderId, paymentId, signature) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const message = `${orderId}|${paymentId}`;

    const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(message)
        .digest('hex');

    // Use timing-safe comparison
    try {
        return crypto.timingSafeEqual(
            Buffer.from(generatedSignature),
            Buffer.from(signature)
        );
    } catch (error) {
        return false;
    }
}

// Verify payment
async function verifyPayment(req, res, next) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (isValid) {
            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    verified: true
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Payment verification failed. Signature mismatch',
                    code: ERROR_CODES.SIGNATURE_MISMATCH,
                    statusCode: 401
                }
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to verify payment. Please contact support',
                code: ERROR_CODES.INTERNAL_ERROR,
                statusCode: 500
            }
        });
    }
}

module.exports = {
    verifyPayment
};
