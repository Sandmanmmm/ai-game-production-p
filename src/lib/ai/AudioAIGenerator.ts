import { AIServiceManager, AudioGenerationRequest as AIAudioRequest } from './AIServiceManager'

export interface AudioAsset {
  id: string
  name: string
  type: 'music' | 'sfx' | 'voice' | 'ambient'
  description: string
  audioUrl: string
  metadata: {
    duration: number
    format: string
    bitrate?: number
    genre?: string
    mood: string
    tags: string[]
    loops: boolean
  }
}

export interface GameAudioGenerationRequest {
  gameTitle: string
  gameDescription: string
  genre: string
  mood: string
  targetAudience: string
  audioElements: {
    musicStyle?: string
    soundscape?: string
    voiceStyle?: string
    inspirations?: string
  }
  audioRequests: AudioAssetRequest[]
}

export interface AudioAssetRequest {
  type: 'music' | 'sfx' | 'voice' | 'ambient'
  name: string
  description: string
  duration?: number
  priority: 'high' | 'medium' | 'low'
  specifications?: {
    tempo?: number
    key?: string
    instruments?: string[]
    volume?: string
    style?: string
    loops?: boolean
    voiceText?: string
  }
}

export class AudioAIGenerator {
  private aiService: AIServiceManager

  constructor(aiService: AIServiceManager) {
    this.aiService = aiService
  }

  async generateGameAudio(request: GameAudioGenerationRequest): Promise<{
    assets: AudioAsset[]
    audioGuide: GameAudioGuide
    errors: string[]
  }> {
    const results = {
      assets: [] as AudioAsset[],
      audioGuide: this.createAudioGuide(request),
      errors: [] as string[]
    }

    // Sort requests by priority and generate
    const sortedRequests = this.sortAudioByPriority(request.audioRequests)

    for (const audioRequest of sortedRequests) {
      try {
        const asset = await this.generateSingleAudio(request, audioRequest, results.audioGuide)
        results.assets.push(asset)
      } catch (error) {
        results.errors.push(`Failed to generate ${audioRequest.name}: ${error}`)
        console.error(`Audio generation error:`, error)
      }
    }

    return results
  }

  async generateSingleAudio(
    gameRequest: GameAudioGenerationRequest,
    audioRequest: AudioAssetRequest,
    audioGuide: GameAudioGuide
  ): Promise<AudioAsset> {
    let generatedAsset: any

    switch (audioRequest.type) {
      case 'music':
        generatedAsset = await this.generateMusic(gameRequest, audioRequest, audioGuide)
        break
      case 'sfx':
        generatedAsset = await this.generateSoundEffect(gameRequest, audioRequest, audioGuide)
        break
      case 'voice':
        generatedAsset = await this.generateVoice(gameRequest, audioRequest, audioGuide)
        break
      case 'ambient':
        generatedAsset = await this.generateAmbient(gameRequest, audioRequest, audioGuide)
        break
      default:
        throw new Error(`Unknown audio type: ${audioRequest.type}`)
    }

    return {
      id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: audioRequest.name,
      type: audioRequest.type,
      description: audioRequest.description,
      audioUrl: generatedAsset.url || 'placeholder-url',
      metadata: {
        duration: audioRequest.duration || this.getDefaultDuration(audioRequest.type),
        format: generatedAsset.format || 'mp3',
        bitrate: generatedAsset.bitrate,
        genre: gameRequest.genre,
        mood: gameRequest.mood,
        tags: this.generateAudioTags(gameRequest, audioRequest),
        loops: audioRequest.specifications?.loops || this.shouldLoop(audioRequest.type)
      }
    }
  }

  private async generateMusic(
    gameRequest: GameAudioGenerationRequest,
    audioRequest: AudioAssetRequest,
    audioGuide: GameAudioGuide
  ) {
    const prompt = this.buildMusicPrompt(gameRequest, audioRequest, audioGuide)
    
    const request: AIAudioRequest = {
      text: prompt,
      style: this.mapMusicStyleToAI(gameRequest.audioElements.musicStyle || gameRequest.genre),
      format: 'mp3',
      duration: audioRequest.duration || this.getDefaultDuration('music')
    }

    const response = await this.aiService.generateAudio(request)

    if (!response.success || !response.data || !response.data[0]) {
      throw new Error(`Failed to generate music: ${response.error}`)
    }

    return response.data[0]
  }

