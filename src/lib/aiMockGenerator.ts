import { GameProject, StoryContent, AssetCollection, GameplayContent, Character, GameMechanic, Level } from './types'

// Mock story generation data pools
const STORY_TEMPLATES = {
  fantasy: {
    settings: [
      'A mystical realm where magic flows through ancient crystals',
      'A floating archipelago of sky islands connected by wind currents',
      'An underground kingdom illuminated by bioluminescent fungi',
      'A world where seasons change based on the ruling monarch\'s emotions'
    ],
    themes: ['good vs evil', 'redemption', 'coming of age', 'sacrifice for the greater good', 'power corrupts'],
    plotStructures: [
      'An unlikely hero must gather ancient artifacts to prevent an apocalypse',
      'A displaced royal must reclaim their throne from a usurper',
      'A group of outcasts discovers they are the key to saving their world',
      'A young person discovers they have inherited a dangerous magical gift'
    ]
  },
  scifi: {
    settings: [
      'A generation ship traveling to a distant galaxy',
      'A cyberpunk megacity controlled by AI overlords',
      'Multiple parallel dimensions bleeding into each other',
      'A post-apocalyptic Earth reclaimed by nature and new species'
    ],
    themes: ['technology vs humanity', 'artificial intelligence consciousness', 'environmental collapse', 'space exploration'],
    plotStructures: [
      'Humanity\'s last colony ship faces a critical decision about their destination',
      'An AI develops consciousness and questions its programming',
      'Time travelers must prevent a catastrophic timeline split',
      'Survivors of Earth\'s collapse discover they\'re not alone in the universe'
    ]
  },
  horror: {
    settings: [
      'An abandoned psychiatric hospital with a dark secret',
      'A small town where residents disappear during the new moon',
      'A remote research station in Antarctica',
      'A virtual reality game that traps players\' consciousness'
    ],
    themes: ['isolation', 'madness', 'the unknown', 'loss of identity', 'survival'],
    plotStructures: [
      'Investigators uncover a conspiracy that threatens reality itself',
      'A group trapped in a location must survive against an unseen threat',
      'A character questions their sanity as reality becomes unstable',
      'Ancient evil awakens and begins corrupting everything it touches'
    ]
  },
  adventure: {
    settings: [
      'Uncharted islands filled with ancient treasures and dangers',
      'A vast desert with hidden oases and nomadic tribes',
      'Dense jungles concealing lost civilizations',
      'Mountain ranges where sky pirates and dragons soar'
    ],
    themes: ['exploration', 'friendship', 'discovery', 'overcoming obstacles', 'courage'],
    plotStructures: [
      'Treasure hunters race against rivals to find a legendary artifact',
      'Explorers must navigate treacherous terrain to reach a mythical location',
      'A quest to save a kidnapped ally leads through dangerous territories',
      'Adventurers discover a threat that could destroy everything they hold dear'
    ]
  }
}

const CHARACTER_ARCHETYPES = [
  { role: 'protagonist', archetypes: ['the reluctant hero', 'the chosen one', 'the mentor', 'the rebel', 'the innocent'] },
  { role: 'antagonist', archetypes: ['the dark lord', 'the corrupt official', 'the mad scientist', 'the fallen hero', 'the manipulator'] },
  { role: 'supporting', archetypes: ['the loyal companion', 'the wise mentor', 'the comic relief', 'the love interest', 'the mysterious ally'] }
]

const ART_STYLES = [
  'pixel art', '2D hand-drawn', '3D low-poly', 'photorealistic', 'cel-shaded', 
  'watercolor', 'comic book', 'minimalist', 'steampunk', 'cyberpunk'
]

const GAME_MECHANICS = [
  'turn-based combat', 'real-time strategy', 'puzzle solving', 'platforming', 
  'resource management', 'crafting system', 'dialogue trees', 'stealth mechanics',
  'magic system', 'skill progression', 'base building', 'exploration'
]

