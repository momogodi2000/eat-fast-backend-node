'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roles = [
      {
        id: uuidv4(),
        name: 'admin',
        description: 'System administrator with full access',
        permissions: ['*'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'restaurant_manager',
        description: 'Restaurant manager with menu and order management',
        permissions: ['menu:read', 'menu:write', 'orders:read', 'orders:update'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'customer',
        description: 'Regular customer with basic access',
        permissions: ['orders:read', 'orders:create'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'delivery_driver',
        description: 'Delivery driver with order tracking access',
        permissions: ['orders:read', 'orders:update_status'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('roles', roles, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};