const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const gstRoutes = require('./routes/gstRoutes');
const leadRoutes = require('./routes/leadRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { corsOriginDelegate, getAllowedOrigins } = require('./utils/corsConfig');

// Validate required environment variables
const requiredEnvVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'FRONTEND_URL'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Missing required environment variable: ${varName}`);
        process.exit(1);
    }
});

console.log('✅ All required environment variables are set');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS: FRONTEND_URL (comma-separated) + any localhost/127.0.0.1 port in development
app.use(cors({
    origin: corsOriginDelegate,
    methods: ['GET', 'POST'],
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiter for order creation (5 requests per 15 minutes)
const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        error: {
            message: 'Too many order creation attempts. Please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for GST lookup (10 requests per 15 minutes)
const gstLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: {
            message: 'Too many GST verification attempts. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for lead save/update (10 requests per 15 minutes)
const leadsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/orders', orderLimiter, orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/gst', gstLimiter, gstRoutes);
app.use('/api/leads', leadsLimiter, leadRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;

// Start server only in non-serverless environment
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 Allowed origins: ${getAllowedOrigins().join(', ') || '(none listed)'}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log('🌐 Dev CORS: also allows http://localhost:* and http://127.0.0.1:*');
        }
    });
}
