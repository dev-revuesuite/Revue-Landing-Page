// Request logging middleware
function requestLogger(req, res, next) {
    const start = Date.now();

    // Log after response is sent
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log({
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
}

module.exports = {
    requestLogger
};
