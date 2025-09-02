import { AIServiceManager } from './AIServiceManager'
import { StoryAIGenerator, StoryGenerationRequest } from './StoryAIGenerator'
import { VisualAIGenerator, VisualGenerationRequest, AssetRequest } from './VisualAIGenerator'
import { AudioAIGenerator, GameAudioGenerationRequest, AudioAssetRequest } from './AudioAIGenerator'
import { StoryLoreContent, GameAsset } from '../types'

export interface MasterGenerationRequest {
  // Basic game information
  gameTitle: string
  gameDescription: string
  genre: string
  mood: string
  targetAudience: string
  
  // Detailed form data from EnhancedProjectCreationDialog
  basicInfo: {
    title: string
    description: string
    genre: string
    targetAudience: string
    estimatedDevelopmentTime: string
  }
  
  gameplay: {
    coreGameplay: string
    playerGoals: string
    challenges: string
    mechanics: string
    controls: string
    difficulty: string
  }
  
  story: {
    hasStory: boolean
    storyBrief?: string
    mainCharacter?: string
    setting?: string
    conflict?: string
    themes?: string
  }
  
  technical: {
    platform: string
    artStyle: string
    mood: string
    colorPalette?: string
    audioStyle?: string
    inspirations?: string
    uniqueFeatures?: string
  }
  
  // Asset generation preferences
  assetPreferences: {
    generateStory: boolean
    generateVisuals: boolean
    generateAudio: boolean
    priority: 'speed' | 'quality' | 'balanced'
    maxAssets: number
  }
}

export interface GeneratedGameProject {
  id: string
  title: string
  description: string
  metadata: {
    generatedAt: string
    generationTime: number
    aiProvider: string
    totalCost: number
    assetCounts: {
      story: number
      visual: number
      audio: number
    }
  }
  
  // Generated content
  story?: StoryLoreContent
  visualAssets: GameAsset[]
  audioAssets: GameAsset[]
  
  // Style guides and documentation
  styleGuide: {
    visual?: any
    audio?: any
  }
  
  // Generation results
  generationReport: {
    success: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  }
}

export class MasterAIGenerator {
  private aiService: AIServiceManager
  private storyGenerator: StoryAIGenerator
  private visualGenerator: VisualAIGenerator
  private audioGenerator: AudioAIGenerator

  constructor(aiServiceConfig: any) {
    this.aiService = new AIServiceManager(aiServiceConfig)
    this.storyGenerator = new StoryAIGenerator(this.aiService)
    this.visualGenerator = new VisualAIGenerator(this.aiService)
    this.audioGenerator = new AudioAIGenerator(this.aiService)
  }

  async generateGameProject(request: MasterGenerationRequest): Promise<GeneratedGameProject> {
    const startTime = Date.now()
    const projectId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const project: GeneratedGameProject = {
      id: projectId,
      title: request.gameTitle,
      description: request.gameDescription,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTime: 0,
        aiProvider: 'mixed-providers',
        totalCost: 0,
        assetCounts: {
          story: 0,
          visual: 0,
          audio: 0
        }
      },
      visualAssets: [],
      audioAssets: [],
      styleGuide: {},
      generationReport: {
        success: false,
        errors: [],
        warnings: [],
        suggestions: []
      }
    }

    try {
      // Generate story content if requested
      if (request.assetPreferences.generateStory) {
        try {
          const storyRequest = this.buildStoryRequest(request)
          project.story = await this.storyGenerator.generateCompleteStory(storyRequest)
          project.metadata.assetCounts.story = this.countStoryAssets(project.story)
          project.generationReport.suggestions.push('Story generated successfully with rich world-building content')
        } catch (error) {
          project.generationReport.errors.push(`Story generation failed: ${error}`)
          project.generationReport.warnings.push('Continuing without story content')
        }
      }

      // Generate visual assets if requested
      if (request.assetPreferences.generateVisuals) {
        try {
          const visualRequest = this.buildVisualRequest(request, project.story)
          const visualResult = await this.visualGenerator.generateGameAssets(visualRequest)
          
          project.visualAssets = visualResult.assets.map(asset => this.convertToGameAsset(asset, 'visual'))
          project.styleGuide.visual = visualResult.styleGuide
          project.metadata.assetCounts.visual = visualResult.assets.length
          
          if (visualResult.errors.length > 0) {
            project.generationReport.warnings.push(...visualResult.errors)
          }
        } catch (error) {
          project.generationReport.errors.push(`Visual generation failed: ${error}`)
        }
      }

      // Generate audio assets if requested
      if (request.assetPreferences.generateAudio) {
        try {
          const audioRequest = this.buildAudioRequest(request, project.story)
          const audioResult = await this.audioGenerator.generateGameAudio(audioRequest)
          
          project.audioAssets = audioResult.assets.map(asset => this.convertToGameAsset(asset, 'audio'))
          project.styleGuide.audio = audioResult.audioGuide
          project.metadata.assetCounts.audio = audioResult.assets.length
          
          if (audioResult.errors.length > 0) {
            project.generationReport.warnings.push(...audioResult.errors)
          }
        } catch (error) {
          project.generationReport.errors.push(`Audio generation failed: ${error}`)
        }
      }

      // Finalize generation
      project.metadata.generationTime = Date.now() - startTime
      project.metadata.totalCost = 0 // Will be tracked in production
      project.generationReport.success = project.generationReport.errors.length === 0
      
      // Add success suggestions
      if (project.generationReport.success) {
        project.generationReport.suggestions.push(
          'Game project generated successfully!',
          'Review the generated assets and customize as needed',
          'Consider refining the story or visual style for your specific needs'
        )
      }

    } catch (error) {
      project.generationReport.errors.push(`Critical generation error: ${error}`)
      project.generationReport.success = false
    }

