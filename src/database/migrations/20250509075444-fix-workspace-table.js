'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('workspaces', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    queryInterface.removeColumn('workspaces', 'deletedAt');
  },
};
