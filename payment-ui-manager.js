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
      <h2>Payment Successful</h2>
      <p>Payment has been successful. You will receive the invoice in your mail id.</p>
      <div class="payment-success-actions">
        <button type="button" class="btn-back-site" onclick="dismissPaymentSuccess()">Back to Site</button>
      </div>
      <div class="social-follow">
        <p class="follow-text">Follow us on Social Media</p>
        <div class="social-icons">
          <a href="https://www.instagram.com/revue.010825/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="https://x.com/Revue010826" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://www.linkedin.com/company/117174007/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </div>
    `;
    }

    if (successContainer) {
        successContainer.style.display = 'flex';
    }
}

function dismissPaymentSuccess() {
    const successContainer = document.getElementById('payment-success-container');
    if (successContainer) {
        successContainer.style.display = 'none';
    }
}

// Show error message
function showError(errorMessage, allowRetry) {
    hideLoading();
    if (typeof closeCheckout === 'function') {
        closeCheckout();
    }

    const errorContainer = document.getElementById('payment-error-container');
    const errorMessageEl = document.getElementById('payment-error-message');

    if (errorMessageEl) {
        errorMessageEl.innerHTML = `
      <button type="button" class="payment-overlay-close" onclick="dismissPaymentError()" aria-label="Close">×</button>
      <div class="error-icon">✕</div>
      <h2>Payment Failed</h2>
      <p>${errorMessage}</p>
      <div class="payment-error-actions">
        ${allowRetry ? '<button type="button" class="btn-retry" onclick="retryPayment()">Retry Payment</button>' : ''}
        <button type="button" class="btn-back-website" onclick="dismissPaymentError()">Back to Website</button>
      </div>
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

function dismissPaymentError() {
    hideError();
    if (typeof closeCheckout === 'function') {
        closeCheckout();
    }
    if (typeof paymentState !== 'undefined') {
        paymentState.isProcessing = false;
    }
    enablePaymentButton();
    if (typeof closeModal === 'function') {
        closeModal();
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
