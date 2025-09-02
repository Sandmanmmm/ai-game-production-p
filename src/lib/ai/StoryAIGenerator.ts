import { StoryLoreContent, StoryCharacter, StoryFaction, StoryChapter } from '../types'
import { AIServiceManager, TextGenerationRequest } from './AIServiceManager'

export interface StoryGenerationRequest {
  gameTitle: string
  gameDescription: string
  genre: string
  mood: string
  targetAudience: string
  complexity: 'simple' | 'medium' | 'complex'
  storyElements: {
    hasStory: boolean
    storyBrief?: string
    mainCharacter?: string
    setting?: string
    conflict?: string
  }
  inspirations?: string
  uniqueFeatures?: string
}

export class StoryAIGenerator {
  private aiService: AIServiceManager

  constructor(aiService: AIServiceManager) {
    this.aiService = aiService
  }

  async generateCompleteStory(request: StoryGenerationRequest): Promise<StoryLoreContent> {
    if (!request.storyElements.hasStory) {
      return this.createMinimalStory(request)
    }

    // Generate each component of the story
    const worldLore = await this.generateWorldLore(request)
    const mainStoryArc = await this.generateMainStoryArc(request)
    const characters = await this.generateCharacters(request)
    const factions = await this.generateFactions(request)
    const chapters = await this.generateChapters(request, mainStoryArc)
    const timeline = await this.generateTimeline(request)

    return {
      worldLore,
      mainStoryArc,
      characters,
      factions,
      subplots: [], // Can be enhanced later
      chapters,
      timeline,
      metadata: {
        genre: request.genre,
        targetAudience: request.targetAudience,
        complexity: request.complexity,
        estimatedLength: this.estimateStoryLength(request.complexity),
        themes: this.extractThemes(request),
        contentWarnings: this.generateContentWarnings(request)
      }
    }
  }

  private async generateWorldLore(request: StoryGenerationRequest) {
    const prompt = this.buildWorldLorePrompt(request)
    
    const response = await this.aiService.generateText({
      prompt,
      maxTokens: 1000,
      temperature: 0.7,
      systemMessage: "You are a creative world-building expert specializing in game narratives."
    })

    if (!response.success || !response.data) {
      throw new Error(`Failed to generate world lore: ${response.error}`)
    }

    // Parse the AI response into structured world lore
    return this.parseWorldLoreResponse(response.data, request)
  }

  private async generateMainStoryArc(request: StoryGenerationRequest) {
    const prompt = this.buildStoryArcPrompt(request)
    
    const response = await this.aiService.generateText({
      prompt,
      maxTokens: 1200,
      temperature: 0.6,
      systemMessage: "You are a narrative designer creating engaging game storylines."
    })

    if (!response.success || !response.data) {
      throw new Error(`Failed to generate story arc: ${response.error}`)
    }

    return this.parseStoryArcResponse(response.data, request)
  }

