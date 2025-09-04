import { GameProject, StoryLoreContent, AssetCollection, GameplayContent, QAContent } from './types'
import { AIMockGenerator } from './aiMockGenerator'
import { allTemplates, getTemplateById, getTemplatesByCategory } from './templates'

// Real Template System Implementation
export interface RealGameTemplate {
  id: string
  name: string
  description: string
  category: 'beginner' | 'intermediate' | 'advanced'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  tags: string[]
  
  // Template Structure
  gameStructure: GameStructure
  prebuiltContent: PrebuiltContent
  customizationOptions: CustomizationOptions
  codeTemplates: CodeTemplates
  
  // Generation Configuration
  generationConfig: GenerationConfig
}

export interface GameStructure {
  gameType: 'clicker' | 'snake' | 'flappy' | 'platformer' | 'tower-defense' | 'rpg'
  scenes: SceneTemplate[]
  mechanics: MechanicTemplate[]
  coreLoop: string
  framework: 'html5-canvas' | 'phaser' | 'three-js'
}

export interface SceneTemplate {
  id: string
  name: string
  type: 'menu' | 'game' | 'ui' | 'transition'
  requiredAssets: string[]
  codeSnippet: string
}

export interface MechanicTemplate {
  id: string
  name: string
  description: string
  codeImplementation: string
  parameters: ParameterTemplate[]
}

export interface ParameterTemplate {
  name: string
  type: 'number' | 'string' | 'boolean' | 'color'
  defaultValue: any
  description: string
  customizable: boolean
}

export interface PrebuiltContent {
  story: Partial<StoryLoreContent>
  assets: {
    art: string[]
    audio: string[]
    ui: string[]
  }
  gameplay: Partial<GameplayContent>
}

export interface CustomizationOptions {
  themes: ThemeOption[]
  mechanics: MechanicOption[]
  visuals: VisualOption[]
  difficulty: DifficultyOption[]
}

export interface ThemeOption {
  id: string
  name: string
  description: string
  assetOverrides: Record<string, string>
  colorScheme: Record<string, string>
}

export interface MechanicOption {
  id: string
  name: string
  description: string
  codeModifications: string[]
  requiredAssets: string[]
}

export interface VisualOption {
  id: string
  name: string
  description: string
  cssModifications: string[]
  assetFilters: string[]
}

export interface DifficultyOption {
  id: string
  name: string
  parameterAdjustments: Record<string, any>
}

export interface CodeTemplates {
  mainGameFile: string
  configFile: string
  htmlTemplate: string
  cssTemplate: string
  additionalFiles: Record<string, string>
}

export interface GenerationConfig {
  storyPromptTemplate: string
  assetPromptTemplate: string
  gameplayPromptTemplate: string
  variableReplacements: Record<string, string>
}

// Template Customization Interface
export interface TemplateCustomizations {
  selectedTheme?: string
  difficulty?: string
  enabledMechanics?: string[]
  enabledVisuals?: string[]
  customParameters?: Record<string, any>
  selectedMechanics?: string[]
  selectedVisuals?: string[]
  gameTitle?: string
  description?: string
}

// User input interface for hybrid generation
export interface UserGameInput {
  gameTitle: string
  gameDescription: string
  storyPrompt?: string
  additionalFeatures?: string[]
  creativityLevel: 'minimal' | 'balanced' | 'creative'
  targetAudience?: string
  visualStyle?: string
}

// Real Template Definitions (imported from modular files)
export const REAL_GAME_TEMPLATES: RealGameTemplate[] = allTemplates

// Real Template Generator Class
export class RealTemplateGenerator {
  private aiGenerator: AIMockGenerator
  
  constructor() {
    this.aiGenerator = new AIMockGenerator()
  }
  
