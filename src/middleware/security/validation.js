const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

// Middleware to normalize registration fields
function normalizeRegisterFields(req, res, next) {
  const body = req.body;
  req.body = {
    ...body,
    firstName: body.firstName || body.first_name,
    lastName: body.lastName || body.last_name,
    phone: body.phone || body.phone_number,
    role: body.role || body.user_type,
  };
  next();
}

// Middleware to normalize contact fields
function normalizeContactFields(req, res, next) {
  const body = req.body;
  req.body = {
    name: body.name,
    email: body.email,
    subject: body.subject,
    message: body.message,
  };
  next();
}

// Middleware to normalize partner application fields
function normalizePartnerFields(req, res, next) {
  const body = req.body;
  req.body = {
    ...body,
    restaurantName: body.restaurantName || body.businessName,
    ownerName: body.ownerName || body.contactName,
    cuisine: body.cuisine || body.cuisineType,
    description: body.description || body.businessExperience || '',
    // Only keep fields expected by backend
    email: body.email,
    phone: body.phone,
    address: body.address,
    // Optionally, add more mappings as needed
  };
  next();
}

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  normalizeRegisterFields,
  normalizeContactFields,
  normalizePartnerFields,
};