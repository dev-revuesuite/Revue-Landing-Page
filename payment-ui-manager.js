// Show loading state
function showLoading(message) {
    const loadingOverlay = document.getElementById('payment-loading-overlay');
    const loadingMessage = document.getElementById('payment-loading-message');

    if (loadingMessage) {
        loadingMessage.textContent = message || 'Processing...';
    }

    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    disablePaymentButton();
}

// Hide loading state
function hideLoading() {
    const loadingOverlay = document.getElementById('payment-loading-overlay');

    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }

    enablePaymentButton();
}

// Show success message
function showSuccess(paymentDetails) {
    hideLoading();
    closeModal();

    const successContainer = document.getElementById('payment-success-container');
    const successMessage = document.getElementById('payment-success-message');

    if (successMessage) {
        successMessage.innerHTML = `
      <div class="success-icon">✓</div>
      <h2>Payment Successful!</h2>
      <p>Your early access spot has been secured.</p>
      <div class="payment-details">
        <p><strong>Payment ID:</strong> ${paymentDetails.paymentId}</p>
        <p><strong>Order ID:</strong> ${paymentDetails.orderId}</p>
      </div>
      <p class="next-steps">We'll send you an email with next steps shortly.</p>
    `;
    }

    if (successContainer) {
        successContainer.style.display = 'flex';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 5000);
    }
}

// Show error message
function showError(errorMessage, allowRetry) {
    hideLoading();

    const errorContainer = document.getElementById('payment-error-container');
    const errorMessageEl = document.getElementById('payment-error-message');

    if (errorMessageEl) {
        errorMessageEl.innerHTML = `
      <div class="error-icon">✕</div>
      <h2>Payment Failed</h2>
      <p>${errorMessage}</p>
      ${allowRetry ? '<button class="btn-retry" onclick="retryPayment()">Retry Payment</button>' : ''}
      <p class="support-text">Need help? Contact support at support@revuesuite.com</p>
    `;
    }

    if (errorContainer) {
        errorContainer.style.display = 'flex';
    }
}

// Hide error message
function hideError() {
    const errorContainer = document.getElementById('payment-error-container');
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

// Lead form inline errors (modal)
function showLeadFormError(message) {
    const el = document.getElementById('lead-form-error');
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
    }
}

function hideLeadFormError() {
    const el = document.getElementById('lead-form-error');
    if (el) {
        el.textContent = '';
        el.style.display = 'none';
    }
}

// Disable payment button
function disablePaymentButton() {
    const button = document.getElementById('m-cta-btn');
    if (button) {
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
    }
}

// Enable payment button
function enablePaymentButton() {
    const button = document.getElementById('m-cta-btn');
    if (button) {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}
