import logger from "../utils/logger.js";

export const logInfo = (msg: string, ...args: unknown[]) => logger.info('INFO:', msg, ...args);
export const logError = (msg: string, ...args: unknown[]) => logger.error('ERROR:', msg, ...args);
export const logDebug = (msg: string, ...args: unknown[]) => logger.debug('DEBUG:', msg, ...args);