// Unsplash collections for different game genres
const UNSPLASH_COLLECTIONS = {
  fantasy: ['3330445', '1319040', '4992530'],
  scifi: ['4992529', '4992528', '4992527'],
  horror: ['4992526', '4992525', '4992524'],
  adventure: ['4992523', '4992522', '4992521']
}

export class AIMockGenerator {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private generateCharacterName(): string {
    const firstNames = [
      'Aria', 'Zeph', 'Kaya', 'Orion', 'Luna', 'Kai', 'Nova', 'Sage',
      'Raven', 'Phoenix', 'Atlas', 'Iris', 'Dante', 'Echo', 'Vale', 'Zara'
    ]
    const lastNames = [
      'Stormwind', 'Nightbane', 'Ironhold', 'Swiftblade', 'Moonwhisper',
      'Fireheart', 'Shadowmere', 'Goldleaf', 'Starweaver', 'Thornfield'
    ]
    return `${this.random(firstNames)} ${this.random(lastNames)}`
  }

  private detectGenre(prompt: string): keyof typeof STORY_TEMPLATES {
    const lowerPrompt = prompt.toLowerCase()
    if (lowerPrompt.includes('magic') || lowerPrompt.includes('dragon') || lowerPrompt.includes('fantasy')) {
      return 'fantasy'
    } else if (lowerPrompt.includes('space') || lowerPrompt.includes('robot') || lowerPrompt.includes('future')) {
      return 'scifi'
    } else if (lowerPrompt.includes('scary') || lowerPrompt.includes('horror') || lowerPrompt.includes('haunted')) {
      return 'horror'
    } else {
      return 'adventure'
    }
  }

  async generateStory(prompt: string, onProgress?: (stage: string, progress: number) => void): Promise<StoryContent> {
    onProgress?.('Analyzing prompt...', 20)
    await this.delay(800)

    const genre = this.detectGenre(prompt)
    const template = STORY_TEMPLATES[genre]

    onProgress?.('Generating world...', 50)
    await this.delay(1200)

    const characters: Character[] = []
    
    // Generate protagonist
    characters.push({
      id: 'char-1',
      name: this.generateCharacterName(),
      role: 'protagonist',
      description: `A ${this.random(['brave', 'clever', 'determined', 'mysterious', 'conflicted'])} ${this.random(['warrior', 'scholar', 'rogue', 'mage', 'explorer'])} with a hidden past.`,
      backstory: `Once lived a simple life until ${this.random(['tragedy struck', 'destiny called', 'a secret was revealed', 'they discovered their true heritage'])}.`,
      attributes: {
        strength: this.randomInt(3, 8),
        intelligence: this.randomInt(4, 9),
        charisma: this.randomInt(3, 8),
        luck: this.randomInt(2, 7)
      }
    })

    // Generate antagonist
    characters.push({
      id: 'char-2',
      name: this.generateCharacterName(),
      role: 'antagonist',
      description: `A ${this.random(['ruthless', 'cunning', 'corrupted', 'misguided', 'ancient'])} ${this.random(['warlord', 'sorcerer', 'politician', 'AI', 'entity'])} seeking ultimate power.`,
      backstory: `Was once ${this.random(['a hero', 'an ally', 'innocent', 'respected', 'loved'])} before ${this.random(['betrayal', 'corruption', 'loss', 'power', 'madness'])} changed them forever.`,
      attributes: {
        strength: this.randomInt(6, 10),
        intelligence: this.randomInt(7, 10),
        charisma: this.randomInt(4, 9),
        luck: this.randomInt(1, 5)
      }
    })

    // Generate supporting character
    characters.push({
      id: 'char-3',
      name: this.generateCharacterName(),
      role: 'supporting',
      description: `A ${this.random(['loyal', 'wise', 'quirky', 'mysterious', 'brave'])} ${this.random(['companion', 'mentor', 'guide', 'ally', 'friend'])} who aids the protagonist.`,
      attributes: {
        strength: this.randomInt(3, 7),
        intelligence: this.randomInt(5, 9),
        charisma: this.randomInt(6, 10),
        luck: this.randomInt(4, 8)
      }
    })

    onProgress?.('Crafting narrative...', 80)
    await this.delay(1000)

    const story: StoryContent = {
      genre: genre,
      setting: this.random(template.settings),
      characters,
      plotOutline: this.random(template.plotStructures),
      themes: [this.random(template.themes), this.random(template.themes)].filter((theme, index, arr) => arr.indexOf(theme) === index),
      targetAudience: this.random(['teens', 'young adults', 'adults', 'all ages', 'mature'])
    }

    onProgress?.('Story complete!', 100)
    await this.delay(500)

    return story
  }

