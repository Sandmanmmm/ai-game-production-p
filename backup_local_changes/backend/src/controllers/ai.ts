import { Request, Response } from 'express';
import { HfInference } from '@huggingface/inference';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { buildEnhancedPrompt } from '../utils/promptTemplates';
import { webSocketService } from '../services/webSocketService';

// Import AssetGenClient safely with error handling
let assetGenClient: any = null;

try {
  const { AssetGenClient } = require('../services/assetGenClient');
  assetGenClient = new AssetGenClient();
  console.log('✅ AssetGenClient initialized successfully');
} catch (error) {
  const err = error as Error;
  console.error('⚠️ Warning: AssetGenClient failed to initialize:', err.message);
  console.log('🔄 API will continue without SDXL service integration');
}

// AI Service Configuration
interface AIConfig {
  huggingface: {
    apiKey?: string;
    textModel: string;
    imageModel: string;
    codeModel: string;
  };
  replicate: {
    apiKey?: string;
  };
  local: {
    enabled: boolean;
    baseUrl?: string;
  };
}

const aiConfig: AIConfig = {
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    textModel: 'microsoft/DialoGPT-medium',
    // Better image models for game asset generation
    imageModel: 'runwayml/stable-diffusion-v1-5', // More stable and game-friendly
    codeModel: 'microsoft/CodeGPT-small-py',
  },
  replicate: {
    apiKey: process.env.REPLICATE_API_TOKEN,
  },
  local: {
    enabled: process.env.USE_LOCAL_AI === 'true',
    baseUrl: process.env.LOCAL_AI_BASE_URL || 'http://localhost:8080',
  },
};

// Initialize HuggingFace client safely
let hf: HfInference | null = null;
if (aiConfig.huggingface.apiKey) {
  hf = new HfInference(aiConfig.huggingface.apiKey);
}

// Mapping function to convert frontend asset types to SDXL service enum values
function mapAssetTypeToSDXL(assetType: string): string {
  const assetTypeMap: { [key: string]: string } = {
    'weapon': 'prop-design',
    'armor': 'prop-design', 
    'character': 'character-design',
    'environment': 'environment-art',
    'ui': 'ui-element',
    'concept': 'concept-art',
    'prop': 'prop-design',
    'item': 'prop-design',
    'background': 'environment-art',
    'landscape': 'environment-art',
    'portrait': 'character-design',
    'design': 'concept-art'
  };
  
  // Return mapped value or default to 'prop-design' for unknown types
  return assetTypeMap[assetType.toLowerCase()] || 'prop-design';
}

// Mapping function to convert frontend styles to SDXL service enum values
function mapStyleToSDXL(style: string | undefined): string | undefined {
  if (!style) return undefined;
  
  const styleMap: { [key: string]: string } = {
    'medieval': 'realistic',
    'fantasy': 'realistic',
    'modern': 'realistic',
    'futuristic': 'realistic',
    'anime': 'cartoon',
    'cartoonish': 'cartoon',
    'pixel': 'pixel-art',
    'retro': 'pixel-art',
    'sketch': 'hand-drawn',
    'drawn': 'hand-drawn',
    'simple': 'minimalist',
    'clean': 'minimalist'
  };
  
  // Return mapped value or default to 'realistic' for unknown styles
  return styleMap[style.toLowerCase()] || 'realistic';
}

// Utility functions for AI providers
async function generateWithHuggingFace(
  model: string,
  prompt: string,
  options: any = {}
): Promise<any> {
  if (!hf) {
    throw new Error('HuggingFace API key not configured');
  }

  try {
    const response = await hf.textGeneration({
      model,
      inputs: prompt,
      parameters: {
        max_new_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
        repetition_penalty: 1.1,
        ...options.parameters,
      },
    });
    return response;
  } catch (error) {
    console.error('HuggingFace API error:', error);
    throw error;
  }
}

