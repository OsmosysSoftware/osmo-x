import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getSuccessResponse(): string {
    const response = `🚀✨ You're all set! Everything is up and running smoothly! ✨🚀`;
    return response;
  }
}
