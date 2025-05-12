import dotenv from "dotenv";

dotenv.config();

export const app = {
  port: (process.env.PORT || 3001) as number,
};
