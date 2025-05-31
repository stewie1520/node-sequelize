import dotenv from "dotenv";

dotenv.config();

export const app = {
  port: parseInt(process.env.PORT || "3001", 10),
  env: (process.env.NODE_ENV || "development") as
    | "development"
    | "staging"
    | "production",
};
