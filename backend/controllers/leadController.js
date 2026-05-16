const { appendLead, updateLeadPayment, GoogleSheetsError } = require('../services/googleSheetsService');
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

async function saveLead(req, res) {
    try {
        const { name, email, plan, gstin, company, address } = req.body;
        const result = await appendLead({
            name,
            email,
            plan,
            gstin,
            company,
            address
        });

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error instanceof GoogleSheetsError) {
            return sendError(res, error.statusCode, error.message, error.code);
        }

        console.error('Lead save error:', error.message);

        return sendError(
            res,
            500,
            "We couldn't save your details. Please try again.",
            ERROR_CODES.LEAD_SAVE_FAILED
        );
    }
}

async function updateLead(req, res) {
    try {
        const { rowId, razorpay_order_id, razorpay_payment_id } = req.body;
        const result = await updateLeadPayment(
            rowId,
            razorpay_order_id,
            razorpay_payment_id
        );

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error instanceof GoogleSheetsError) {
            return sendError(
                res,
                error.statusCode,
                error.message,
                ERROR_CODES.LEAD_UPDATE_FAILED
            );
        }

        console.error('Lead update error:', error.message);

        return sendError(
            res,
            500,
            'Could not update payment status. Please contact support with your payment ID.',
            ERROR_CODES.LEAD_UPDATE_FAILED
        );
    }
}

module.exports = {
    saveLead,
    updateLead
};
