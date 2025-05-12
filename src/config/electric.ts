import dotenv from "dotenv";

dotenv.config();

export const electric = {
  url: process.env.ELECTRIC_SHAPE_URL as string,
};
