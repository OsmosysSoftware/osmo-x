import { Queue } from 'bullmq';
import * as readline from 'readline';

/**
 * Redis Cleanup Script
 *
 * This script helps clean up completed and failed jobs from all BullMQ queues
 * to reduce Redis memory usage.
 *
 * Usage:
 *   ts-node scripts/redis-cleanup.ts
 */

interface CleanupStats {
  queueName: string;
  completedRemoved: number;
  failedRemoved: number;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function getRedisConfig(): Promise<{ host: string; port: number }> {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);

  console.log(`\nUsing Redis connection: ${host}:${port}`);
  console.log('(Configure via REDIS_HOST and REDIS_PORT environment variables)\n');

  return { host, port };
}

async function listQueues(
  redisConfig: { host: string; port: number },
): Promise<{ name: string; queue: Queue }[]> {
  // Get all queue keys from Redis using SCAN (non-blocking)
  const Queue = require('bullmq').Queue;
  const Redis = require('ioredis');
  const redis = new Redis(redisConfig);

  const queueNames = new Set<string>();
  let cursor = '0';

  do {
    const result = await redis.scan(cursor, 'MATCH', 'bull:*:meta', 'COUNT', 100);
    cursor = result[0];
    const keys = result[1];

    keys.forEach((key: string) => {
      const parts = key.split(':');
      if (parts.length >= 2) {
        queueNames.add(parts[1]);
      }
    });
  } while (cursor !== '0');

  await redis.quit();

  const queues = Array.from(queueNames).map((name: string) => ({
    name: name as string,
    queue: new Queue(name, { connection: redisConfig }),
  }));

  return queues;
}

async function cleanupQueue(
  queue: Queue,
  queueName: string,
  grace: number,
): Promise<CleanupStats> {
  console.log(`\nCleaning up queue: ${queueName}`);

  const batchSize = 1000;
  let totalCompleted = 0;
  let totalFailed = 0;

  // Clean completed jobs in batches
  let completedBatch: string[];

  do {
    completedBatch = await queue.clean(grace, batchSize, 'completed');
    totalCompleted += completedBatch.length;
    if (completedBatch.length > 0) {
      console.log(`  Batch: removed ${completedBatch.length} completed jobs`);
    }
  } while (completedBatch.length === batchSize);

  console.log(`  Total removed: ${totalCompleted} completed jobs`);

  // Clean failed jobs in batches
  let failedBatch: string[];

  do {
    failedBatch = await queue.clean(grace, batchSize, 'failed');
    totalFailed += failedBatch.length;
    if (failedBatch.length > 0) {
      console.log(`  Batch: removed ${failedBatch.length} failed jobs`);
    }
  } while (failedBatch.length === batchSize);

  console.log(`  Total removed: ${totalFailed} failed jobs`);

  return {
    queueName,
    completedRemoved: totalCompleted,
    failedRemoved: totalFailed,
  };
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Redis Queue Cleanup Script');
  console.log('='.repeat(60));

  const redisConfig = await getRedisConfig();

  console.log('Scanning for BullMQ queues...');
  const queues = await listQueues(redisConfig);

  if (queues.length === 0) {
    console.log('No queues found.');
    rl.close();
    return;
  }

  console.log(`\nFound ${queues.length} queue(s):`);
  queues.forEach((q, i) => console.log(`  ${i + 1}. ${q.name}`));

  const graceInput = await askQuestion(
    '\nEnter grace period in milliseconds (jobs older than this will be removed, 0 for all): ',
  );
  const grace = parseInt(graceInput, 10) || 0;

  const confirm = await askQuestion(
    `\nThis will clean up completed and failed jobs from ${queues.length} queue(s). Continue? (yes/no): `,
  );

  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('Cleanup cancelled.');
    rl.close();
    await Promise.all(queues.map((q) => q.queue.close()));
    return;
  }

  console.log('\nStarting cleanup...');
  const stats: CleanupStats[] = [];

  for (const { queue, name } of queues) {
    try {
      const stat = await cleanupQueue(queue, name, grace);
      stats.push(stat);
    } catch (error) {
      console.error(`Error cleaning queue ${name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Cleanup Summary');
  console.log('='.repeat(60));

  let totalCompleted = 0;
  let totalFailed = 0;

  stats.forEach((stat) => {
    console.log(`\n${stat.queueName}:`);
    console.log(`  Completed jobs removed: ${stat.completedRemoved}`);
    console.log(`  Failed jobs removed: ${stat.failedRemoved}`);
    totalCompleted += stat.completedRemoved;
    totalFailed += stat.failedRemoved;
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total completed jobs removed: ${totalCompleted}`);
  console.log(`Total failed jobs removed: ${totalFailed}`);
  console.log(`Total jobs removed: ${totalCompleted + totalFailed}`);
  console.log('='.repeat(60));

  rl.close();
  await Promise.all(queues.map((q) => q.queue.close()));
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