async function generateImageWithHuggingFace(
  prompt: string,
  options: any = {}
): Promise<Blob> {
  if (!hf) {
    throw new Error('HuggingFace API key not configured');
  }

  try {
    const response = await hf.textToImage({
      model: aiConfig.huggingface.imageModel,
      inputs: prompt,
      parameters: {
        width: options.width || 512,
        height: options.height || 512,
        num_inference_steps: options.steps || 30,
        guidance_scale: options.guidance || 7.5,
      },
    });
    return response as unknown as Blob;
  } catch (error) {
    console.error('HuggingFace Image API error:', error);
    throw error;
  }
}

async function generateWithReplicate(
  model: string,
  input: any
): Promise<any> {
  if (!aiConfig.replicate.apiKey) {
    throw new Error('Replicate API key not configured');
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${aiConfig.replicate.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model,
        input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Replicate API error:', error);
    throw error;
  }
}

// Story Generation Controller
export const generateStory = async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      gameType,
      genre,
      tone,
      length,
      context,
      provider = 'huggingface',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { message: 'Prompt is required' },
      });
    }

    let generatedStory;

    // Enhanced story prompt with game context
    const storyPrompt = `Generate a ${genre || 'fantasy'} ${gameType || 'RPG'} game story with a ${tone || 'heroic'} tone.
    
Context: ${context || 'A new adventure begins'}
Prompt: ${prompt}
Length: ${length || 'medium'}

Story:`;

    switch (provider) {
      case 'huggingface':
        const hfResponse = await generateWithHuggingFace(
          'microsoft/DialoGPT-medium',
          storyPrompt,
          {
            maxTokens: length === 'short' ? 256 : length === 'long' ? 1024 : 512,
            temperature: 0.8,
          }
        );
        generatedStory = hfResponse.generated_text.replace(storyPrompt, '').trim();
        break;

      case 'replicate':
        const replicateResponse = await generateWithReplicate(
          'meta/llama-2-70b-chat',
          {
            prompt: storyPrompt,
            max_new_tokens: length === 'short' ? 256 : length === 'long' ? 1024 : 512,
            temperature: 0.8,
          }
        );
        generatedStory = replicateResponse.output?.join('') || 'Story generation failed';
        break;

      case 'local':
        if (!aiConfig.local.enabled) {
          throw new Error('Local AI not enabled');
        }
        const localResponse = await fetch(`${aiConfig.local.baseUrl}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: storyPrompt }),
        });
        const localData = await localResponse.json() as any;
        generatedStory = localData.text || 'Local generation failed';
        break;

      default:
        throw new Error('Invalid provider specified');
    }

    // Store the generated story (you'd save to database here)
    const storyId = uuidv4();
    
    res.json({
      success: true,
      data: {
        id: storyId,
        story: generatedStory,
        metadata: {
          prompt,
          gameType,
          genre,
          tone,
          length,
          provider,
          generatedAt: new Date().toISOString(),
        },
      },
    });

  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to generate story', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
    });
  }
};

// Asset Generation Controller
export const generateAssets = async (req: Request, res: Response) => {
  // Add extensive logging for debugging
  console.log('🎨 Asset generation request received');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  console.log('👤 Request user:', req.user ? 'authenticated' : 'anonymous');

  try {
    const { prompt, assetType, style, size, count, provider, options } = req.body;

    // Enhanced input validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.log('❌ Validation failed: Invalid prompt');
      return res.status(400).json({
        success: false,
        error: { message: 'Valid prompt is required' },
      });
    }

    if (!assetType || typeof assetType !== 'string') {
      console.log('❌ Validation failed: Invalid assetType');
      return res.status(400).json({
        success: false,
        error: { message: 'Valid assetType is required' },
      });
    }

    console.log(`✅ Validation passed - Prompt: "${prompt.substring(0, 50)}..." AssetType: "${assetType}"`);

    // Safe initialization check
    if (!assetGenClient) {
      console.log('⚠️ AssetGenClient not available, using mock response');
      const mockJobId = `mock-${Date.now()}`;
      
      return res.json({
        success: true,
        data: {
          jobId: mockJobId,
          status: 'processing',
          message: 'Asset generation started (mock mode - SDXL service not available)',
          trackingUrl: `/api/ai/jobs/${mockJobId}`,
          provider: 'mock',
          estimatedTime: '30-60 seconds'
        },
      });
    }

    console.log(`🎨 Asset generation request: ${prompt} (${assetType})`);

    const generatedAssets: any[] = [];

    // Determine provider order - Asset Gen Service first, then fallback
    const providers = provider === 'huggingface' ? ['huggingface'] : ['asset_gen', 'huggingface'];
    
    let lastError: Error | null = null;

    // Try providers in order with enhanced error handling
    for (const currentProvider of providers) {
      try {
        if (currentProvider === 'asset_gen') {
          // Skip SDXL service if not available
          if (!assetGenClient) {
            console.log('⚠️ SDXL service not initialized, skipping...');
            throw new Error('Asset Generation Service is not initialized');
          }
          
          console.log('🔍 Checking SDXL service availability...');
          
          // Check Asset Gen Service health with timeout
          let isHealthy = false;
          try {
            isHealthy = await Promise.race([
              assetGenClient.healthCheck(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Health check timeout')), 5000)
              )
            ]);
          } catch (healthError) {
            console.log('⚠️ SDXL service health check failed:', (healthError as Error).message);
            throw new Error('Asset Generation Service is not available');
          }

          if (!isHealthy) {
            throw new Error('Asset Generation Service is not available');
          }

          console.log('Using Asset Generation Service for generation');
          
          // Generate a job ID for tracking
          const jobId = uuidv4();
          
          // Emit initial progress event
          webSocketService.emitAssetProgress({
            jobId,
            status: 'started',
            progress: 0,
            message: 'Starting asset generation with AI service',
            assetType,
            prompt,
            timestamp: new Date().toISOString()
          });

          try {
            const mappedAssetType = mapAssetTypeToSDXL(assetType);
            const mappedStyle = mapStyleToSDXL(style);
            console.log(`🔄 Mapped asset type: "${assetType}" -> "${mappedAssetType}"`);
            console.log(`🎨 Mapped style: "${style}" -> "${mappedStyle}"`);
            
            const assetGenResponse = await assetGenClient.generateAssets({
              prompt,
              asset_type: mappedAssetType,
              style: mappedStyle,
              width: size === 'small' ? 256 : size === 'medium' ? 512 : 1024,
              height: size === 'small' ? 256 : size === 'medium' ? 512 : 1024,
              num_images: count || 1,
              guidance_scale: options?.guidance_scale || 7.5,
              steps: options?.num_inference_steps || 20,
              seed: options?.seed || undefined,
            });

            // Emit processing progress
            webSocketService.emitAssetProgress({
              jobId: assetGenResponse.job_id || jobId,
              status: 'processing',
              progress: 25,
              message: 'Asset generation job submitted to AI service',
              assetType,
              prompt,
              timestamp: new Date().toISOString(),
              estimatedTimeRemaining: 45
            });

            // Asset Gen Service returns a job ID - we need to poll for results
            if (assetGenResponse.status === 'success' || assetGenResponse.job_id) {
              // For now, return the job info - in production we'd implement polling
              return res.json({
                success: true,
                data: {
                  jobId: assetGenResponse.job_id || jobId,
                  status: 'processing',
                  message: 'Asset generation started with Asset Generation Service',
                  trackingUrl: `/api/ai/jobs/${assetGenResponse.job_id || jobId}`,
                  provider: 'asset_gen',
                  estimatedTime: '30-60 seconds'
                },
              });
            } else {
              throw new Error(`Asset Generation failed: ${assetGenResponse.message || 'Unknown error'}`);
            }
          } catch (error: any) {
            // Emit failure event
            webSocketService.emitAssetProgress({
              jobId,
              status: 'failed',
              progress: 0,
              message: `Asset generation failed: ${error.message}`,
              assetType,
              prompt,
              timestamp: new Date().toISOString()
            });
            throw error;
          }
        } else if (currentProvider === 'huggingface') {
          console.log('Using HuggingFace API for generation');
          
          if (!hf) {
            throw new Error('HuggingFace API not configured');
          }

          // Generate a job ID for tracking
          const jobId = uuidv4();
          
          // Emit initial progress event
          webSocketService.emitAssetProgress({
            jobId,
            status: 'started',
            progress: 0,
            message: 'Starting asset generation with HuggingFace',
            assetType,
            prompt,
            timestamp: new Date().toISOString()
          });

          // Generate multiple assets if requested
          const numAssets = count || 1;
          for (let i = 0; i < numAssets; i++) {
            // Emit progress for each asset
            webSocketService.emitAssetProgress({
              jobId,
              status: 'processing',
              progress: Math.round(((i + 0.5) / numAssets) * 100),
              message: `Generating asset ${i + 1} of ${numAssets}`,
              assetType,
              prompt,
              timestamp: new Date().toISOString(),
              currentStep: `Asset ${i + 1}`,
              totalSteps: numAssets,
              currentStepIndex: i + 1
            });

            let assetPrompt = prompt;
            
            // Enhance prompt based on asset type
            switch (assetType) {
              case 'character':
                assetPrompt = `${prompt}, character design, game asset, ${style} style, high quality`;
                break;
              case 'environment':
                assetPrompt = `${prompt}, environment, game background, ${style} style, detailed`;
                break;
              case 'ui':
                assetPrompt = `${prompt}, UI element, game interface, ${style} style, clean design`;
                break;
              case 'sprite':
                assetPrompt = `${prompt}, pixel sprite, game sprite, ${style} style, transparent background`;
                break;
              default:
                assetPrompt = `${prompt}, game asset, ${style} style, high quality`;
                break;
            }

            const imageResponse = await hf.textToImage({
              model: 'stabilityai/stable-diffusion-2-1',
              inputs: assetPrompt,
              parameters: {
                num_inference_steps: 25,
                guidance_scale: 7.0,
              },
            });

            if (imageResponse) {
              const base64Image = Buffer.from(imageResponse).toString('base64');
              const assetId = uuidv4();
              generatedAssets.push({
                id: assetId,
                url: `data:image/png;base64,${base64Image}`,
                type: assetType,
                style,
                size,
              });
            }
          }

          // Success with HuggingFace - return
          if (generatedAssets.length > 0) {
            // Emit completion event
            webSocketService.emitAssetProgress({
              jobId,
              status: 'completed',
              progress: 100,
              message: `Successfully generated ${generatedAssets.length} assets`,
              assetType,
              prompt,
              timestamp: new Date().toISOString(),
              generatedAssets
            });

            return res.json({
              success: true,
              data: {
                assets: generatedAssets,
                metadata: {
                  prompt,
                  assetType,
                  style,
                  size,
                  count: count || 1,
                  provider: 'huggingface',
                  generatedAt: new Date().toISOString(),
                  jobId
                },
              },
            });
          } else {
            // Emit failure event
            webSocketService.emitAssetProgress({
              jobId,
              status: 'failed',
              progress: 0,
              message: 'HuggingFace generation produced no results',
              assetType,
              prompt,
              timestamp: new Date().toISOString()
            });
            throw new Error('HuggingFace generation produced no results');
          }
        }
      } catch (error) {
        console.error(`Provider ${currentProvider} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue; // Try next provider
      }
    }

    // If we get here, all providers failed
    throw lastError || new Error('All asset generation providers failed');

  } catch (error) {
    console.error('Asset generation error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to generate assets', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
    });
  }
};

