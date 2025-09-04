import { AIServiceManager, ImageGenerationRequest } from './AIServiceManager'

export interface VisualAsset {
  id: string
  name: string
  type: 'character' | 'background' | 'ui' | 'prop' | 'effect' | 'tile'
  description: string
  imageUrl: string
  metadata: {
    width: number
    height: number
    style: string
    colors: string[]
    tags: string[]
  }
}

export interface VisualGenerationRequest {
  gameTitle: string
  gameDescription: string
  genre: string
  artStyle: string
  mood: string
  targetAudience: string
  artElements: {
    characterDesign?: string
    colorPalette?: string
    visualStyle?: string
    inspirations?: string
  }
  assetRequests: AssetRequest[]
}

export interface AssetRequest {
  type: 'character' | 'background' | 'ui' | 'prop' | 'effect' | 'tile'
  name: string
  description: string
  priority: 'high' | 'medium' | 'low'
  specifications?: {
    dimensions?: string
    style?: string
    colors?: string[]
    details?: string
  }
}

export class VisualAIGenerator {
  private aiService: AIServiceManager

  constructor(aiService: AIServiceManager) {
    this.aiService = aiService
  }

  async generateGameAssets(request: VisualGenerationRequest): Promise<{
    assets: VisualAsset[]
    styleGuide: GameStyleGuide
    errors: string[]
  }> {
    const results = {
      assets: [] as VisualAsset[],
      styleGuide: await this.createStyleGuide(request),
      errors: [] as string[]
    }

    // Generate assets in order of priority
    const sortedRequests = this.sortAssetsByPriority(request.assetRequests)

    for (const assetRequest of sortedRequests) {
      try {
        const asset = await this.generateSingleAsset(request, assetRequest, results.styleGuide)
        results.assets.push(asset)
      } catch (error) {
        results.errors.push(`Failed to generate ${assetRequest.name}: ${error}`)
        console.error(`Asset generation error:`, error)
      }
    }

    return results
  }

  async generateSingleAsset(
    gameRequest: VisualGenerationRequest,
    assetRequest: AssetRequest,
    styleGuide: GameStyleGuide
  ): Promise<VisualAsset> {
    const prompt = this.buildAssetPrompt(gameRequest, assetRequest, styleGuide)
    const assetSize = this.getAssetDimensions(assetRequest)
    
    const imageRequest: ImageGenerationRequest = {
      prompt,
      style: this.mapArtStyleToAIStyle(gameRequest.artStyle),
      size: assetSize as "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792",
      quality: assetRequest.priority === 'high' ? 'hd' : 'standard',
      count: 1
    }

    const response = await this.aiService.generateImage(imageRequest)

    if (!response.success || !response.data || !response.data[0]) {
      throw new Error(`Failed to generate image: ${response.error}`)
    }

    const generatedAsset = response.data[0]

    return {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: assetRequest.name,
      type: assetRequest.type,
      description: assetRequest.description,
      imageUrl: generatedAsset.url || 'placeholder-url',
      metadata: {
        width: this.parseDimensions(assetSize).width,
        height: this.parseDimensions(assetSize).height,
        style: gameRequest.artStyle,
        colors: this.extractColors(gameRequest.artElements.colorPalette || ''),
        tags: this.generateAssetTags(gameRequest, assetRequest)
      }
    }
  }

  private async createStyleGuide(request: VisualGenerationRequest): Promise<GameStyleGuide> {
    return {
      id: `style-${Date.now()}`,
      name: `${request.gameTitle} Style Guide`,
      artStyle: request.artStyle,
      colorPalette: {
        primary: this.extractPrimaryColors(request.artElements.colorPalette || ''),
        secondary: this.extractSecondaryColors(request.artElements.colorPalette || ''),
        accent: this.extractAccentColors(request.artElements.colorPalette || ''),
        neutral: ['#000000', '#FFFFFF', '#808080']
      },
      typography: {
        primary: this.selectPrimaryFont(request.artStyle),
        secondary: this.selectSecondaryFont(request.artStyle),
        ui: this.selectUIFont(request.artStyle)
      },
      guidelines: {
        characterDesign: request.artElements.characterDesign || 'Design characters that fit the game aesthetic',
        backgroundStyle: this.generateBackgroundGuidelines(request),
        uiDesign: this.generateUIGuidelines(request),
        effectsStyle: this.generateEffectsGuidelines(request)
      },
      constraints: {
        maxColors: this.getColorConstraints(request.artStyle),
        resolution: this.getResolutionConstraints(request.targetAudience),
        fileFormats: ['PNG', 'JPG', 'SVG'],
        accessibility: this.getAccessibilityGuidelines(request.targetAudience)
      }
    }
  }

