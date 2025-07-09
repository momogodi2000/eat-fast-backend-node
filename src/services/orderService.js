const { Order, OrderItem, Dish, Restaurant, User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./emailService');

class OrderService {
  async createOrder(orderData, userId = null) {
    const { items, deliveryAddress, customerName, customerPhone, customerEmail, restaurantId } = orderData;

    // Generate order number
    const orderNumber = `EF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const guestToken = userId ? null : uuidv4();

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const dish = await Dish.findByPk(item.dishId);
      if (!dish || !dish.isAvailable) {
        throw new Error(`Dish ${item.dishId} not available`);
      }

      const itemTotal = dish.price * item.quantity;
      totalAmount += parseFloat(itemTotal);
      
      orderItems.push({
        dishId: item.dishId,
        quantity: item.quantity,
        price: dish.price,
        specialInstructions: item.specialInstructions
      });
    }

    // Get restaurant for delivery fee
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    totalAmount += parseFloat(restaurant.deliveryFee);

    // Create order
    const order = await Order.create({
      orderNumber,
      userId,
      guestToken,
      restaurantId,
      totalAmount,
      deliveryFee: restaurant.deliveryFee,
      deliveryAddress,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod: 'cash_on_delivery',
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes
    });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      });
    }

    // Send confirmation email if provided
    if (customerEmail) {
      await emailService.sendOrderConfirmation(customerEmail, {
        orderNumber,
        totalAmount,
        deliveryAddress,
        estimatedDelivery: order.estimatedDelivery
      });
    }

    return {
      orderId: order.id,
      orderNumber,
      guestToken,
      totalAmount,
      estimatedDelivery: order.estimatedDelivery
    };
  }

  async getOrderById(orderId, userId = null, guestToken = null) {
    const where = { id: orderId };
    
    if (userId) {
      where.userId = userId;
    } else if (guestToken) {
      where.guestToken = guestToken;
    } else {
      throw new Error('User ID or guest token required');
    }

    const order = await Order.findOne({
      where,
      include: [
        { 
          model: OrderItem, 
          as: 'items',
          include: [{ model: Dish, as: 'dish' }]
        },
        { model: Restaurant, as: 'restaurant' },
        { model: User, as: 'user' }
      ]
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId, status, userId = null) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    await order.update({ status });

    if (status === 'delivered') {
      await order.update({ actualDelivery: new Date() });
    }

    // Send status update email
    if (order.customerEmail) {
      await emailService.sendOrderStatusUpdate(
        order.customerEmail,
        order.orderNumber,
        status
      );
    }

    return order;
  }

  async getUserOrders(userId, filters = {}) {
    const { page = 1, limit = 10, status } = filters;
    const offset = (page - 1) * limit;

    const where = { userId };
    if (status) where.status = status;

    const orders = await Order.findAndCountAll({
      where,
      include: [
        { 
          model: OrderItem, 
          as: 'items',
          include: [{ model: Dish, as: 'dish' }]
        },
        { model: Restaurant, as: 'restaurant' }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return orders;
  }

  async getRestaurantOrders(restaurantId, filters = {}) {
    const { page = 1, limit = 10, status } = filters;
    const offset = (page - 1) * limit;

    const where = { restaurantId };
    if (status) where.status = status;

    const orders = await Order.findAndCountAll({
      where,
      include: [
        { 
          model: OrderItem, 
          as: 'items',
          include: [{ model: Dish, as: 'dish' }]
        },
        { model: User, as: 'user' }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return orders;
  }
}

module.exports = new OrderService();