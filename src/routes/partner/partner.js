const express = require('express');
const { body } = require('express-validator');
const partnerController = require('../../controllers/partner/partnerController');
const { authenticateToken, requireRole } = require('../../middleware/auth/auth');
const { handleValidationErrors, partnerValidationRules } = require('../../middleware/validation/validation');
const { partnerLimiter } = require('../../config/security');

const router = express.Router();

// Public routes
router.post('/', partnerLimiter, partnerValidationRules, partnerController.submitApplication);
router.get('/status/:id', partnerController.getApplicationStatus);

// Admin routes
router.get('/admin', authenticateToken, requireRole(['administrator']), partnerController.getAllApplications);
router.get('/admin/:id', authenticateToken, requireRole(['administrator']), partnerController.getApplicationById);
router.patch('/admin/:id/status', authenticateToken, requireRole(['administrator']), partnerController.updateApplicationStatus);

module.exports = router;