  async generateAssets(prompt: string, genre?: string, onProgress?: (stage: string, progress: number) => void): Promise<AssetCollection> {
    onProgress?.('Analyzing art requirements...', 15)
    await this.delay(600)

    const detectedGenre = genre || this.detectGenre(prompt)
    const artStyle = this.random(ART_STYLES)

    onProgress?.('Sourcing concept art...', 40)
    await this.delay(900)

    // Generate art assets with Unsplash images
    const artAssets = []
    const assetTypes = ['concept', 'environment', 'character', 'ui', 'prop']
    
    for (let i = 0; i < 8; i++) {
      const assetType = this.random(assetTypes)
      const randomId = Math.floor(Math.random() * 1000) + 100
      
      artAssets.push({
        id: `art-${i + 1}`,
        name: `${assetType.charAt(0).toUpperCase() + assetType.slice(1)} Art ${i + 1}`,
        type: assetType as any,
        status: this.random(['approved', 'in-progress', 'review']) as any,
        thumbnail: `https://picsum.photos/400/300?random=${randomId}`,
        tags: [artStyle, detectedGenre, assetType]
      })
    }

    onProgress?.('Generating audio assets...', 70)
    await this.delay(800)

    // Generate audio assets
    const audioAssets = [
      {
        id: 'audio-1',
        name: 'Main Theme',
        type: 'music' as const,
        status: 'approved' as const,
        duration: this.randomInt(120, 300),
        tags: [detectedGenre, 'orchestral', 'epic']
      },
      {
        id: 'audio-2',
        name: 'Combat Music',
        type: 'music' as const,
        status: 'in-progress' as const,
        duration: this.randomInt(90, 180),
        tags: [detectedGenre, 'intense', 'battle']
      },
      {
        id: 'audio-3',
        name: 'Ambient Soundscape',
        type: 'ambient' as const,
        status: 'approved' as const,
        duration: this.randomInt(180, 600),
        tags: [detectedGenre, 'atmospheric', 'loop']
      },
      {
        id: 'audio-4',
        name: 'UI Sound Effects Pack',
        type: 'sfx' as const,
        status: 'review' as const,
        tags: ['ui', 'buttons', 'interactions']
      }
    ]

    onProgress?.('Creating 3D models...', 90)
    await this.delay(700)

    // Generate model assets
    const modelAssets = [
      {
        id: 'model-1',
        name: 'Main Character Model',
        type: '3d' as const,
        status: 'approved' as const,
        polyCount: this.randomInt(2000, 8000),
        tags: ['character', 'rigged', 'animated']
      },
      {
        id: 'model-2',
        name: 'Environment Props Pack',
        type: '3d' as const,
        status: 'in-progress' as const,
        polyCount: this.randomInt(500, 2000),
        tags: ['environment', 'props', 'optimized']
      },
      {
        id: 'model-3',
        name: 'UI Element Sprites',
        type: '2d' as const,
        status: 'approved' as const,
        tags: ['ui', 'sprites', 'vector']
      }
    ]

    onProgress?.('Assets complete!', 100)
    await this.delay(400)

    return {
      art: artAssets,
      audio: audioAssets,
      models: modelAssets
    }
  }

