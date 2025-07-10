const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Dish = sequelize.define('Dish', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Restaurants',
        key: 'id'
      }
    },
    imageUrl: {
      type: DataTypes.STRING
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      comment: 'Time in minutes'
    },
    ingredients: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    allergens: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    nutritionalInfo: {
      type: DataTypes.JSONB
    }
  }, {
    tableName: 'dishes',
    timestamps: true
  });

  Dish.associate = function(models) {
    Dish.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    Dish.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
    Dish.hasMany(models.OrderItem, { foreignKey: 'dishId', as: 'orderItems' });
  };

  return Dish;
};