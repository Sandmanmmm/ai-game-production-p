import { Job } from 'bullmq';
import { jobQueueService } from './jobQueue';
import {
  AssetGenerationJobData,
  JobResult,
  AssetGenerationResult,
  JobProgress,
  QUEUE_NAMES
} from '../types/jobQueue';

export class AssetGenerationWorker {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Register the worker to process asset generation jobs
    jobQueueService.registerWorker(
      QUEUE_NAMES.ASSET_GENERATION,
      this.processAssetGeneration.bind(this)
    );

    this.isInitialized = true;
    console.log('✅ Asset Generation Worker initialized');
  }

  private async processAssetGeneration(
    job: Job<AssetGenerationJobData, JobResult<AssetGenerationResult>>
  ): Promise<JobResult<AssetGenerationResult>> {
    const { data } = job;
    
    try {
      console.log(`Processing asset generation job ${job.id} for project ${data.projectId}`);

      // Update job progress - Initializing
      await job.updateProgress({
        percentage: 0,
        stage: 'Initializing',
        message: 'Setting up asset generation...',
        currentStep: 1,
        totalSteps: 5
      } as JobProgress);

      // Simulate prompt enhancement
      await this.sleep(1000);
      await job.updateProgress({
        percentage: 20,
        stage: 'Prompt Enhancement',
        message: 'Enhancing prompt with style and context...',
        currentStep: 2,
        totalSteps: 5
      } as JobProgress);

      // Simulate style pack loading
      if (data.stylePackId) {
        await this.sleep(1500);
        await job.updateProgress({
          percentage: 40,
          stage: 'Style Loading',
          message: `Loading style pack: ${data.stylePackId}`,
          currentStep: 3,
          totalSteps: 5
        } as JobProgress);
      }

      // Simulate AI generation
      await this.sleep(3000);
      await job.updateProgress({
        percentage: 70,
        stage: 'AI Generation',
        message: `Generating ${data.options.batchSize} asset variations...`,
        currentStep: 4,
        totalSteps: 5
      } as JobProgress);

      // Simulate post-processing
      await this.sleep(1000);
      await job.updateProgress({
        percentage: 90,
        stage: 'Post-processing',
        message: 'Optimizing assets for game use...',
        currentStep: 5,
        totalSteps: 5
      } as JobProgress);

      // Generate mock result
      const mockAssets = Array.from({ length: data.options.batchSize }, (_, i) => ({
        id: `asset-${Date.now()}-${i}`,
        url: `https://example.com/assets/${data.projectId}/${Date.now()}-${i}.${data.options.format}`,
        thumbnailUrl: `https://example.com/assets/${data.projectId}/${Date.now()}-${i}-thumb.webp`,
        filename: `${data.assetType}-${Date.now()}-${i}.${data.options.format}`,
        dimensions: data.options.dimensions,
        fileSize: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
        format: data.options.format,
        qualityScore: Math.floor(Math.random() * 30) + 70, // 70-100
        prompt: data.prompt,
        generatedAt: new Date()
      }));

      const result: AssetGenerationResult = {
        assets: mockAssets,
        summary: {
          totalGenerated: mockAssets.length,
          avgQualityScore: mockAssets.reduce((sum, asset) => sum + asset.qualityScore, 0) / mockAssets.length,
          processingTime: 6500, // milliseconds
          cost: mockAssets.length * 0.02 // $0.02 per asset
        }
      };

      // Final progress update
      await job.updateProgress({
        percentage: 100,
        stage: 'Completed',
        message: `Generated ${result.assets.length} assets successfully`,
        currentStep: 5,
        totalSteps: 5
      } as JobProgress);

      console.log(`Asset generation job ${job.id} completed successfully`);
      
      return {
        success: true,
        data: result,
        metadata: {
          processingTime: result.summary.processingTime,
          resourcesUsed: {
            gpu: true,
            memory: 2048 // MB
          },
          qualityScore: result.summary.avgQualityScore
        }
      };

    } catch (error) {
      console.error(`Asset generation job ${job.id} failed:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          processingTime: 0,
          resourcesUsed: {
            gpu: false,
            memory: 0
          }
        }
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const assetGenerationWorker = new AssetGenerationWorker();
