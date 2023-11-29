import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpExceptionBody,
} from '@nestjs/common';
import { Response } from 'express';
import { JsendFormatter } from './jsend-formatter';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private jsend: JsendFormatter) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const data = exception.getResponse() as HttpExceptionBody;
    response.status(status).json(this.jsend.fail(data.message));
  }
}
