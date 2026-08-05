import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtOrApiKeyGuard, RequestWithApiKeyAuth } from './jwt-or-api-key.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';

describe('JwtOrApiKeyGuard', () => {
  let guard: JwtOrApiKeyGuard;
  let jwtAuthGuard: { canActivate: jest.Mock };
  let rolesGuard: { canActivate: jest.Mock };
  let serverApiKeysService: { findApplicationIdByRawApiKey: jest.Mock };

  const buildContext = (headers: Record<string, string | string[]>): ExecutionContext => {
    const request = { headers } as RequestWithApiKeyAuth;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jwtAuthGuard = { canActivate: jest.fn() };
    rolesGuard = { canActivate: jest.fn() };
    serverApiKeysService = { findApplicationIdByRawApiKey: jest.fn() };
    guard = new JwtOrApiKeyGuard(
      jwtAuthGuard as unknown as JwtAuthGuard,
      rolesGuard as unknown as RolesGuard,
      serverApiKeysService as unknown as ServerApiKeysService,
    );
  });

  it('authenticates via x-api-key and stamps apiKeyApplicationId on the request', async () => {
    serverApiKeysService.findApplicationIdByRawApiKey.mockResolvedValue(7);
    const context = buildContext({ 'x-api-key': 'raw-key' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(serverApiKeysService.findApplicationIdByRawApiKey).toHaveBeenCalledWith('raw-key');
    expect(jwtAuthGuard.canActivate).not.toHaveBeenCalled();
    expect(context.switchToHttp().getRequest<RequestWithApiKeyAuth>().apiKeyApplicationId).toBe(7);
  });

  it('rejects an unrecognized x-api-key', async () => {
    serverApiKeysService.findApplicationIdByRawApiKey.mockResolvedValue(undefined);
    const context = buildContext({ 'x-api-key': 'bad-key' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('uses the first value when x-api-key is sent as multiple headers', async () => {
    serverApiKeysService.findApplicationIdByRawApiKey.mockResolvedValue(3);
    const context = buildContext({ 'x-api-key': ['first-key', 'second-key'] });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(serverApiKeysService.findApplicationIdByRawApiKey).toHaveBeenCalledWith('first-key');
  });

  it('falls back to JWT + role auth when no x-api-key header is present', async () => {
    jwtAuthGuard.canActivate.mockResolvedValue(true);
    rolesGuard.canActivate.mockReturnValue(true);
    const context = buildContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(serverApiKeysService.findApplicationIdByRawApiKey).not.toHaveBeenCalled();
    expect(jwtAuthGuard.canActivate).toHaveBeenCalledWith(context);
    expect(rolesGuard.canActivate).toHaveBeenCalledWith(context);
  });

  it('short-circuits when JwtAuthGuard rejects, without calling RolesGuard', async () => {
    jwtAuthGuard.canActivate.mockResolvedValue(false);
    const context = buildContext({});

    await expect(guard.canActivate(context)).resolves.toBe(false);
    expect(rolesGuard.canActivate).not.toHaveBeenCalled();
  });
});
