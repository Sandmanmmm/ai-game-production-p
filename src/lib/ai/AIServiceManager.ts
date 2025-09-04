import { GameProject, StoryLoreContent, AssetCollection, GameplayContent } from '../types'

// AI Service Provider Types
export type AIProvider = 'openai' | 'claude' | 'local'
export type ImageProvider = 'dalle' | 'stable-diffusion' | 'local'
export type AudioProvider = 'elevenlabs' | 'local'

// Configuration interfaces
export interface AIServiceConfig {
  textProvider: AIProvider
  imageProvider: ImageProvider
  audioProvider: AudioProvider
  apiKeys: {
    openai?: string
    claude?: string
    dalle?: string
    stableDiffusion?: string
    elevenlabs?: string
  }
  limits: {
    requestsPerMinute: number
    maxConcurrent: number
    monthlyBudget: number
  }
  quality: {
    textModel: string
    imageResolution: string
    audioQuality: string
  }
}

// AI Generation Request Types
export interface TextGenerationRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  systemMessage?: string
  context?: any
}

export interface ImageGenerationRequest {
  prompt: string
  style?: string
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  count?: number
}

export interface AudioGenerationRequest {
  text?: string
  style?: string
  voice?: string
  format?: 'mp3' | 'wav' | 'ogg'
  duration?: number
}

// Response types
export interface AIResponse<T> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    tokens?: number
    cost?: number
    duration?: number
  }
}

export interface GeneratedAsset {
  id: string
  type: 'image' | 'audio' | 'text'
  url?: string
  content?: string
  metadata: {
    prompt: string
    provider: string
    generatedAt: string
    size?: number
    format?: string
  }
}

// Main AI Service Manager
export class AIServiceManager {
  private config: AIServiceConfig
  private requestCounts: Map<string, number> = new Map()
  private activeRequests: number = 0
  private totalCost: number = 0

  constructor(config: AIServiceConfig) {
    this.config = config
    this.initializeRateLimiting()
  }

  private initializeRateLimiting() {
    // Reset request counts every minute
    setInterval(() => {
      this.requestCounts.clear()
    }, 60000)
  }

  private async checkRateLimit(): Promise<boolean> {
    const currentMinute = Math.floor(Date.now() / 60000).toString()
    const currentCount = this.requestCounts.get(currentMinute) || 0
    
    if (currentCount >= this.config.limits.requestsPerMinute) {
      throw new Error('Rate limit exceeded. Please wait a minute before making more requests.')
    }
    
    if (this.activeRequests >= this.config.limits.maxConcurrent) {
      throw new Error('Too many concurrent requests. Please wait for existing requests to complete.')
    }
    
    return true
  }

  private updateRequestCount() {
    const currentMinute = Math.floor(Date.now() / 60000).toString()
    const currentCount = this.requestCounts.get(currentMinute) || 0
    this.requestCounts.set(currentMinute, currentCount + 1)
    this.activeRequests++
  }

  private completeRequest(cost: number = 0) {
    this.activeRequests--
    this.totalCost += cost
    
    if (this.totalCost > this.config.limits.monthlyBudget) {
      console.warn('Monthly AI budget exceeded!')
    }
  }

