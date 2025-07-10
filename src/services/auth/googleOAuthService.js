// src/services/googleOAuthService.js
const { OAuth2Client } = require('google-auth-library');
const { User, Role } = require('../../models');
const crypto = require('crypto');
const authService = require('./authService');

class GoogleOAuthService {
  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl() {
    const state = crypto.randomBytes(16).toString('hex');
    
    const authUrl = this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      state,
      prompt: 'consent'
    });

    return { authUrl, state };
  }

  async verifyCallback(code, state) {
    try {
      // Exchange code for tokens
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
      });

      // Set credentials and get user info
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
      throw new Error(`OAuth verification failed: ${error.message}`);
    }
  }

  async handleOAuthUser(googleUserData, roleName = 'customer') {
    try {
      // Check if user already exists
      let user = await User.findOne({
        where: { googleId: googleUserData.googleId },
        include: [{ model: Role, as: 'role' }]
      });

      let isNewUser = false;

      // If user doesn't exist, check if email exists
      if (!user) {
        const existingUserByEmail = await User.findOne({
          where: { email: googleUserData.email }
        });

        if (existingUserByEmail) {
          // Link Google account to existing email account
          await existingUserByEmail.update({
            googleId: googleUserData.googleId,
            profilePicture: googleUserData.profilePicture,
            provider: 'google',
            isVerified: true
          });
          
          user = existingUserByEmail;
        } else {
          // Create new user
          const role = await Role.findOne({ where: { name: roleName } });
          if (!role) {
            throw new Error('Invalid role');
          }

          user = await User.create({
            firstName: googleUserData.firstName,
            lastName: googleUserData.lastName,
            email: googleUserData.email,
            googleId: googleUserData.googleId,
            profilePicture: googleUserData.profilePicture,
            provider: 'google',
            roleId: role.id,
            status: 'active',
            isVerified: true
          });

          isNewUser = true;
        }

        // Reload user with role
        user = await User.findByPk(user.id, {
          include: [{ model: Role, as: 'role' }]
        });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate tokens
      const tokens = authService.generateTokens(user);

      // Determine redirect URL based on role
      const redirectUrl = this.getRedirectUrlByRole(user.role.name);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          profilePicture: user.profilePicture
        },
        tokens,
        redirectUrl,
        isNewUser
      };
    } catch (error) {
      throw error;
    }
  }

  async getAvailableRoles() {
    try {
      const roles = await Role.findAll({
        where: {
          name: ['customer', 'restaurant_owner', 'delivery_person']
        },
        attributes: ['id', 'name', 'displayName', 'description']
      });
      
      return roles;
    } catch (error) {
      throw error;
    }
  }

  getRedirectUrlByRole(role) {
    const roleRedirects = {
      admin: '/admin/dashboard',
      customer: '/client/dashboard',
      restaurant_owner: '/restaurant/dashboard',
      delivery_person: '/delivery/dashboard',
      support_agent: '/agent/dashboard'
    };

    return roleRedirects[role] || '/';
  }
}

module.exports = new GoogleOAuthService();