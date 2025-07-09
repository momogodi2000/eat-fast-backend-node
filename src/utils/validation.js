const { body, param, query } = require('express-validator');

// Common validation patterns
const validationPatterns = {
  email: () => body('email').isEmail().normalizeEmail(),
  password: () => body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: (field) => body(field).trim().isLength({ min: 2, max: 50 }),
  phone: () => body('phone').isMobilePhone('any'),
  uuid: (field) => param(field).isUUID(),
  requiredString: (field, min = 1, max = 255) => body(field).trim().isLength({ min, max }),
  optionalString: (field, max = 255) => body(field).optional().trim().isLength({ max }),
  price: () => body('price').isFloat({ min: 0 }),
  quantity: () => body('quantity').isInt({ min: 1 }),
  status: (validStatuses) => body('status').isIn(validStatuses),
  pagination: () => [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]
};

// User validation schemas
const userValidation = {
  register: [
    validationPatterns.email(),
    validationPatterns.password(),
    validationPatterns.name('firstName'),
    validationPatterns.name('lastName'),
    validationPatterns.phone(),
    validationPatterns.optionalString('address', 500)
  ],
  login: [
    validationPatterns.email(),
    validationPatterns.requiredString('password')
  ],
  updateProfile: [
    validationPatterns.name('firstName'),
    validationPatterns.name('lastName'),
    validationPatterns.phone(),
    validationPatterns.optionalString('address', 500)
  ]
};

// Dish validation schemas
const dishValidation = {
  create: [
    validationPatterns.requiredString('name', 2, 100),
    validationPatterns.optionalString('description', 500),
    validationPatterns.price(),
    body('categoryId').isUUID(),
    body('preparationTime').optional().isInt({ min: 1 }),
    body('ingredients').optional().isArray(),
    body('allergens').optional().isArray()
  ],
  update: [
    validationPatterns.requiredString('name', 2, 100),
    validationPatterns.optionalString('description', 500),
    validationPatterns.price(),
    body('categoryId').isUUID(),
    body('preparationTime').optional().isInt({ min: 1 }),
    body('ingredients').optional().isArray(),
    body('allergens').optional().isArray()
  ]
};

// Order validation schemas
const orderValidation = {
  create: [
    body('items').isArray({ min: 1 }),
    body('items.*.dishId').isUUID(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.specialInstructions').optional().isLength({ max: 200 }),
    validationPatterns.requiredString('deliveryAddress', 10, 500),
    validationPatterns.requiredString('customerName', 2, 100),
    validationPatterns.phone().withMessage('customerPhone'),
    body('customerEmail').optional().isEmail(),
    body('restaurantId').isUUID()
  ],
  updateStatus: [
    validationPatterns.status(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
  ]
};

// Contact validation schemas
const contactValidation = {
  submit: [
    validationPatterns.requiredString('name', 2, 100),
    validationPatterns.email(),
    validationPatterns.requiredString('subject', 5, 200),
    validationPatterns.requiredString('message', 10, 1000)
  ]
};

module.exports = {
  validationPatterns,
  userValidation,
  dishValidation,
  orderValidation,
  contactValidation
};