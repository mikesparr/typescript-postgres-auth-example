/**
 * Standard logger (to console for 12factor)
 */
import winston from "winston";

const { createLogger, format, transports } = winston;
const { combine, timestamp, colorize, printf } = format;

const prodFormat = () => {
  const replaceError = ({ label, level, message, stack }: any) => ({
    label,
    level,
    message,
    stack,
  });

  const replacer = (key: string, value: any) =>
    value instanceof Error ? replaceError(value) : value;

  return combine(format.json({ replacer }));
};

const devFormat = () => {
  const formatMessage = (info: any) => `${info.level} ${info.message}`;
  const formatError = (info: any) =>
    `${info.level} ${info.message}\n\n${info.stack}\n`;

  const fmt = (info: any) =>
    info instanceof Error ? formatError(info) : formatMessage(info);
  return combine(colorize(), printf(fmt));
};

const logger = createLogger({
  exitOnError: false,
  format: process.env.NODE_ENV === "production" ? prodFormat() : devFormat(),
  level: "info",
  transports: [
    new transports.Console(),
    // new winston.transports.File({ filename: "errors.log" }),
  ],
});

export default logger;
