const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrderCreation } = require('../middleware/validation');

// POST /api/orders/create
router.post('/create', validateOrderCreation, orderController.createOrder);

module.exports = router;
