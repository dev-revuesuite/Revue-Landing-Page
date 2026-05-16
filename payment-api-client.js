// API base URL: local Express in dev; same origin on Vercel/production
const API_BASE_URL = (function () {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    return window.location.origin;
})();

async function parseJsonResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
    }
    return data;
}

// GST lookup
async function lookupGst(gstin) {
    const response = await fetch(`${API_BASE_URL}/api/gst/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstin })
    });
    const data = await parseJsonResponse(response);
    return data.data;
}

// Save lead to Google Sheets
async function saveLead(payload) {
    const response = await fetch(`${API_BASE_URL}/api/leads/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(response);
    return data.data;
}

// Update lead row after successful payment
async function updateLeadPayment(rowId, razorpayOrderId, razorpayPaymentId) {
    const response = await fetch(`${API_BASE_URL}/api/leads/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            rowId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId
        })
    });
    return parseJsonResponse(response);
}

// Create Razorpay order
async function createOrder(plan, email, extras = {}) {
    const body = { plan, email };
    if (extras.name) {
        body.name = extras.name;
    }
    if (extras.gstin) {
        body.gstin = extras.gstin;
    }

    const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await parseJsonResponse(response);
    return data.data;
}

// Verify payment
async function verifyPayment(paymentData) {
    const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
    });
    return parseJsonResponse(response);
}
