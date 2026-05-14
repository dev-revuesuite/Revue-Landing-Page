const Razorpay = require('razorpay');

// Initialize Razorpay instance
function initializeRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
}

// Create Razorpay order
async function createOrder(options) {
    try {
        const razorpayInstance = initializeRazorpay();
        const order = await razorpayInstance.orders.create(options);
        return order;
    } catch (error) {
        throw new Error('Failed to create order with Razorpay: ' + error.message);
    }
}

module.exports = {
    initializeRazorpay,
    createOrder
};
