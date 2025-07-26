const express = require('express');
const { body } = require('express-validator');
const orderController = require('../../controllers/order/orderController');
const { authenticateToken, requireRole } = require('../../middleware/auth/auth');
const { handleValidationErrors, validateUUIDParam } = require('../../middleware/validation/validation');
const { generalLimiter } = require('../../config/security');

const router = express.Router();

// Validation middleware
const guestOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.dishId').isUUID().withMessage('Invalid dish ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress').trim().isLength({ min: 10, max: 500 }).withMessage('Delivery address must be between 10 and 500 characters'),
  body('customerName').trim().isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2 and 100 characters'),
  body('customerPhone').isMobilePhone('any').withMessage('Please provide a valid phone number'),
  body('customerEmail').optional().isEmail().withMessage('Please provide a valid email address'),
  body('restaurantId').isUUID().withMessage('Invalid restaurant ID'),
  handleValidationErrors
];

// Public routes
router.post('/guest', generalLimiter, guestOrderValidation, orderController.createGuestOrder);
router.get('/receipt/:orderId', validateUUIDParam('orderId'), handleValidationErrors, orderController.getOrderReceipt);

// Protected routes
router.post('/guest/attach-user', authenticateToken, orderController.attachGuestOrder);
router.patch('/:orderId/status', 
  authenticateToken, 
  requireRole(['administrator', 'restaurant_manager']), 
  validateUUIDParam('orderId'),
  handleValidationErrors,
  orderController.updateOrderStatus
);

module.exports = router;