import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: format.combine(
    format.timestamp({format: 'DD-MM-YYYY hh:mm:ss A'}),
    format.colorize(),
    format.simple(),
  ),
  transports: [
    new transports.Console(),
    // new transports.File({ filename: 'app.log' })
  ],
});

export default logger;