  // Text generation using GPT or Claude
  async generateText(request: TextGenerationRequest): Promise<AIResponse<string>> {
    try {
      await this.checkRateLimit()
      this.updateRequestCount()

      let response: string
      let cost = 0

      switch (this.config.textProvider) {
        case 'openai':
          response = await this.generateWithOpenAI(request)
          cost = this.calculateOpenAICost(request.maxTokens || 1000)
          break
        case 'claude':
          response = await this.generateWithClaude(request)
          cost = this.calculateClaudeCost(request.maxTokens || 1000)
          break
        case 'local':
          response = await this.generateWithLocal(request)
          cost = 0
          break
        default:
          throw new Error(`Unsupported text provider: ${this.config.textProvider}`)
      }

      this.completeRequest(cost)

      return {
        success: true,
        data: response,
        usage: {
          tokens: request.maxTokens || 1000,
          cost,
          duration: Date.now()
        }
      }
    } catch (error) {
      this.completeRequest()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Image generation using DALL-E or Stable Diffusion
  async generateImage(request: ImageGenerationRequest): Promise<AIResponse<GeneratedAsset[]>> {
    try {
      await this.checkRateLimit()
      this.updateRequestCount()

      let assets: GeneratedAsset[] = []
      let cost = 0

      switch (this.config.imageProvider) {
        case 'dalle':
          assets = await this.generateWithDALLE(request)
          cost = this.calculateDALLECost(request.size || '1024x1024', request.count || 1)
          break
        case 'stable-diffusion':
          assets = await this.generateWithStableDiffusion(request)
          cost = this.calculateStableDiffusionCost(request.count || 1)
          break
        case 'local':
          assets = await this.generateImagesLocally(request)
          cost = 0
          break
        default:
          throw new Error(`Unsupported image provider: ${this.config.imageProvider}`)
      }

      this.completeRequest(cost)

      return {
        success: true,
        data: assets,
        usage: {
          cost,
          duration: Date.now()
        }
      }
    } catch (error) {
      this.completeRequest()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Audio generation
  async generateAudio(request: AudioGenerationRequest): Promise<AIResponse<GeneratedAsset>> {
    try {
      await this.checkRateLimit()
      this.updateRequestCount()

      let asset: GeneratedAsset
      let cost = 0

      switch (this.config.audioProvider) {
        case 'elevenlabs':
          asset = await this.generateWithElevenLabs(request)
          cost = this.calculateElevenLabsCost(request.text?.length || 100)
          break
        case 'local':
          asset = await this.generateAudioLocally(request)
          cost = 0
          break
        default:
          throw new Error(`Unsupported audio provider: ${this.config.audioProvider}`)
      }

      this.completeRequest(cost)

      return {
        success: true,
        data: asset,
        usage: {
          cost,
          duration: Date.now()
        }
      }
    } catch (error) {
      this.completeRequest()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Provider-specific implementations
  private async generateWithOpenAI(request: TextGenerationRequest): Promise<string> {
    const apiKey = this.config.apiKeys.openai
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // In real implementation, this would call OpenAI API
    // For now, return a placeholder that indicates AI would be called
    return `[AI Generated Content via OpenAI GPT-4]\n\nPrompt: ${request.prompt}\n\nThis would be generated by GPT-4 in production with detailed, contextual content based on the user's game concept.`
  }

  private async generateWithClaude(request: TextGenerationRequest): Promise<string> {
    const apiKey = this.config.apiKeys.claude
    if (!apiKey) {
      throw new Error('Claude API key not configured')
    }

    return `[AI Generated Content via Claude]\n\nPrompt: ${request.prompt}\n\nThis would be generated by Claude in production.`
  }

  private async generateWithLocal(request: TextGenerationRequest): Promise<string> {
    // Fallback to enhanced mock generation
    return `[Local AI Generated Content]\n\nBased on: ${request.prompt}\n\nThis represents content that would be generated by a local AI model.`
  }

  private async generateWithDALLE(request: ImageGenerationRequest): Promise<GeneratedAsset[]> {
    const apiKey = this.config.apiKeys.dalle
    if (!apiKey) {
      throw new Error('DALL-E API key not configured')
    }

    // In production, this would call DALL-E API and return actual image URLs
    return [{
      id: `dalle-${Date.now()}`,
      type: 'image',
      url: `https://placeholder-ai-image.com/generated/${Date.now()}`,
      metadata: {
        prompt: request.prompt,
        provider: 'dalle',
        generatedAt: new Date().toISOString(),
        size: 1024 * 1024,
        format: 'png'
      }
    }]
  }

  private async generateWithStableDiffusion(request: ImageGenerationRequest): Promise<GeneratedAsset[]> {
    return [{
      id: `sd-${Date.now()}`,
      type: 'image',
      url: `https://placeholder-sd-image.com/generated/${Date.now()}`,
      metadata: {
        prompt: request.prompt,
        provider: 'stable-diffusion',
        generatedAt: new Date().toISOString(),
        size: 1024 * 1024,
        format: 'png'
      }
    }]
  }

  private async generateImagesLocally(request: ImageGenerationRequest): Promise<GeneratedAsset[]> {
    return [{
      id: `local-img-${Date.now()}`,
      type: 'image',
      url: `https://via.placeholder.com/512x512/1a1a1a/ffffff?text=AI+Generated+Image`,
      metadata: {
        prompt: request.prompt,
        provider: 'local',
        generatedAt: new Date().toISOString(),
        size: 512 * 512,
        format: 'png'
      }
    }]
  }

  private async generateWithElevenLabs(request: AudioGenerationRequest): Promise<GeneratedAsset> {
    return {
      id: `elevenlabs-${Date.now()}`,
      type: 'audio',
      url: `https://placeholder-audio.com/generated/${Date.now()}.mp3`,
      metadata: {
        prompt: request.text || '',
        provider: 'elevenlabs',
        generatedAt: new Date().toISOString(),
        size: 1024 * 100, // Rough estimate
        format: 'mp3'
      }
    }
  }

  private async generateAudioLocally(request: AudioGenerationRequest): Promise<GeneratedAsset> {
    return {
      id: `local-audio-${Date.now()}`,
      type: 'audio',
      url: `data:audio/wav;base64,placeholder`, // Placeholder audio data
      metadata: {
        prompt: request.text || '',
        provider: 'local',
        generatedAt: new Date().toISOString(),
        size: 1024 * 50,
        format: 'wav'
      }
    }
  }

  // Cost calculation methods
  private calculateOpenAICost(tokens: number): number {
    // GPT-4 pricing: ~$0.03/1K tokens
    return (tokens / 1000) * 0.03
  }

  private calculateClaudeCost(tokens: number): number {
    // Claude pricing: ~$0.015/1K tokens
    return (tokens / 1000) * 0.015
  }

  private calculateDALLECost(size: string, count: number): number {
    // DALL-E 3 pricing varies by size
    const costs = {
      '256x256': 0.016,
      '512x512': 0.018,
      '1024x1024': 0.020,
      '1792x1024': 0.040,
      '1024x1792': 0.040
    }
    return costs[size as keyof typeof costs] * count || 0.020 * count
  }

  private calculateStableDiffusionCost(count: number): number {
    // Stable Diffusion API pricing
    return count * 0.002
  }

  private calculateElevenLabsCost(textLength: number): number {
    // ElevenLabs pricing based on character count
    return (textLength / 1000) * 0.30
  }

  // Utility methods
  getUsageStats() {
    return {
      totalCost: this.totalCost,
      activeRequests: this.activeRequests,
      budgetRemaining: this.config.limits.monthlyBudget - this.totalCost
    }
  }

  updateConfig(newConfig: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...newConfig }
  }
}

// Default configuration
export const defaultAIConfig: AIServiceConfig = {
  textProvider: 'openai',
  imageProvider: 'dalle',
  audioProvider: 'elevenlabs',
  apiKeys: {
    // These would be loaded from environment variables in production
    // For development, we'll handle this through a configuration service
    openai: '',
    claude: '',
    dalle: '',
    stableDiffusion: '',
    elevenlabs: ''
  },
  limits: {
    requestsPerMinute: 60,
    maxConcurrent: 5,
    monthlyBudget: 500
  },
  quality: {
    textModel: 'gpt-4',
    imageResolution: '1024x1024',
    audioQuality: 'high'
  }
}

// Singleton instance
export const aiServiceManager = new AIServiceManager(defaultAIConfig)
