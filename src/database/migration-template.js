"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     *
     * For adding a column:
     * await queryInterface.addColumn('users', 'columnName', { type: Sequelize.STRING });
     *
     * For adding a foreign key:
     * await queryInterface.addConstraint('tableA', {
     *   fields: ['foreignTableId'],
     *   type: 'foreign key',
     *   name: 'fk_tableA_foreignTable',
     *   references: {
     *     table: 'foreignTable',
     *     field: 'id'
     *   },
     *   onDelete: 'cascade',
     *   onUpdate: 'cascade'
     * });
     */
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     *
     * For removing a column:
     * await queryInterface.removeColumn('users', 'columnName');
     *
     * For removing a foreign key:
     * await queryInterface.removeConstraint('tableA', 'fk_tableA_foreignTable');
     */
  },
};
