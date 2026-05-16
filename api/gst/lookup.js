const { lookupGstin, GstVerifyError } = require('../../backend/services/gstVerifyService');
const { normalizeGstin, validateGstinFormat } = require('../../backend/utils/helpers');
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

    const gstin = normalizeGstin(req.body?.gstin);

    if (!gstin) {
        return sendError(res, 400, 'GSTIN is required', ERROR_CODES.MISSING_FIELDS);
    }

    if (!validateGstinFormat(gstin)) {
        return sendError(
            res,
            400,
            'Please enter a valid 15-character GSTIN.',
            ERROR_CODES.INVALID_GSTIN
        );
    }

    try {
        const data = await lookupGstin(gstin);

        return res.status(200).json({
            success: true,
            data
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
};
