'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create newsletters table
    await queryInterface.createTable('newsletters', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'unsubscribed'),
        defaultValue: 'pending'
      },
      confirmationToken: {
        type: Sequelize.STRING
      },
      unsubscribeToken: {
        type: Sequelize.STRING
      },
      confirmedAt: {
        type: Sequelize.DATE
      },
      unsubscribedAt: {
        type: Sequelize.DATE
      },
      unsubscribeReason: {
        type: Sequelize.TEXT
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create contacts table
    await queryInterface.createTable('contacts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('new', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'new'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      adminReply: {
        type: Sequelize.TEXT
      },
      repliedAt: {
        type: Sequelize.DATE
      },
      repliedBy: {
        type: Sequelize.UUID
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create partner_applications table
    await queryInterface.createTable('partner_applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      restaurantName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ownerName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      cuisine: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      businessLicense: {
        type: Sequelize.STRING
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      status: {
        type: Sequelize.ENUM('pending', 'under_review', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      reviewedBy: {
        type: Sequelize.UUID
      },
      reviewedAt: {
        type: Sequelize.DATE
      },
      rejectionReason: {
        type: Sequelize.TEXT
      },
      notes: {
        type: Sequelize.TEXT
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('partner_applications');
    await queryInterface.dropTable('contacts');
    await queryInterface.dropTable('newsletters');
  }
};