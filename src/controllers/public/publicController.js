const { Dish, Category, Restaurant } = require('../../models');
const { Op } = require('sequelize');

class PublicController {
  async getPublicMenu(req, res) {
    try {
      const { page = 1, limit = 20, category, search, restaurant } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        isAvailable: true
      };

      if (category) where.categoryId = category;
      if (search) where.name = { [Op.iLike]: `%${search}%` };
      if (restaurant) where.restaurantId = restaurant;

      const dishes = await Dish.findAndCountAll({
        where,
        include: [
          { model: Category, as: 'category' },
          { 
            model: Restaurant, 
            as: 'restaurant',
            where: { isActive: true, status: 'approved' }
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']]
      });

      const categories = await Category.findAll({
        where: { isActive: true },
        order: [['sortOrder', 'ASC']]
      });

      res.json({
        dishes: dishes.rows,
        categories,
        pagination: {
          total: dishes.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(dishes.count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRestaurants(req, res) {
    try {
      const { page = 1, limit = 10, cuisine, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        isActive: true,
        status: 'approved'
      };

      if (cuisine) where.cuisine = cuisine;
      if (search) where.name = { [Op.iLike]: `%${search}%` };

      const restaurants = await Restaurant.findAndCountAll({
        where,
        attributes: [
          'id', 'name', 'description', 'address', 'cuisine', 
          'rating', 'deliveryFee', 'createdAt'
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['rating', 'DESC'], ['name', 'ASC']]
      });

      res.json({
        restaurants: restaurants.rows,
        pagination: {
          total: restaurants.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(restaurants.count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PublicController();