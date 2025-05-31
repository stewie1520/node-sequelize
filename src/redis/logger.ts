import logger from "../utils/logger.js";

export const logInfo = (msg: string, ...args: unknown[]) =>
  logger.info(msg, ...args);
export const logError = (msg: string, ...args: unknown[]) =>
  logger.error(msg, ...args);
export const logDebug = (msg: string, ...args: unknown[]) =>
  logger.debug(msg, ...args);
