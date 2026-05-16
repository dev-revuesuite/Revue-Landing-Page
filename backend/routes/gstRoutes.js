const express = require('express');
const router = express.Router();
const gstController = require('../controllers/gstController');
const { validateGstLookup } = require('../middleware/validation');

router.post('/lookup', validateGstLookup, gstController.lookupGst);

module.exports = router;
