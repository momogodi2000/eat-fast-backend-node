const express = require('express');
const { body } = require('express-validator');
const newsletterController = require('../controllers/newsletterController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { contactLimiter } = require('../config/security');

const router = express.Router();

// Validation middleware
const subscribeValidation = [
  body('email').isEmail().normalizeEmail()
];

// Public routes
router.post('/subscribe', contactLimiter, subscribeValidation, newsletterController.subscribe);
router.get('/confirm/:token', newsletterController.confirmSubscription);
router.get('/unsubscribe/:token', newsletterController.unsubscribe);
router.post('/unsubscribe/:token', newsletterController.unsubscribe);

// Admin routes
router.get('/admin/stats', authenticateToken, requireRole(['admin']), newsletterController.getStats);

module.exports = router;