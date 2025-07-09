'use strict';
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get restaurant manager role
    const [managerRole] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'restaurant_manager'`
    );

    if (!managerRole.length) {
      throw new Error('Restaurant manager role not found.');
    }

    const hashedPassword = await argon2.hash('Manager123!');

    // Create restaurant manager
    const managerId = uuidv4();
    const manager = {
      id: managerId,
      email: 'manager@eatfast.com',
      password: hashedPassword,
      firstName: 'Restaurant',
      lastName: 'Manager',
      phone: '+237654321098',
      address: 'Douala, Cameroon',
      roleId: managerRole[0].id,
      status: 'active',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await queryInterface.bulkInsert('users', [manager], {});

    // Create sample restaurant
    const restaurant = {
      id: uuidv4(),
      name: 'Chez Mama Africa',
      description: 'Authentic Cameroonian cuisine in the heart of Douala',
      address: 'Rue de la Joie, Akwa, Douala, Cameroon',
      phone: '+237654321098',
      email: 'contact@mamaafrica.cm',
      managerId: managerId,
      status: 'approved',
      cuisine: 'Cameroonian',
      rating: 4.5,
      deliveryFee: 1000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await queryInterface.bulkInsert('restaurants', [restaurant], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('restaurants', null, {});
    await queryInterface.bulkDelete('users', {
      email: 'manager@eatfast.com'
    }, {});
  }
};