// Job Status Controller for Asset Generation Service
export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Job ID is required' },
      });
    }

    // Check if SDXL service is available
    if (!assetGenClient) {
      return res.status(503).json({
        success: false,
        error: { message: 'Asset Generation Service is not available' },
      });
    }

    // Get status from SDXL service with error handling
    let jobStatus;
    try {
      jobStatus = await Promise.race([
        assetGenClient.getJobStatus(jobId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Job status timeout')), 10000)
        )
      ]);
    } catch (statusError) {
      console.error('Failed to get job status:', statusError);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve job status' },
      });
    }
    
    // Check if job is completed and transform results
    if (jobStatus.status === 'completed' && jobStatus.result) {
      const results = await assetGenClient.getJobResults(jobId);
      
      // Transform SDXL results to GameForge format
      const assets = results.image_urls?.map((url: string, index: number) => ({
        id: `${jobId}-asset-${index + 1}`,
        url: url.startsWith('http') ? url : `http://localhost:8000${url}`,
        filename: url.split('/').pop() || `generated-${index + 1}.png`,
        type: results.asset_type || 'concept-art',
        width: results.width || 512,
        height: results.height || 512,
        format: 'png',
        metadata: {
          prompt: results.prompt,
          generationMethod: 'sdxl',
          provider: 'asset_gen',
          realAI: true,
          sdxlModel: results.model_used || 'stable-diffusion-xl',
          steps: results.steps,
          guidance: results.guidance_scale,
          seed: results.seed,
          processingTime: results.total_processing_time,
          qualityScore: results.average_quality_score
        }
      })) || [];

      // Emit completion event via WebSocket
      webSocketService.emitAssetProgress({
        jobId,
        status: 'completed',
        progress: 100,
        message: `SDXL generation completed: ${assets.length} assets generated`,
        assetType: results.asset_type || 'concept-art',
        prompt: results.prompt,
        timestamp: new Date().toISOString(),
        generatedAssets: assets
      });

      return res.json({
        success: true,
        data: {
          status: 'completed',
          assets,
          metadata: {
            provider: 'sdxl',
            generationMethod: 'real-ai',
            generatedAt: results.completed_at,
            totalProcessingTime: results.total_processing_time,
            averageQualityScore: results.average_quality_score,
            successful: results.successful,
            failed: results.failed
          }
        }
      });
    } else {
      // Still processing - return progress info
      return res.json({
        success: true,
        data: {
          status: jobStatus.status || 'processing',
          progress: jobStatus.progress?.percentage || 0,
          message: jobStatus.progress?.message || 'Generating with SDXL...',
          estimatedTimeRemaining: jobStatus.progress?.estimated_time_remaining,
          currentStep: jobStatus.progress?.current_step,
          totalSteps: jobStatus.progress?.total_steps,
          stage: jobStatus.progress?.stage
        }
      });
    }
  } catch (error) {
    console.error('Job status check error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to get job status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
    });
  }
};

