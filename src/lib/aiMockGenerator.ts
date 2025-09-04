import { GameProject, StoryLoreContent, AssetCollection, GameplayContent, QAContent, Character, GameMechanic, Level } from './types'

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

  async generateStory(prompt: string, onProgress?: (stage: string, progress: number) => void): Promise<StoryLoreContent> {
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

    const story: StoryLoreContent = {
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

  async generateGameplay(prompt: string, story?: StoryLoreContent, onProgress?: (stage: string, progress: number) => void): Promise<GameplayContent> {
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

  async generateQA(prompt: string, gameplay?: GameplayContent, onProgress?: (stage: string, progress: number) => void): Promise<QAContent> {
    onProgress?.('Initializing QA systems...', 20)
    await this.delay(800)

    onProgress?.('Running automated tests...', 50)
    await this.delay(1200)

    onProgress?.('Generating test scenarios...', 80)
    await this.delay(1000)

    // Generate test plans
    const testPlans = [
      {
        id: 'test-functional',
        name: 'Functional Testing',
        type: 'functional' as const,
        status: 'complete' as const,
        testCases: [
          {
            id: 'tc-1',
            description: 'Player movement and controls',
            steps: ['Start game', 'Use movement controls', 'Test all directions'],
            expected: 'Player moves smoothly without lag',
            status: 'pass' as const
          },
          {
            id: 'tc-2', 
            description: 'Game progression system',
            steps: ['Complete first level', 'Check XP gain', 'Verify level unlock'],
            expected: 'Player progresses correctly through levels',
            status: 'pass' as const
          }
        ]
      },
      {
        id: 'test-performance',
        name: 'Performance Testing',
        type: 'performance' as const,
        status: 'in-progress' as const,
        testCases: [
          {
            id: 'tc-3',
            description: 'Frame rate stability',
            steps: ['Run game for 30 minutes', 'Monitor FPS', 'Check for drops'],
            expected: 'Consistent 60 FPS on target hardware',
            status: 'pending' as const
          }
        ]
      }
    ]

    // Generate bugs
    const bugs = [
      {
        id: 'bug-1',
        title: 'Audio cutting out in level 3',
        severity: 'medium' as const,
        status: 'open' as const,
        description: 'Background music stops playing randomly in level 3',
        steps: ['Load level 3', 'Play for 2-3 minutes', 'Audio stops'],
        assignee: 'Audio Team'
      },
      {
        id: 'bug-2',
        title: 'Minor UI text overlap on mobile',
        severity: 'low' as const,
        status: 'in-progress' as const,
        description: 'Score text overlaps with health bar on smaller screens',
        steps: ['Launch on mobile device', 'Check UI alignment'],
        assignee: 'UI Team'
      }
    ]

    // Generate metrics
    const metrics = {
      test_coverage: this.randomInt(85, 95),
      bug_count: bugs.length,
      resolved_bugs: 0,
      performance_score: this.randomInt(7, 9) / 10 * 100
    }

    onProgress?.('QA analysis complete!', 100)
    await this.delay(500)

    return {
      testPlans,
      bugs,
      metrics
    }
  }

  async generateFullProject(
    prompt: string, 
    onPipelineProgress?: (stage: string, progress: number) => void,
    onQAReady?: (content?: Partial<GameProject>) => boolean
  ): Promise<Partial<GameProject>> {
    let generatedContent: Partial<GameProject> = {}

    // Story generation
    onPipelineProgress?.('story', 10)
    const story = await this.generateStory(prompt)
    generatedContent.story = story
    onPipelineProgress?.('story', 100)

    // Small delay between stages
    await this.delay(500)

    // Assets generation  
    onPipelineProgress?.('assets', 10)
    const assets = await this.generateAssets(prompt, story.genre)
    generatedContent.assets = assets
    onPipelineProgress?.('assets', 100)

    await this.delay(500)

    // Gameplay generation
    onPipelineProgress?.('gameplay', 10)
    const gameplay = await this.generateGameplay(prompt, story)
    generatedContent.gameplay = gameplay
    onPipelineProgress?.('gameplay', 100)

    await this.delay(500)

    // QA generation
    onPipelineProgress?.('qa', 10)
    const qa = await this.generateQA(prompt, gameplay)
    generatedContent.qa = qa
    onPipelineProgress?.('qa', 100)

    // Trigger QA workspace after QA stage completion
    if (onQAReady) {
      console.log('🔬 AI Generator: QA stage complete, triggering QA Ready callback...')
      await this.delay(800) // Brief pause to show completion
      const qaHandled = onQAReady(generatedContent)
      if (qaHandled) {
        console.log('🔬 AI Generator: QA workspace opened, not returning content')
        return {} // Don't return content since QA workspace was opened
      }
    } else {
      console.log('🔬 AI Generator: QA stage complete but no callback provided')
    }

    return generatedContent
  }
}

export const aiMockGenerator = new AIMockGenerator()

// Story & Lore Content Generator
export async function generateStoryContent(prompt: string, genre: string = 'adventure') {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500))
  
  const storyTemplates = STORY_TEMPLATES[genre as keyof typeof STORY_TEMPLATES] || STORY_TEMPLATES.adventure
  
  const mockStoryContent = {
    worldLore: {
      id: 'world-' + Date.now(),
      name: `${genre.charAt(0).toUpperCase() + genre.slice(1)} World`,
      geography: storyTemplates.settings[Math.floor(Math.random() * storyTemplates.settings.length)],
      politics: generatePoliticalSystem(genre),
      culture: generateCulture(genre),
      history: generateHistory(genre),
      technology: generateTechnology(genre),
      magic: genre === 'fantasy' ? generateMagicSystem() : ''
    },
    mainStoryArc: {
      id: 'arc-main',
      title: 'The Main Quest',
      description: storyTemplates.plotStructures[Math.floor(Math.random() * storyTemplates.plotStructures.length)],
      acts: generateStoryActs(),
      themes: storyTemplates.themes.slice(0, 2 + Math.floor(Math.random() * 2)),
      tone: ['dark', 'serious', 'balanced', 'light'][Math.floor(Math.random() * 4)] as any
    },
    chapters: generateChapters(3 + Math.floor(Math.random() * 5)),
    characters: generateStoryCharacters(genre),
    factions: generateFactions(genre),
    subplots: generateSubplots(),
    timeline: generateTimeline(),
    metadata: {
      genre,
      targetAudience: 'general',
      complexity: ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)] as any,
      estimatedLength: ['short', 'medium', 'long'][Math.floor(Math.random() * 3)] as any,
      themes: storyTemplates.themes.slice(0, 3),
      contentWarnings: genre === 'horror' ? ['violence', 'disturbing themes'] : []
    }
  }
  
  return mockStoryContent
}

