const { appendLead, GoogleSheetsError } = require('../../backend/services/googleSheetsService');
const {
    validatePlan,
    validateName,
    validateEmail,
    normalizeGstin
} = require('../../backend/utils/helpers');
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

function validateSaveBody(body) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const plan = body?.plan;
    const gstin = normalizeGstin(body?.gstin);
    const company = typeof body?.company === 'string' ? body.company.trim() : '';
    const address = typeof body?.address === 'string' ? body.address.trim() : '';

    if (!validateName(name)) {
        return { error: sendErrorPayload('Please enter your full name.', ERROR_CODES.INVALID_NAME, 400) };
    }

    if (!validateEmail(email)) {
        return { error: sendErrorPayload('Invalid email format', ERROR_CODES.INVALID_EMAIL, 400) };
    }

    if (!validatePlan(plan)) {
        return {
            error: sendErrorPayload(
                'Invalid plan type. Must be "freelancer" or "studio"',
                ERROR_CODES.INVALID_PLAN,
                400
            )
        };
    }

    if (gstin && (!company || !address)) {
        return {
            error: sendErrorPayload(
                'Company and address are required when GSTIN is provided.',
                ERROR_CODES.VALIDATION_ERROR,
                400
            )
        };
    }

    return { data: { name, email, plan, gstin, company, address } };
}

function sendErrorPayload(message, code, statusCode) {
    return { message, code, statusCode };
}

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) {
        return;
    }

    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
    }

    const validation = validateSaveBody(req.body);
    if (validation.error) {
        const { message, code, statusCode } = validation.error;
        return sendError(res, statusCode, message, code);
    }

    try {
        const result = await appendLead(validation.data);

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
};
