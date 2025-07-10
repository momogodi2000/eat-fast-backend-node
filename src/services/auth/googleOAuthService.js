// src/services/googleOAuthService.js
const { OAuth2Client } = require('google-auth-library');
const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class GoogleOAuthService {
  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl() {
    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: state,
      prompt: 'consent'
    });

    return { authUrl, state };
  }

  /**
   * Verify Google OAuth callback and get user info
   */
  async verifyCallback(code, state) {
    try {
      const { tokens } = await this.client.getToken(code);
      this.client.setCredentials(tokens);

      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      return {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        profilePicture: payload.picture,
        emailVerified: payload.email_verified
      };
    } catch (error) {
      throw new Error(`Google OAuth verification failed: ${error.message}`);
    }
  }

  /**
   * Handle Google OAuth login/registration with role selection
   */
  async handleOAuthUser(googleUserData, selectedRole = 'customer') {
    try {
      // Check if user already exists
      let user = await User.findOne({ 
        where: { email: googleUserData.email },
        include: [{ model: Role, as: 'role' }]
      });

      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          await user.update({ 
            googleId: googleUserData.googleId,
            profilePicture: googleUserData.profilePicture,
            isVerified: true
          });
        }

        // Generate tokens
        const tokens = this.generateTokens(user);
        
        return {
          user: this.sanitizeUser(user),
          tokens,
          isNewUser: false,
          redirectUrl: this.getRoleBasedRedirectUrl(user.role.name)
        };
      } else {
        // Get selected role
        const role = await Role.findOne({ where: { name: selectedRole } });
        if (!role) {
          throw new Error('Invalid role selected');
        }

        // Create new user
        user = await User.create({
          googleId: googleUserData.googleId,
          email: googleUserData.email,
          firstName: googleUserData.firstName,
          lastName: googleUserData.lastName,
          profilePicture: googleUserData.profilePicture,
          roleId: role.id,
          isVerified: true,
          status: 'active',
          provider: 'google'
        });

        // Load user with role
        user = await User.findByPk(user.id, {
          include: [{ model: Role, as: 'role' }]
        });

        // Generate tokens
        const tokens = this.generateTokens(user);

        return {
          user: this.sanitizeUser(user),
          tokens,
          isNewUser: true,
          redirectUrl: this.getRoleBasedRedirectUrl(user.role.name)
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate JWT tokens for user
   */
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Get role-based redirect URL
   */
  getRoleBasedRedirectUrl(roleName) {
    const redirectUrls = {
      'admin': '/admin/dashboard',
      'restaurant': '/restaurant/dashboard',
      'customer': '/customer/dashboard',
      'delivery': '/delivery/dashboard'
    };

    return redirectUrls[roleName] || '/dashboard';
  }

  /**
   * Sanitize user data for response
   */
  sanitizeUser(user) {
    const { password, passwordHash, ...sanitizedUser } = user.toJSON();
    return sanitizedUser;
  }

  /**
   * Validate if role is available for OAuth registration
   */
  async getAvailableRoles() {
    const availableRoles = await Role.findAll({
      where: {
        name: ['customer', 'restaurant', 'delivery'] // admin role requires special approval
      },
      attributes: ['id', 'name', 'description']
    });

    return availableRoles;
  }
}

module.exports = new GoogleOAuthService();