  private buildAssetPrompt(
    gameRequest: VisualGenerationRequest,
    assetRequest: AssetRequest,
    styleGuide: GameStyleGuide
  ): string {
    const basePrompt = this.getBasePromptForAssetType(assetRequest.type)
    
    let prompt = `${basePrompt} for a ${gameRequest.genre} game called "${gameRequest.gameTitle}".

Asset Name: ${assetRequest.name}
Description: ${assetRequest.description}

Art Style: ${gameRequest.artStyle}
Mood: ${gameRequest.mood}
Target Audience: ${gameRequest.targetAudience}

Style Requirements:
- Use ${gameRequest.artStyle} art style
- Maintain ${gameRequest.mood} mood/atmosphere
- Color palette: ${this.formatColorPalette(styleGuide.colorPalette)}
- Character design notes: ${gameRequest.artElements.characterDesign || 'Standard design'}

Technical Specifications:`

    if (assetRequest.specifications?.dimensions) {
      prompt += `\n- Dimensions: ${assetRequest.specifications.dimensions}`
    }
    
    if (assetRequest.specifications?.style) {
      prompt += `\n- Specific style: ${assetRequest.specifications.style}`
    }
    
    if (assetRequest.specifications?.details) {
      prompt += `\n- Additional details: ${assetRequest.specifications.details}`
    }

    // Add asset-specific requirements
    prompt += this.getAssetSpecificRequirements(assetRequest.type, gameRequest)

    return prompt
  }

  private buildNegativePrompt(gameRequest: VisualGenerationRequest, assetRequest: AssetRequest): string {
    let negativePrompt = 'blurry, low quality, pixelated, distorted, ugly, deformed, '
    
    // Age-appropriate content filtering
    if (gameRequest.targetAudience === 'children') {
      negativePrompt += 'violent, scary, dark, mature themes, weapons, blood, '
    }

    // Style-specific negative prompts
    if (gameRequest.artStyle === 'pixel art') {
      negativePrompt += 'smooth gradients, photorealistic, 3d rendering, '
    } else if (gameRequest.artStyle === 'cartoon') {
      negativePrompt += 'realistic, photographic, dark shadows, '
    }

    // Asset-specific negative prompts
    switch (assetRequest.type) {
      case 'character':
        negativePrompt += 'multiple heads, extra limbs, floating objects, '
        break
      case 'background':
        negativePrompt += 'characters, foreground objects, text, UI elements, '
        break
      case 'ui':
        negativePrompt += 'characters, background scenery, 3d elements, '
        break
    }

    return negativePrompt.trim().replace(/, $/, '')
  }

  private getBasePromptForAssetType(type: string): string {
    switch (type) {
      case 'character':
        return 'Create a game character sprite'
      case 'background':
        return 'Create a game background scene'
      case 'ui':
        return 'Create a UI element or interface component'
      case 'prop':
        return 'Create a game prop or interactive object'
      case 'effect':
        return 'Create a visual effect or particle system representation'
      case 'tile':
        return 'Create a tileable game texture or environment tile'
      default:
        return 'Create a game asset'
    }
  }

