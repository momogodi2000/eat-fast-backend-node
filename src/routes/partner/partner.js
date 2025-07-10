const express = require('express');
const { body } = require('express-validator');
const partnerController = require('../controllers/partnerController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { normalizePartnerFields } = require('../middleware/validation');
const { partnerLimiter } = require('../../config/security');

const router = express.Router();

// Validation middleware
const partnerValidation = [
  body('restaurantName').trim().isLength({ min: 2, max: 100 }),
  body('ownerName').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone('any'),
  body('address').trim().isLength({ min: 10, max: 500 }),
  body('cuisine').trim().isLength({ min: 2, max: 50 }),
  body('description').optional().isLength({ max: 1000 })
];

// Public routes
router.post('/', partnerLimiter, normalizePartnerFields, partnerValidation, partnerController.submitApplication);
router.get('/status/:id', partnerController.getApplicationStatus);

// Admin routes
router.get('/admin', authenticateToken, requireRole(['admin']), partnerController.getAllApplications);
router.get('/admin/:id', authenticateToken, requireRole(['admin']), partnerController.getApplicationById);
router.patch('/admin/:id/status', authenticateToken, requireRole(['admin']), partnerController.updateApplicationStatus);

module.exports = router;