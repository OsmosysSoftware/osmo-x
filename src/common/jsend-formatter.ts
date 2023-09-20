import { HttpExceptionBodyMessage } from '@nestjs/common';
import { Notification } from 'src/modules/notifications/entities/notification.entity';

export class JsendFormatter {
  public success(data: { notification: Notification }): Record<string, unknown> {
    return {
      status: 'success',
      data: data,
    };
  }

  public fail(data: HttpExceptionBodyMessage): Record<string, unknown> {
    return {
      status: 'fail',
      data: data,
    };
  }

  public error(message: string): Record<string, unknown> {
    return {
      status: 'error',
      message: message,
    };
  }
}