function generatePoliticalSystem(genre: string): string {
  const systems = {
    fantasy: ['A feudal system ruled by noble houses', 'A theocracy guided by ancient prophecies', 'A magical council of archmages'],
    scifi: ['A corporate technocracy', 'A post-scarcity democracy', 'An AI-assisted meritocracy'],
    horror: ['A corrupt small-town government', 'A secretive organization pulling the strings', 'Anarchy after societal collapse'],
    adventure: ['A republic of explorers', 'Nomadic tribes with rotating leadership', 'A confederation of city-states']
  }
  const systemArray = systems[genre as keyof typeof systems] || systems.adventure
  return systemArray[Math.floor(Math.random() * systemArray.length)]
}

function generateCulture(genre: string): string {
  const cultures = {
    fantasy: ['Honor-bound warriors who value bravery above all', 'Scholarly mages who preserve ancient knowledge', 'Nature-worshiping druids living in harmony'],
    scifi: ['Cybernetic-enhanced humans exploring identity', 'Space-born generations who never knew planets', 'Gene-modified colonists adapted to harsh environments'],
    horror: ['Isolated communities with dark traditions', 'Urban dwellers disconnected from nature', 'Survivors clinging to pre-catastrophe customs'],
    adventure: ['Treasure-seeking explorers and merchants', 'Nomadic peoples following seasonal migrations', 'Coastal civilizations master of sea and storm']
  }
  const cultureArray = cultures[genre as keyof typeof cultures] || cultures.adventure
  return cultureArray[Math.floor(Math.random() * cultureArray.length)]
}

