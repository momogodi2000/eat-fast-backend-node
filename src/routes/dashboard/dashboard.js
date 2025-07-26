// src/routes/dashboard.js
const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth/auth');
const dashboardController = require('../../controllers/dashboard/dashboardController');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// Role-based dashboard routes
router.get('/admin', requireRole(['administrator']), dashboardController.getAdminDashboard);
router.get('/restaurant', requireRole(['restaurant_manager']), dashboardController.getRestaurantDashboard);
router.get('/customer', requireRole(['client']), dashboardController.getCustomerDashboard);
router.get('/delivery', requireRole(['delivery_agent']), dashboardController.getDeliveryDashboard);

// General dashboard route (redirects based on role)
router.get('/', dashboardController.redirectToDashboard);

module.exports = router;