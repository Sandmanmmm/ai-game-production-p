// Job Queue Types and Interfaces

export interface AssetGenerationJobData {
  id: string;
  projectId: string;
  userId: string;
  prompt: string;
  stylePackId?: string;
  assetType: 'character-design' | 'environment-art' | 'prop-design' | 'ui-element' | 'concept-art';
  options: {
    batchSize: number;
    dimensions: {
      width: number;
      height: number;
    };
    quality: 'draft' | 'standard' | 'high';
    format: 'png' | 'webp' | 'svg';
    variations: number;
  };
  metadata?: {
    tags: string[];
    category: string;
    description?: string;
    referenceImages?: string[];
  };
  createdAt: Date;
}

export interface StylePackTrainingJobData {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  referenceImages: string[];
  baseModel: 'SDXL' | 'SD1.5' | 'custom';
  trainingConfig: {
    steps: number;
    learningRate: number;
    batchSize: number;
    resolution: number;
  };
  createdAt: Date;
}

export interface JobProgress {
  percentage: number;
  stage: string;
  message: string;
  estimatedTimeRemaining?: number;
  currentStep?: number;
  totalSteps?: number;
}

export interface JobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime: number;
    resourcesUsed: {
      gpu: boolean;
      memory: number;
    };
    qualityScore?: number;
  };
}

export interface AssetGenerationResult {
  assets: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    filename: string;
    dimensions: { width: number; height: number };
    fileSize: number;
    format: string;
    qualityScore: number;
    prompt: string;
    generatedAt: Date;
  }>;
  summary: {
    totalGenerated: number;
    avgQualityScore: number;
    processingTime: number;
    cost?: number;
  };
}

export interface StylePackTrainingResult {
  stylePackId: string;
  modelPath: string;
  checkpointUrl: string;
  metrics: {
    finalLoss: number;
    trainingAccuracy: number;
    validationAccuracy: number;
  };
  previewImages: string[];
  metadata: {
    trainingTime: number;
    steps: number;
    epochs: number;
  };
}

// Job Status Enum
export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

// Queue Names
export const QUEUE_NAMES = {
  ASSET_GENERATION: 'asset-generation',
  STYLE_PACK_TRAINING: 'style-pack-training',
  ASSET_POST_PROCESSING: 'asset-post-processing',
  NOTIFICATIONS: 'notifications'
} as const;

// Job Options
export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
}

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
