const { User, Role, Order, Restaurant } = require('../models');
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
      const stats = await Promise.all([
        User.count(),
        Restaurant.count(),
        Order.count(),
        Order.count({ where: { status: 'delivered' } }),
        Order.sum('totalAmount', { where: { status: 'delivered' } })
      ]);

      res.json({
        totalUsers: stats[0],
        totalRestaurants: stats[1],
        totalOrders: stats[2],
        deliveredOrders: stats[3],
        totalRevenue: stats[4] || 0
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();