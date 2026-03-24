import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { BullHealthIndicator } from './bull.health';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TerminusModule, NotificationsModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, BullHealthIndicator],
})
export class HealthModule {}
