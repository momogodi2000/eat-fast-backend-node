const { Contact } = require('../models');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

class ContactController {
  async submitContact(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, subject, message } = req.body;

      // Create contact inquiry
      const contact = await Contact.create({
        name,
        email,
        subject,
        message,
        status: 'new',
        priority: 'medium'
      });

      // Send notification to admin
      await emailService.sendContactNotification(contact);

      res.status(201).json({
        message: 'Contact inquiry submitted successfully',
        inquiryId: contact.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getContacts(req, res) {
    try {
      const { page = 1, limit = 10, status, priority, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const contacts = await Contact.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        contacts: contacts.rows,
        pagination: {
          total: contacts.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(contacts.count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getContactById(req, res) {
    try {
      const { id } = req.params;
      const contact = await Contact.findByPk(id);

      if (!contact) {
        return res.status(404).json({ error: 'Contact inquiry not found' });
      }

      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async replyToContact(req, res) {
    try {
      const { id } = req.params;
      const { reply } = req.body;

      const contact = await Contact.findByPk(id);
      if (!contact) {
        return res.status(404).json({ error: 'Contact inquiry not found' });
      }

      // Update contact with reply
      await contact.update({
        adminReply: reply,
        repliedAt: new Date(),
        repliedBy: req.user.id,
        status: 'resolved'
      });

      // Send reply email
      await emailService.sendContactReply(
        contact.email,
        contact.name,
        contact.subject,
        reply
      );

      res.json({ message: 'Reply sent successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ContactController();