import { ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  const user = ctx.getContext().req.user;

  if (!user) {
    throw new Error('User not found in request');
  }

  return user;
});
