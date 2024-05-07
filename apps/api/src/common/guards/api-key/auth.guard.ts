import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly serverApiKeysService: ServerApiKeysService,
    private logger: Logger,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateRequest(context);
  }

  async validateRequest(execContext: ExecutionContext): Promise<boolean> {
    const request = execContext.switchToHttp().getRequest();

    // Get auth header incase of http request
    if (request && request.headers) {
      const authHeader = request.headers['authorization'];
      const validationResult = await this.validateAuthHeader(authHeader);

      if (validationResult) {
        return true;
      }
    }

    // Get auth header incase of graphql request
    const ctx = GqlExecutionContext.create(execContext);
    const req = ctx.getContext().req;
    const authHeader = req.headers.authorization;
    const validationResult = await this.validateAuthHeader(authHeader);

    if (validationResult) {
      return true;
    }

    throw new UnauthorizedException('Invalid API key');
  }

  // TODO: validate using jwt token instead of db
  async validateAuthHeader(authHeader: string): Promise<boolean> {
    if (!authHeader) {
      this.logger.error('No bearer token provided');
      throw new UnauthorizedException('No bearer token provided');
    }

    let apiKeyToken = null;

    if (authHeader.startsWith('Bearer ')) {
      apiKeyToken = authHeader.substring(7);
    } else {
      this.logger.error('Invalid bearer token format');
      throw new UnauthorizedException('Invalid bearer token format');
    }

    const apiKeyEntry = await this.serverApiKeysService.findByServerApiKey(apiKeyToken);

    if (!apiKeyEntry) {
      this.logger.error('Invalid token');
      throw new UnauthorizedException('Invalid token');
    }

    if (apiKeyToken && apiKeyToken === apiKeyEntry.apiKey) {
      return true;
    }

    return false;
  }
}
