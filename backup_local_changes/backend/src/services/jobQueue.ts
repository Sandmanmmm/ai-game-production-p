import { Queue, Worker, Job } from 'bullmq';
import { bullMQConnection } from '../config/redis';
import {
  AssetGenerationJobData,
  StylePackTrainingJobData,
  JobProgress,
  JobResult,
  AssetGenerationResult,
  StylePackTrainingResult,
  JobOptions,
  QUEUE_NAMES,
  QueueName,
  JobStatus
} from '../types/jobQueue';

export class JobQueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues() {
    // Initialize all queues
    Object.values(QUEUE_NAMES).forEach(queueName => {
      const queue = new Queue(queueName, {
        connection: bullMQConnection,
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      this.queues.set(queueName, queue);

      // Set up basic event listeners
      queue.on('error', (error: Error) => {
        console.error(`Queue ${queueName} error:`, error);
      });

      queue.on('waiting', (job: any) => {
        console.log(`Job ${job.id} is waiting in queue ${queueName}`);
      });

      console.log(`Queue ${queueName} initialized`);
    });

    console.log('✅ Job queues initialized successfully');
  }

  // Get a specific queue
  getQueue(queueName: QueueName): Queue | undefined {
    return this.queues.get(queueName);
  }

  // Add asset generation job
  async addAssetGenerationJob(
    data: AssetGenerationJobData,
    options?: JobOptions
  ): Promise<Job<AssetGenerationJobData, JobResult<AssetGenerationResult>>> {
    const queue = this.getQueue(QUEUE_NAMES.ASSET_GENERATION);
    if (!queue) {
      throw new Error('Asset generation queue not found');
    }

    const job = await queue.add('generate-assets', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.attempts || 3,
      backoff: options?.backoff || { type: 'exponential', delay: 2000 },
      removeOnComplete: options?.removeOnComplete || 10,
      removeOnFail: options?.removeOnFail || 5,
    });

    console.log(`Asset generation job ${job.id} added to queue`);
    return job;
  }

  // Add style pack training job
  async addStylePackTrainingJob(
    data: StylePackTrainingJobData,
    options?: JobOptions
  ): Promise<Job<StylePackTrainingJobData, JobResult<StylePackTrainingResult>>> {
    const queue = this.getQueue(QUEUE_NAMES.STYLE_PACK_TRAINING);
    if (!queue) {
      throw new Error('Style pack training queue not found');
    }

    const job = await queue.add('train-style-pack', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.attempts || 1, // Training jobs typically shouldn't retry
      removeOnComplete: options?.removeOnComplete || 5,
      removeOnFail: options?.removeOnFail || 3,
    });

    console.log(`Style pack training job ${job.id} added to queue`);
    return job;
  }

  // Get job status and progress
  async getJobStatus(jobId: string, queueName: QueueName): Promise<{
    status: JobStatus;
    progress?: JobProgress;
    result?: any;
    failedReason?: string;
  }> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await Job.fromId(queue, jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    const state = await job.getState();
    
    return {
      status: state as JobStatus,
      progress: job.progress as JobProgress,
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  // Cancel a job
  async cancelJob(jobId: string, queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await Job.fromId(queue, jobId);
    if (job) {
      await job.remove();
      console.log(`Job ${jobId} cancelled in queue ${queueName}`);
    }
  }

  // Get queue stats
  async getQueueStats(queueName: QueueName) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }

  // Clean old jobs
  async cleanQueue(queueName: QueueName, maxAge: number = 24 * 60 * 60 * 1000) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(maxAge, 10, 'completed');
    await queue.clean(maxAge, 5, 'failed');
    
    console.log(`Cleaned old jobs from queue ${queueName}`);
  }

  // Register a worker for processing jobs
  registerWorker<T, R>(
    queueName: QueueName,
    processor: (job: Job<T, R>) => Promise<R>
  ): Worker<T, R> {
    const worker = new Worker<T, R>(queueName, processor, {
      connection: bullMQConnection,
      concurrency: 1, // Start with 1, can be increased based on resources
    });

    // Set up worker event listeners
    worker.on('completed', (job, result) => {
      console.log(`Worker completed job ${job.id} in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Worker failed job ${job?.id} in queue ${queueName}:`, err);
    });

    worker.on('progress', (job, progress) => {
      console.log(`Job ${job.id} progress:`, progress);
    });

    this.workers.set(queueName, worker);
    console.log(`Worker registered for queue ${queueName}`);
    
    return worker;
  }

  // Graceful shutdown
  async shutdown() {
    console.log('Shutting down job queue service...');
    
    // Close all workers
    for (const [queueName, worker] of this.workers.entries()) {
      console.log(`Closing worker for queue ${queueName}`);
      await worker.close();
    }

    // Close all queues
    for (const [queueName, queue] of this.queues.entries()) {
      console.log(`Closing queue ${queueName}`);
      await queue.close();
    }

    console.log('Job queue service shutdown complete');
  }
}

// Singleton instance
export const jobQueueService = new JobQueueService();

// Graceful shutdown on process termination - disable in development for PowerShell compatibility
if (process.env.NODE_ENV !== 'development') {
  process.on('SIGINT', async () => {
    await jobQueueService.shutdown();
    // WebSocket shutdown will be handled in server.ts
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await jobQueueService.shutdown();
    // WebSocket shutdown will be handled in server.ts
    process.exit(0);
  });
} else {
  console.log('🔄 Job queue signal handlers disabled in development mode (PowerShell compatibility)');
}
