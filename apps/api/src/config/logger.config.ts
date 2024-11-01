import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { transports, format } from 'winston';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import { name as applicationName } from 'package.json';
import DailyRotateFile from 'winston-daily-rotate-file';

const configService = new ConfigService();

const logDir = 'logs';

// Fetch maxSize values from environment variables or use defaults
const combinedLogMaxSize = configService.get<string>('COMBINED_LOG_MAX_SIZE');
const errorLogMaxSize = configService.get<string>('ERROR_LOG_MAX_SIZE');

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

// Configure combined log options
const combinedLogOptions: DailyRotateFile.DailyRotateFileTransportOptions = {
  filename: join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '30d',
  format: logFormat,
};

// Set maxSize for combined logs based on env variable or default
if (combinedLogMaxSize === '0') {
  // Do not set maxSize to remove the limit
} else if (combinedLogMaxSize) {
  combinedLogOptions.maxSize = combinedLogMaxSize;
} else {
  // Default value
  combinedLogOptions.maxSize = '150m';
}

// Configure error log options
const errorLogOptions: DailyRotateFile.DailyRotateFileTransportOptions = {
  filename: join(logDir, 'error-%DATE%.log'),
  level: 'error',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '30d',
  format: logFormat,
};

// Set maxSize for error logs based on env variable or default
if (errorLogMaxSize === '0') {
  // Do not set maxSize to remove the limit
} else if (errorLogMaxSize) {
  errorLogOptions.maxSize = errorLogMaxSize;
} else {
  // Default value
  errorLogOptions.maxSize = '20m';
}

const transportsConfig = [
  new transports.Console({
    format: format.combine(
      format.timestamp(),
      format.ms(),
      nestWinstonModuleUtilities.format.nestLike(applicationName),
    ),
  }),
  new transports.DailyRotateFile(combinedLogOptions),
  new transports.DailyRotateFile(errorLogOptions),
];

export const loggerConfig = WinstonModule.createLogger({
  level: configService.get('LOG_LEVEL', 'info'),
  transports: transportsConfig,
});
