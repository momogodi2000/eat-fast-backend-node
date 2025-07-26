'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roles = [
      {
        id: uuidv4(),
        name: 'administrator',
        description: 'System administrator with full access',
        permissions: ['*'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'restaurant_manager',
        description: 'Restaurant manager with menu and order management',
        permissions: ['menu:read', 'menu:write', 'orders:read', 'orders:update', 'restaurant:manage'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'client',
        description: 'Regular customer with basic access',
        permissions: ['orders:read', 'orders:create', 'profile:manage'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'delivery_agent',
        description: 'Delivery agent with order tracking and delivery access',
        permissions: ['orders:read', 'orders:update_status', 'deliveries:manage', 'profile:manage'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'agent_support',
        description: 'Customer support agent with user assistance capabilities',
        permissions: ['support:read', 'support:write', 'users:read', 'tickets:manage', 'profile:manage'],
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