  private async generateSoundEffect(
    gameRequest: GameAudioGenerationRequest,
    audioRequest: AudioAssetRequest,
    audioGuide: GameAudioGuide
  ) {
    const prompt = this.buildSFXPrompt(gameRequest, audioRequest, audioGuide)
    
    const request: AIAudioRequest = {
      text: prompt,
      style: 'sound effect',
      format: 'wav',
      duration: audioRequest.duration || this.getDefaultDuration('sfx')
    }

    const response = await this.aiService.generateAudio(request)

    if (!response.success || !response.data || !response.data[0]) {
      throw new Error(`Failed to generate sound effect: ${response.error}`)
    }

    return response.data[0]
  }

  private async generateVoice(
    gameRequest: GameAudioGenerationRequest,
    audioRequest: AudioAssetRequest,
    audioGuide: GameAudioGuide
  ) {
    const voiceText = audioRequest.specifications?.voiceText || audioRequest.description
    
    const request: AIAudioRequest = {
      text: voiceText,
      voice: this.selectVoiceType(gameRequest, audioRequest),
      format: 'mp3',
      duration: this.estimateVoiceDuration(voiceText)
    }

    const response = await this.aiService.generateAudio(request)

    if (!response.success || !response.data || !response.data[0]) {
      throw new Error(`Failed to generate voice: ${response.error}`)
    }

    return response.data[0]
  }

  private async generateAmbient(
    gameRequest: GameAudioGenerationRequest,
    audioRequest: AudioAssetRequest,
    audioGuide: GameAudioGuide
  ) {
    const prompt = this.buildAmbientPrompt(gameRequest, audioRequest, audioGuide)
    
    const request: AIAudioRequest = {
      text: prompt,
      style: 'ambient soundscape',
      format: 'ogg',
      duration: audioRequest.duration || this.getDefaultDuration('ambient')
    }

    const response = await this.aiService.generateAudio(request)

    if (!response.success || !response.data || !response.data[0]) {
      throw new Error(`Failed to generate ambient audio: ${response.error}`)
    }

    return response.data[0]
  }

  private createAudioGuide(request: GameAudioGenerationRequest): GameAudioGuide {
    return {
      id: `audio-guide-${Date.now()}`,
      name: `${request.gameTitle} Audio Guide`,
      musicStyle: request.audioElements.musicStyle || this.inferMusicStyle(request.genre),
      soundscape: request.audioElements.soundscape || this.inferSoundscape(request.genre),
      voiceDirection: this.createVoiceDirection(request),
      technicalSpecs: {
        sampleRate: 44100,
        bitDepth: 16,
        format: ['mp3', 'ogg', 'wav'],
        maxDuration: this.getMaxDuration(request.targetAudience),
        dynamicRange: this.getDynamicRange(request.mood)
      },
      guidelines: {
        music: this.createMusicGuidelines(request),
        sfx: this.createSFXGuidelines(request),
        voice: this.createVoiceGuidelines(request),
        ambient: this.createAmbientGuidelines(request)
      }
    }
  }

  // Prompt building methods
  private buildMusicPrompt(
    gameRequest: GameAudioGenerationRequest,
    audioRequest: AudioAssetRequest,
    audioGuide: GameAudioGuide
  ): string {
    let prompt = `Create ${audioRequest.name} music for the ${gameRequest.genre} game "${gameRequest.gameTitle}".

Track Description: ${audioRequest.description}
Music Style: ${gameRequest.audioElements.musicStyle || gameRequest.genre}
Mood: ${gameRequest.mood}
Target Audience: ${gameRequest.targetAudience}

Musical Requirements:`

    if (audioRequest.specifications?.tempo) {
      prompt += `\n- Tempo: ${audioRequest.specifications.tempo} BPM`
    }
    
    if (audioRequest.specifications?.key) {
      prompt += `\n- Key: ${audioRequest.specifications.key}`
    }
    
    if (audioRequest.specifications?.instruments) {
      prompt += `\n- Instruments: ${audioRequest.specifications.instruments.join(', ')}`
    }

    if (audioRequest.specifications?.loops) {
      prompt += `\n- Should loop seamlessly`
    }

    prompt += `\n\nContext: This music will be used in ${gameRequest.gameDescription}`
    
    return prompt
  }