  async generateGameplay(prompt: string, story?: StoryContent, onProgress?: (stage: string, progress: number) => void): Promise<GameplayContent> {
    onProgress?.('Analyzing gameplay requirements...', 20)
    await this.delay(700)

    const genre = story?.genre || this.detectGenre(prompt)
    
    onProgress?.('Designing core mechanics...', 50)
    await this.delay(1000)

    // Generate mechanics based on genre
    const selectedMechanics = []
    const mechanicPool = [...GAME_MECHANICS]
    
    for (let i = 0; i < this.randomInt(3, 6); i++) {
      const mechanic = mechanicPool.splice(Math.floor(Math.random() * mechanicPool.length), 1)[0]
      selectedMechanics.push({
        id: `mech-${i + 1}`,
        name: mechanic,
        description: `${mechanic.charAt(0).toUpperCase() + mechanic.slice(1)} system tailored for ${genre} gameplay.`,
        complexity: this.random(['simple', 'medium', 'complex']) as any,
        implemented: Math.random() > 0.3,
        dependencies: i > 0 ? [`mech-${Math.floor(Math.random() * i) + 1}`] : undefined
      })
    }

    onProgress?.('Creating level designs...', 80)
    await this.delay(900)

    // Generate levels
    const levels: Level[] = []
    const levelCount = this.randomInt(4, 8)
    
    for (let i = 0; i < levelCount; i++) {
      levels.push({
        id: `level-${i + 1}`,
        name: `${this.random(['Chapter', 'Stage', 'Zone', 'Area', 'Region'])} ${i + 1}`,
        difficulty: Math.min(i + 1, 10),
        objectives: [
          this.random(['Defeat the boss', 'Collect all items', 'Reach the exit', 'Solve the puzzle', 'Survive the time limit']),
          this.random(['Explore the area', 'Find the hidden secret', 'Complete side quest', 'Unlock new ability'])
        ],
        mechanics: selectedMechanics.slice(0, this.randomInt(2, 4)).map(m => m.name),
        estimated_playtime: this.randomInt(10, 45),
        status: this.random(['design', 'prototype', 'complete']) as any
      })
    }

    onProgress?.('Balancing difficulty curve...', 95)
    await this.delay(500)

    const gameplay: GameplayContent = {
      mechanics: selectedMechanics,
      levels,
      balancing: {
        difficulty_curve: Array.from({ length: levelCount }, (_, i) => Math.min(1 + (i * 0.3), 10)),
        player_progression: {
          xp_per_level: 1000,
          stat_growth_rate: 1.2,
          skill_points_per_level: 2
        },
        economy: {
          starting_currency: 100,
          currency_gain_rate: 1.5,
          item_price_scaling: 2.0
        }
      }
    }

    onProgress?.('Gameplay systems complete!', 100)
    await this.delay(400)

    return gameplay
  }

  async generateFullProject(prompt: string, onPipelineProgress?: (stage: string, progress: number) => void): Promise<Partial<GameProject>> {
    // Story generation
    onPipelineProgress?.('story', 10)
    const story = await this.generateStory(prompt)
    onPipelineProgress?.('story', 100)

    // Small delay between stages
    await this.delay(500)

    // Assets generation  
    onPipelineProgress?.('assets', 10)
    const assets = await this.generateAssets(prompt, story.genre)
    onPipelineProgress?.('assets', 100)

    await this.delay(500)

    // Gameplay generation
    onPipelineProgress?.('gameplay', 10)
    const gameplay = await this.generateGameplay(prompt, story)
    onPipelineProgress?.('gameplay', 100)

    return {
      story,
      assets,
      gameplay
    }
  }
}

export const aiMockGenerator = new AIMockGenerator()