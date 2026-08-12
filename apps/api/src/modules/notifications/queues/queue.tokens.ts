import { Queue } from 'bullmq';

// Deliberately dependency-free: NotificationQueueProducer depends on this token/interface
// instead of importing QueueService directly, to avoid closing the import cycle
// NotificationConsumer -> NotificationQueueProducer -> QueueService -> *.job.consumer.ts
// (each of which extends NotificationConsumer). Importing QueueService's concrete class here
// would recreate that cycle.
export const QUEUE_SERVICE = Symbol('QUEUE_SERVICE');

export interface IQueueService {
  getOrCreateQueue(action: string, providerType: string, providerId: string): Queue;
}
