'use strict';
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get admin role
    const [adminRole] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'admin'`
    );

    if (!adminRole.length) {
      throw new Error('Admin role not found. Please run roles seeder first.');
    }

    const hashedPassword = await argon2.hash('Admin123!');

    const admin = {
      id: uuidv4(),
      email: 'admin@eatfast.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+237123456789',
      address: 'Yaoundé, Cameroon',
      roleId: adminRole[0].id,
      status: 'active',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await queryInterface.bulkInsert('users', [admin], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: 'admin@eatfast.com'
    }, {});
  }
};