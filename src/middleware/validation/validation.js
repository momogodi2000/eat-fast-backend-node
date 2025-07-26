const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Normalize register fields middleware
 */
const normalizeRegisterFields = (req, res, next) => {
  if (req.body) {
    // Trim and normalize string fields
    if (req.body.firstName) {
      req.body.firstName = req.body.firstName.trim();
    }
    if (req.body.lastName) {
      req.body.lastName = req.body.lastName.trim();
    }
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase().trim();
    }
    if (req.body.phone) {
      // Remove all non-digit characters and normalize phone
      req.body.phone = req.body.phone.replace(/\D/g, '');
    }
    if (req.body.role) {
      req.body.role = req.body.role.toLowerCase().trim();
    }
    
    // Ensure role is valid
    const validRoles = ['client', 'restaurant_manager', 'delivery_agent', 'agent_support', 'administrator'];
    if (req.body.role && !validRoles.includes(req.body.role)) {
      req.body.role = 'client'; // Default to client if invalid role
    }
  }
  next();
};

/**
 * Normalize login fields middleware
 */
const normalizeLoginFields = (req, res, next) => {
  if (req.body) {
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase().trim();
    }
  }
  next();
};

/**
 * Validation rules for user registration
 */
const registerValidationRules = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('role')
    .optional()
    .isIn(['client', 'restaurant_manager', 'delivery_agent', 'agent_support'])
    .withMessage('Invalid role specified'),
  
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date of birth format'),
  
  body('acceptTerms')
    .isBoolean()
    .custom(value => value === true)
    .withMessage('You must accept the terms and conditions')
];

/**
 * Validation rules for user login
 */
const loginValidationRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

/**
 * Validation rules for 2FA verification
 */
const twoFactorValidationRules = [
  body('userId')
    .isUUID()
    .withMessage('Invalid user ID'),
  
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA code must be 6 digits')
    .isNumeric()
    .withMessage('2FA code must be numeric')
];

/**
 * Validation rules for password reset
 */
const passwordResetValidationRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Validation rules for order creation
 */
const orderValidationRules = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.dishId')
    .isUUID()
    .withMessage('Invalid dish ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),
  
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('deliveryAddress')
    .isLength({ min: 10, max: 500 })
    .withMessage('Delivery address must be between 10 and 500 characters'),
  
  body('paymentMethod')
    .isIn(['card', 'mobile_money', 'cash'])
    .withMessage('Invalid payment method'),
  
  body('customerInfo.name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customerInfo.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  
  body('customerInfo.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
];

/**
 * Validation rules for dish creation/update
 */
const dishValidationRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Dish name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('categoryId')
    .isUUID()
    .withMessage('Invalid category ID'),
  
  body('preparationTime')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Preparation time must be between 1 and 300 minutes'),
  
  body('allergens')
    .optional()
    .isArray()
    .withMessage('Allergens must be an array'),
  
  body('nutritionalInfo')
    .optional()
    .isObject()
    .withMessage('Nutritional info must be an object'),
  
  body('isVegetarian')
    .optional()
    .isBoolean()
    .withMessage('isVegetarian must be a boolean'),
  
  body('isVegan')
    .optional()
    .isBoolean()
    .withMessage('isVegan must be a boolean'),
  
  body('isGlutenFree')
    .optional()
    .isBoolean()
    .withMessage('isGlutenFree must be a boolean')
];

/**
 * Validation rules for contact form
 */
const contactValidationRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  
  body('category')
    .optional()
    .isIn(['general', 'support', 'partnership', 'complaint', 'suggestion'])
    .withMessage('Invalid category')
];

/**
 * Validation rules for partner application
 */
const partnerValidationRules = [
  body('restaurantName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Restaurant name must be between 2 and 100 characters'),
  
  body('ownerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('cuisineType')
    .optional()
    .isArray()
    .withMessage('Cuisine type must be an array'),
  
  body('businessLicense')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Business license number must not exceed 100 characters')
];

/**
 * Parameter validation for UUIDs
 */
const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName}`)
];

/**
 * Query validation for pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'email', 'price'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for newsletter subscription
 */
const newsletterValidationRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('preferences')
    .optional()
    .isArray()
    .withMessage('Preferences must be an array')
];

module.exports = {
  handleValidationErrors,
  normalizeRegisterFields,
  normalizeLoginFields,
  registerValidationRules,
  loginValidationRules,
  twoFactorValidationRules,
  passwordResetValidationRules,
  orderValidationRules,
  dishValidationRules,
  contactValidationRules,
  partnerValidationRules,
  newsletterValidationRules,
  validateUUIDParam,
  validatePagination
}; 