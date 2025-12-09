/**
 * Simple job queue for background tasks
 * In production, use a proper job queue like Bull, BullMQ, or similar
 */

export interface Job {
  id: string;
  type: string;
  data: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

class SimpleJobQueue {
  private jobs: Map<string, Job> = new Map();
  private running: Set<string> = new Set();
  private handlers: Map<string, (data: any) => Promise<any>> = new Map();

  /**
   * Register a job handler
   */
  registerHandler(type: string, handler: (data: any) => Promise<any>) {
    this.handlers.set(type, handler);
  }

  /**
   * Add a job to the queue
   */
  addJob(type: string, data: any, maxAttempts: number = 3): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: Job = {
      id: jobId,
      type,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
    };
    this.jobs.set(jobId, job);
    
    // Process job asynchronously
    this.processJob(jobId).catch(error => {
      console.error(`[JobQueue] Error processing job ${jobId}:`, error);
    });

    return jobId;
  }

  /**
   * Process a job
   */
  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') {
      return;
    }

    if (this.running.has(jobId)) {
      return; // Already processing
    }

    this.running.add(jobId);
    job.status = 'running';
    job.startedAt = new Date();
    job.attempts++;

    try {
      const handler = this.handlers.get(job.type);
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      await handler(job.data);

      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (job.attempts < job.maxAttempts) {
        // Retry
        job.status = 'pending';
        const delay = Math.min(1000 * Math.pow(2, job.attempts - 1), 30000); // Exponential backoff, max 30s
        setTimeout(() => {
          this.processJob(jobId).catch(err => {
            console.error(`[JobQueue] Error retrying job ${jobId}:`, err);
          });
        }, delay);
      } else {
        // Max attempts reached
        job.status = 'failed';
        job.completedAt = new Date();
      }
    } finally {
      this.running.delete(jobId);
    }
  }

  /**
   * Get job status
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: Job['status']): Job[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }
}

export const jobQueue = new SimpleJobQueue();

