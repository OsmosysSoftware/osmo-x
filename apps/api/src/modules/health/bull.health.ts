import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { QueueService } from '../notifications/queues/queue.service';

@Injectable()
export class BullHealthIndicator extends HealthIndicator {
  constructor(private readonly queueService: QueueService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const queues = this.queueService.getQueues();
    let totalWaiting = 0;
    let totalActive = 0;
    let totalDelayed = 0;

    try {
      for (const queue of queues.values()) {
        const counts = await queue.getJobCounts('waiting', 'active', 'delayed');
        totalWaiting += counts.waiting || 0;
        totalActive += counts.active || 0;
        totalDelayed += counts.delayed || 0;
      }

      return this.getStatus(key, true, {
        queue_count: queues.size,
        active: totalActive,
        waiting: totalWaiting,
        delayed: totalDelayed,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Bull queue health check failed',
        this.getStatus(key, false, { message: (error as Error).message }),
      );
    }
  }
}
