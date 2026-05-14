// Payment state
const paymentState = {
    isProcessing: false,
    currentOrderId: null,
    selectedPlan: null,
    userEmail: null
};

// Plan names mapping
const planNames = {
    freelancer: 'Freelancer Early Access',
    studio: 'Studio Early Access'
};

// Initialize payment flow
async function initializePayment(plan, email) {
    // Prevent duplicate submissions
    if (paymentState.isProcessing) {
        return;
    }

    try {
        paymentState.isProcessing = true;
        paymentState.selectedPlan = plan;
        paymentState.userEmail = email;

        // Show loading
        showLoading('Creating order...');

        // Create order
        const orderDetails = await createOrder(plan, email);
        paymentState.currentOrderId = orderDetails.orderId;

        // Load Razorpay script
        await loadRazorpayScript();

        // Hide loading before opening checkout
        hideLoading();

        // Open Razorpay checkout
        openCheckout(
            orderDetails,
            email,
            planNames[plan],
            handlePaymentSuccess,
            handlePaymentFailure,
            handleModalClose
        );

    } catch (error) {
        showError(error.message || 'Failed to initialize payment. Please try again.', true);
        paymentState.isProcessing = false;
    }
}

// Handle payment success
async function handlePaymentSuccess(response) {
    try {
        showLoading('Verifying payment...');

        // Verify payment
        const verificationResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
        });

        // Show success message
        showSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id
        });

        // Reset state
        paymentState.isProcessing = false;
        paymentState.currentOrderId = null;

    } catch (error) {
        showError('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id, false);
        paymentState.isProcessing = false;
    }
}

// Handle payment failure
function handlePaymentFailure(error) {
    const errorMessage = error.description || error.reason || 'Payment failed. Please try again.';
    showError(errorMessage, true);

    paymentState.isProcessing = false;
}

// Handle modal close (payment cancelled)
function handleModalClose() {
    if (paymentState.isProcessing) {
        showError('Payment was cancelled. You can try again when ready.', true);
        paymentState.isProcessing = false;
    }
}

// Retry payment
function retryPayment() {
    hideError();
    if (paymentState.selectedPlan && paymentState.userEmail) {
        initializePayment(paymentState.selectedPlan, paymentState.userEmail);
    }
}
