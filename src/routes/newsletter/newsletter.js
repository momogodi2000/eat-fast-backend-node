const express = require('express');
const { body } = require('express-validator');
const newsletterController = require('../../controllers/newsletter/newsletterController');
const { authenticateToken, requireRole } = require('../../middleware/auth/auth');
const { handleValidationErrors, newsletterValidationRules } = require('../../middleware/validation/validation');
const { contactLimiter } = require('../../config/security');

const router = express.Router();

// Public routes
router.post('/subscribe', contactLimiter, newsletterValidationRules, newsletterController.subscribe);
router.get('/confirm/:token', newsletterController.confirmSubscription);
router.get('/unsubscribe/:token', newsletterController.unsubscribe);
router.post('/unsubscribe/:token', newsletterController.unsubscribe);

// Admin routes
router.get('/admin/stats', authenticateToken, requireRole(['administrator']), newsletterController.getStats);

module.exports = router;