import { Queue } from 'bullmq';

// Kept dependency-free: importing QueueService directly here would recreate the
// NotificationConsumer -> ... -> QueueService -> job-consumer -> NotificationConsumer cycle.
export const QUEUE_SERVICE = Symbol('QUEUE_SERVICE');

export interface IQueueService {
  getOrCreateQueue(action: string, providerType: string, providerId: string): Queue;
}
