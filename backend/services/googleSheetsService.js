const { ERROR_CODES } = require('../utils/constants');

class GoogleSheetsError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

function getWebhookUrl() {
    const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!url) {
        throw new GoogleSheetsError(
            'Lead storage is not configured. Please contact support.',
            500,
            ERROR_CODES.SHEETS_NOT_CONFIGURED
        );
    }
    return url;
}

async function postToWebhook(payload, errorCode, fallbackMessage) {
    const url = getWebhookUrl();

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });
    } catch (error) {
        throw new GoogleSheetsError(fallbackMessage, 503, errorCode);
    }

    const text = await response.text();
    let body;

    try {
        body = JSON.parse(text);
    } catch (error) {
        throw new GoogleSheetsError(fallbackMessage, 502, errorCode);
    }

    if (!response.ok || !body.success) {
        const message = typeof body.error === 'string' ? body.error : fallbackMessage;
        throw new GoogleSheetsError(message, 502, errorCode);
    }

    return body;
}

const SAVE_FAILED_MESSAGE = "We couldn't save your details. Please try again.";
const UPDATE_FAILED_MESSAGE = 'Could not update payment status. Please contact support with your payment ID.';

async function appendLead({ name, email, plan, gstin, company, address }) {
    const body = await postToWebhook({
        action: 'append',
        timestamp: new Date().toISOString(),
        name,
        email,
        gstin: gstin || '',
        company: company || '',
        address: address || '',
        plan,
        payment_status: 'pending'
    }, ERROR_CODES.LEAD_SAVE_FAILED, SAVE_FAILED_MESSAGE);

    const rowId = Number(body.rowId);
    if (!rowId || rowId < 2) {
        throw new GoogleSheetsError(
            "We couldn't save your details. Please try again.",
            502,
            ERROR_CODES.LEAD_SAVE_FAILED
        );
    }

    return { rowId };
}

async function updateLeadPayment(rowId, razorpayOrderId, razorpayPaymentId) {
    await postToWebhook({
        action: 'update',
        rowId,
        payment_status: 'paid',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId
    }, ERROR_CODES.LEAD_UPDATE_FAILED, UPDATE_FAILED_MESSAGE);

    return { rowId };
}

module.exports = {
    GoogleSheetsError,
    appendLead,
    updateLeadPayment
};
