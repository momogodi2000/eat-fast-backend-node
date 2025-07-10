const { Dish, Category, Restaurant } = require('../../models');
const { validationResult } = require('express-validator');

class MenuController {
  async getDishes(req, res) {
    try {
      const { page = 1, limit = 10, category, search, isAvailable } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        restaurantId: req.user.restaurant?.id
      };

      if (category) where.categoryId = category;
      if (search) where.name = { [Op.iLike]: `%${search}%` };
      if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

      const dishes = await Dish.findAndCountAll({
        where,
        include: [
          { model: Category, as: 'category' },
          { model: Restaurant, as: 'restaurant' }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        dishes: dishes.rows,
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

  async createDish(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const restaurant = await Restaurant.findOne({
        where: { managerId: req.user.id }
      });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const dish = await Dish.create({
        ...req.body,
        restaurantId: restaurant.id
      });

      const dishWithDetails = await Dish.findByPk(dish.id, {
        include: [
          { model: Category, as: 'category' },
          { model: Restaurant, as: 'restaurant' }
        ]
      });

      res.status(201).json(dishWithDetails);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateDish(req, res) {
    try {
      const { dishId } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const restaurant = await Restaurant.findOne({
        where: { managerId: req.user.id }
      });

      const dish = await Dish.findOne({
        where: { 
          id: dishId, 
          restaurantId: restaurant.id 
        }
      });

      if (!dish) {
        return res.status(404).json({ error: 'Dish not found' });
      }

      await dish.update(req.body);

      const updatedDish = await Dish.findByPk(dishId, {
        include: [
          { model: Category, as: 'category' },
          { model: Restaurant, as: 'restaurant' }
        ]
      });

      res.json(updatedDish);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteDish(req, res) {
    try {
      const { dishId } = req.params;
      
      const restaurant = await Restaurant.findOne({
        where: { managerId: req.user.id }
      });

      const dish = await Dish.findOne({
        where: { 
          id: dishId, 
          restaurantId: restaurant.id 
        }
      });

      if (!dish) {
        return res.status(404).json({ error: 'Dish not found' });
      }

      await dish.destroy();
      res.json({ message: 'Dish deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async toggleAvailability(req, res) {
    try {
      const { dishId } = req.params;
      
      const restaurant = await Restaurant.findOne({
        where: { managerId: req.user.id }
      });

      const dish = await Dish.findOne({
        where: { 
          id: dishId, 
          restaurantId: restaurant.id 
        }
      });

      if (!dish) {
        return res.status(404).json({ error: 'Dish not found' });
      }

      await dish.update({ isAvailable: !dish.isAvailable });
      res.json({ 
        message: `Dish ${dish.isAvailable ? 'enabled' : 'disabled'}`,
        isAvailable: dish.isAvailable 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async toggleFeatured(req, res) {
    try {
      const { dishId } = req.params;
      
      const restaurant = await Restaurant.findOne({
        where: { managerId: req.user.id }
      });

      const dish = await Dish.findOne({
        where: { 
          id: dishId, 
          restaurantId: restaurant.id 
        }
      });

      if (!dish) {
        return res.status(404).json({ error: 'Dish not found' });
      }

      await dish.update({ isFeatured: !dish.isFeatured });
      res.json({ 
        message: `Dish ${dish.isFeatured ? 'featured' : 'unfeatured'}`,
        isFeatured: dish.isFeatured 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await Category.findAll({
        where: { isActive: true },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });

      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStatistics(req, res) {
    try {
      const restaurant = await Restaurant.findOne({
        where: { managerId: req.user.id }
      });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const stats = await Dish.findAll({
        where: { restaurantId: restaurant.id },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalDishes'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isAvailable" = true THEN 1 END')), 'availableDishes'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isFeatured" = true THEN 1 END')), 'featuredDishes']
        ],
        raw: true
      });

      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MenuController();