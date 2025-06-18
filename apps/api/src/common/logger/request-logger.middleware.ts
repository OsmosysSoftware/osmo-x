import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body } = req;
    const now = Date.now();

    // Log request details before it reaches the handler
    this.logger.log(`Incoming Request: ${method} ${originalUrl}`);

    if (Object.keys(body).length > 0) {
      this.logger.log(`Request Body: ${JSON.stringify(body)}`);
    }

    // Set up a listener for when the response finishes
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const delay = Date.now() - now;

      this.logger.log(
        `Outgoing Response: ${method} ${originalUrl} - statusCode ${statusCode} - contentLength ${contentLength} - delay ${delay}ms`,
      );
    });

    // Pass control to the next middleware or route handler
    next();
  }
}
