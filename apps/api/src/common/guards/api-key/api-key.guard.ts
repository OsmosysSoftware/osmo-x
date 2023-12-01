import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

const configService = new ConfigService();
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const apiKey = configService.getOrThrow<string>('SERVER_API_KEY');
    const request = context.switchToHttp().getRequest();

    // Get auth header incase of http request
    if (request && request.headers) {
      const authHeader = request.headers['authorization'];

      if (authHeader && authHeader === `Bearer ${apiKey}`) {
        return true;
      }
    }

    // Get quth header incase of graphql request
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader === `Bearer ${apiKey}`) {
      return true;
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
