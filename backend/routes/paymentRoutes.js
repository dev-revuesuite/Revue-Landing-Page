const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validatePaymentVerification } = require('../middleware/validation');

// POST /api/payment/verify
router.post('/verify', validatePaymentVerification, paymentController.verifyPayment);

module.exports = router;
