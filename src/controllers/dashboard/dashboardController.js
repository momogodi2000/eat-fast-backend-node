// src/controllers/dashboardController.js
const { User, Order, Restaurant, Dish } = require('../../models');
const { Op } = require('sequelize');

class DashboardController {
  /**
   * Redirect to appropriate dashboard based on user role
   */
  async redirectToDashboard(req, res) {
    try {
      const user = req.user;
      const role = user.role;

      // Role-based redirection
      const redirectMap = {
        'admin': '/admin/dashboard',
        'restaurant': '/restaurant/dashboard',
        'customer': '/customer/dashboard',
        'delivery': '/delivery/dashboard'
      };

      const redirectUrl = redirectMap[role] || '/customer/dashboard';

      res.json({
        success: true,
        redirectUrl,
        userRole: role,
        message: `Redirecting to ${role} dashboard`
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to determine dashboard',
        code: 'DASHBOARD_REDIRECT_FAILED'
      });
    }
  }

  /**
   * Admin Dashboard
   */
  async getAdminDashboard(req, res) {
    try {
      // Get various statistics
      const stats = await this.getAdminStats();

      res.json({
        success: true,
        data: {
          title: 'Admin Dashboard',
          user: req.user,
          stats,
          quickActions: [
            { name: 'Manage Users', url: '/admin/users' },
            { name: 'Approve Restaurants', url: '/admin/restaurants/pending' },
            { name: 'View Reports', url: '/admin/reports' },
            { name: 'System Settings', url: '/admin/settings' }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load admin dashboard',
        code: 'ADMIN_DASHBOARD_FAILED'
      });
    }
  }

  /**
   * Restaurant Manager Dashboard
   */
  async getRestaurantDashboard(req, res) {
    try {
      const userId = req.user.id;
      
      // Get restaurant owned by user
      const restaurant = await Restaurant.findOne({
        where: { ownerId: userId }
      });

      if (!restaurant) {
        return res.status(404).json({
          error: 'Restaurant not found for this user',
          code: 'RESTAURANT_NOT_FOUND'
        });
      }

      const stats = await this.getRestaurantStats(restaurant.id);

      res.json({
        success: true,
        data: {
          title: 'Restaurant Dashboard',
          user: req.user,
          restaurant,
          stats,
          quickActions: [
            { name: 'Manage Menu', url: '/restaurant/menu' },
            { name: 'View Orders', url: '/restaurant/orders' },
            { name: 'Analytics', url: '/restaurant/analytics' },
            { name: 'Settings', url: '/restaurant/settings' }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load restaurant dashboard',
        code: 'RESTAURANT_DASHBOARD_FAILED'
      });
    }
  }

  /**
   * Customer Dashboard
   */
  async getCustomerDashboard(req, res) {
    try {
      const userId = req.user.id;
      const stats = await this.getCustomerStats(userId);

      res.json({
        success: true,
        data: {
          title: 'Customer Dashboard',
          user: req.user,
          stats,
          quickActions: [
            { name: 'Browse Restaurants', url: '/restaurants' },
            { name: 'My Orders', url: '/orders/history' },
            { name: 'Favorites', url: '/favorites' },
            { name: 'Profile Settings', url: '/profile' }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load customer dashboard',
        code: 'CUSTOMER_DASHBOARD_FAILED'
      });
    }
  }

  /**
   * Delivery Personnel Dashboard
   */
  async getDeliveryDashboard(req, res) {
    try {
      const userId = req.user.id;
      const stats = await this.getDeliveryStats(userId);

      res.json({
        success: true,
        data: {
          title: 'Delivery Dashboard',
          user: req.user,
          stats,
          quickActions: [
            { name: 'Available Orders', url: '/delivery/available' },
            { name: 'My Deliveries', url: '/delivery/history' },
            { name: 'Earnings', url: '/delivery/earnings' },
            { name: 'Profile', url: '/delivery/profile' }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load delivery dashboard',
        code: 'DELIVERY_DASHBOARD_FAILED'
      });
    }
  }

  /**
   * Get admin statistics
   */
  async getAdminStats() {
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      pendingRestaurants,
      todayOrders,
      totalRevenue
    ] = await Promise.all([
      User.count(),
      Restaurant.count(),
      Order.count(),
      Restaurant.count({ where: { status: 'pending' } }),
      Order.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Order.sum('totalAmount', {
        where: { status: 'delivered' }
      })
    ]);

    return {
      totalUsers,
      totalRestaurants,
      totalOrders,
      pendingRestaurants,
      todayOrders,
      totalRevenue: totalRevenue || 0
    };
  }

  /**
   * Get restaurant statistics
   */
  async getRestaurantStats(restaurantId) {
    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      totalDishes,
      averageRating
    ] = await Promise.all([
      Order.count({ where: { restaurantId } }),
      Order.count({
        where: {
          restaurantId,
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Order.sum('totalAmount', {
        where: { restaurantId, status: 'delivered' }
      }),
      Dish.count({ where: { restaurantId } }),
      // You might want to implement a rating system
      4.5 // Placeholder
    ]);

    return {
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue || 0,
      totalDishes,
      averageRating
    };
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(userId) {
    const [
      totalOrders,
      totalSpent,
      favoriteRestaurants,
      recentOrders
    ] = await Promise.all([
      Order.count({ where: { userId } }),
      Order.sum('totalAmount', {
        where: { userId, status: 'delivered' }
      }),
      // You might want to implement a favorites system
      0, // Placeholder
      Order.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{ model: Restaurant, as: 'restaurant' }]
      })
    ]);

    return {
      totalOrders,
      totalSpent: totalSpent || 0,
      favoriteRestaurants,
      recentOrders
    };
  }

  /**
   * Get delivery personnel statistics
   */
  async getDeliveryStats(userId) {
    // Assuming you have a delivery assignments table
    const stats = {
      totalDeliveries: 0,
      todayDeliveries: 0,
      totalEarnings: 0,
      averageRating: 0,
      availableOrders: 0
    };

    // Implement actual statistics based on your delivery system
    return stats;
  }
}

module.exports = new DashboardController();