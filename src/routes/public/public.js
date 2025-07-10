const express = require('express');
const publicController = require('../controllers/publicController');
const { generalLimiter } = require('../../config/security');

const router = express.Router();

// Apply rate limiting to all public routes
router.use(generalLimiter);

// Routes
router.get('/menu', publicController.getPublicMenu);
router.get('/restaurants', publicController.getRestaurants);

module.exports = router;