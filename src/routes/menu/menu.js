const express = require('express');
const { body } = require('express-validator');
const menuController = require('../../controllers/menu/menuController');
const { authenticateToken, requireRole } = require('../../middleware/auth/auth');
const { handleValidationErrors, validateUUIDParam } = require('../../middleware/validation/validation');

const router = express.Router();

// All menu routes require authentication and restaurant manager role
router.use(authenticateToken);
router.use(requireRole(['restaurant_manager', 'administrator']));

// Validation middleware
const dishValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Dish name must be between 2 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').isUUID().withMessage('Invalid category ID'),
  body('preparationTime').optional().isInt({ min: 1 }).withMessage('Preparation time must be at least 1 minute'),
  body('ingredients').optional().isArray().withMessage('Ingredients must be an array'),
  body('allergens').optional().isArray().withMessage('Allergens must be an array'),
  handleValidationErrors
];

// Routes
router.get('/dishes', menuController.getDishes);
router.post('/dishes', dishValidation, menuController.createDish);
router.put('/dishes/:dishId', validateUUIDParam('dishId'), dishValidation, menuController.updateDish);
router.delete('/dishes/:dishId', validateUUIDParam('dishId'), handleValidationErrors, menuController.deleteDish);
router.put('/dishes/:dishId/availability', validateUUIDParam('dishId'), handleValidationErrors, menuController.toggleAvailability);
router.put('/dishes/:dishId/featured', validateUUIDParam('dishId'), handleValidationErrors, menuController.toggleFeatured);
router.get('/categories', menuController.getCategories);
router.get('/statistics', menuController.getStatistics);

module.exports = router;