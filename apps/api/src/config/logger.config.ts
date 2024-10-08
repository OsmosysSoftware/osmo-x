import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { transports, format } from 'winston';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import { name as applicationName } from 'package.json';

const configService = new ConfigService();

const logDir = 'logs';
const logFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    const { timestamp, level, url, httpMethod, context, data, message, stack } = info;
    const severity =
      level === 'error' || level === 'fatal' ? 'high' : level === 'warn' ? 'med' : 'low';
    const tracebackId = uuidv4();
    const logObject = {
      timestamp,
      level,
      severity,
      tracebackId,
      url,
      httpMethod,
      source: context,
      data,
      message,
      stackTrace: stack,
    };
    return JSON.stringify(logObject);
  }),
);

const transportsConfig = [
  new transports.Console({
    format: format.combine(
      format.timestamp(),
      format.ms(),
      nestWinstonModuleUtilities.format.nestLike(applicationName),
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
  level: configService.get('LOG_LEVEL', 'info'),
  transports: transportsConfig,
});