  private buildSFXPrompt(
    gameRequest: GameAudioGenerationRequest,
    audioRequest: AudioAssetRequest,
    audioGuide: GameAudioGuide
  ): string {
    return `Create a ${audioRequest.name} sound effect for the ${gameRequest.genre} game "${gameRequest.gameTitle}".

Sound Description: ${audioRequest.description}
Game Context: ${gameRequest.gameDescription}
Audio Style: ${gameRequest.audioElements.soundscape || 'realistic'}
Mood: ${gameRequest.mood}

Sound Requirements:
- Clear and recognizable sound
- Appropriate for ${gameRequest.targetAudience} audience
- Should fit within ${gameRequest.mood} atmosphere
- Duration: ${audioRequest.duration || 'short (1-3 seconds)'} seconds

The sound should enhance gameplay feedback and be distinguishable from other game audio.`
  }

  private buildAmbientPrompt(
    gameRequest: GameAudioGenerationRequest,
    audioRequest: AudioAssetRequest,
    audioGuide: GameAudioGuide
  ): string {
    return `Create ambient soundscape "${audioRequest.name}" for the ${gameRequest.genre} game "${gameRequest.gameTitle}".

Ambience Description: ${audioRequest.description}
Setting: ${gameRequest.gameDescription}
Soundscape Style: ${gameRequest.audioElements.soundscape || 'immersive'}
Mood: ${gameRequest.mood}

Ambient Requirements:
- Subtle and non-intrusive background audio
- Should loop seamlessly
- Enhance the game atmosphere
- Appropriate for ${gameRequest.targetAudience}
- Duration: ${audioRequest.duration || '30-60'} seconds

Create a rich but subtle audio environment that supports the game's atmosphere.`
  }

  // Utility methods
  private mapMusicStyleToAI(style: string): string {
    const styleMapping: { [key: string]: string } = {
      'fantasy': 'orchestral fantasy music',
      'sci-fi': 'electronic futuristic music',
      'horror': 'dark atmospheric music',
      'adventure': 'epic adventure music',
      'puzzle': 'calm ambient music',
      'action': 'energetic dynamic music',
      'rpg': 'medieval fantasy music',
      'platformer': 'upbeat cheerful music'
    }

    return styleMapping[style.toLowerCase()] || style
  }

  private selectVoiceType(gameRequest: GameAudioGenerationRequest, audioRequest: AudioAssetRequest): string {
    if (gameRequest.targetAudience === 'children') {
      return 'friendly, clear voice'
    }
    
    if (gameRequest.genre.includes('fantasy')) {
      return 'narrative fantasy voice'
    }
    
    if (gameRequest.genre.includes('sci-fi')) {
      return 'futuristic voice'
    }

    return 'neutral clear voice'
  }

  private estimateVoiceDuration(text: string): number {
    // Rough estimate: 2.5 words per second for natural speech
    const wordCount = text.split(' ').length
    return Math.ceil(wordCount / 2.5)
  }

  private getDefaultDuration(type: string): number {
    const durations: { [key: string]: number } = {
      'music': 120,    // 2 minutes
      'sfx': 3,        // 3 seconds
      'voice': 5,      // 5 seconds (estimated)
      'ambient': 60    // 1 minute
    }

    return durations[type] || 10
  }

  private shouldLoop(type: string): boolean {
    return ['music', 'ambient'].includes(type)
  }

  private sortAudioByPriority(assets: AudioAssetRequest[]): AudioAssetRequest[] {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
    return [...assets].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }

