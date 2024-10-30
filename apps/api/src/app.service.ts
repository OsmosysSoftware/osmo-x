import { Injectable } from '@nestjs/common';
import { SUCCESS_RESPONSE } from './common/constants/miscellaneous';

@Injectable()
export class AppService {
  getSuccessResponse(): string {
    const response = SUCCESS_RESPONSE;
    return response;
  }
}
