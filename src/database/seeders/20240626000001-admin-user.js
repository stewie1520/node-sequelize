'use strict';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

export default {
  up: async (queryInterface) => {
    // Create admin user from environment variables
    const adminEmail = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log(
        'Skipping admin user creation: Missing environment variables',
      );
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Insert the admin user
    return queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  down: async (queryInterface) => {
    // Remove the admin user
    return queryInterface.bulkDelete(
      'users',
      {
        email: process.env.ADMIN_USER,
      },
      {},
    );
  },
};
