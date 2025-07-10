const { Sequelize } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Import all models
const User = require('./auth/user')(sequelize);
const Role = require('./auth/role')(sequelize);
const Restaurant = require('./restaurant/restaurant')(sequelize);
const Dish = require('./menu/dish')(sequelize);
const Category = require('./menu/category')(sequelize);
const Order = require('./order/order')(sequelize);
const OrderItem = require('./order/orderItem')(sequelize);
const Newsletter = require('./newsletter/newsletter')(sequelize);
const Contact = require('./contact/contact')(sequelize);
const PartnerApplication = require('./partner/partnerApplication')(sequelize);

// Define associations
const models = {
  User,
  Role,
  Restaurant,
  Dish,
  Category,
  Order,
  OrderItem,
  Newsletter,
  Contact,
  PartnerApplication
};

// Run associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};