function generateHistory(genre: string): string {
  const histories = {
    fantasy: ['The Great War of the Five Kingdoms ended in magical catastrophe', 'Dragons once ruled before the Age of Heroes began', 'Ancient artifacts still hold the power of lost civilizations'],
    scifi: ['The Singularity changed humanity forever', 'First contact with aliens reshaped society', 'The Climate Wars drove humanity to the stars'],
    horror: ['The Event that no one speaks about anymore', 'Experiments that should never have been conducted', 'Ancient evils that were never truly vanquished'],
    adventure: ['The Golden Age of exploration and discovery', 'The Great Expedition that opened new frontiers', 'Lost civilizations waiting to be rediscovered']
  }
  const historyArray = histories[genre as keyof typeof histories] || histories.adventure
  return historyArray[Math.floor(Math.random() * historyArray.length)]
}

function generateTechnology(genre: string): string {
  const tech = {
    fantasy: ['Magical crystals power ancient technologies', 'Enchanted items blend magic with craftsmanship', 'Alchemical innovations rival modern science'],
    scifi: ['Faster-than-light travel through quantum tunneling', 'Neural interfaces for direct mind-machine connection', 'Nanotechnology reshapes matter at will'],
    horror: ['Forbidden technologies with terrible costs', 'Experimental devices that breach reality', 'Ancient knowledge that should stay buried'],
    adventure: ['Ingenious mechanical contraptions and gadgets', 'Sailing ships capable of extraordinary journeys', 'Maps and navigation tools for unknown territories']
  }
  const techArray = tech[genre as keyof typeof tech] || tech.adventure
  return techArray[Math.floor(Math.random() * techArray.length)]
}

function generateMagicSystem(): string {
  const systems = [
    'Magic flows through ley lines connecting sacred sites',
    'Spellcasters must sacrifice memories to cast spells',
    'Magic is tied to emotions and mental state',
    'Elemental magic requires physical gestures and words',
    'Magic can only be used during certain celestial alignments'
  ]
  return systems[Math.floor(Math.random() * systems.length)]
}

function generateStoryActs() {
  return [
    { id: 'act1', name: 'The Call to Adventure', description: 'The hero\'s journey begins with an inciting incident', chapters: [], climax: 'The point of no return' },
    { id: 'act2', name: 'The Conflict Rises', description: 'Challenges intensify as stakes are raised', chapters: [], climax: 'The darkest moment' },
    { id: 'act3', name: 'Resolution', description: 'The final confrontation and its aftermath', chapters: [], climax: 'The climactic battle' }
  ]
}

function generateChapters(count: number) {
  const chapters = []
  for (let i = 0; i < count; i++) {
    chapters.push({
      id: `chapter-${i + 1}`,
      title: `Chapter ${i + 1}`,
      description: `An important part of the story unfolds`,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      order: i + 1,
      status: 'draft' as const,
      characters: [],
      locations: [],
      objectives: [`Complete objective ${i + 1}`]
    })
  }
  return chapters
}

function generateStoryCharacters(genre: string) {
  const names = {
    fantasy: ['Thorin', 'Lyra', 'Gareth', 'Elara', 'Magnus'],
    scifi: ['Zara', 'Kai', 'Nova', 'Atlas', 'Vex'],
    horror: ['Sarah', 'Marcus', 'Elena', 'David', 'Amy'],
    adventure: ['Jake', 'Maya', 'Diego', 'Aria', 'Rex']
  }
  
  const characterNames = names[genre as keyof typeof names] || names.adventure
  
  return [
    {
      id: 'char-1',
      name: characterNames[0],
      role: 'protagonist' as const,
      description: 'A brave hero with a mysterious past',
      backstory: 'Born in humble circumstances, destined for greatness',
      motivation: 'To protect those they care about',
      arc: 'From inexperienced to legendary hero',
      relationships: [],
      traits: {
        courage: 85,
        intelligence: 70,
        charisma: 60,
        loyalty: 90,
        ambition: 75,
        empathy: 80
      }
    },
    {
      id: 'char-2', 
      name: characterNames[1],
      role: 'supporting' as const,
      description: 'A loyal companion with unique skills',
      backstory: 'A trusted ally from the hero\'s past',
      relationships: [],
      traits: {
        courage: 70,
        intelligence: 85,
        charisma: 75,
        loyalty: 95,
        ambition: 50,
        empathy: 85
      }
    },
    {
      id: 'char-3',
      name: characterNames[2],
      role: 'antagonist' as const,
      description: 'A formidable foe with complex motivations',
      backstory: 'Once a hero, now corrupted by power',
      relationships: [],
      traits: {
        courage: 90,
        intelligence: 95,
        charisma: 85,
        loyalty: 30,
        ambition: 95,
        empathy: 20
      }
    }
  ]
}