  private async generateCharacters(request: StoryGenerationRequest): Promise<StoryCharacter[]> {
    const prompt = this.buildCharactersPrompt(request)
    
    const response = await this.aiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.8,
      systemMessage: "You are a character development specialist creating memorable game characters."
    })

    if (!response.success || !response.data) {
      throw new Error(`Failed to generate characters: ${response.error}`)
    }

    return this.parseCharactersResponse(response.data, request)
  }

  private async generateFactions(request: StoryGenerationRequest): Promise<StoryFaction[]> {
    if (request.complexity === 'simple') {
      return [] // Simple games don't need factions
    }

    const prompt = this.buildFactionsPrompt(request)
    
    const response = await this.aiService.generateText({
      prompt,
      maxTokens: 800,
      temperature: 0.7,
      systemMessage: "You are designing organizations and groups for a game world."
    })

    if (!response.success || !response.data) {
      return [] // Non-critical, can be empty
    }

    return this.parseFactionsResponse(response.data, request)
  }

  private async generateChapters(request: StoryGenerationRequest, mainStoryArc: any): Promise<StoryChapter[]> {
    const chapterCount = this.getChapterCount(request.complexity)
    const chapters: StoryChapter[] = []

    for (let i = 0; i < chapterCount; i++) {
      const prompt = this.buildChapterPrompt(request, mainStoryArc, i + 1, chapterCount)
      
      const response = await this.aiService.generateText({
        prompt,
        maxTokens: 600,
        temperature: 0.6,
        systemMessage: "You are creating individual story chapters for a game."
      })

      if (response.success && response.data) {
        const chapter = this.parseChapterResponse(response.data, i + 1, request)
        chapters.push(chapter)
      }
    }

    return chapters
  }

  private async generateTimeline(request: StoryGenerationRequest) {
    const prompt = this.buildTimelinePrompt(request)
    
    const response = await this.aiService.generateText({
      prompt,
      maxTokens: 800,
      temperature: 0.5,
      systemMessage: "You are creating a chronological timeline for a game world."
    })

    if (!response.success || !response.data) {
      return [] // Timeline is optional
    }

    return this.parseTimelineResponse(response.data, request)
  }

  // Prompt building methods
  private buildWorldLorePrompt(request: StoryGenerationRequest): string {
    return `Create a detailed world setting for a ${request.genre} game called "${request.gameTitle}".

Game Description: ${request.gameDescription}

Setting Context: ${request.storyElements.setting || 'Create an appropriate setting'}
Mood/Tone: ${request.mood}
Target Audience: ${request.targetAudience}
Inspirations: ${request.inspirations || 'None specified'}

Please provide:
1. GEOGRAPHY: Describe the physical world, locations, and environments
2. POLITICS: Government systems, power structures, conflicts
3. CULTURE: Society, customs, traditions, beliefs
4. HISTORY: Important past events that shape the current world
5. TECHNOLOGY: Level of advancement, important inventions or discoveries
6. MAGIC/SPECIAL ELEMENTS: Supernatural or unique aspects of the world (if applicable)

Keep the content appropriate for ${request.targetAudience} and maintain a ${request.mood} tone throughout.`
  }

  private buildStoryArcPrompt(request: StoryGenerationRequest): string {
    return `Create a main story arc for the ${request.genre} game "${request.gameTitle}".

Game Description: ${request.gameDescription}
Story Brief: ${request.storyElements.storyBrief || 'Create an engaging main storyline'}
Main Character: ${request.storyElements.mainCharacter || 'Create a compelling protagonist'}
Main Conflict: ${request.storyElements.conflict || 'Design a central conflict'}

Story Complexity: ${request.complexity}
Unique Features: ${request.uniqueFeatures || 'None specified'}

Please create:
1. STORY TITLE: An engaging title for the main story
2. DESCRIPTION: A compelling 2-3 sentence summary
3. ACTS: Break the story into ${request.complexity === 'simple' ? '3' : request.complexity === 'medium' ? '4-5' : '6-8'} acts with clear progression
4. THEMES: 3-5 key themes that run throughout the story
5. TONE: Specify whether the story is dark, serious, balanced, light, or humorous

Ensure the story fits the ${request.mood} mood and is appropriate for ${request.targetAudience}.`
  }

  private buildCharactersPrompt(request: StoryGenerationRequest): string {
    const characterCount = request.complexity === 'simple' ? 3 : request.complexity === 'medium' ? 5 : 8
    
    return `Create ${characterCount} characters for the ${request.genre} game "${request.gameTitle}".

Game Context: ${request.gameDescription}
Main Character: ${request.storyElements.mainCharacter || 'Create a protagonist'}
Setting: ${request.storyElements.setting || 'Unknown setting'}

For each character, provide:
1. NAME: Memorable and fitting for the setting
2. ROLE: protagonist, antagonist, supporting, or npc
3. DESCRIPTION: Physical appearance and personality (2-3 sentences)
4. BACKSTORY: Important history that shapes their actions
5. MOTIVATION: What drives this character
6. CHARACTER ARC: How they change throughout the story
7. RELATIONSHIPS: How they relate to other characters

Include:
- 1 Protagonist (main playable character)
- ${request.complexity === 'simple' ? '1' : '1-2'} Antagonist(s)
- ${characterCount - 2} Supporting characters or important NPCs

Keep all characters appropriate for ${request.targetAudience} with ${request.mood} tone.`
  }

  private buildFactionsPrompt(request: StoryGenerationRequest): string {
    return `Create 2-4 factions/organizations for "${request.gameTitle}".

Game Setting: ${request.storyElements.setting}
Conflict: ${request.storyElements.conflict}
Genre: ${request.genre}

For each faction:
1. NAME: Memorable organization name
2. DESCRIPTION: Purpose and identity
3. GOALS: What they're trying to achieve
4. RESOURCES: What they control (territory, technology, etc.)
5. MEMBERS: Key figures or types of members
6. RELATIONSHIPS: How they interact with other factions

Make factions relevant to the main conflict and appropriate for ${request.targetAudience}.`
  }

  private buildChapterPrompt(request: StoryGenerationRequest, storyArc: any, chapterNum: number, totalChapters: number): string {
    return `Create Chapter ${chapterNum} of ${totalChapters} for "${request.gameTitle}".

Story Context: ${request.gameDescription}
Overall Arc: ${storyArc.description || 'Main storyline'}
Chapter Position: This is chapter ${chapterNum} of ${totalChapters}

For this chapter:
1. TITLE: Engaging chapter title
2. DESCRIPTION: What happens in this chapter (2-3 sentences)
3. CONTENT: Detailed chapter content (3-4 paragraphs)
4. OBJECTIVES: What the player/character must accomplish
5. CHARACTERS: Which characters are featured
6. LOCATIONS: Where the chapter takes place

Progress the story appropriately for a ${chapterNum === 1 ? 'beginning' : chapterNum === totalChapters ? 'conclusion' : 'middle'} chapter.`
  }

  private buildTimelinePrompt(request: StoryGenerationRequest): string {
    return `Create a chronological timeline of important events for "${request.gameTitle}".

Setting: ${request.storyElements.setting}
Time Period: Determine appropriate time spans for a ${request.genre} setting

Create 5-8 timeline events including:
1. ANCIENT HISTORY: Foundation events, origins
2. MAJOR CONFLICTS: Wars, disasters, turning points
3. RECENT HISTORY: Events leading to current situation
4. CURRENT EVENTS: What's happening when the game starts

For each event:
- DATE/TIME: When it occurred
- TITLE: Brief event name
- DESCRIPTION: What happened and why it matters
- CONSEQUENCES: How it affected the world

Keep events relevant to the main story and setting.`
  }

  // Response parsing methods
  private parseWorldLoreResponse(response: string, request: StoryGenerationRequest) {
    // In production, this would use more sophisticated parsing
    // For now, create a structured response from the AI text
    return {
      id: `world-${Date.now()}`,
      name: `${request.gameTitle} World`,
      geography: this.extractSection(response, 'GEOGRAPHY') || `The world of ${request.gameTitle} features diverse environments...`,
      politics: this.extractSection(response, 'POLITICS') || 'Complex political systems govern the world...',
      culture: this.extractSection(response, 'CULTURE') || 'Rich cultural traditions define the inhabitants...',
      history: this.extractSection(response, 'HISTORY') || 'Ancient events have shaped the current world...',
      technology: this.extractSection(response, 'TECHNOLOGY') || 'Technology level appropriate for the setting...',
      magic: this.extractSection(response, 'MAGIC') || request.genre.includes('fantasy') ? 'Magical elements permeate the world...' : 'No magical elements present...'
    }
  }

  private parseStoryArcResponse(response: string, request: StoryGenerationRequest) {
    return {
      id: `story-${Date.now()}`,
      title: this.extractSection(response, 'STORY TITLE') || request.gameTitle,
      description: this.extractSection(response, 'DESCRIPTION') || request.gameDescription,
      acts: this.parseActs(response) || [],
      themes: this.parseThemes(response) || this.extractThemes(request),
      tone: this.extractTone(response) || request.mood as any
    }
  }

  private parseCharactersResponse(response: string, request: StoryGenerationRequest): StoryCharacter[] {
    // Simplified parsing - in production would be more sophisticated
    const characters: StoryCharacter[] = []
    const sections = response.split(/Character \d+:/i).slice(1)
    
    sections.forEach((section, index) => {
      const character: StoryCharacter = {
        id: `char-${Date.now()}-${index}`,
        name: this.extractName(section) || `Character ${index + 1}`,
        role: this.extractRole(section) || (index === 0 ? 'protagonist' : 'supporting'),
        description: this.extractDescription(section) || 'A mysterious character...',
        backstory: this.extractBackstory(section),
        motivation: this.extractMotivation(section),
        arc: this.extractArc(section),
        relationships: [],
        traits: {
          courage: Math.floor(Math.random() * 10) + 1,
          intelligence: Math.floor(Math.random() * 10) + 1,
          charisma: Math.floor(Math.random() * 10) + 1,
          loyalty: Math.floor(Math.random() * 10) + 1,
          ambition: Math.floor(Math.random() * 10) + 1,
          empathy: Math.floor(Math.random() * 10) + 1
        }
      }
      characters.push(character)
    })

    return characters
  }

  private parseFactionsResponse(response: string, request: StoryGenerationRequest): StoryFaction[] {
    const factions: StoryFaction[] = []
    // Simplified parsing implementation
    return factions
  }

  private parseChapterResponse(response: string, chapterNum: number, request: StoryGenerationRequest): StoryChapter {
    return {
      id: `chapter-${chapterNum}`,
      title: this.extractSection(response, 'TITLE') || `Chapter ${chapterNum}`,
      description: this.extractSection(response, 'DESCRIPTION') || 'An exciting chapter...',
      content: this.extractSection(response, 'CONTENT') || response.substring(0, 500),
      order: chapterNum,
      status: 'complete' as const,
      characters: this.extractCharacterList(response) || [],
      locations: this.extractLocationList(response) || [],
      objectives: this.extractObjectiveList(response) || []
    }
  }

  private parseTimelineResponse(response: string, request: StoryGenerationRequest) {
    // Simplified timeline parsing
    return []
  }

  // Utility methods
  private createMinimalStory(request: StoryGenerationRequest): StoryLoreContent {
    // For games without story focus, create minimal story elements
    return {
      worldLore: {
        id: 'minimal-world',
        name: `${request.gameTitle} Setting`,
        geography: 'Game environment',
        politics: 'Simple structure',
        culture: 'Game culture',
        history: 'Minimal background',
        technology: 'Appropriate tech level',
        magic: 'No special elements'
      },
      mainStoryArc: {
        id: 'minimal-arc',
        title: request.gameTitle,
        description: request.gameDescription,
        acts: [],
        themes: ['gameplay', 'challenge'],
        tone: 'balanced' as const
      },
      characters: [],
      factions: [],
      subplots: [],
      chapters: [],
      timeline: [],
      metadata: {
        genre: request.genre,
        targetAudience: request.targetAudience,
        complexity: 'simple' as const,
        estimatedLength: 'short' as const,
        themes: ['gameplay-focused'],
        contentWarnings: []
      }
    }
  }

  private estimateStoryLength(complexity: string): 'short' | 'medium' | 'long' | 'epic' {
    switch (complexity) {
      case 'simple': return 'short'
      case 'medium': return 'medium'
      case 'complex': return 'long'
      default: return 'medium'
    }
  }

  private extractThemes(request: StoryGenerationRequest): string[] {
    const themes: string[] = []
    if (request.genre.includes('fantasy')) themes.push('magic', 'adventure')
    if (request.genre.includes('sci-fi')) themes.push('technology', 'future')
    if (request.mood === 'dark') themes.push('conflict', 'struggle')
    if (request.mood === 'lighthearted') themes.push('friendship', 'discovery')
    return themes.length > 0 ? themes : ['adventure', 'challenge']
  }

  private generateContentWarnings(request: StoryGenerationRequest): string[] {
    const warnings: string[] = []
    if (request.mood === 'dark') warnings.push('Dark themes')
    if (request.genre.includes('horror')) warnings.push('Scary content')
    if (request.targetAudience === 'adults') warnings.push('Mature themes')
    return warnings
  }

  private getChapterCount(complexity: string): number {
    switch (complexity) {
      case 'simple': return 3
      case 'medium': return 5
      case 'complex': return 8
      default: return 5
    }
  }

  // Text extraction utility methods
  private extractSection(text: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}:?\\s*([^\\n]*(?:\\n(?!\\d+\\.|[A-Z]+:)[^\\n]*)*)`, 'i')
    const match = text.match(regex)
    return match ? match[1].trim() : null
  }

  private extractName(text: string): string | null {
    const match = text.match(/NAME:?\s*([^\n]+)/i)
    return match ? match[1].trim() : null
  }

  private extractRole(text: string): 'protagonist' | 'antagonist' | 'supporting' | 'npc' | null {
    const match = text.match(/ROLE:?\s*([^\n]+)/i)
    if (!match) return null
    
    const role = match[1].toLowerCase()
    if (role.includes('protagonist') || role.includes('hero')) return 'protagonist'
    if (role.includes('antagonist') || role.includes('villain')) return 'antagonist'
    if (role.includes('supporting')) return 'supporting'
    return 'npc'
  }

  private extractDescription(text: string): string | null {
    const match = text.match(/DESCRIPTION:?\s*([^\\n]*(?:\\n(?![A-Z]+:)[^\\n]*)*)/i)
    return match ? match[1].trim() : null
  }

  private extractBackstory(text: string): string | undefined {
    const match = text.match(/BACKSTORY:?\s*([^\\n]*(?:\\n(?![A-Z]+:)[^\\n]*)*)/i)
    return match ? match[1].trim() : undefined
  }

  private extractMotivation(text: string): string | undefined {
    const match = text.match(/MOTIVATION:?\s*([^\\n]*(?:\\n(?![A-Z]+:)[^\\n]*)*)/i)
    return match ? match[1].trim() : undefined
  }

  private extractArc(text: string): string | undefined {
    const match = text.match(/ARC:?\s*([^\\n]*(?:\\n(?![A-Z]+:)[^\\n]*)*)/i)
    return match ? match[1].trim() : undefined
  }

  private parseActs(text: string): any[] {
    // Simplified acts parsing
    return []
  }

  private parseThemes(text: string): string[] {
    const match = text.match(/THEMES:?\s*([^\\n]+)/i)
    if (!match) return []
    
    return match[1].split(',').map(theme => theme.trim())
  }

  private extractTone(text: string): string {
    const match = text.match(/TONE:?\s*([^\\n]+)/i)
    return match ? match[1].trim().toLowerCase() : 'balanced'
  }

  private extractCharacterList(text: string): string[] {
    const match = text.match(/CHARACTERS:?\s*([^\\n]+)/i)
    return match ? match[1].split(',').map(char => char.trim()) : []
  }

  private extractLocationList(text: string): string[] {
    const match = text.match(/LOCATIONS:?\s*([^\\n]+)/i)
    return match ? match[1].split(',').map(loc => loc.trim()) : []
  }

  private extractObjectiveList(text: string): string[] {
    const match = text.match(/OBJECTIVES:?\s*([^\\n]*(?:\\n(?![A-Z]+:)[^\\n]*)*)/i)
    if (!match) return []
    
    return match[1].split(/\\n|\\./).map(obj => obj.trim()).filter(obj => obj.length > 0)
  }
}
