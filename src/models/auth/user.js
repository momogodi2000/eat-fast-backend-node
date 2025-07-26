// src/models/user.js (Note: lowercase filename to match your import)
const { DataTypes } = require('sequelize');
const argon2 = require('argon2');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        isAlpha: true
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        isAlpha: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [5, 255]
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^\+?[1-9]\d{1,14}$/
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true, // Allow null for OAuth users
      validate: {
        len: [8, 255]
      }
    },
    // New Google OAuth fields
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    provider: {
      type: DataTypes.ENUM('local', 'google'),
      defaultValue: 'local',
      allowNull: false
    },
    // End of new fields
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended', 'banned'),
      defaultValue: 'pending',
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Security fields
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Document verification fields
    documentsStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'needs_review'),
      defaultValue: 'pending'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        // Only hash password if it's provided (local auth)
        if (user.password) {
          user.password = await argon2.hash(user.password);
        }
      },
      beforeUpdate: async (user) => {
        // Only hash password if it's being changed
        if (user.changed('password') && user.password) {
          user.password = await argon2.hash(user.password);
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['googleId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['roleId']
      },
      {
        fields: ['provider']
      }
    ]
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    if (!this.password) {
      return false; // OAuth users don't have passwords
    }
    try {
      return await argon2.verify(this.password, password);
    } catch (error) {
      return false;
    }
  };

  User.prototype.isAccountLocked = function() {
    return this.lockedUntil && this.lockedUntil > Date.now();
  };

  User.prototype.incrementLoginAttempts = async function() {
    const updates = { loginAttempts: this.loginAttempts + 1 };
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts >= 4) {
      updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    
    return this.update(updates);
  };

  User.prototype.resetLoginAttempts = async function() {
    return this.update({
      loginAttempts: 0,
      lockedUntil: null
    });
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Remove sensitive fields
    delete values.password;
    delete values.twoFactorSecret;
    delete values.passwordResetToken;
    delete values.emailVerificationToken;
    
    return values;
  };

  // Associations
  User.associate = (models) => {
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role'
    });
    
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders'
    });
    
    User.hasOne(models.Restaurant, {
      foreignKey: 'ownerId',
      as: 'restaurant'
    });
  };

  return User;
};