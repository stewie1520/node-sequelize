'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workspaces', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      authorId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workspaces');
  },
};
