// src/middleware/auth.js (Updated)
const jwt = require('jsonwebtoken');
const { User, Role } = require('../../models');
const SecurityMiddleware = require('../security/security');

// Create rate limiters
const rateLimiters = SecurityMiddleware.createAdvancedRateLimiter();

class AuthMiddleware {
  /**
   * Authenticate JWT token (supports both traditional and OAuth users)
   */
  static async authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          error: 'Access token required',
          code: 'NO_TOKEN'
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user with role information
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions']
        }],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user account is active
      if (user.status !== 'active') {
        return res.status(401).json({
          error: 'Account is not active',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        return res.status(401).json({
          error: 'Account is temporarily locked',
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Update last login for security tracking
      await user.update({ lastLogin: new Date() });

      // Attach user info to request
      req.user = {
        ...user.toJSON(),
        role: user.role.name,
        permissions: user.role.permissions
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      console.error('Authentication error:', error);
      res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }

  /**
   * Require specific roles
   */
  static requireRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: userRole
        });
      }

      next();
    };
  }

  /**
   * Require specific permissions
   */
  static requirePermission(requiredPermissions) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const userPermissions = req.user.permissions || [];
      
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermissions,
          current: userPermissions
        });
      }

      next();
    };
  }

  /**
   * Optional authentication (for endpoints that work with or without auth)
   */
  static async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
          include: [{
            model: Role,
            as: 'role',
            attributes: ['id', 'name', 'permissions']
          }],
          attributes: { exclude: ['password', 'twoFactorSecret'] }
        });

        if (user && user.status === 'active') {
          req.user = {
            ...user.toJSON(),
            role: user.role.name,
            permissions: user.role.permissions
          };
        }
      }

      next();
    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(req, res, next) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'Refresh token required',
          code: 'NO_REFRESH_TOKEN'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions']
        }]
      });

      if (!user || user.status !== 'active') {
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  }

  /**
   * Check if user owns resource
   */
  static checkResourceOwnership(resourceUserIdField = 'userId') {
    return (req, res, next) => {
      const resourceUserId = req.params.userId || req.body[resourceUserIdField];
      const currentUserId = req.user.id;
      const userRole = req.user.role;

      // Admins can access any resource
      if (userRole === 'admin') {
        return next();
      }

      // Users can only access their own resources
      if (resourceUserId !== currentUserId) {
        return res.status(403).json({
          error: 'Access denied to this resource',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      next();
    };
  }

  /**
   * Rate limiting middleware exports
   */
  static get rateLimitStrict() {
    return rateLimiters.auth;
  }

  static get rateLimitModerate() {
    return rateLimiters.create;
  }

  static get rateLimitLenient() {
    return rateLimiters.read;
  }

  static get rateLimitPassword() {
    return rateLimiters.password;
  }

  /**
   * Comprehensive security middleware stack
   */
  static getSecurityStack() {
    return [
      SecurityMiddleware.setSecurityHeaders(),
      SecurityMiddleware.preventSQLInjection(),
      SecurityMiddleware.preventMassDataDumping(),
      SecurityMiddleware.preventIdenticalDataDumping(),
      SecurityMiddleware.sanitizeInput()
    ];
  }

  /**
   * File upload security
   */
  static get secureFileUpload() {
    return SecurityMiddleware.secureFileUpload();
  }

  /**
   * Query validation
   */
  static get validateQuery() {
    return SecurityMiddleware.validateQueryParams();
  }
}

module.exports = AuthMiddleware;