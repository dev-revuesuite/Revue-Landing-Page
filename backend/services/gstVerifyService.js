const { GST_VERIFY_BASE_URL, ERROR_CODES } = require('../utils/constants');
const { normalizeGstin } = require('../utils/helpers');

class GstVerifyError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

function getApiKey() {
    const apiKey = process.env.GSTVERIFY_API_KEY;
    if (!apiKey) {
        throw new GstVerifyError(
            'GST verification is not configured. Please contact support.',
            500,
            ERROR_CODES.GST_API_KEY_MISSING
        );
    }
    return apiKey;
}

function mapProviderError(status, body) {
    const providerMessage = typeof body?.error === 'string'
        ? body.error
        : body?.error?.message || body?.message;

    switch (status) {
        case 401:
            return new GstVerifyError(
                'GST verification is not configured correctly. Please contact support.',
                500,
                ERROR_CODES.GST_PROVIDER_AUTH_ERROR
            );
        case 402:
            return new GstVerifyError(
                'GST verification is temporarily unavailable. Please try again later or continue without GST.',
                503,
                ERROR_CODES.GST_PROVIDER_UNAVAILABLE
            );
        case 422:
            return new GstVerifyError(
                'This GSTIN does not look valid. Please check the number and try again.',
                400,
                ERROR_CODES.INVALID_GSTIN
            );
        case 429:
            return new GstVerifyError(
                'Too many GST verification attempts. Please try again in a few minutes.',
                429,
                ERROR_CODES.GST_PROVIDER_RATE_LIMIT
            );
        case 502:
            return new GstVerifyError(
                'GST verification is temporarily unavailable. Please try again in a few minutes or continue without GST.',
                503,
                ERROR_CODES.GST_PROVIDER_UNAVAILABLE
            );
        default:
            return new GstVerifyError(
                providerMessage || 'Could not verify GST. Please try again.',
                status >= 400 && status < 500 ? status : 502,
                ERROR_CODES.GST_PROVIDER_ERROR
            );
    }
}

function mapGstData(data) {
    const status = (data.status || '').trim();
    const company = (data.legal_name || data.trade_name || '').trim();
    const address = (data.address || '').trim();

    if (status.toLowerCase() !== 'active') {
        throw new GstVerifyError(
            'This GST registration is not active. Please use an active GSTIN or continue without GST.',
            400,
            ERROR_CODES.GST_NOT_ACTIVE
        );
    }

    if (!company || !address) {
        throw new GstVerifyError(
            'Could not retrieve complete GST details. Please try again.',
            502,
            ERROR_CODES.GST_PROVIDER_ERROR
        );
    }

    return {
        gstin: data.gstin,
        company,
        tradeName: data.trade_name || null,
        address,
        status
    };
}

async function lookupGstin(rawGstin) {
    const gstin = normalizeGstin(rawGstin);
    const apiKey = getApiKey();
    const url = `${GST_VERIFY_BASE_URL}/${encodeURIComponent(gstin)}`;

    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                Accept: 'application/json'
            }
        });
    } catch (error) {
        throw new GstVerifyError(
            'GST verification is temporarily unavailable. Please try again in a few minutes.',
            503,
            ERROR_CODES.GST_PROVIDER_UNAVAILABLE
        );
    }

    let body = {};
    try {
        body = await response.json();
    } catch (error) {
        body = {};
    }

    if (!response.ok) {
        throw mapProviderError(response.status, body);
    }

    if (!body.success || !body.data) {
        throw new GstVerifyError(
            body.error || 'Could not verify GST. Please try again.',
            400,
            ERROR_CODES.GST_PROVIDER_ERROR
        );
    }

    return mapGstData(body.data);
}

module.exports = {
    GstVerifyError,
    lookupGstin
};
