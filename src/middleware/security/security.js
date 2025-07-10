// src/middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const { body, query, param } = require('express-validator');

class SecurityMiddleware {
  
  /**
   * Advanced SQL Injection Prevention
   */
  static preventSQLInjection() {
    return (req, res, next) => {
      const sqlInjectionPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Single quotes, comments
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // Equals with quotes/semicolons
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // OR statements
        /((\%27)|(\'))union/i, // UNION statements
        /exec(\s|\+)+(s|x)p\w+/i, // Stored procedures
        /((\%27)|(\'))|((\%3B)|(;)).*drop/i, // DROP statements
        /((\%27)|(\'))|((\%3B)|(;)).*create/i, // CREATE statements
        /((\%27)|(\'))|((\%3B)|(;)).*insert/i, // INSERT statements
        /((\%27)|(\'))|((\%3B)|(;)).*delete/i, // DELETE statements
        /((\%27)|(\'))|((\%3B)|(;)).*update/i, // UPDATE statements
        /((\%27)|(\'))|((\%3B)|(;)).*select/i, // SELECT statements
        /script[^>]*>.*?<\/script>/gi, // Script tags
        /javascript:/gi, // JavaScript protocol
        /vbscript:/gi, // VBScript protocol
        /on\w+\s*=/gi, // Event handlers
        /<iframe[^>]*>.*?<\/iframe>/gi, // Iframe tags
        /<object[^>]*>.*?<\/object>/gi // Object tags
      ];

      const checkForInjection = (value, path = '') => {
        if (typeof value === 'string') {
          for (const pattern of sqlInjectionPatterns) {
            if (pattern.test(value)) {
              console.warn(`SQL Injection attempt detected in ${path}:`, value);
              return true;
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          for (const [key, val] of Object.entries(value)) {
            if (checkForInjection(val, `${path}.${key}`)) {
              return true;
            }
          }
        }
        return false;
      };

      // Check all inputs
      const allInputs = { ...req.body, ...req.query, ...req.params };
      
      if (checkForInjection(allInputs)) {
        return res.status(400).json({
          error: 'Invalid input detected',
          code: 'SECURITY_VIOLATION'
        });
      }

      next();
    };
  }

  /**
   * Prevent Mass Data Dumping
   */
  static preventMassDataDumping() {
    return (req, res, next) => {
      const originalJson = res.json;
      const maxRecords = parseInt(process.env.MAX_RECORDS_PER_REQUEST) || 1000;
      const maxResponseSize = parseInt(process.env.MAX_RESPONSE_SIZE) || 10 * 1024 * 1024; // 10MB

      res.json = function(data) {
        // Check if response is an array (list of records)
        if (Array.isArray(data)) {
          if (data.length > maxRecords) {
            console.warn(`Mass data dumping attempt: ${data.length} records requested`);
            return originalJson.call(this, {
              error: 'Too many records requested',
              code: 'MASS_DATA_REQUEST',
              limit: maxRecords,
              total: data.length
            });
          }
        }

        // Check response size
        const responseSize = JSON.stringify(data).length;
        if (responseSize > maxResponseSize) {
          console.warn(`Large response detected: ${responseSize} bytes`);
          return originalJson.call(this, {
            error: 'Response too large',
            code: 'RESPONSE_SIZE_LIMIT',
            limit: maxResponseSize
          });
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Input Sanitization and Validation
   */
  static sanitizeInput() {
    return (req, res, next) => {
      const sanitizeValue = (value) => {
        if (typeof value === 'string') {
          // Remove potentially dangerous characters
          return validator.escape(value.trim());
        } else if (typeof value === 'object' && value !== null) {
          for (const [key, val] of Object.entries(value)) {
            value[key] = sanitizeValue(val);
          }
        }
        return value;
      };

      // Sanitize body, query, and params
      if (req.body) req.body = sanitizeValue({ ...req.body });
      if (req.query) req.query = sanitizeValue({ ...req.query });
      if (req.params) req.params = sanitizeValue({ ...req.params });

      next();
    };
  }

  /**
   * Advanced Rate Limiting for Different Operations
   */
  static createAdvancedRateLimiter() {
    const rateLimiters = {
      // Strict rate limiting for authentication endpoints
      auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
        skipSuccessfulRequests: true,
        message: {
          error: 'Too many authentication attempts',
          code: 'RATE_LIMIT_AUTH'
        },
        standardHeaders: true,
        legacyHeaders: false
      }),

      // Moderate rate limiting for data creation
      create: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // 20 requests per window
        message: {
          error: 'Too many creation requests',
          code: 'RATE_LIMIT_CREATE'
        }
      }),

      // Lenient rate limiting for read operations
      read: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: {
          error: 'Too many read requests',
          code: 'RATE_LIMIT_READ'
        }
      }),

      // Very strict for password operations
      password: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 attempts per hour
        message: {
          error: 'Too many password attempts',
          code: 'RATE_LIMIT_PASSWORD'
        }
      })
    };

    return rateLimiters;
  }

  /**
   * Detect and prevent identical data patterns
   */
  static preventIdenticalDataDumping() {
    const requestCache = new Map();
    const maxCacheSize = 1000;
    const suspiciousThreshold = 10; // Same request pattern more than 10 times

    return (req, res, next) => {
      const requestSignature = JSON.stringify({
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Clean old entries if cache is too large
      if (requestCache.size > maxCacheSize) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
      }

      // Track request patterns
      if (requestCache.has(requestSignature)) {
        const data = requestCache.get(requestSignature);
        data.count++;
        data.lastSeen = Date.now();

        // Flag suspicious behavior
        if (data.count > suspiciousThreshold) {
          console.warn(`Suspicious identical request pattern detected:`, {
            signature: requestSignature,
            count: data.count,
            ip: req.ip
          });

          return res.status(429).json({
            error: 'Suspicious request pattern detected',
            code: 'IDENTICAL_REQUEST_PATTERN'
          });
        }
      } else {
        requestCache.set(requestSignature, {
          count: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now()
        });
      }

      next();
    };
  }

  /**
   * Comprehensive security headers
   */
  static setSecurityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "https:"],
          imgSrc: ["'self'", "https:", "data:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  /**
   * Query parameter validation to prevent abuse
   */
  static validateQueryParams() {
    return [
      query('page').optional().isInt({ min: 1, max: 1000 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('sort').optional().isIn(['asc', 'desc']),
      query('orderBy').optional().isAlphanumeric('en-US', { ignore: '_' }),
      query('search').optional().isLength({ max: 255 }).trim().escape()
    ];
  }

  /**
   * File upload security
   */
  static secureFileUpload() {
    return (req, res, next) => {
      if (req.files) {
        for (const file of Object.values(req.files)) {
          // Check file type
          const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/plain'
          ];

          if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({
              error: 'File type not allowed',
              code: 'INVALID_FILE_TYPE'
            });
          }

          // Check file size (10MB max)
          const maxSize = 10 * 1024 * 1024;
          if (file.size > maxSize) {
            return res.status(400).json({
              error: 'File too large',
              code: 'FILE_SIZE_LIMIT'
            });
          }

          // Scan filename for dangerous patterns
          const dangerousPatterns = /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i;
          if (dangerousPatterns.test(file.name)) {
            return res.status(400).json({
              error: 'Dangerous file extension detected',
              code: 'DANGEROUS_FILE'
            });
          }
        }
      }
      next();
    };
  }
}

module.exports = SecurityMiddleware;