'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add metadata field to contacts table
    await queryInterface.addColumn('contacts', 'metadata', {
      type: Sequelize.JSONB,
      defaultValue: {}
    }).catch(error => {
      console.log('Column metadata already exists in contacts table or table does not exist');
    });

    // Add additionalInfo field to partner_applications table
    await queryInterface.addColumn('partner_applications', 'additionalInfo', {
      type: Sequelize.JSONB,
      defaultValue: {}
    }).catch(error => {
      console.log('Column additionalInfo already exists in partner_applications table or table does not exist');
    });

    // Add source and preferences fields to newsletters table
    await queryInterface.addColumn('newsletters', 'source', {
      type: Sequelize.STRING,
      defaultValue: 'website'
    }).catch(error => {
      console.log('Column source already exists in newsletters table or table does not exist');
    });

    await queryInterface.addColumn('newsletters', 'preferences', {
      type: Sequelize.JSONB,
      defaultValue: {
        promotions: true,
        news: true,
        product_updates: true
      }
    }).catch(error => {
      console.log('Column preferences already exists in newsletters table or table does not exist');
    });

    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // Remove metadata field from contacts table
    await queryInterface.removeColumn('contacts', 'metadata').catch(error => {
      console.log('Column metadata does not exist in contacts table or table does not exist');
    });

    // Remove additionalInfo field from partner_applications table
    await queryInterface.removeColumn('partner_applications', 'additionalInfo').catch(error => {
      console.log('Column additionalInfo does not exist in partner_applications table or table does not exist');
    });

    // Remove source and preferences fields from newsletters table
    await queryInterface.removeColumn('newsletters', 'source').catch(error => {
      console.log('Column source does not exist in newsletters table or table does not exist');
    });
    
    await queryInterface.removeColumn('newsletters', 'preferences').catch(error => {
      console.log('Column preferences does not exist in newsletters table or table does not exist');
    });

    return Promise.resolve();
  }
}; 