const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { validateLeadSave, validateLeadUpdate } = require('../middleware/validation');

router.post('/save', validateLeadSave, leadController.saveLead);
router.post('/update', validateLeadUpdate, leadController.updateLead);

module.exports = router;
