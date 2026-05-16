const { updateLeadPayment, GoogleSheetsError } = require('../../backend/services/googleSheetsService');
const { ERROR_CODES } = require('../../backend/utils/constants');
const { handlePreflight } = require('../../backend/utils/vercelCors');

function sendError(res, statusCode, message, code) {
    return res.status(statusCode).json({
        success: false,
        error: {
            message,
            code,
            statusCode
        }
    });
}

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) {
        return;
    }

    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
    }

    const rowId = Number(req.body?.rowId);
    const razorpay_order_id = typeof req.body?.razorpay_order_id === 'string'
        ? req.body.razorpay_order_id.trim()
        : '';
    const razorpay_payment_id = typeof req.body?.razorpay_payment_id === 'string'
        ? req.body.razorpay_payment_id.trim()
        : '';

    if (!Number.isInteger(rowId) || rowId < 2) {
        return sendError(
            res,
            400,
            'Invalid row reference for lead update.',
            ERROR_CODES.INVALID_ROW_ID
        );
    }

    if (!razorpay_order_id || !razorpay_payment_id) {
        return sendError(
            res,
            400,
            'Missing required fields: rowId, razorpay_order_id, razorpay_payment_id',
            ERROR_CODES.MISSING_FIELDS
        );
    }

    try {
        const result = await updateLeadPayment(rowId, razorpay_order_id, razorpay_payment_id);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error instanceof GoogleSheetsError) {
            return sendError(res, error.statusCode, error.message, ERROR_CODES.LEAD_UPDATE_FAILED);
        }

        console.error('Lead update error:', error.message);

        return sendError(
            res,
            500,
            'Could not update payment status. Please contact support with your payment ID.',
            ERROR_CODES.LEAD_UPDATE_FAILED
        );
    }
};
