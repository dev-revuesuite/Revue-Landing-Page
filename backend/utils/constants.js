// Plan configuration
const PLANS = {
    freelancer: {
        amount: 29900, // ₹299 in paise
        name: 'Freelancer Early Access',
        displayPrice: '₹299',
        description: 'For individual designers'
    },
    studio: {
        amount: 199900, // ₹1,999 in paise
        name: 'Studio Early Access',
        displayPrice: '₹1,999',
        description: 'For small creative teams (Up to 5 users)'
    }
};

// Currency
const CURRENCY = 'INR';

// GSTIN format: 2 digit state + 10 char PAN + entity + Z + check digit
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const GST_VERIFY_BASE_URL = 'https://gstverify.co.in/api/v1/verify';

// Error codes
const ERROR_CODES = {
    INVALID_PLAN: 'INVALID_PLAN',
    INVALID_EMAIL: 'INVALID_EMAIL',
    INVALID_GSTIN: 'INVALID_GSTIN',
    GST_NOT_ACTIVE: 'GST_NOT_ACTIVE',
    GST_API_KEY_MISSING: 'GST_API_KEY_MISSING',
    GST_PROVIDER_UNAVAILABLE: 'GST_PROVIDER_UNAVAILABLE',
    GST_PROVIDER_AUTH_ERROR: 'GST_PROVIDER_AUTH_ERROR',
    GST_PROVIDER_RATE_LIMIT: 'GST_PROVIDER_RATE_LIMIT',
    GST_PROVIDER_ERROR: 'GST_PROVIDER_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
    SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
    MISSING_FIELDS: 'MISSING_FIELDS',
    INVALID_NAME: 'INVALID_NAME',
    SHEETS_NOT_CONFIGURED: 'SHEETS_NOT_CONFIGURED',
    LEAD_SAVE_FAILED: 'LEAD_SAVE_FAILED',
    LEAD_UPDATE_FAILED: 'LEAD_UPDATE_FAILED',
    INVALID_ROW_ID: 'INVALID_ROW_ID',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

module.exports = {
    PLANS,
    CURRENCY,
    GSTIN_REGEX,
    GST_VERIFY_BASE_URL,
    ERROR_CODES
};
