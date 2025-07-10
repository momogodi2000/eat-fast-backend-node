// src/routes/auth/auth.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../../controllers/auth/authController');
const googleOAuthController = require('../../controllers/auth/googleOAuthController');
const { authenticateToken, rateLimitStrict, rateLimitModerate } = require('../../middleware/auth/auth');
const { normalizeRegisterFields } = require('../../middleware/validation/validation');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).escape(),
  body('lastName').trim().isLength({ min: 2, max: 50 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('phone').optional().isMobilePhone('any'),
  body('role').optional().isIn(['customer', 'restaurant', 'delivery'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
];

const oauthCallbackValidation = [
  body('code').isLength({ min: 1 }).trim(),
  body('state').isLength({ min: 1 }).trim(),
  body('role').optional().isIn(['customer', 'restaurant', 'delivery'])
];

const twoFactorValidation = [
  body('userId').isUUID(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric()
];

// Traditional authentication routes
router.post('/register', rateLimitStrict, normalizeRegisterFields, registerValidation, authController.register);
router.post('/login', rateLimitStrict, loginValidation, authController.login);
router.post('/verify-2fa', rateLimitStrict, twoFactorValidation, authController.verify2FA);
router.post('/resend-2fa', rateLimitModerate, authController.resend2FA);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);
router.post('/forgot-password', rateLimitModerate, authController.forgotPassword);
router.post('/reset-password', rateLimitModerate, authController.resetPassword);

// Google OAuth routes
router.get('/google/init', rateLimitModerate, googleOAuthController.initiateOAuth);
router.get('/google/roles', rateLimitModerate, googleOAuthController.getAvailableRoles);
router.post('/google/callback', rateLimitStrict, oauthCallbackValidation, googleOAuthController.handleCallback);
router.post('/google/link', authenticateToken, oauthCallbackValidation, googleOAuthController.linkAccount);
router.delete('/google/unlink', authenticateToken, googleOAuthController.unlinkAccount);

module.exports = router;