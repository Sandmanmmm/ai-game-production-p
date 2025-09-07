// Simplified Real Template Generator for Production
import { REAL_GAME_TEMPLATES } from './mockData'

export interface RealGameTemplate {
  id: string
  name: string
  description: string
  category: 'beginner' | 'intermediate' | 'advanced'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  tags: string[]
  gameStructure: {
    gameType: string
    framework: string
    coreLoop: string
    scenes: any[]
    mechanics: any[]
  }
  prebuiltContent: {
    story: any
    assets: {
      art: string[]
      audio: string[]
      ui: string[]
    }
  }
  customizationOptions: {
    difficulty: any
    themes: any[]
    mechanics: any[]
    visuals: any[]
  }
}

export interface UserGameInput {
  gameTitle: string
  gameDescription: string
  storyPrompt?: string
  additionalFeatures?: string[]
  creativityLevel: 'minimal' | 'balanced' | 'creative'
  targetAudience?: string
  visualStyle?: string
}

export class RealTemplateGenerator {
  static getTemplates(): RealGameTemplate[] {
    return REAL_GAME_TEMPLATES
  }
  
  static getOldInlineTemplates(): RealGameTemplate[] {
    return []
  }
  
  getTemplateById(id: string): RealGameTemplate | undefined {
    return REAL_GAME_TEMPLATES.find(template => template.id === id)
  }
  
  getTemplatesByCategory(category: string): RealGameTemplate[] {
    return REAL_GAME_TEMPLATES.filter(template => template.category === category)
  }
  
  createGameProject(template: RealGameTemplate, userInput?: any): any {
    return {
      id: Date.now().toString(),
      name: template.name,
      description: template.description,
      template: template,
      userInput: userInput || {},
      createdAt: new Date().toISOString(),
      status: 'created'
    }
  }
}

// Export singleton
export const realTemplateGenerator = new RealTemplateGenerator()
