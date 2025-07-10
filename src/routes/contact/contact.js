const express = require('express');
const { body } = require('express-validator');
const contactController = require('../controllers/contactController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { normalizeContactFields } = require('../middleware/validation');
const { contactLimiter } = require('../../config/security');

const router = express.Router();

// Validation middleware
const contactValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().isLength({ min: 5, max: 200 }),
  body('message').trim().isLength({ min: 10, max: 1000 })
];

// Public routes
router.post('/submit', contactLimiter, normalizeContactFields, contactValidation, contactController.submitContact);

// Admin routes
router.get('/', authenticateToken, requireRole(['admin']), contactController.getContacts);
router.get('/:id', authenticateToken, requireRole(['admin']), contactController.getContactById);
router.post('/:id/reply', authenticateToken, requireRole(['admin']), contactController.replyToContact);

module.exports = router;