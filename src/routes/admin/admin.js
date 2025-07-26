const express = require('express');
const { body } = require('express-validator');
const adminController = require('../../controllers/admin/adminController');
const { authenticateToken, requireRole } = require('../../middleware/auth/auth');
const { handleValidationErrors, validateUUIDParam, validatePagination } = require('../../middleware/validation/validation');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['administrator']));

// User management validation
const userUpdateValidation = [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').optional().isMobilePhone('any').withMessage('Please provide a valid phone number'),
  body('status').optional().isIn(['pending', 'active', 'suspended', 'banned']).withMessage('Invalid status'),
  body('roleId').optional().isUUID().withMessage('Invalid role ID'),
  handleValidationErrors
];

const userStatusValidation = [
  body('status').isIn(['pending', 'active', 'suspended', 'banned']).withMessage('Invalid status'),
  handleValidationErrors
];

const restaurantValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Restaurant name must be between 2 and 100 characters'),
  body('status').optional().isIn(['pending', 'active', 'suspended', 'banned']).withMessage('Invalid status'),
  handleValidationErrors
];

// Dashboard and Statistics Routes
router.get('/dashboard', adminController.getDashboardStats);
router.get('/statistics', adminController.getDetailedStatistics);

// User Management Routes
router.get('/users', validatePagination, handleValidationErrors, adminController.getUsers);
router.get('/users/:id', validateUUIDParam('id'), handleValidationErrors, adminController.getUserById);
router.put('/users/:id', validateUUIDParam('id'), userUpdateValidation, adminController.updateUser);
router.patch('/users/:id/status', validateUUIDParam('id'), userStatusValidation, adminController.updateUserStatus);
router.delete('/users/:id', validateUUIDParam('id'), handleValidationErrors, adminController.deleteUser);
router.post('/users/:id/documents/approve', validateUUIDParam('id'), handleValidationErrors, adminController.approveUserDocuments);
router.post('/users/:id/documents/reject', validateUUIDParam('id'), handleValidationErrors, adminController.rejectUserDocuments);

// Restaurant Management Routes  
router.get('/restaurants', validatePagination, handleValidationErrors, adminController.getRestaurants);
router.get('/restaurants/:id', validateUUIDParam('id'), handleValidationErrors, adminController.getRestaurantById);
router.put('/restaurants/:id', validateUUIDParam('id'), restaurantValidation, adminController.updateRestaurant);
router.patch('/restaurants/:id/status', validateUUIDParam('id'), userStatusValidation, adminController.updateRestaurantStatus);
router.delete('/restaurants/:id', validateUUIDParam('id'), handleValidationErrors, adminController.deleteRestaurant);

// Order Management Routes
router.get('/orders', validatePagination, handleValidationErrors, adminController.getOrders);
router.get('/orders/:id', validateUUIDParam('id'), handleValidationErrors, adminController.getOrderById);
router.patch('/orders/:id/status', validateUUIDParam('id'), handleValidationErrors, adminController.updateOrderStatus);

// System Management Routes
router.get('/roles', adminController.getRoles);
router.get('/analytics', adminController.getAnalytics);
router.get('/support-tickets', validatePagination, handleValidationErrors, adminController.getSupportTickets);
router.get('/contact-messages', validatePagination, handleValidationErrors, adminController.getContactMessages);

// Reports and Exports
router.get('/reports/users', adminController.generateUserReport);
router.get('/reports/orders', adminController.generateOrderReport);
router.get('/reports/revenue', adminController.generateRevenueReport);

module.exports = router;