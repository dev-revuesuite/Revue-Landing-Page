const { isOriginAllowed, getAllowedOrigins } = require('./corsConfig');

function applyCorsHeaders(req, res) {
    const origin = req.headers.origin;

    if (origin && isOriginAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        const allowed = getAllowedOrigins();
        if (allowed.length > 0) {
            res.setHeader('Access-Control-Allow-Origin', allowed[0]);
        } else {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
    } else {
        const allowed = getAllowedOrigins();
        res.setHeader('Access-Control-Allow-Origin', allowed[0] || process.env.FRONTEND_URL || '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
}

function handlePreflight(req, res) {
    applyCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

module.exports = {
    applyCorsHeaders,
    handlePreflight
};
