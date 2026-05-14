const { PLANS } = require('./constants');

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

// Validate email format
function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    validateEmail,
    generateReceiptId
};
