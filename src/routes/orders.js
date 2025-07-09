const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generalLimiter } = require('../config/security');

const router = express.Router();

// Validation middleware
const guestOrderValidation = [
  body('items').isArray({ min: 1 }),
  body('items.*.dishId').isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('deliveryAddress').trim().isLength({ min: 10, max: 500 }),
  body('customerName').trim().isLength({ min: 2, max: 100 }),
  body('customerPhone').isMobilePhone('any'),
  body('customerEmail').optional().isEmail(),
  body('restaurantId').isUUID()
];

// Public routes
router.post('/guest', generalLimiter, guestOrderValidation, orderController.createGuestOrder);
router.get('/receipt/:orderId', orderController.getOrderReceipt);

// Protected routes
router.post('/guest/attach-user', authenticateToken, orderController.attachGuestOrder);
router.patch('/:orderId/status', 
  authenticateToken, 
  requireRole(['admin', 'restaurant_manager']), 
  orderController.updateOrderStatus
);

module.exports = router;