const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Role } = require('../../models');
const emailService = require('../email/emailService');
const redisClient = require('../../config/redis');

class AuthService {
  
  async register(userData) {
    try {
      // Map frontend field names to backend field names
      const mappedUserData = {
        firstName: userData.first_name || userData.firstName,
        lastName: userData.last_name || userData.lastName,
        email: userData.email,
        phone: userData.phone_number || userData.phone,
        password: userData.password,
        // Map user_type to role if provided
        roleId: undefined // Will be set to default role below
      };

      // Check if user already exists
      const existingUser = await User.findOne({ 
        where: { email: mappedUserData.email } 
      });
      
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Get default role or map from user_type if provided
      let defaultRole;
      if (userData.user_type) {
        // Map user_type to role name
        const roleName = this.mapUserTypeToRole(userData.user_type);
        defaultRole = await Role.findOne({ where: { name: roleName } });
      } else {
        defaultRole = await Role.findOne({ where: { name: 'customer' } });
      }
      
      if (!defaultRole) {
        defaultRole = await Role.findOne({ where: { name: 'customer' } });
      }
      
      mappedUserData.roleId = defaultRole.id;
      
      // Create user
      const user = await User.create(mappedUserData);

      // Generate 2FA code
      const twoFactorCode = this.generateTwoFactorCode();
      
      // Store 2FA code in Redis (expires in 10 minutes)
      await redisClient.setex(
        `2fa:${user.id}`,
        600,
        twoFactorCode
      );

      // Send verification email
      await emailService.sendVerificationEmail(user.email, twoFactorCode);

      return {
        userId: user.id,
        message: 'Registration successful. Please check your email for verification code.'
      };

    } catch (error) {
      throw error;
    }
  }

  // Helper method to map user_type to role name
  mapUserTypeToRole(userType) {
    const roleMapping = {
      'client': 'customer',
      'customer': 'customer',
      'restaurant': 'restaurant_owner',
      'delivery': 'delivery_person',
      'admin': 'admin',
      'agent': 'support_agent'
    };
    
    return roleMapping[userType.toLowerCase()] || 'customer';
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ 
        where: { email },
        include: [{ model: Role, as: 'role' }]
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('Account is temporarily locked');
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      
      if (!isValidPassword) {
        await this.handleFailedLogin(user);
        throw new Error('Invalid credentials');
      }

      // Reset login attempts
      await user.update({ 
        loginAttempts: 0, 
        lockedUntil: null 
      });

      // Generate 2FA code
      const twoFactorCode = this.generateTwoFactorCode();
      
      // Store 2FA code in Redis
      await redisClient.setex(
        `2fa:${user.id}`,
        600,
        twoFactorCode
      );

      // Send 2FA code via email
      await emailService.send2FACode(user.email, twoFactorCode);

      return {
        userId: user.id,
        requiresTwoFactor: true,
        message: 'Please check your email for verification code.'
      };

    } catch (error) {
      throw error;
    }
  }

  async verify2FA(userId, code) {
    try {
      const storedCode = await redisClient.get(`2fa:${userId}`);
      
      if (!storedCode || storedCode !== code) {
        throw new Error('Invalid verification code');
      }

      // Remove 2FA code from Redis
      await redisClient.del(`2fa:${userId}`);

      // Get user with role
      const user = await User.findByPk(userId, {
        include: [{ model: Role, as: 'role' }]
      });

      // Update user status and last login
      await user.update({ 
        status: 'active',
        isVerified: true,
        lastLogin: new Date()
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Map backend field names to frontend field names for response
      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          firstName: user.firstName, // Include both formats for compatibility
          lastName: user.lastName,   // Include both formats for compatibility
          phone_number: user.phone,
          phone: user.phone,
          role: user.role.name,
          status: user.status
        },
        tokens
      };

    } catch (error) {
      throw error;
    }
  }

  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.name
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  generateTwoFactorCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async handleFailedLogin(user) {
    const attempts = user.loginAttempts + 1;
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await user.update({
      loginAttempts: attempts,
      lockedUntil: lockUntil
    });
  }

  async refreshTokens(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || user.status !== 'active') {
        throw new Error('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId) {
    // Remove any stored tokens/sessions from Redis
    await redisClient.del(`session:${userId}`);
    await redisClient.del(`2fa:${userId}`);
  }
}

module.exports = new AuthService();