// src/routes/dashboard.js
const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// Role-based dashboard routes
router.get('/admin', requireRole(['admin']), dashboardController.getAdminDashboard);
router.get('/restaurant', requireRole(['restaurant']), dashboardController.getRestaurantDashboard);
router.get('/customer', requireRole(['customer']), dashboardController.getCustomerDashboard);
router.get('/delivery', requireRole(['delivery']), dashboardController.getDeliveryDashboard);

// General dashboard route (redirects based on role)
router.get('/', dashboardController.redirectToDashboard);

module.exports = router;