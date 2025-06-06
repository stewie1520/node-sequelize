import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import logger from "../utils/logger.js";

dotenv.config();

// Database connection configuration
const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "my_first_electric_db",
  logging: (sql, timing) => {
    logger.debug(sql, { timing });
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
