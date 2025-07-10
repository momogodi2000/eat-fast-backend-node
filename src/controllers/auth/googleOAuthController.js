// src/controllers/auth/googleOAuthController.js
const { validationResult } = require('express-validator');
const googleOAuthService = require('../../services/auth/googleOAuthService');
const redisClient = require('../../config/redis');
const { User } = require('../../models');

class GoogleOAuthController {
  /**
   * Initiate Google OAuth flow
   */
  async initiateOAuth(req, res) {
    try {
      const { authUrl, state } = googleOAuthService.getAuthUrl();
      
      // Store state in Redis for security (expires in 10 minutes)
      await redisClient.setex(`oauth:state:${state}`, 600, JSON.stringify({
        timestamp: Date.now(),
        ip: req.ip
      }));

      res.json({
        success: true,
        authUrl,
        state
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to initiate OAuth',
        code: 'OAUTH_INIT_FAILED'
      });
    }
  }

  /**
   * Get available roles for OAuth registration
   */
  async getAvailableRoles(req, res) {
    try {
      const roles = await googleOAuthService.getAvailableRoles();
      
      res.json({
        success: true,
        roles
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch available roles',
        code: 'ROLES_FETCH_FAILED'
      });
    }
  }

  /**
   * Handle Google OAuth callback
   */
  async handleCallback(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { code, state, role = 'customer' } = req.body;

      // Verify state parameter
      const stateData = await redisClient.get(`oauth:state:${state}`);
      if (!stateData) {
        return res.status(400).json({
          error: 'Invalid or expired state parameter',
          code: 'INVALID_STATE'
        });
      }

      // Remove used state
      await redisClient.del(`oauth:state:${state}`);

      // Verify with Google and get user data
      const googleUserData = await googleOAuthService.verifyCallback(code, state);

      // Handle user creation/login with role selection
      const result = await googleOAuthService.handleOAuthUser(googleUserData, role);

      // Set secure HTTP-only cookies for tokens
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };

      res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

      res.json({
        success: true,
        message: result.isNewUser ? 'Account created successfully' : 'Login successful',
        user: result.user,
        accessToken: result.tokens.accessToken,
        redirectUrl: result.redirectUrl,
        isNewUser: result.isNewUser
      });

    } catch (error) {
      console.error('OAuth callback error:', error);
      
      res.status(500).json({
        error: error.message || 'OAuth authentication failed',
        code: 'OAUTH_CALLBACK_FAILED'
      });
    }
  }

  /**
   * Link existing account with Google
   */
  async linkAccount(req, res) {
    try {
      const { code, state } = req.body;
      const userId = req.user.id;

      // Verify state parameter
      const stateData = await redisClient.get(`oauth:state:${state}`);
      if (!stateData) {
        return res.status(400).json({
          error: 'Invalid or expired state parameter',
          code: 'INVALID_STATE'
        });
      }

      await redisClient.del(`oauth:state:${state}`);

      // Get Google user data
      const googleUserData = await googleOAuthService.verifyCallback(code, state);

      // Check if Google account is already linked to another user
      const existingUser = await User.findOne({
        where: { googleId: googleUserData.googleId }
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          error: 'This Google account is already linked to another user',
          code: 'GOOGLE_ACCOUNT_ALREADY_LINKED'
        });
      }

      // Link Google account to current user
      await User.update(
        {
          googleId: googleUserData.googleId,
          profilePicture: googleUserData.profilePicture
        },
        { where: { id: userId } }
      );

      res.json({
        success: true,
        message: 'Google account linked successfully'
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to link Google account',
        code: 'LINK_ACCOUNT_FAILED'
      });
    }
  }

  /**
   * Unlink Google account
   */
  async unlinkAccount(req, res) {
    try {
      const userId = req.user.id;

      await User.update(
        {
          googleId: null,
          profilePicture: null
        },
        { where: { id: userId } }
      );

      res.json({
        success: true,
        message: 'Google account unlinked successfully'
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to unlink Google account',
        code: 'UNLINK_ACCOUNT_FAILED'
      });
    }
  }
}

module.exports = new GoogleOAuthController();