  private getAssetSpecificRequirements(type: string, gameRequest: VisualGenerationRequest): string {
    let requirements = ''

    switch (type) {
      case 'character':
        requirements = `
        
Character-specific requirements:
- Clear silhouette and readable design at small sizes
- Consistent with game's character design language
- Appropriate animation potential (static pose that suggests movement)
- Clear focal point and visual hierarchy
- Fits within the game world established by the story and setting`
        break

      case 'background':
        requirements = `
        
Background-specific requirements:
- Should not compete with foreground characters for attention
- Establish depth and atmosphere
- Support gameplay visibility (characters should stand out)
- Consistent lighting and perspective
- Tileable if specified for repeating backgrounds`
        break

      case 'ui':
        requirements = `
        
UI-specific requirements:
- Clear readability and high contrast
- Consistent with game's visual theme
- Scalable design that works at different sizes
- Consider accessibility (color blind friendly)
- Modern and intuitive design patterns`
        break

      case 'prop':
        requirements = `
        
Prop-specific requirements:
- Clear purpose and function should be visually apparent
- Consistent with game world's technology and aesthetic
- Appropriate scale relative to characters
- Consider interaction states (normal, highlighted, activated)`
        break
    }

    return requirements
  }

  private mapArtStyleToAIStyle(artStyle: string): string {
    const styleMapping: { [key: string]: string } = {
      'pixel art': 'pixel art, 8-bit, retro game graphics, sharp pixels, limited color palette',
      'cartoon': 'cartoon illustration, cel-shaded, colorful, clean lines, stylized',
      'realistic': 'digital art, realistic rendering, detailed, high quality illustration',
      'minimalist': 'minimalist design, clean, simple, geometric, flat design',
      'fantasy': 'fantasy art, magical, detailed illustration, rich colors, atmospheric',
      'sci-fi': 'science fiction art, futuristic, technological, sleek design',
      'anime': 'anime art style, manga illustration, Japanese animation style',
      'hand-drawn': 'traditional art, hand-drawn illustration, organic lines, artistic'
    }

    return styleMapping[artStyle.toLowerCase()] || artStyle
  }

  private getAssetDimensions(assetRequest: AssetRequest): string {
    if (assetRequest.specifications?.dimensions) {
      return assetRequest.specifications.dimensions
    }

    // Default dimensions by asset type
    const defaultDimensions: { [key: string]: string } = {
      'character': '512x512',
      'background': '1024x768',
      'ui': '256x256',
      'prop': '256x256',
      'effect': '512x512',
      'tile': '128x128'
    }

    return defaultDimensions[assetRequest.type] || '512x512'
  }

  private parseDimensions(size: string): { width: number, height: number } {
    const [width, height] = size.split('x').map(Number)
    return { width: width || 512, height: height || 512 }
  }

  private sortAssetsByPriority(assets: AssetRequest[]): AssetRequest[] {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
    return [...assets].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }

