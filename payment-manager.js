// Payment state
const paymentState = {
    isProcessing: false,
    currentOrderId: null,
    selectedPlan: null,
    userEmail: null,
    leadRowId: null,
    leadName: null,
    leadGstin: null
};

const planNames = {
    freelancer: 'Freelancer Early Access',
    studio: 'Studio Early Access'
};

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resetLeadPaymentState() {
    paymentState.leadRowId = null;
    paymentState.leadName = null;
    paymentState.leadGstin = null;
    paymentState.isProcessing = false;
}

function normalizeGstinClient(gstin) {
    return (gstin || '').trim().toUpperCase().replace(/\s+/g, '');
}

function collectLeadForm() {
    const nameEl = document.getElementById('lead-name');
    const emailEl = document.getElementById('lead-email');
    const hasGstEl = document.getElementById('has-gst');
    const gstinEl = document.getElementById('lead-gstin');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const hasGst = hasGstEl ? hasGstEl.checked : false;
    const gstin = normalizeGstinClient(gstinEl ? gstinEl.value : '');

    if (name.length < 2) {
        return { valid: false, message: 'Please enter your full name.' };
    }

    if (!EMAIL_PATTERN.test(email)) {
        return { valid: false, message: 'Please enter a valid email address.' };
    }

    if (hasGst) {
        if (gstin.length !== 15) {
            return { valid: false, message: 'Please enter a valid 15-character GSTIN.' };
        }
        if (!GSTIN_PATTERN.test(gstin)) {
            return { valid: false, message: 'Please enter a valid 15-character GSTIN.' };
        }
    }

    return {
        valid: true,
        name,
        email,
        hasGst,
        gstin: hasGst ? gstin : '',
        company: '',
        address: ''
    };
}

async function handleContinueToPayment(plan) {
    if (paymentState.isProcessing) {
        return;
    }

    const lead = collectLeadForm();
    if (!lead.valid) {
        if (typeof showLeadFormError === 'function') {
            showLeadFormError(lead.message);
        }
        return;
    }

    if (typeof hideLeadFormError === 'function') {
        hideLeadFormError();
    }
    if (typeof hideError === 'function') {
        hideError();
    }

    paymentState.isProcessing = true;
    paymentState.selectedPlan = plan;

    try {
        let gstin = '';
        let company = '';
        let address = '';

        if (lead.hasGst) {
            showLoading('Verifying GST...');
            const gstData = await lookupGst(lead.gstin);
            gstin = gstData.gstin || lead.gstin;
            company = gstData.company || '';
            address = gstData.address || '';
        }

        if (!paymentState.leadRowId) {
            showLoading('Saving your details...');
            const saveResult = await saveLead({
                name: lead.name,
                email: lead.email,
                plan: plan,
                gstin: gstin,
                company: company,
                address: address
            });
            paymentState.leadRowId = saveResult.rowId;
        }

        paymentState.leadName = lead.name;
        paymentState.leadGstin = gstin;
        paymentState.userEmail = lead.email;

        await initializePayment(plan, lead.email, {
            name: lead.name,
            gstin: gstin
        });
    } catch (error) {
        hideLoading();
        const message = error.message || 'Something went wrong. Please try again.';
        if (typeof showLeadFormError === 'function') {
            showLeadFormError(message);
        } else if (typeof showError === 'function') {
            showError(message, false);
        }
        paymentState.isProcessing = false;
        enablePaymentButton();
    }
}

async function initializePayment(plan, email, extras = {}) {
    try {
        paymentState.isProcessing = true;
        paymentState.selectedPlan = plan;
        paymentState.userEmail = email;

        showLoading('Creating order...');

        const orderDetails = await createOrder(plan, email, extras);
        paymentState.currentOrderId = orderDetails.orderId;

        await loadRazorpayScript();

        hideLoading();

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
        enablePaymentButton();
    }
}

async function handlePaymentSuccess(response) {
    try {
        showLoading('Verifying payment...');

        await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
        });

        if (paymentState.leadRowId) {
            try {
                await updateLeadPayment(
                    paymentState.leadRowId,
                    response.razorpay_order_id,
                    response.razorpay_payment_id
                );
            } catch (updateError) {
                console.error('Lead sheet update failed:', updateError.message);
            }
        }

        showSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id
        });

        paymentState.isProcessing = false;
        paymentState.currentOrderId = null;
        resetLeadPaymentState();
    } catch (error) {
        showError(
            'Payment verification failed. Please contact support with your payment ID: ' +
                response.razorpay_payment_id,
            false
        );
        paymentState.isProcessing = false;
    }
}

function handlePaymentFailure(error) {
    if (typeof closeCheckout === 'function') {
        closeCheckout();
    }
    const errorMessage = error.description || error.reason || 'Payment failed. Please try again.';
    showError(errorMessage, true);
    paymentState.isProcessing = false;
}

function handleModalClose() {
    if (paymentState.isProcessing) {
        showError('Payment was cancelled. You can try again when ready.', true);
        paymentState.isProcessing = false;
        enablePaymentButton();
    }
}

function retryPayment() {
    hideError();
    if (typeof closeCheckout === 'function') {
        closeCheckout();
    }
    if (paymentState.selectedPlan && paymentState.userEmail) {
        handleContinueToPayment(paymentState.selectedPlan);
    }
}
