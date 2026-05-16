const {
    validatePlan,
    validateName,
    validateEmail,
    normalizeGstin,
    validateGstinFormat
} = require('../utils/helpers');
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

// Validate GST lookup request
function validateGstLookup(req, res, next) {
    const gstin = normalizeGstin(req.body?.gstin);

    if (!gstin) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'GSTIN is required',
                code: ERROR_CODES.MISSING_FIELDS,
                statusCode: 400
            }
        });
    }

    if (!validateGstinFormat(gstin)) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Please enter a valid 15-character GSTIN.',
                code: ERROR_CODES.INVALID_GSTIN,
                statusCode: 400
            }
        });
    }

    req.body.gstin = gstin;
    next();
}

// Validate lead save request
function validateLeadSave(req, res, next) {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const plan = req.body?.plan;
    const gstin = normalizeGstin(req.body?.gstin);
    const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
    const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';

    if (!validateName(name)) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Please enter your full name.',
                code: ERROR_CODES.INVALID_NAME,
                statusCode: 400
            }
        });
    }

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

    if (gstin && (!company || !address)) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Company and address are required when GSTIN is provided.',
                code: ERROR_CODES.VALIDATION_ERROR,
                statusCode: 400
            }
        });
    }

    req.body = { name, email, plan, gstin, company, address };
    next();
}

// Validate lead update after payment
function validateLeadUpdate(req, res, next) {
    const rowId = Number(req.body?.rowId);
    const razorpay_order_id = typeof req.body?.razorpay_order_id === 'string'
        ? req.body.razorpay_order_id.trim()
        : '';
    const razorpay_payment_id = typeof req.body?.razorpay_payment_id === 'string'
        ? req.body.razorpay_payment_id.trim()
        : '';

    if (!Number.isInteger(rowId) || rowId < 2) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid row reference for lead update.',
                code: ERROR_CODES.INVALID_ROW_ID,
                statusCode: 400
            }
        });
    }

    if (!razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Missing required fields: rowId, razorpay_order_id, razorpay_payment_id',
                code: ERROR_CODES.MISSING_FIELDS,
                statusCode: 400
            }
        });
    }

    req.body = { rowId, razorpay_order_id, razorpay_payment_id };
    next();
}

module.exports = {
    validateOrderCreation,
    validatePaymentVerification,
    validateGstLookup,
    validateLeadSave,
    validateLeadUpdate
};
