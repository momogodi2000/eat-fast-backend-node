const { Newsletter } = require('../../models');
const { validationResult } = require('express-validator');
const emailService = require('../../services/email/emailService');
const crypto = require('crypto');

class NewsletterController {
  async subscribe(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, source, preferences } = req.body;

      // Check if already subscribed
      const existingSubscription = await Newsletter.findOne({ where: { email } });
      
      if (existingSubscription) {
        if (existingSubscription.status === 'confirmed') {
          // Update preferences if provided
          if (preferences) {
            await existingSubscription.update({
              preferences: preferences
            });
            return res.json({ message: 'Preferences updated successfully' });
          }
          return res.status(400).json({ error: 'Email already subscribed' });
        }
        
        // Resend confirmation if pending
        if (existingSubscription.status === 'pending') {
          await emailService.sendNewsletterConfirmation(
            email,
            existingSubscription.confirmationToken
          );
          return res.json({ message: 'Confirmation email resent' });
        }
      }

      // Create new subscription
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      const subscription = await Newsletter.create({
        email,
        confirmationToken,
        unsubscribeToken,
        status: 'pending',
        source: source || 'website',
        preferences: preferences || {
          promotions: true,
          news: true,
          product_updates: true
        }
      });

      // Send confirmation email
      await emailService.sendNewsletterConfirmation(email, confirmationToken);

      res.status(201).json({
        message: 'Please check your email to confirm subscription'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async confirmSubscription(req, res) {
    try {
      const { token } = req.params;

      const subscription = await Newsletter.findOne({
        where: { confirmationToken: token }
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Invalid confirmation token' });
      }

      if (subscription.status === 'confirmed') {
        return res.json({ message: 'Email already confirmed' });
      }

      await subscription.update({
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmationToken: null
      });

      res.json({ message: 'Email confirmed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async unsubscribe(req, res) {
    try {
      const { token } = req.params;
      const { reason } = req.body;

      const subscription = await Newsletter.findOne({
        where: { unsubscribeToken: token }
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Invalid unsubscribe token' });
      }

      await subscription.update({
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
        unsubscribeReason: reason || null
      });

      res.json({ message: 'Successfully unsubscribed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await Newsletter.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'confirmed\' THEN 1 END')), 'confirmed'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'pending\' THEN 1 END')), 'pending'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'unsubscribed\' THEN 1 END')), 'unsubscribed']
        ],
        raw: true
      });

      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new NewsletterController();