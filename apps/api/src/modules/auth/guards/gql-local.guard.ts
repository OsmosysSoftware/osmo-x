import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

@Injectable()
export class GqlLocalAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    request.body = ctx.getArgs().loginUserInput;
    return request;
  }
}
