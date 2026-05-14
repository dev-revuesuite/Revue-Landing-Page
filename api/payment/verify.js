const crypto = require('crypto');
const { ERROR_CODES } = require('../../backend/utils/constants');

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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Missing required fields',
                    code: ERROR_CODES.VALIDATION_ERROR,
                    statusCode: 400
                }
            });
        }

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
};