// Code Generation Controller
export const generateCode = async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      language = 'javascript',
      framework,
      gameType,
      complexity = 'medium',
      provider = 'huggingface',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { message: 'Prompt is required' },
      });
    }

    // Enhanced code prompt with context
    const codePrompt = `Generate ${language} code for a ${gameType || 'video game'} ${framework ? `using ${framework}` : ''}:

Requirements: ${prompt}
Complexity: ${complexity}
Language: ${language}

Code:`;

    let generatedCode;

    switch (provider) {
      case 'huggingface':
        const codeResponse = await generateWithHuggingFace(
          'microsoft/CodeGPT-small-py',
          codePrompt,
          {
            maxTokens: complexity === 'simple' ? 256 : complexity === 'complex' ? 1024 : 512,
            temperature: 0.3, // Lower temperature for code generation
          }
        );
        generatedCode = codeResponse.generated_text.replace(codePrompt, '').trim();
        break;

      case 'replicate':
        const replicateResponse = await generateWithReplicate(
          'meta/codellama-34b',
          {
            prompt: codePrompt,
            max_new_tokens: complexity === 'simple' ? 256 : complexity === 'complex' ? 1024 : 512,
            temperature: 0.3,
          }
        );
        generatedCode = replicateResponse.output?.join('') || 'Code generation failed';
        break;

      default:
        throw new Error('Invalid provider specified');
    }

    const codeId = uuidv4();
    
    res.json({
      success: true,
      data: {
        id: codeId,
        code: generatedCode,
        metadata: {
          prompt,
          language,
          framework,
          gameType,
          complexity,
          provider,
          generatedAt: new Date().toISOString(),
        },
      },
    });

  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to generate code', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
    });
  }
};
