import path from "path";

import winston from "winston";
import { getRequestId } from "./requestContext.js";
import { app as appConfig } from "../config/app.js";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  return appConfig.env === "development" ? "debug" : "warn";
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Add colors to winston
winston.addColors(colors);

const requestIdFormat = winston.format((info) => {
  info.requestId = getRequestId();
  return info;
});

// Define the format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
  requestIdFormat(),
);

// Define the format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.json(),
  requestIdFormat(),
);

// Define the logger configuration
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // Error log file transport
  new winston.transports.File({
    filename: path.join("logs", "error.log"),
    level: "error",
    format: fileFormat,
  }),
  // All logs file transport
  new winston.transports.File({
    filename: path.join("logs", "all.log"),
    format: fileFormat,
  }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

export default logger;
