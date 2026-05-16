const { PLANS, GSTIN_REGEX } = require('./constants');

const GSTIN_CHECKSUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Validate plan type
function validatePlan(plan) {
    return plan && (plan === 'freelancer' || plan === 'studio');
}

// Get plan amount
function getPlanAmount(plan) {
    if (!validatePlan(plan)) {
        return null;
    }
    return PLANS[plan].amount;
}

// Get plan details
function getPlanDetails(plan) {
    if (!validatePlan(plan)) {
        return null;
    }
    return PLANS[plan];
}

// Validate lead name (min 2 characters after trim)
function validateName(name) {
    if (!name || typeof name !== 'string') {
        return false;
    }
    return name.trim().length >= 2;
}

// Validate email format
function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Normalize GSTIN: trim, uppercase, remove spaces
function normalizeGstin(gstin) {
    if (!gstin || typeof gstin !== 'string') {
        return '';
    }
    return gstin.trim().toUpperCase().replace(/\s+/g, '');
}

// Validate GSTIN checksum (15th character)
function validateGstinChecksum(gstin) {
    let sum = 0;
    for (let i = 0; i < 14; i++) {
        const code = GSTIN_CHECKSUM_CHARS.indexOf(gstin[i]);
        if (code === -1) {
            return false;
        }
        const weight = (i % 2) + 1;
        let product = code * weight;
        sum += Math.floor(product / 36) + (product % 36);
    }
    const checksumIndex = (36 - (sum % 36)) % 36;
    return gstin[14] === GSTIN_CHECKSUM_CHARS[checksumIndex];
}

// Validate GSTIN format and checksum
function validateGstinFormat(gstin) {
    const normalized = normalizeGstin(gstin);
    if (normalized.length !== 15 || !GSTIN_REGEX.test(normalized)) {
        return false;
    }
    return validateGstinChecksum(normalized);
}

// Generate unique receipt ID
function generateReceiptId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `rcpt_${timestamp}_${random}`;
}

module.exports = {
    validatePlan,
    getPlanAmount,
    getPlanDetails,
    validateName,
    validateEmail,
    normalizeGstin,
    validateGstinFormat,
    generateReceiptId
};