    return project
  }

  private buildStoryRequest(request: MasterGenerationRequest): StoryGenerationRequest {
    return {
      gameTitle: request.gameTitle,
      gameDescription: request.gameDescription,
      genre: request.genre,
      mood: request.mood,
      targetAudience: request.targetAudience,
      complexity: this.determineStoryComplexity(request),
      storyElements: {
        hasStory: request.story.hasStory,
        storyBrief: request.story.storyBrief,
        mainCharacter: request.story.mainCharacter,
        setting: request.story.setting,
        conflict: request.story.conflict
      },
      inspirations: request.technical.inspirations,
      uniqueFeatures: request.technical.uniqueFeatures
    }
  }

  private buildVisualRequest(request: MasterGenerationRequest, story?: StoryLoreContent): VisualGenerationRequest {
    const assetRequests = this.generateVisualAssetRequests(request, story)
    
    return {
      gameTitle: request.gameTitle,
      gameDescription: request.gameDescription,
      genre: request.genre,
      artStyle: request.technical.artStyle,
      mood: request.technical.mood,
      targetAudience: request.targetAudience,
      artElements: {
        colorPalette: request.technical.colorPalette,
        visualStyle: request.technical.artStyle,
        inspirations: request.technical.inspirations
      },
      assetRequests
    }
  }

  private buildAudioRequest(request: MasterGenerationRequest, story?: StoryLoreContent): GameAudioGenerationRequest {
    const audioRequests = this.generateAudioAssetRequests(request, story)
    
    return {
      gameTitle: request.gameTitle,
      gameDescription: request.gameDescription,
      genre: request.genre,
      mood: request.mood,
      targetAudience: request.targetAudience,
      audioElements: {
        musicStyle: request.technical.audioStyle,
        soundscape: this.inferSoundscape(request.genre),
        inspirations: request.technical.inspirations
      },
      audioRequests
    }
  }

  private generateVisualAssetRequests(request: MasterGenerationRequest, story?: StoryLoreContent): AssetRequest[] {
    const requests: AssetRequest[] = []
    const maxAssets = Math.min(request.assetPreferences.maxAssets, 10) // Limit for cost control

    // Main character sprite (if story has character)
    if (story?.characters && story.characters.length > 0) {
      requests.push({
        type: 'character',
        name: story.characters[0].name,
        description: story.characters[0].description || 'Main game character',
        priority: 'high',
        specifications: {
          dimensions: '512x512',
          style: request.technical.artStyle
        }
      })
    }

    // Background scene
    requests.push({
      type: 'background',
      name: 'Main Game Background',
      description: story?.worldLore.geography || request.gameDescription,
      priority: 'high',
      specifications: {
        dimensions: '1024x768',
        style: request.technical.artStyle
      }
    })

    // UI elements
    requests.push({
      type: 'ui',
      name: 'Game Button',
      description: 'Main action button for the game interface',
      priority: 'medium',
      specifications: {
        dimensions: '256x64',
        style: request.technical.artStyle
      }
    })

    // Additional assets based on genre
    const genreAssets = this.getGenreSpecificVisualAssets(request.genre, request.technical.artStyle)
    requests.push(...genreAssets.slice(0, maxAssets - requests.length))

    return requests
  }

  private generateAudioAssetRequests(request: MasterGenerationRequest, story?: StoryLoreContent): AudioAssetRequest[] {
    const requests: AudioAssetRequest[] = []
    const maxAssets = Math.min(request.assetPreferences.maxAssets, 6) // Limit audio assets for cost

    // Background music
    requests.push({
      type: 'music',
      name: 'Main Theme',
      description: `Background music for ${request.gameTitle}`,
      duration: 120, // 2 minutes
      priority: 'high',
      specifications: {
        loops: true,
        style: request.technical.audioStyle || request.genre
      }
    })

    // Sound effects
    requests.push({
      type: 'sfx',
      name: 'Click Sound',
      description: 'Button click or interaction sound',
      duration: 1,
      priority: 'medium',
      specifications: {
        volume: 'medium',
        loops: false
      }
    })

    // Ambient sound if appropriate
    if (['fantasy', 'sci-fi', 'horror', 'adventure'].includes(request.genre.toLowerCase())) {
      requests.push({
        type: 'ambient',
        name: 'Atmospheric Background',
        description: `Ambient atmosphere for ${request.genre} setting`,
        duration: 60,
        priority: 'medium',
        specifications: {
          loops: true
        }
      })
    }

    return requests.slice(0, maxAssets)
  }

  private getGenreSpecificVisualAssets(genre: string, artStyle: string): AssetRequest[] {
    const genreAssets: { [key: string]: AssetRequest[] } = {
      'platformer': [
        {
          type: 'tile',
          name: 'Ground Tile',
          description: 'Repeatable ground/floor tile',
          priority: 'medium',
          specifications: { dimensions: '64x64', style: artStyle }
        }
      ],
      'rpg': [
        {
          type: 'prop',
          name: 'Treasure Chest',
          description: 'Interactive treasure chest',
          priority: 'medium',
          specifications: { dimensions: '128x128', style: artStyle }
        }
      ],
      'puzzle': [
        {
          type: 'prop',
          name: 'Puzzle Piece',
          description: 'Game puzzle element',
          priority: 'medium',
          specifications: { dimensions: '64x64', style: artStyle }
        }
      ]
    }

    return genreAssets[genre.toLowerCase()] || []
  }

  private determineStoryComplexity(request: MasterGenerationRequest): 'simple' | 'medium' | 'complex' {
    if (!request.story.hasStory) return 'simple'
    
    const complexityFactors = [
      request.story.storyBrief?.length || 0,
      request.story.themes?.length || 0,
      request.targetAudience === 'adults' ? 1 : 0,
      ['rpg', 'adventure', 'fantasy'].includes(request.genre.toLowerCase()) ? 1 : 0
    ]

    const score = complexityFactors.reduce((sum, factor) => sum + (typeof factor === 'number' ? factor : 0), 0)
    
    if (score < 50) return 'simple'
    if (score < 150) return 'medium'
    return 'complex'
  }

  private inferSoundscape(genre: string): string {
    const soundscapes: { [key: string]: string } = {
      'fantasy': 'magical and mystical',
      'sci-fi': 'futuristic and technological',
      'horror': 'eerie and atmospheric',
      'adventure': 'dynamic and exciting',
      'puzzle': 'calm and thoughtful',
      'platformer': 'energetic and upbeat'
    }

    return soundscapes[genre.toLowerCase()] || 'immersive and appropriate'
  }

  private countStoryAssets(story: StoryLoreContent): number {
    return (
      (story.characters?.length || 0) +
      (story.chapters?.length || 0) +
      (story.factions?.length || 0) +
      1 // worldLore
    )
  }

  private convertToGameAsset(asset: any, type: 'visual' | 'audio'): GameAsset {
    return {
      id: asset.id,
      name: asset.name,
      type: type === 'visual' ? 'image' : 'audio',
      url: type === 'visual' ? asset.imageUrl : asset.audioUrl,
      description: asset.description,
      metadata: asset.metadata,
      tags: asset.metadata.tags || [],
      createdAt: new Date().toISOString()
    }
  }

  // Utility methods for external access
  public async estimateGenerationCost(request: MasterGenerationRequest): Promise<number> {
    let estimatedCost = 0

    if (request.assetPreferences.generateStory) {
      estimatedCost += 0.50 // Story generation estimate
    }

    if (request.assetPreferences.generateVisuals) {
      const visualCount = Math.min(request.assetPreferences.maxAssets, 5)
      estimatedCost += visualCount * 0.75 // Visual generation estimate
    }

    if (request.assetPreferences.generateAudio) {
      const audioCount = Math.min(request.assetPreferences.maxAssets, 3)
      estimatedCost += audioCount * 1.25 // Audio generation estimate
    }

    return estimatedCost
  }

  public getServiceStatus(): {
    isReady: boolean
    activeProvider: string
    remainingBudget: number
    requestsUsed: number
  } {
    return {
      isReady: true, // Simplified for now
      activeProvider: 'multiple',
      remainingBudget: 500, // Default budget
      requestsUsed: 0
    }
  }
}
