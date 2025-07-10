const { Dish, Category, Restaurant } = require('../../models');
const { Op } = require('sequelize');

class MenuService {
  async getPublicMenu(filters = {}) {
    const { category, restaurant, search, featured, limit = 20, offset = 0 } = filters;

    const where = { isAvailable: true };
    
    if (category) where.categoryId = category;
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (featured) where.isFeatured = true;

    const restaurantWhere = { isActive: true, status: 'approved' };
    if (restaurant) restaurantWhere.id = restaurant;

    const dishes = await Dish.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category' },
        { 
          model: Restaurant, 
          as: 'restaurant',
          where: restaurantWhere
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']]
    });

    return dishes;
  }

  async getRestaurantMenu(restaurantId) {
    const dishes = await Dish.findAll({
      where: { 
        restaurantId,
        isAvailable: true 
      },
      include: [
        { model: Category, as: 'category' }
      ],
      order: [['isFeatured', 'DESC'], ['name', 'ASC']]
    });

    return dishes;
  }

  async searchDishes(query, filters = {}) {
    const where = {
      isAvailable: true,
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ]
    };

    if (filters.category) where.categoryId = filters.category;
    if (filters.restaurant) where.restaurantId = filters.restaurant;

    const dishes = await Dish.findAll({
      where,
      include: [
        { model: Category, as: 'category' },
        { 
          model: Restaurant, 
          as: 'restaurant',
          where: { isActive: true, status: 'approved' }
        }
      ],
      order: [['isFeatured', 'DESC'], ['name', 'ASC']]
    });

    return dishes;
  }

  async getDishById(dishId) {
    const dish = await Dish.findByPk(dishId, {
      include: [
        { model: Category, as: 'category' },
        { model: Restaurant, as: 'restaurant' }
      ]
    });

    if (!dish || !dish.isAvailable) {
      throw new Error('Dish not found or not available');
    }

    return dish;
  }
}

module.exports = new MenuService();