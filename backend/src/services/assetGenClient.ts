import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

export interface GenerateAssetsRequest {
  prompt: string;
  negative_prompt?: string;
  asset_type: 'character-design' | 'environment-art' | 'prop-design' | 'ui-element' | 'concept-art';
  style?: 'pixel-art' | 'hand-drawn' | 'realistic' | 'cartoon' | 'minimalist';
  quality?: 'draft' | 'standard' | 'high' | 'production';
  width?: number;
  height?: number;
  num_images?: number;
  steps?: number;
  guidance_scale?: number;
  seed?: number;
  model_id?: string;
  lora_weights?: string[];
  lora_scales?: number[];
  format?: 'png' | 'webp' | 'jpg';
  transparent_background?: boolean;
  optimize_for_game?: boolean;
  apply_sprite_optimization?: boolean;
  apply_tileset_optimization?: boolean;
  remove_background?: boolean;
  project_id?: string;
  user_id?: string;
  tags?: string[];
}

export interface GeneratedAsset {
  id: string;
  url: string;
  thumbnail_url?: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  file_size: number;
  prompt: string;
  negative_prompt?: string;
  seed: number;
  steps: number;
  guidance_scale: number;
  model_used: string;
  quality_score?: number;
  processing_time: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface GenerationResponse {
  request_id: string;
  status: 'completed' | 'failed' | 'processing';
  assets: GeneratedAsset[];
  total_generated: number;
  successful: number;
  failed: number;
  total_processing_time: number;
  average_quality_score?: number;
  error_message?: string;
  completed_at: string;
}

export interface StylePackRequest {
  name: string;
  description?: string;
  base_model?: string;
  reference_images: string[];
  training_steps?: number;
  learning_rate?: number;
  batch_size?: number;
  resolution?: number;
  lora_rank?: number;
  lora_alpha?: number;
  lora_dropout?: number;
  output_name?: string;
  project_id?: string;
  user_id?: string;
}

export interface JobInfo {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    percentage: number;
    stage: string;
    message: string;
    current_step?: number;
    total_steps?: number;
    estimated_time_remaining?: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: any;
  error?: string;
}

export class AssetGenClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private isHealthy: boolean = false;
  private lastHealthCheck: Date = new Date(0);
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = (process.env as any).ASSET_GEN_SERVICE_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 300000, // 5 minutes for generation requests
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GameForge-Backend/1.0'
      }
    });

    // Setup request/response interceptors for logging
    this.client.interceptors.request.use(
      (config: any) => {
        console.log(`🔄 Asset Gen Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('❌ Asset Gen Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: any) => {
        console.log(`✅ Asset Gen Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: any) => {
        console.error(`❌ Asset Gen Response Error: ${error.response?.status} ${error.config?.url}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );

    // Don't start automatic health checks on initialization - they can be started manually
    // this.startHealthChecks();
  }

  /**
   * Generate game assets using the AI service
   */
  async generateAssets(request: GenerateAssetsRequest): Promise<{ job_id: string; status: string; message: string }> {
    try {
      console.log('🎨 Starting asset generation:', { 
        prompt: request.prompt.substring(0, 50) + '...',
        asset_type: request.asset_type,
        num_images: request.num_images || 1 
      });

      // Call the Python Asset Generation Service
      const response = await this.client.post('/generate', request);

      console.log('✅ Asset generation job submitted:', response.data);

      return response.data;

    } catch (error: any) {
      console.error('❌ Asset generation failed:', error);
      
      // Provide helpful error messages
      if (error.response?.status === 503) {
        throw new Error('Asset Generation Service is not ready. Please try again in a few moments.');
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request: ${error.response.data?.detail || error.message}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Asset Generation Service is not available. Please check if the service is running.');
      }
      
      throw new Error(`Asset generation failed: ${error.message}`);
    }
  }

  /**
   * Train a custom style pack (LoRA)
   */
  async trainStylePack(request: StylePackRequest): Promise<{ job_id: string; status: string; message: string }> {
    try {
      console.log('🎭 Starting style pack training:', { 
        name: request.name,
        reference_count: request.reference_images.length 
      });

      // Call the Python service
      const response = await this.client.post('/train-style', request);

      console.log('✅ Style pack training job submitted:', response.data);

      return response.data;

    } catch (error: any) {
      console.error('❌ Style pack training failed:', error);
      throw new Error(`Style pack training failed: ${error.message}`);
    }
  }

  /**
   * Get job status and progress
   */
  async getJobStatus(jobId: string): Promise<JobInfo> {
    try {
      const response = await this.client.get(`/job/${jobId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Job not found');
      }
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  /**
   * Get job results
   */
  async getJobResults(jobId: string): Promise<GenerationResponse | any> {
    try {
      const response = await this.client.get(`/job/${jobId}/results`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Job results not found');
      }
      throw new Error(`Failed to get job results: ${error.message}`);
    }
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<{ message: string }> {
    try {
      const response = await this.client.delete(`/job/${jobId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Job not found or cannot be cancelled');
      }
      throw new Error(`Failed to cancel job: ${error.message}`);
    }
  }

  /**
   * List jobs with optional filtering
   */
  async listJobs(options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ jobs: JobInfo[] }> {
    try {
      const response = await this.client.get('/jobs', { params: options });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to list jobs: ${error.message}`);
    }
  }

  /**
   * Upload reference images for style training
   */
  async uploadReferenceImages(files: { filename: string; data: Buffer }[]): Promise<{ message: string; files: any[] }> {
    try {
      const formData = new FormData();
      
      for (const file of files) {
        formData.append('files', file.data, file.filename);
      }

      const response = await this.client.post('/upload-references', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 1 minute for uploads
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to upload reference images: ${error.message}`);
    }
  }

  /**
   * Download a generated asset
   */
  async downloadAsset(assetId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(`/assets/${assetId}`, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Asset not found');
      }
      throw new Error(`Failed to download asset: ${error.message}`);
    }
  }

  /**
   * Get model information
   */
  async getModels(): Promise<any[]> {
    try {
      const response = await this.client.get('/models');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get models: ${error.message}`);
    }
  }

  /**
   * Load a specific model
   */
  async loadModel(modelId: string, modelType: string = 'sdxl'): Promise<{ message: string }> {
    try {
      const response = await this.client.post('/models/load', {
        model_id: modelId,
        model_type: modelType
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to load model: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    models_loaded: boolean;
    gpu_available: boolean;
    redis_connected: boolean;
    storage_accessible: boolean;
  }> {
    try {
      const response = await this.client.get('/health', { timeout: 10000 });
      this.isHealthy = response.data.status === 'healthy';
      this.lastHealthCheck = new Date();
      return response.data;
    } catch (error: any) {
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Check if the service is healthy
   */
  public get healthy(): boolean {
    // Consider stale if health check is older than 2 minutes
    const isStale = Date.now() - this.lastHealthCheck.getTime() > 120000;
    return this.isHealthy && !isStale;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks() {
    setInterval(async () => {
      try {
        await this.healthCheck();
        if (this.isHealthy) {
          console.debug('🟢 Asset Gen Service healthy');
        }
      } catch (error) {
        console.warn('🔴 Asset Gen Service health check failed');
      }
    }, this.healthCheckInterval);

    // Initial health check - non-blocking
    setTimeout(() => {
      this.healthCheck().catch((error) => {
        console.warn('🔴 Initial Asset Gen Service health check failed:', error.message);
      });
    }, 5000); // Wait 5 seconds for service to start
  }

  /**
   * Get service status for monitoring
   */
  getStatus() {
    return {
      baseUrl: this.baseUrl,
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      healthy: this.healthy
    };
  }
}
