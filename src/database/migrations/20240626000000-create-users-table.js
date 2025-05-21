'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add index for faster queries
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
  },
};
