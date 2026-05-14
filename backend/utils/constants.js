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

// Error codes
const ERROR_CODES = {
    INVALID_PLAN: 'INVALID_PLAN',
    INVALID_EMAIL: 'INVALID_EMAIL',
    ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
    SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
    MISSING_FIELDS: 'MISSING_FIELDS',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

module.exports = {
    PLANS,
    CURRENCY,
    ERROR_CODES
};
