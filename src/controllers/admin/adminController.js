const { User, Role, Order, Restaurant, Contact } = require('../../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class AdminController {
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, role, status, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const include = [{ model: Role, as: 'role' }];
      if (role) {
        include[0].where = { name: role };
      }

      const users = await User.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      res.json({
        users: users.rows,
        pagination: {
          total: users.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(users.count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        include: [{ model: Role, as: 'role' }],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't allow updating password through this endpoint
      const { password, ...updateData } = req.body;

      await user.update(updateData);

      const updatedUser = await User.findByPk(id, {
        include: [{ model: Role, as: 'role' }],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.update({ status });
      res.json({ message: 'User status updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // GDPR compliant deletion - anonymize data
      await user.update({
        email: `deleted_${Date.now()}@example.com`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        address: null,
        status: 'banned'
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

      const stats = await Promise.all([
        User.count(),
        Restaurant.count(),
        Order.count(),
        Order.count({ where: { status: 'delivered' } }),
        Order.sum('totalAmount', { where: { status: 'delivered' } }),
        User.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
        Order.count({ where: { createdAt: { [Op.gte]: startOfWeek } } }),
        Order.count({ where: { status: 'pending' } })
      ]);

      res.json({
        totalUsers: stats[0],
        totalRestaurants: stats[1],
        totalOrders: stats[2],
        deliveredOrders: stats[3],
        totalRevenue: stats[4] || 0,
        newUsersThisMonth: stats[5],
        ordersThisWeek: stats[6],
        pendingOrders: stats[7]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDetailedStatistics(req, res) {
    try {
      const { period = 'month' } = req.query;
      let dateFilter;
      const now = new Date();

      switch (period) {
        case 'week':
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      }

      const stats = await Promise.all([
        User.count({ where: { createdAt: { [Op.gte]: dateFilter } } }),
        Order.count({ where: { createdAt: { [Op.gte]: dateFilter } } }),
        Order.sum('totalAmount', { where: { createdAt: { [Op.gte]: dateFilter }, status: 'delivered' } }),
        Restaurant.count({ where: { createdAt: { [Op.gte]: dateFilter } } })
      ]);

      res.json({
        period,
        newUsers: stats[0],
        newOrders: stats[1],
        revenue: stats[2] || 0,
        newRestaurants: stats[3]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRestaurants(req, res) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const restaurants = await Restaurant.findAndCountAll({
        where,
        include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
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

  async getRestaurantById(req, res) {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.findByPk(id, {
        include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }]
      });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateRestaurant(req, res) {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.findByPk(id);

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      await restaurant.update(req.body);
      
      const updatedRestaurant = await Restaurant.findByPk(id, {
        include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }]
      });

      res.json(updatedRestaurant);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateRestaurantStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const restaurant = await Restaurant.findByPk(id);
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      await restaurant.update({ status });
      res.json({ message: 'Restaurant status updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteRestaurant(req, res) {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.findByPk(id);

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      await restaurant.update({ 
        status: 'banned',
        name: `Deleted Restaurant ${Date.now()}`
      });

      res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrders(req, res) {
    try {
      const { page = 1, limit = 10, status, restaurantId } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (restaurantId) where.restaurantId = restaurantId;

      const orders = await Order.findAndCountAll({
        where,
        include: [
          { model: Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        orders: orders.rows,
        pagination: {
          total: orders.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(orders.count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findByPk(id, {
        include: [
          { model: Restaurant, as: 'restaurant' },
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      await order.update({ status });
      res.json({ message: 'Order status updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async approveUserDocuments(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.update({ 
        isVerified: true, 
        status: 'active',
        documentsStatus: 'approved'
      });

      res.json({ message: 'User documents approved successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async rejectUserDocuments(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.update({ 
        documentsStatus: 'rejected',
        rejectionReason: reason
      });

      res.json({ message: 'User documents rejected successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRoles(req, res) {
    try {
      const roles = await Role.findAll({
        attributes: ['id', 'name', 'description', 'permissions']
      });

      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAnalytics(req, res) {
    try {
      const { period = 'month' } = req.query;
      
      // Implementation for analytics data
      const analytics = {
        period,
        userGrowth: [],
        orderTrends: [],
        revenueMetrics: [],
        restaurantPerformance: []
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSupportTickets(req, res) {
    try {
      // This would require a tickets model - placeholder for now
      res.json({
        tickets: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getContactMessages(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const messages = await Contact.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        messages: messages.rows,
        pagination: {
          total: messages.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(messages.count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateUserReport(req, res) {
    try {
      const users = await User.findAll({
        include: [{ model: Role, as: 'role' }],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      res.json({ users, generatedAt: new Date() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateOrderReport(req, res) {
    try {
      const orders = await Order.findAll({
        include: [
          { model: Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
        ]
      });

      res.json({ orders, generatedAt: new Date() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateRevenueReport(req, res) {
    try {
      const revenue = await Order.findAll({
        where: { status: 'delivered' },
        attributes: ['createdAt', 'totalAmount', 'restaurantId'],
        include: [{ model: Restaurant, as: 'restaurant', attributes: ['name'] }]
      });

      res.json({ revenue, generatedAt: new Date() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();