const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Newsletter = sequelize.define('Newsletter', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'unsubscribed'),
      defaultValue: 'pending'
    },
    confirmationToken: {
      type: DataTypes.STRING
    },
    unsubscribeToken: {
      type: DataTypes.STRING
    },
    confirmedAt: {
      type: DataTypes.DATE
    },
    unsubscribedAt: {
      type: DataTypes.DATE
    },
    unsubscribeReason: {
      type: DataTypes.TEXT
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: 'website'
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        promotions: true,
        news: true,
        product_updates: true
      }
    }
  }, {
    tableName: 'newsletters',
    timestamps: true
  });

  return Newsletter;
};