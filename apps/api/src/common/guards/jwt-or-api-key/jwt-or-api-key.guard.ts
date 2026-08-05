import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';

export type RequestWithApiKeyAuth = Request & { apiKeyApplicationId?: number };

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly rolesGuard: RolesGuard,
    private readonly serverApiKeysService: ServerApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApiKeyAuth>();
    const apiKeyHeader = request.headers['x-api-key'];

    if (apiKeyHeader) {
      const rawApiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
      const applicationId = await this.serverApiKeysService.findApplicationIdByRawApiKey(rawApiKey);

      if (applicationId === undefined) {
        throw new UnauthorizedException('Invalid API key');
      }

      request.apiKeyApplicationId = applicationId;

      return true;
    }

    const jwtValid = await this.jwtAuthGuard.canActivate(context);

    if (!jwtValid) {
      return false;
    }

    return this.rolesGuard.canActivate(context);
  }
}
