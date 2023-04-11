import winston from 'winston';
import { config } from '../config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  verbose: 'white'
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    info => {
      const timestamp =
        config.NODE_ENV === 'development'
          ? ' '
          : `${info.timestamp as string}: `;

      const level = info.level;
      const message = info.message as string;

      return `[${level}]${timestamp}${message}`;
    }
  )
);

const transports = [
  new winston.transports.Console()
  // new winston.transports.File({
  //   filename: 'logs/error.log',
  //   level: 'error'
  // }),
  // new winston.transports.File({ filename: 'logs/all.log' })
];

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels,
  format,
  transports
});