  async generateFromTemplate(
    template: RealGameTemplate,
    customizations: TemplateCustomizations,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<GameProject> {
    onProgress?.('Initializing template generation...', 5)
    
    // 1. Apply customizations to template
    const customizedTemplate = this.applyCustomizations(template, customizations)
    
    // 2. Generate enhanced content using AI
    onProgress?.('Generating story content...', 25)
    const story = await this.generateEnhancedStory(customizedTemplate, customizations)
    
    onProgress?.('Creating template assets...', 50)
    const assets = await this.generateTemplateAssets(customizedTemplate, customizations)
    
    onProgress?.('Building gameplay systems...', 75)
    const gameplay = await this.generateTemplateGameplay(customizedTemplate, customizations)
    
    // 3. Create final project
    onProgress?.('Finalizing project...', 95)
    const project = this.createGameProject(customizedTemplate, {
      story,
      assets,
      gameplay
    })
    
    onProgress?.('Template generation complete!', 100)
    return project
  }

  // NEW: Hybrid template + user input generation
  async generateFromTemplateWithUserInput(
    template: RealGameTemplate, 
    customizations: TemplateCustomizations,
    userInput: {
      gameTitle: string
      gameDescription: string
      storyPrompt?: string
      additionalFeatures?: string[]
      creativityLevel: 'minimal' | 'balanced' | 'creative'
      targetAudience?: string
      visualStyle?: string
    },
    onProgress?: (stage: string, progress: number) => void
  ): Promise<GameProject> {
    onProgress?.('Initializing hybrid generation...', 5)
    
    // 1. Enhance customizations with user input
    const enhancedCustomizations = await this.enhanceCustomizationsWithUserInput(
      template, customizations, userInput
    )
    
    onProgress?.('Processing user creativity...', 20)
    
    // 2. Generate AI enhancements based on creativity level
    const aiEnhancements = await this.generateAIEnhancements(
      template, userInput, enhancedCustomizations
    )
    
    onProgress?.('Merging template with user vision...', 40)
    
    // 3. Merge template foundation with user input
    const hybridContent = await this.mergeTemplateWithUserInput(
      template, userInput, aiEnhancements
    )
    
    onProgress?.('Generating final project...', 70)
    
    // 4. Create hybrid project
    const project = this.createHybridGameProject(
      template, hybridContent, enhancedCustomizations, userInput
    )
    
    onProgress?.('Hybrid generation complete!', 100)
    return project
  }

  private applyCustomizations(
    template: RealGameTemplate,
    customizations: TemplateCustomizations
  ): RealGameTemplate {
    const customized = JSON.parse(JSON.stringify(template))
    
    // Apply theme customizations
    if (customizations.selectedTheme) {
      const theme = template.customizationOptions.themes.find(
        t => t.id === customizations.selectedTheme
      )
      if (theme) {
        // Apply theme-specific overrides
        Object.assign(customized.generationConfig.variableReplacements, {
          '{{SELECTED_THEME}}': theme.id,
          '{{THEME_NAME}}': theme.name,
          '{{PRIMARY_COLOR}}': theme.colorScheme.primary,
          '{{SECONDARY_COLOR}}': theme.colorScheme.secondary,
          '{{ACCENT_COLOR}}': theme.colorScheme.accent
        })
      }
    }
    
    // Apply difficulty adjustments
    if (customizations.difficulty) {
      const difficulty = template.customizationOptions.difficulty.find(
        d => d.id === customizations.difficulty
      )
      if (difficulty) {
        Object.assign(
          customized.generationConfig.variableReplacements,
          difficulty.parameterAdjustments
        )
      }
    }
    
    return customized
  }

  private async generateEnhancedStory(
    template: RealGameTemplate,
    customizations: TemplateCustomizations
  ): Promise<StoryLoreContent> {
    const prompt = this.buildStoryPrompt(template, customizations)
    return await this.aiGenerator.generateStory(prompt)
  }

  private async generateTemplateAssets(
    template: RealGameTemplate,
    customizations: TemplateCustomizations
  ): Promise<AssetCollection> {
    const prompt = this.buildAssetPrompt(template, customizations)
    return await this.aiGenerator.generateAssets(prompt, template.gameStructure.gameType)
  }

  private async generateTemplateGameplay(
    template: RealGameTemplate,
    customizations: TemplateCustomizations
  ): Promise<GameplayContent> {
    const prompt = this.buildGameplayPrompt(template, customizations)
    const story = template.prebuiltContent.story as StoryLoreContent
    return await this.aiGenerator.generateGameplay(prompt, story)
  }

  private buildStoryPrompt(template: RealGameTemplate, customizations: TemplateCustomizations): string {
    let prompt = template.generationConfig.storyPromptTemplate
    
    // Replace variables
    Object.entries(template.generationConfig.variableReplacements).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(key, 'g'), value)
    })
    
    return prompt
  }

  private buildAssetPrompt(template: RealGameTemplate, customizations: TemplateCustomizations): string {
    let prompt = template.generationConfig.assetPromptTemplate
    
    // Replace variables
    Object.entries(template.generationConfig.variableReplacements).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(key, 'g'), value)
    })
    
    return prompt
  }

  private buildGameplayPrompt(template: RealGameTemplate, customizations: TemplateCustomizations): string {
    let prompt = template.generationConfig.gameplayPromptTemplate
    
    // Replace variables
    Object.entries(template.generationConfig.variableReplacements).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(key, 'g'), value)
    })
    
    return prompt
  }

  private createGameProject(
    template: RealGameTemplate,
    content: {
      story: StoryLoreContent
      assets: AssetCollection
      gameplay: GameplayContent
    }
  ): GameProject {
    return {
      id: `project-${Date.now()}`,
      title: template.name,
      description: template.description,
      prompt: `Generated from template: ${template.name}`,
      status: 'development' as const,
      progress: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipeline: [
        {
          id: 'story',
          name: 'Story & Lore',
          status: 'complete' as const,
          progress: 100,
          order: 1
        },
        {
          id: 'assets',
          name: 'Asset Generation',
          status: 'complete' as const,
          progress: 100,
          order: 2
        },
        {
          id: 'gameplay',
          name: 'Gameplay Systems',
          status: 'in-progress' as const,
          progress: 50,
          order: 3
        },
        {
          id: 'qa',
          name: 'Quality Assurance',
          status: 'pending' as const,
          progress: 0,
          order: 4
        }
      ],
      story: content.story,
      assets: content.assets,
      gameplay: content.gameplay,
      qa: {
        testPlans: [],
        bugs: [],
        metrics: {
          test_coverage: 0,
          bug_count: 0,
          resolved_bugs: 0,
          performance_score: 0
        }
      }
    }
  }

  // Helper methods for hybrid generation
  private async enhanceCustomizationsWithUserInput(
    template: RealGameTemplate,
    customizations: TemplateCustomizations,
    userInput: any
  ): Promise<TemplateCustomizations> {
    // Merge user preferences with template customizations
    return {
      ...customizations,
      gameTitle: userInput.gameTitle,
      description: userInput.gameDescription
    }
  }

  private async generateAIEnhancements(
    template: RealGameTemplate,
    userInput: any,
    customizations: TemplateCustomizations
  ): Promise<any> {
    // Generate AI enhancements based on creativity level
    const creativityMultiplier = {
      minimal: 0.2,
      balanced: 0.5,
      creative: 0.8
    }[userInput.creativityLevel] || 0.5

    // Since generateCreativeEnhancements doesn't exist, use basic story generation
    const enhancedStory = await this.aiGenerator.generateStory(
      `${userInput.gameDescription} - Creativity Level: ${userInput.creativityLevel}`
    )

    return {
      creativityLevel: userInput.creativityLevel,
      enhancements: {
        story: enhancedStory,
        additionalFeatures: userInput.additionalFeatures || [],
        visualStyle: userInput.visualStyle
      }
    }
  }

  private async mergeTemplateWithUserInput(
    template: RealGameTemplate,
    userInput: any,
    aiEnhancements: any
  ): Promise<any> {
    return {
      baseTemplate: template,
      userInput,
      aiEnhancements,
      mergedContent: {
        // This would contain the merged template + user content
        title: userInput.gameTitle,
        description: userInput.gameDescription,
        enhancedFeatures: aiEnhancements.enhancements
      }
    }
  }

  private createHybridGameProject(
    template: RealGameTemplate,
    hybridContent: any,
    customizations: TemplateCustomizations,
    userInput: any
  ): GameProject {
    return {
      id: `hybrid-project-${Date.now()}`,
      title: userInput.gameTitle,
      description: userInput.gameDescription,
      prompt: `Hybrid project: ${userInput.gameDescription}`,
      status: 'development' as const,
      progress: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipeline: [
        {
          id: 'concept',
          name: 'Concept Development',
          status: 'complete' as const,
          progress: 100,
          order: 1
        },
        {
          id: 'story',
          name: 'Story & Lore',
          status: 'in-progress' as const,
          progress: 30,
          order: 2
        },
        {
          id: 'assets',
          name: 'Asset Generation',
          status: 'pending' as const,
          progress: 0,
          order: 3
        },
        {
          id: 'gameplay',
          name: 'Gameplay Systems',
          status: 'pending' as const,
          progress: 0,
          order: 4
        }
      ],
      story: {
        worldLore: {
          id: 'hybrid-world',
          name: userInput.gameTitle + ' World',
          geography: `Custom world created for ${userInput.gameTitle}`,
          politics: 'Player-defined political system',
          culture: 'Unique culture based on player vision',
          history: `The story of ${userInput.gameTitle} begins...`,
          technology: 'Advanced game technology',
          magic: 'Magical elements as defined by player'
        },
        mainStoryArc: {
          id: 'hybrid-story',
          title: userInput.gameTitle,
          description: userInput.gameDescription,
          acts: [],
          themes: ['adventure', 'creativity', 'player-driven'],
          tone: 'balanced' as const
        },
        characters: [],
        factions: [],
        subplots: [],
        chapters: [],
        timeline: [],
        metadata: {
          genre: template.gameStructure.gameType,
          targetAudience: userInput.targetAudience || 'general',
          complexity: 'medium' as const,
          estimatedLength: 'medium' as const,
          themes: ['hybrid', 'template-enhanced'],
          contentWarnings: []
        }
      },
      assets: {
        art: [],
        audio: [],
        ui: [],
        models: []
      },
      gameplay: {
        mechanics: [],
        levels: [],
        balancing: {
          difficulty_curve: [1, 2, 3, 4, 5],
          player_progression: {}
        }
      },
      qa: {
        testPlans: [],
        bugs: [],
        metrics: {
          test_coverage: 0,
          bug_count: 0,
          resolved_bugs: 0,
          performance_score: 0
        }
      }
    }
  }

  // Helper methods
  getTemplate(templateId: string): RealGameTemplate | undefined {
    return getTemplateById(templateId)
  }
  
  getTemplatesByCategory(category: 'beginner' | 'intermediate' | 'advanced'): RealGameTemplate[] {
    return getTemplatesByCategory(category)
  }
  
  // Generate interactive preview for template selection
  async generateTemplatePreview(templateId: string): Promise<string> {
    const template = this.getTemplate(templateId)
    if (!template) return ''
    
    // Create a mini-implementation for preview
    const previewCode = `
      <div class="template-preview" style="width: 300px; height: 200px; border: 2px solid #ccc; position: relative;">
        <div class="preview-title">${template.name}</div>
        <div class="preview-game-area" style="background: ${template.customizationOptions.themes[0].colorScheme.primary};">
          ${this.generatePreviewHTML(template)}
        </div>
        <div class="preview-stats">
          <span>Complexity: ${template.complexity}</span>
          <span>Time: ${template.estimatedTime}</span>
        </div>
      </div>
    `
    
    return previewCode
  }
  
  private generatePreviewHTML(template: RealGameTemplate): string {
    switch (template.gameStructure.gameType) {
      case 'clicker':
        return `
          <div class="clickable-preview" style="width: 60px; height: 60px; background: #8B4513; border-radius: 50%; margin: 20px auto; cursor: pointer;"></div>
          <div class="stats-preview">Score: 1,234</div>
        `
      case 'snake':
        return `
          <div class="snake-preview" style="width: 80px; height: 20px; background: #00AA00; margin: 20px auto; border-radius: 10px;"></div>
          <div class="stats-preview">Length: 5</div>
        `
      case 'flappy':
        return `
          <div class="bird-preview" style="width: 40px; height: 30px; background: #FFFF00; margin: 20px auto; border-radius: 50%;"></div>
          <div class="stats-preview">Best: 42</div>
        `
      case 'platformer':
        return `
          <div class="player-preview" style="width: 30px; height: 40px; background: #4169E1; margin: 20px auto; border-radius: 5px;"></div>
          <div class="stats-preview">Level: 1</div>
        `
      default:
        return '<div class="generic-preview">Game Preview</div>'
    }
  }
}

// Export singleton
export const realTemplateGenerator = new RealTemplateGenerator()
