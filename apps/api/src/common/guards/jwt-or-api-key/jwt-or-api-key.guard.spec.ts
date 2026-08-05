import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtOrApiKeyGuard, RequestWithApiKeyAuth } from './jwt-or-api-key.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';

describe('JwtOrApiKeyGuard', () => {
  let guard: JwtOrApiKeyGuard;
  let jwtAuthGuard: { canActivate: jest.Mock };
  let gqlAuthGuard: { canActivate: jest.Mock };
  let rolesGuard: { canActivate: jest.Mock };
  let serverApiKeysService: { findApplicationIdByRawApiKey: jest.Mock };

  const buildHttpContext = (headers: Record<string, string | string[]>): ExecutionContext => {
    const request = { headers } as RequestWithApiKeyAuth;

    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  const buildGraphqlContext = (headers: Record<string, string | string[]>): ExecutionContext => {
    const req = { headers } as RequestWithApiKeyAuth;

    return {
      getType: () => 'graphql',
      getArgs: () => [{}, {}, { req }, {}],
      getClass: () => class {},
      getHandler: () => function handler(): void {},
      req,
    } as unknown as ExecutionContext & { req: RequestWithApiKeyAuth };
  };

  beforeEach(() => {
    jwtAuthGuard = { canActivate: jest.fn() };
    gqlAuthGuard = { canActivate: jest.fn() };
    rolesGuard = { canActivate: jest.fn() };
    serverApiKeysService = { findApplicationIdByRawApiKey: jest.fn() };
    guard = new JwtOrApiKeyGuard(
      jwtAuthGuard as unknown as JwtAuthGuard,
      gqlAuthGuard as unknown as GqlAuthGuard,
      rolesGuard as unknown as RolesGuard,
      serverApiKeysService as unknown as ServerApiKeysService,
    );
  });

  it('authenticates via x-api-key and stamps apiKeyApplicationId on the request', async () => {
    serverApiKeysService.findApplicationIdByRawApiKey.mockResolvedValue(7);
    const context = buildHttpContext({ 'x-api-key': 'raw-key' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(serverApiKeysService.findApplicationIdByRawApiKey).toHaveBeenCalledWith('raw-key');
    expect(jwtAuthGuard.canActivate).not.toHaveBeenCalled();
    expect(context.switchToHttp().getRequest<RequestWithApiKeyAuth>().apiKeyApplicationId).toBe(7);
  });

  it('rejects an unrecognized x-api-key', async () => {
    serverApiKeysService.findApplicationIdByRawApiKey.mockResolvedValue(undefined);
    const context = buildHttpContext({ 'x-api-key': 'bad-key' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('uses the first value when x-api-key is sent as multiple headers', async () => {
    serverApiKeysService.findApplicationIdByRawApiKey.mockResolvedValue(3);
    const context = buildHttpContext({ 'x-api-key': ['first-key', 'second-key'] });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(serverApiKeysService.findApplicationIdByRawApiKey).toHaveBeenCalledWith('first-key');
  });

  it('falls back to JWT + role auth when no x-api-key header is present (HTTP)', async () => {
    jwtAuthGuard.canActivate.mockResolvedValue(true);
    rolesGuard.canActivate.mockReturnValue(true);
    const context = buildHttpContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(serverApiKeysService.findApplicationIdByRawApiKey).not.toHaveBeenCalled();
    expect(jwtAuthGuard.canActivate).toHaveBeenCalledWith(context);
    expect(gqlAuthGuard.canActivate).not.toHaveBeenCalled();
    expect(rolesGuard.canActivate).toHaveBeenCalledWith(context);
  });

  it('short-circuits when JwtAuthGuard rejects, without calling RolesGuard', async () => {
    jwtAuthGuard.canActivate.mockResolvedValue(false);
    const context = buildHttpContext({});

    await expect(guard.canActivate(context)).resolves.toBe(false);
    expect(rolesGuard.canActivate).not.toHaveBeenCalled();
  });

  it('authenticates GraphQL requests via x-api-key and stamps the underlying req', async () => {
    serverApiKeysService.findApplicationIdByRawApiKey.mockResolvedValue(9);
    const context = buildGraphqlContext({ 'x-api-key': 'raw-key' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect((context as unknown as { req: RequestWithApiKeyAuth }).req.apiKeyApplicationId).toBe(9);
    expect(gqlAuthGuard.canActivate).not.toHaveBeenCalled();
  });

  it('falls back to GqlAuthGuard + role auth for GraphQL requests with no x-api-key', async () => {
    gqlAuthGuard.canActivate.mockResolvedValue(true);
    rolesGuard.canActivate.mockReturnValue(true);
    const context = buildGraphqlContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(gqlAuthGuard.canActivate).toHaveBeenCalledWith(context);
    expect(jwtAuthGuard.canActivate).not.toHaveBeenCalled();
    expect(rolesGuard.canActivate).toHaveBeenCalledWith(context);
  });
});
