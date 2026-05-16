const { lookupGstin, GstVerifyError } = require('../services/gstVerifyService');
const { ERROR_CODES } = require('../utils/constants');

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

async function lookupGst(req, res) {
    try {
        const result = await lookupGstin(req.body.gstin);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error instanceof GstVerifyError) {
            return sendError(res, error.statusCode, error.message, error.code);
        }

        console.error('GST lookup error:', error.message);

        return sendError(
            res,
            500,
            'Could not verify GST. Please try again.',
            ERROR_CODES.INTERNAL_ERROR
        );
    }
}

module.exports = {
    lookupGst
};
