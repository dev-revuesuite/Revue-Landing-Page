// Comma-separated origins in FRONTEND_URL, e.g.:
// FRONTEND_URL=https://revuesuite.com
// FRONTEND_URL=http://127.0.0.1:5501,http://localhost:5500

const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function getAllowedOrigins() {
    const raw = process.env.FRONTEND_URL || '';
    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

function isLocalDevOrigin(origin) {
    return LOCAL_DEV_ORIGIN_PATTERN.test(origin);
}

function isOriginAllowed(origin) {
    if (!origin) {
        return true;
    }

    const allowed = getAllowedOrigins();
    if (allowed.includes(origin)) {
        return true;
    }

    if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) {
        return true;
    }

    return false;
}

function corsOriginDelegate(origin, callback) {
    if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
}

module.exports = {
    getAllowedOrigins,
    isOriginAllowed,
    corsOriginDelegate
};