  private generateAudioTags(gameRequest: GameAudioGenerationRequest, audioRequest: AudioAssetRequest): string[] {
    const tags = [
      gameRequest.genre,
      gameRequest.mood,
      audioRequest.type,
      gameRequest.targetAudience
    ]

    // Add audio-specific tags
    switch (audioRequest.type) {
      case 'music':
        tags.push('soundtrack', 'background')
        if (audioRequest.specifications?.loops) tags.push('looping')
        break
      case 'sfx':
        tags.push('sound-effect', 'feedback')
        break
      case 'voice':
        tags.push('narrator', 'dialogue')
        break
      case 'ambient':
        tags.push('atmosphere', 'background', 'looping')
        break
    }

    return tags.filter(Boolean)
  }

  private inferMusicStyle(genre: string): string {
    const styles: { [key: string]: string } = {
      'fantasy': 'orchestral with medieval instruments',
      'sci-fi': 'electronic and synthesized',
      'horror': 'dark and atmospheric',
      'puzzle': 'minimalist and ambient',
      'action': 'energetic and dynamic',
      'adventure': 'epic and uplifting'
    }

    return styles[genre.toLowerCase()] || 'adaptive to gameplay'
  }

  private inferSoundscape(genre: string): string {
    const soundscapes: { [key: string]: string } = {
      'fantasy': 'magical and mystical',
      'sci-fi': 'futuristic and technological',
      'horror': 'eerie and unsettling',
      'nature': 'organic and environmental',
      'urban': 'cityscape and modern'
    }

    return soundscapes[genre.toLowerCase()] || 'immersive and contextual'
  }

  private createVoiceDirection(request: GameAudioGenerationRequest): VoiceDirection {
    return {
      style: request.audioElements.voiceStyle || 'clear and engaging',
      pace: this.getVoicePace(request.targetAudience),
      tone: request.mood,
      accent: 'neutral',
      ageRange: this.getVoiceAgeRange(request.targetAudience)
    }
  }

  private getVoicePace(targetAudience: string): string {
    if (targetAudience === 'children') return 'slower and clear'
    if (targetAudience === 'teens') return 'energetic'
    return 'natural'
  }

  private getVoiceAgeRange(targetAudience: string): string {
    if (targetAudience === 'children') return 'young adult'
    if (targetAudience === 'teens') return 'young adult'
    if (targetAudience === 'adults') return 'adult'
    return 'adult'
  }

  private getMaxDuration(targetAudience: string): number {
    if (targetAudience === 'children') return 180 // 3 minutes max
    return 300 // 5 minutes max
  }

  private getDynamicRange(mood: string): string {
    if (mood === 'intense') return 'wide'
    if (mood === 'calm') return 'narrow'
    return 'moderate'
  }

  private createMusicGuidelines(request: GameAudioGenerationRequest): string {
    return `Create music that enhances the ${request.mood} atmosphere and supports ${request.genre} gameplay. Music should be memorable but not distracting, with appropriate complexity for ${request.targetAudience}.`
  }

  private createSFXGuidelines(request: GameAudioGenerationRequest): string {
    return `Design sound effects that provide clear audio feedback for player actions. Effects should be distinctive, appropriate for ${request.targetAudience}, and maintain consistency with the ${request.genre} setting.`
  }

  private createVoiceGuidelines(request: GameAudioGenerationRequest): string {
    return `Voice acting should be clear, engaging, and appropriate for ${request.targetAudience}. Maintain consistent character voices and deliver dialogue that supports the ${request.mood} tone.`
  }

  private createAmbientGuidelines(request: GameAudioGenerationRequest): string {
    return `Ambient audio should create immersive atmosphere while remaining subtle and non-intrusive. Sounds should support the ${request.genre} setting and ${request.mood} atmosphere.`
  }
}

// Supporting interfaces
export interface GameAudioGuide {
  id: string
  name: string
  musicStyle: string
  soundscape: string
  voiceDirection: VoiceDirection
  technicalSpecs: AudioTechnicalSpecs
  guidelines: AudioGuidelines
}

export interface VoiceDirection {
  style: string
  pace: string
  tone: string
  accent: string
  ageRange: string
}

export interface AudioTechnicalSpecs {
  sampleRate: number
  bitDepth: number
  format: string[]
  maxDuration: number
  dynamicRange: string
}

export interface AudioGuidelines {
  music: string
  sfx: string
  voice: string
  ambient: string
}
