// Template Data Types
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
  story: any // Using any to match existing structure
  assets: {
    art: string[]
    audio: string[]
    ui: string[]
  }
  gameplay: any // Using any to match existing structure
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
