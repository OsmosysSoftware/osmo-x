import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { transports, format } from 'winston';
import { join } from 'path';
import 'winston-daily-rotate-file';

const logDir = 'logs';
const logFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    const { timestamp, severity, requestId, httpMethod, requestUrl, level, message, stack, data } =
      info;
    const logObject = {
      timestamp,
      level,
      severity,
      requestId,
      httpMethod,
      requestUrl,
      message,
      stackTrace: stack,
      data,
    };
    return JSON.stringify(logObject);
  }),
);

const transportsConfig = [
  new transports.Console({
    format: format.combine(
      format.timestamp(),
      format.ms(),
      nestWinstonModuleUtilities.format.nestLike('OsmoNotify'),
    ),
  }),

  new transports.DailyRotateFile({
    filename: join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '30d',
    maxSize: '5m',
    format: logFormat,
  }),
  new transports.DailyRotateFile({
    filename: join(logDir, 'error-%DATE%.log'),
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '30d',
    maxSize: '5m',
    format: logFormat,
  }),
];

export const loggerConfig = WinstonModule.createLogger({
  transports: transportsConfig,
});
