const express = require('express');
const { body } = require('express-validator');
const contactController = require('../../controllers/contact/contactController');
const { authenticateToken, requireRole } = require('../../middleware/auth/auth');
const { handleValidationErrors, contactValidationRules } = require('../../middleware/validation/validation');
const { contactLimiter } = require('../../config/security');

const router = express.Router();

// Public routes
router.post('/submit', contactLimiter, contactValidationRules, contactController.submitContact);

// Admin routes
router.get('/', authenticateToken, requireRole(['administrator']), contactController.getContacts);
router.get('/:id', authenticateToken, requireRole(['administrator']), contactController.getContactById);
router.post('/:id/reply', authenticateToken, requireRole(['administrator']), contactController.replyToContact);

module.exports = router;