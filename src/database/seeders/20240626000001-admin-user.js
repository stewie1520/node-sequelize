"use strict";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

export default {
  up: async (queryInterface) => {
    // Create admin user from environment variables
    const adminEmail = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log(
        "Skipping admin user creation: Missing environment variables",
      );
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    const adminId = uuidv4();

    // Insert the admin user
    await queryInterface.bulkInsert(
      "users",
      [
        {
          id: adminId,
          name: "Admin User",
          email: adminEmail,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );

    await queryInterface.bulkInsert(
      "user_roles",
      [
        {
          id: uuidv4(),
          userId: adminId,
          role: "ADMIN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  down: async (queryInterface) => {
    // Remove the admin user
    await queryInterface.bulkDelete(
      "users",
      {
        email: process.env.ADMIN_USER,
      },
      {},
    );
  },
};
