const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

module.exports = {
  securityHeaders,
  createRateLimiter,
  // Rate limiters for different endpoints
  authLimiter: createRateLimiter(15 * 60 * 1000, 5, 'Too many auth attempts'),
  generalLimiter: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests'),
  contactLimiter: createRateLimiter(60 * 60 * 1000, 3, 'Too many contact submissions'),
  partnerLimiter: createRateLimiter(60 * 60 * 1000, 2, 'Too many partner applications')
};