  private extractColors(colorPalette: string): string[] {
    // Extract hex colors from the palette description
    const hexMatches = colorPalette.match(/#[0-9A-Fa-f]{6}/g)
    if (hexMatches) return hexMatches

    // Extract color names and convert to approximate hex values
    const colorNames = colorPalette.toLowerCase().match(/\b(red|blue|green|yellow|purple|orange|pink|brown|black|white|gray|grey)\b/g)
    if (colorNames) {
      const colorMap: { [key: string]: string } = {
        'red': '#FF0000',
        'blue': '#0000FF',
        'green': '#00FF00',
        'yellow': '#FFFF00',
        'purple': '#800080',
        'orange': '#FFA500',
        'pink': '#FFC0CB',
        'brown': '#8B4513',
        'black': '#000000',
        'white': '#FFFFFF',
        'gray': '#808080',
        'grey': '#808080'
      }
      return colorNames.map(color => colorMap[color]).filter(Boolean)
    }

    return ['#000000', '#FFFFFF'] // Default fallback colors
  }

  private extractPrimaryColors(colorPalette: string): string[] {
    const colors = this.extractColors(colorPalette)
    return colors.slice(0, 2) // Take first 2 as primary
  }

  private extractSecondaryColors(colorPalette: string): string[] {
    const colors = this.extractColors(colorPalette)
    return colors.slice(2, 4) // Take next 2 as secondary
  }

  private extractAccentColors(colorPalette: string): string[] {
    const colors = this.extractColors(colorPalette)
    return colors.slice(4, 6) // Take next 2 as accent
  }

  private selectPrimaryFont(artStyle: string): string {
    const fontMap: { [key: string]: string } = {
      'pixel art': 'monospace',
      'cartoon': 'Comic Sans MS, cursive',
      'realistic': 'Georgia, serif',
      'minimalist': 'Arial, sans-serif',
      'fantasy': 'Cinzel, serif',
      'sci-fi': 'Orbitron, monospace',
      'anime': 'Klee One, cursive',
      'hand-drawn': 'Patrick Hand, cursive'
    }

    return fontMap[artStyle.toLowerCase()] || 'Arial, sans-serif'
  }

  private selectSecondaryFont(artStyle: string): string {
    return 'Arial, sans-serif' // Simple fallback for secondary text
  }

  private selectUIFont(artStyle: string): string {
    return 'Arial, sans-serif' // UI should prioritize readability
  }

  private generateBackgroundGuidelines(request: VisualGenerationRequest): string {
    return `Create backgrounds that support the ${request.mood} mood and ${request.artStyle} style. Backgrounds should provide context for the game world while allowing foreground elements to remain clearly visible.`
  }

  private generateUIGuidelines(request: VisualGenerationRequest): string {
    return `Design UI elements that are clear, accessible, and consistent with the ${request.artStyle} aesthetic. Prioritize usability and readability for ${request.targetAudience} users.`
  }

  private generateEffectsGuidelines(request: VisualGenerationRequest): string {
    return `Create visual effects that enhance gameplay feedback and maintain the ${request.mood} atmosphere without overwhelming the core game visuals.`
  }

  private getColorConstraints(artStyle: string): number {
    const constraintMap: { [key: string]: number } = {
      'pixel art': 16,
      'minimalist': 5,
      'cartoon': 20,
      'realistic': 50
    }

    return constraintMap[artStyle.toLowerCase()] || 25
  }

  private getResolutionConstraints(targetAudience: string): string[] {
    if (targetAudience === 'children') {
      return ['1024x768', '1280x720'] // Simpler resolutions
    }
    return ['1920x1080', '2560x1440', '3840x2160'] // Full range
  }

  private getAccessibilityGuidelines(targetAudience: string): string[] {
    const guidelines = [
      'Ensure sufficient color contrast',
      'Avoid relying solely on color for information',
      'Use clear, readable fonts'
    ]

    if (targetAudience === 'children') {
      guidelines.push(
        'Use larger UI elements',
        'Provide clear visual feedback',
        'Minimize visual complexity'
      )
    }

    return guidelines
  }

  private formatColorPalette(palette: ColorPalette): string {
    const colors = [
      ...palette.primary,
      ...palette.secondary,
      ...palette.accent
    ].filter(Boolean).join(', ')
    
    return colors || 'vibrant and cohesive color scheme'
  }

  private generateAssetTags(gameRequest: VisualGenerationRequest, assetRequest: AssetRequest): string[] {
    const tags = [
      gameRequest.genre,
      gameRequest.artStyle,
      gameRequest.mood,
      assetRequest.type,
      gameRequest.targetAudience
    ]

    // Add specific tags based on asset type
    switch (assetRequest.type) {
      case 'character':
        tags.push('sprite', 'character', 'animated')
        break
      case 'background':
        tags.push('environment', 'scene', 'backdrop')
        break
      case 'ui':
        tags.push('interface', 'button', 'menu')
        break
      case 'prop':
        tags.push('object', 'item', 'interactive')
        break
    }

    return tags.filter(Boolean)
  }
}

// Supporting interfaces
export interface GameStyleGuide {
  id: string
  name: string
  artStyle: string
  colorPalette: ColorPalette
  typography: Typography
  guidelines: StyleGuidelines
  constraints: StyleConstraints
}

export interface ColorPalette {
  primary: string[]
  secondary: string[]
  accent: string[]
  neutral: string[]
}

export interface Typography {
  primary: string
  secondary: string
  ui: string
}

export interface StyleGuidelines {
  characterDesign: string
  backgroundStyle: string
  uiDesign: string
  effectsStyle: string
}

export interface StyleConstraints {
  maxColors: number
  resolution: string[]
  fileFormats: string[]
  accessibility: string[]
}
