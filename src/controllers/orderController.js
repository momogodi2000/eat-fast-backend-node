const { Order, OrderItem, Dish, Restaurant, User } = require('../models');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

class OrderController {
  async createGuestOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { items, deliveryAddress, customerName, customerPhone, customerEmail, restaurantId } = req.body;

      // Generate order number and guest token
      const orderNumber = `EF${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const guestToken = uuidv4();

      // Calculate total amount
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const dish = await Dish.findByPk(item.dishId);
        if (!dish || !dish.isAvailable) {
          return res.status(400).json({ error: `Dish ${item.dishId} not available` });
        }

        const itemTotal = dish.price * item.quantity;
        totalAmount += itemTotal;
        
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
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      totalAmount += restaurant.deliveryFee;

      // Create order
      const order = await Order.create({
        orderNumber,
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

      res.status(201).json({
        orderId: order.id,
        orderNumber,
        guestToken,
        totalAmount,
        estimatedDelivery: order.estimatedDelivery,
        message: 'Order created successfully'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async attachGuestOrder(req, res) {
    try {
      const { guestToken } = req.body;
      
      const order = await Order.findOne({
        where: { guestToken }
      });

      if (!order) {
        return res.status(404).json({ error: 'Guest order not found' });
      }

      if (order.userId) {
        return res.status(400).json({ error: 'Order already attached to user' });
      }

      await order.update({
        userId: req.user.id,
        guestToken: null
      });

      res.json({ message: 'Order attached to user account' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOrderReceipt(req, res) {
    try {
      const { orderId } = req.params;
      const { token } = req.query;

      let order;
      
      if (token) {
        // Guest access with token
        order = await Order.findOne({
          where: { id: orderId, guestToken: token }
        });
      } else if (req.user) {
        // User access
        order = await Order.findOne({
          where: { 
            id: orderId, 
            userId: req.user.id 
          }
        });
      } else {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const orderWithDetails = await Order.findByPk(orderId, {
        include: [
          { 
            model: OrderItem, 
            as: 'items',
            include: [{ model: Dish, as: 'dish' }]
          },
          { model: Restaurant, as: 'restaurant' }
        ]
      });

      res.json(orderWithDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      await order.update({ status });

      if (status === 'delivered') {
        await order.update({ actualDelivery: new Date() });
      }

      res.json({ message: 'Order status updated', status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new OrderController();