function generateFactions(genre: string) {
  const factionNames = {
    fantasy: ['The Silver Order', 'Shadowmere Guild', 'The Iron Throne'],
    scifi: ['Stellar Federation', 'The Syndicate', 'Neo-Terra Alliance'],
    horror: ['The Cult of Shadows', 'Survivors United', 'The Corporation'],
    adventure: ['Explorers Guild', 'The Merchant Union', 'Sky Pirates']
  }
  
  const names = factionNames[genre as keyof typeof factionNames] || factionNames.adventure
  
  return [
    {
      id: 'faction-1',
      name: names[0],
      description: 'A noble organization fighting for justice',
      goals: ['Protect the innocent', 'Maintain order', 'Preserve ancient knowledge'],
      resources: ['Trained warriors', 'Sacred artifacts', 'Political influence'],
      members: ['char-1'],
      relationships: [],
      power: 75,
      influence: ['Military', 'Religious']
    },
    {
      id: 'faction-2',
      name: names[1],
      description: 'A secretive group with hidden agendas',
      goals: ['Accumulate power', 'Control information', 'Eliminate rivals'],
      resources: ['Spy network', 'Dark magic', 'Forbidden knowledge'],
      members: ['char-3'],
      relationships: [],
      power: 60,
      influence: ['Underground', 'Economic']
    }
  ]
}

function generateSubplots() {
  return [
    {
      id: 'subplot-1',
      title: 'The Lost Artifact',
      description: 'A powerful item from the past holds the key to victory',
      characters: ['char-1', 'char-2'],
      resolution: 'The artifact is found but at great cost',
      impact: 'major' as const,
      status: 'planned' as const
    },
    {
      id: 'subplot-2',
      title: 'Unlikely Alliance', 
      description: 'Former enemies must work together',
      characters: ['char-2', 'char-3'],
      impact: 'moderate' as const,
      status: 'active' as const
    }
  ]
}

function generateTimeline() {
  return [
    {
      id: 'event-1',
      title: 'The Ancient War',
      description: 'A great conflict that shaped the current world',
      date: '1000 years ago',
      type: 'backstory' as const,
      consequences: ['Current political structure', 'Ancient ruins scattered across the land']
    },
    {
      id: 'event-2',
      title: 'The Hero\'s Birth',
      description: 'The protagonist enters the world',
      date: '20 years ago',
      type: 'backstory' as const,
      characters: ['char-1']
    },
    {
      id: 'event-3',
      title: 'The Inciting Incident',
      description: 'The event that begins the main story',
      date: 'Present day',
      type: 'main-story' as const,
      characters: ['char-1', 'char-2'],
      consequences: ['The hero\'s journey begins']
    }
  ]
}

