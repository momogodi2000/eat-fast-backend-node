const { PartnerApplication } = require('../../models');
const { validationResult } = require('express-validator');
const emailService = require('../../services/email/emailService');

class PartnerController {
  async submitApplication(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Map frontend field names to backend field names
      const applicationData = {
        restaurantName: req.body.businessName || req.body.restaurantName,
        ownerName: req.body.contactName || req.body.ownerName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        cuisine: req.body.cuisine || req.body.cuisineType,
        description: req.body.description || req.body.businessExperience || '',
        // Store additional frontend fields in the additionalInfo field
        additionalInfo: {
          businessExperience: req.body.businessExperience,
          foundingYear: req.body.foundingYear,
          employeeCount: req.body.employeeCount,
          averageOrderValue: req.body.averageOrderValue,
          deliveryRadius: req.body.deliveryRadius,
          openingHours: req.body.openingHours,
          website: req.body.website,
          socialMedia: req.body.socialMedia
        }
      };
      
      // Handle file uploads if any
      if (req.files && req.files.length > 0) {
        applicationData.documents = req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        }));
      }

      const application = await PartnerApplication.create(applicationData);

      // Send confirmation email
      await emailService.sendPartnerApplicationConfirmation(
        application.email,
        application.ownerName,
        application.id
      );

      res.status(201).json({
        message: 'Application submitted successfully',
        applicationId: application.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      
      const application = await PartnerApplication.findByPk(id, {
        attributes: ['id', 'restaurantName', 'status', 'createdAt', 'reviewedAt']
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json(application);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllApplications(req, res) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (search) {
        where[Op.or] = [
          { restaurantName: { [Op.iLike]: `%${search}%` } },
          { ownerName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const applications = await PartnerApplication.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        applications: applications.rows,
        pagination: {
          total: applications.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(applications.count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const application = await PartnerApplication.findByPk(id);

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json(application);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, rejectionReason, notes } = req.body;

      const application = await PartnerApplication.findByPk(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      await application.update({
        status,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        notes
      });

      // Send status update email
      await emailService.sendPartnerStatusUpdate(
        application.email,
        application.ownerName,
        application.restaurantName,
        status,
        rejectionReason
      );

      res.json({ message: 'Application status updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PartnerController();