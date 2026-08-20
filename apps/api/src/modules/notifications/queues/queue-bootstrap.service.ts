import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { QueueService } from './queue.service';

/**
 * Re-attaches workers to webhook queues that still hold pending jobs when the API boots.
 * Without this, a delayed webhook retry scheduled before a restart has no worker and would sit
 * in Redis until an unrelated notification for the same provider happened to recreate the queue.
 */
@Injectable()
export class QueueBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(QueueBootstrapService.name);

  constructor(
    @Inject(forwardRef(() => ProvidersService))
    private readonly providersService: ProvidersService,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const providers = await this.providersService.findAllActive();

      await this.queueService.restoreWebhookWorkers(providers);
    } catch (error) {
      // Never block startup: queues are still created lazily on the next enqueue.
      this.logger.error(
        `Failed to restore webhook workers on boot: ${error.message}. Falling back to lazy queue creation.`,
        error.stack,
      );
    }
  }
}
