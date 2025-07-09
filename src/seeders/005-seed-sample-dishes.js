'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get category and restaurant IDs
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, name FROM categories`
    );
    const [restaurants] = await queryInterface.sequelize.query(
      `SELECT id FROM restaurants LIMIT 1`
    );

    if (!categories.length || !restaurants.length) {
      throw new Error('Categories and restaurants must be seeded first.');
    }

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {});

    const restaurantId = restaurants[0].id;

    const dishes = [
      {
        id: uuidv4(),
        name: 'Ndolé',
        description: 'Traditional Cameroonian dish with groundnuts, bitter leaves, and your choice of meat or fish',
        price: 2500,
        categoryId: categoryMap['Plats Principaux'],
        restaurantId: restaurantId,
        isAvailable: true,
        isFeatured: true,
        preparationTime: 45,
        ingredients: ['Bitter leaves', 'Groundnuts', 'Meat/Fish', 'Onions', 'Spices'],
        allergens: ['Peanuts'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Eru',
        description: 'Delicious Cameroonian dish with eru leaves, waterleaf, and assorted meat',
        price: 3000,
        categoryId: categoryMap['Plats Principaux'],
        restaurantId: restaurantId,
        isAvailable: true,
        isFeatured: true,
        preparationTime: 60,
        ingredients: ['Eru leaves', 'Waterleaf', 'Assorted meat', 'Crayfish', 'Palm oil'],
        allergens: ['Shellfish'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Poulet Braisé',
        description: 'Grilled chicken marinated in local spices',
        price: 3500,
        categoryId: categoryMap['Grillades'],
        restaurantId: restaurantId,
        isAvailable: true,
        isFeatured: false,
        preparationTime: 30,
        ingredients: ['Chicken', 'Local spices', 'Onions', 'Tomatoes'],
        allergens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Poisson Braisé',
        description: 'Grilled fish with traditional Cameroonian seasoning',
        price: 4000,
        categoryId: categoryMap['Grillades'],
        restaurantId: restaurantId,
        isAvailable: true,
        isFeatured: false,
        preparationTime: 35,
        ingredients: ['Fresh fish', 'Traditional spices', 'Onions', 'Ginger'],
        allergens: ['Fish'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Riz Jollof',
        description: 'Spiced rice cooked with tomatoes and vegetables',
        price: 2000,
        categoryId: categoryMap['Accompagnements'],
        restaurantId: restaurantId,
        isAvailable: true,
        isFeatured: false,
        preparationTime: 25,
        ingredients: ['Rice', 'Tomatoes', 'Onions', 'Spices', 'Vegetables'],
        allergens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Plantain Frit',
        description: 'Fried plantain slices - sweet and delicious',
        price: 1000,
        categoryId: categoryMap['Accompagnements'],
        restaurantId: restaurantId,
        isAvailable: true,
        isFeatured: false,
        preparationTime: 15,
        ingredients: ['Ripe plantains', 'Vegetable oil', 'Salt'],
        allergens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Mutzig',
        description: 'Local Cameroonian beer',
        price: 650,
        categoryId: categoryMap['Boissons'],
        restaurantId: restaurantId,
        isAvailable: true,
        isFeatured: false,
        preparationTime: 2,
        ingredients: ['Malted barley', 'Hops', 'Water'],
        allergens: ['Gluten'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: '33 Export',
        description: 'Premium Cameroonian beer',
        price: 700,
        categoryId: categoryMap['Boissons'],
        restaurantId: restaurantId,
        isAvailable: true,
        isFeatured: false,
        preparationTime: 2,
        ingredients: ['Malted barley', 'Hops', 'Water'],
        allergens: ['Gluten'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('dishes', dishes, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('dishes', null, {});
  }
};