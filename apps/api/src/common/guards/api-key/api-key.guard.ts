import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly serverApiKeysService: ServerApiKeysService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateRequest(context);
  }

  async validateRequest(execContext: ExecutionContext): Promise<boolean> {
    const request = execContext.switchToHttp().getRequest();
    let apiKeyToken = null;

    // Get auth header incase of http request
    if (request && request.headers) {
      const authHeader = request.headers['authorization'];

      if (authHeader.startsWith('Bearer ')) {
        apiKeyToken = authHeader.substring(7);
      } else {
        throw new Error('Invalid bearer token format');
      }

      const apiKeyEntry = await this.serverApiKeysService.findByServerApiKey(apiKeyToken);

      if (apiKeyToken && apiKeyToken === apiKeyEntry.apiKey) {
        return true;
      }
    }

    // Get quth header incase of graphql request
    const ctx = GqlExecutionContext.create(execContext);
    const req = ctx.getContext().req;
    const authHeader = req.headers.authorization;

    if (authHeader.startsWith('Bearer ')) {
      apiKeyToken = authHeader.substring(7);
    } else {
      throw new Error('Invalid bearer token format');
    }

    const apiKeyEntry = await this.serverApiKeysService.findByServerApiKey(apiKeyToken);

    if (apiKeyToken && apiKeyToken === apiKeyEntry.apiKey) {
      return true;
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
