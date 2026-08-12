import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Protects internal endpoints that scheduler.sh calls directly (no user session).
 * Requires SCHEDULER_INTERNAL_KEY to be set and matched via the x-scheduler-key header.
 */
@Injectable()
export class SchedulerAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedKey = this.configService.get<string>('SCHEDULER_INTERNAL_KEY');

    if (!expectedKey) {
      throw new UnauthorizedException('Scheduler endpoint is not configured');
    }

    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-scheduler-key'];

    if (providedKey !== expectedKey) {
      throw new UnauthorizedException('Invalid scheduler key');
    }

    return true;
  }
}
