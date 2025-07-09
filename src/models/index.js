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
const User = require('./user')(sequelize);
const Role = require('./role')(sequelize);
const Restaurant = require('./restaurant')(sequelize);
const Dish = require('./dish')(sequelize);
const Category = require('./category')(sequelize);
const Order = require('./order')(sequelize);
const OrderItem = require('./orderItem')(sequelize);
const Newsletter = require('./newsletter')(sequelize);
const Contact = require('./contact')(sequelize);
const PartnerApplication = require('./partnerApplication')(sequelize);

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