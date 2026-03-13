import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly host: string;
  private readonly port: number;

  constructor(private readonly configService: ConfigService) {
    super();
    this.host = this.configService.getOrThrow<string>('REDIS_HOST');
    this.port = +this.configService.getOrThrow<number>('REDIS_PORT');
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redis = new Redis({
      host: this.host,
      port: this.port,
      connectTimeout: 3000,
      lazyConnect: true,
    });

    try {
      await redis.connect();
      const pong = await redis.ping();
      await redis.quit();

      if (pong !== 'PONG') {
        throw new Error('Redis ping did not return PONG');
      }

      return this.getStatus(key, true);
    } catch (error) {
      await redis.quit().catch(() => {});

      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, { message: (error as Error).message }),
      );
    }
  }
}