// Asset Generation Function
export async function generateAssets(params: { 
  prompt: string, 
  type: 'art' | 'audio' | 'model' | 'ui', 
  category: string, 
  style?: string, 
  resolution?: string, 
  format?: string 
}) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000))
  
  const assetId = `${params.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const timestamp = new Date().toISOString()
  
  if (params.type === 'art') {
    return [{
      id: assetId,
      name: generateAssetName(params.prompt, params.type),
      type: params.category,
      category: params.category,
      status: 'approved' as const,
      src: '/api/placeholder/512/512',
      thumbnail: '/api/placeholder/256/256',
      prompt: params.prompt,
      style: params.style || 'realistic',
      resolution: params.resolution || '512x512',
      format: params.format || 'png',
      tags: generateAssetTags(params.prompt, params.type),
      variations: [],
      linkedTo: [],
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        usageCount: 0,
        collections: [],
        quality: ['good', 'excellent'][Math.floor(Math.random() * 2)] as 'good' | 'excellent',
        aiGenerated: true,
        originalPrompt: params.prompt
      }
    }]
  } else if (params.type === 'audio') {
    return [{
      id: assetId,
      name: generateAssetName(params.prompt, params.type),
      type: params.category,
      category: params.category,
      status: 'approved' as const,
      src: '/api/placeholder-audio/generated.mp3',
      duration: 60 + Math.random() * 180,
      prompt: params.prompt,
      style: params.style || 'cinematic',
      bpm: 120 + Math.floor(Math.random() * 80),
      key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)] + ['', 'm'][Math.floor(Math.random() * 2)],
      tags: generateAssetTags(params.prompt, params.type),
      variations: [],
      linkedTo: [],
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        usageCount: 0,
        collections: [],
        quality: ['good', 'excellent'][Math.floor(Math.random() * 2)] as 'good' | 'excellent',
        aiGenerated: true,
        originalPrompt: params.prompt
      }
    }]
  } else if (params.type === 'model') {
    return [{
      id: assetId,
      name: generateAssetName(params.prompt, params.type),
      type: params.category,
      category: params.category,
      status: 'approved' as const,
      src: '/api/placeholder-model/generated.obj',
      thumbnail: '/api/placeholder/256/256',
      polyCount: 1000 + Math.floor(Math.random() * 9000),
      prompt: params.prompt,
      style: params.style || 'stylized',
      format: 'obj',
      tags: generateAssetTags(params.prompt, params.type),
      variations: [],
      linkedTo: [],
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        usageCount: 0,
        collections: [],
        quality: ['good', 'excellent'][Math.floor(Math.random() * 2)] as 'good' | 'excellent',
        aiGenerated: true,
        originalPrompt: params.prompt
      }
    }]
  } else { // ui
    return [{
      id: assetId,
      name: generateAssetName(params.prompt, params.type),
      type: params.category,
      category: params.category,
      status: 'approved' as const,
      src: '/api/placeholder/256/256',
      thumbnail: '/api/placeholder/128/128',
      prompt: params.prompt,
      style: params.style || 'modern',
      resolution: params.resolution || '256x256',
      format: params.format || 'png',
      tags: generateAssetTags(params.prompt, params.type),
      variations: [],
      linkedTo: [],
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        usageCount: 0,
        collections: [],
        quality: ['good', 'excellent'][Math.floor(Math.random() * 2)] as 'good' | 'excellent',
        aiGenerated: true,
        originalPrompt: params.prompt
      }
    }]
  }
}

function generateAssetName(prompt: string, type: string): string {
  const words = prompt.split(' ').filter(w => w.length > 2).slice(0, 3)
  const baseName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  
  const typeNames = {
    art: ['Artwork', 'Illustration', 'Concept', 'Visual'],
    audio: ['Track', 'Theme', 'Sound', 'Music'],
    model: ['Model', 'Asset', 'Object', '3D Asset'],
    ui: ['Icon', 'Interface', 'UI Element', 'Button']
  }
  
  const suffix = typeNames[type as keyof typeof typeNames]?.[Math.floor(Math.random() * 4)] || 'Asset'
  return baseName ? `${baseName} ${suffix}` : `Generated ${suffix}`
}

function generateAssetTags(prompt: string, type: string): string[] {
  const promptWords = prompt.toLowerCase().split(' ').filter(w => w.length > 2)
  const baseTags = promptWords.slice(0, 3)
  
  const typeTags = {
    art: ['artwork', 'visual', 'illustration'],
    audio: ['audio', 'sound', 'music'],
    model: ['3d', 'model', 'object'],
    ui: ['ui', 'interface', 'icon']
  }
  
  const qualityTags = ['high-quality', 'ai-generated', 'game-ready']
  
  return [
    ...baseTags,
    ...(typeTags[type as keyof typeof typeTags] || []),
    ...qualityTags.slice(0, 1 + Math.floor(Math.random() * 2))
  ].slice(0, 6)
}