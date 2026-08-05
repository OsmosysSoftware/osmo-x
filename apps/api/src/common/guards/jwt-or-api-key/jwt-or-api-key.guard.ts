import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ApiHeaderOptions } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';

export type RequestWithApiKeyAuth = Request & { apiKeyApplicationId?: number };

// Swagger doc for @ApiHeader() on any endpoint guarded by JwtOrApiKeyGuard.
export const API_KEY_HEADER_DOC: ApiHeaderOptions = {
  name: 'x-api-key',
  required: false,
  description: 'Server API key, scoped to a single application (alternative to Bearer JWT)',
};

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly gqlAuthGuard: GqlAuthGuard,
    private readonly rolesGuard: RolesGuard,
    private readonly serverApiKeysService: ServerApiKeysService,
  ) {}

  private getRequest(context: ExecutionContext, isGraphql: boolean): RequestWithApiKeyAuth {
    if (isGraphql) {
      return GqlExecutionContext.create(context).getContext().req;
    }

    return context.switchToHttp().getRequest<RequestWithApiKeyAuth>();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isGraphql = context.getType<'graphql' | 'http'>() === 'graphql';
    const request = this.getRequest(context, isGraphql);
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

    const jwtValid = isGraphql
      ? await this.gqlAuthGuard.canActivate(context)
      : await this.jwtAuthGuard.canActivate(context);

    if (!jwtValid) {
      return false;
    }

    return this.rolesGuard.canActivate(context);
  }
}
