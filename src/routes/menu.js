const express = require('express');
const { body } = require('express-validator');
const menuController = require('../controllers/menuController');
const { authenticateToken, requireRestaurantManager } = require('../middleware/auth');

const router = express.Router();

// All menu routes require authentication and restaurant manager role
router.use(authenticateToken);
router.use(requireRestaurantManager);

// Validation middleware
const dishValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('price').isFloat({ min: 0 }),
  body('categoryId').isUUID(),
  body('preparationTime').optional().isInt({ min: 1 }),
  body('ingredients').optional().isArray(),
  body('allergens').optional().isArray()
];

// Routes
router.get('/dishes', menuController.getDishes);
router.post('/dishes', dishValidation, menuController.createDish);
router.put('/dishes/:dishId', dishValidation, menuController.updateDish);
router.delete('/dishes/:dishId', menuController.deleteDish);
router.put('/dishes/:dishId/availability', menuController.toggleAvailability);
router.put('/dishes/:dishId/featured', menuController.toggleFeatured);
router.get('/categories', menuController.getCategories);
router.get('/statistics', menuController.getStatistics);

module.exports = router;