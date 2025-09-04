import { GameProject, PipelineStage, AIAssistantMessage, ArtAsset, AudioAsset, ModelAsset, StoryLoreContent } from './types'

const createBasicStoryLoreContent = (genre: string, setting: string, plotOutline: string, themes: string[]): StoryLoreContent => {
  return {
    worldLore: {
      id: 'world-1',
      name: `${genre} World`,
      geography: `A rich ${genre.toLowerCase()} world with diverse landscapes and environments.`,
      politics: 'Complex political structures shape the world dynamics.',
      culture: `The culture reflects traditional ${genre.toLowerCase()} themes and values.`,
      history: 'A deep history spans generations, creating the backdrop for current events.',
      technology: genre.includes('sci-fi') || genre.includes('cyberpunk') ? 'Advanced technology plays a key role' : 'Traditional tools and methods are used',
      magic: genre.includes('fantasy') || genre.includes('magic') ? 'Magic is woven into the fabric of reality' : 'No magical elements present'
    },
    mainStoryArc: {
      id: 'main-arc-1',
      title: 'The Main Journey',
      description: plotOutline,
      acts: [
        { id: 'act-1', name: 'Beginning', description: 'The story begins and characters are introduced', chapters: ['chapter-1', 'chapter-2'] },
        { id: 'act-2', name: 'Rising Action', description: 'Conflict develops and tension builds', chapters: ['chapter-3', 'chapter-4'] },
        { id: 'act-3', name: 'Climax & Resolution', description: 'The climax occurs and story concludes', chapters: ['chapter-5'] }
      ],
      themes: themes,
      tone: 'balanced' as const
    },
    chapters: [
      { id: 'chapter-1', title: 'The Beginning', description: 'Our story starts here', content: 'Chapter content...', order: 1, status: 'draft' as const, characters: [], locations: [], objectives: [] },
      { id: 'chapter-2', title: 'First Challenge', description: 'The first obstacle appears', content: 'Chapter content...', order: 2, status: 'draft' as const, characters: [], locations: [], objectives: [] },
      { id: 'chapter-3', title: 'Rising Tension', description: 'Things get more complex', content: 'Chapter content...', order: 3, status: 'draft' as const, characters: [], locations: [], objectives: [] },
      { id: 'chapter-4', title: 'The Confrontation', description: 'Major conflict emerges', content: 'Chapter content...', order: 4, status: 'draft' as const, characters: [], locations: [], objectives: [] },
      { id: 'chapter-5', title: 'Resolution', description: 'The story concludes', content: 'Chapter content...', order: 5, status: 'draft' as const, characters: [], locations: [], objectives: [] }
    ],
    characters: [],
    factions: [],
    subplots: [],
    timeline: [],
    metadata: {
      genre: genre,
      targetAudience: 'Teen and Adult gamers',
      complexity: 'medium' as const,
      estimatedLength: 'medium' as const,
      themes: themes
    }
  }
}

// Migration function to convert old StoryContent to new StoryLoreContent
const migrateOldStoryContent = (oldStory: any): StoryLoreContent | null => {
  if (!oldStory) return null
  
  // Check if it's already the new format
  if (oldStory.worldLore && oldStory.mainStoryArc && oldStory.metadata) {
    return oldStory as StoryLoreContent
  }
  
  // Convert old format to new format
  if (oldStory.genre && oldStory.setting && oldStory.plotOutline && oldStory.themes) {
    console.log('🔄 Migrating old story format to new format')
    return createBasicStoryLoreContent(
      oldStory.genre,
      oldStory.setting,
      oldStory.plotOutline,
      oldStory.themes
    )
  }
  
  return null
}

export { migrateOldStoryContent }

const generateThemeApropriateAssets = (prompt: string, genre: string) => {
  const promptLower = prompt.toLowerCase()
  
  if (promptLower.includes('cyberpunk') || promptLower.includes('hacking') || promptLower.includes('futuristic')) {
    return {
      art: [
        {
          id: 'art_cyberpunk_rebel',
          name: 'Cyberpunk Rebel',
          type: 'character' as const,
          category: 'character' as const,
          status: 'approved' as const,
          tags: ['cyberpunk', 'character', 'hacker', 'rebel'],
          src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          prompt: 'Futuristic hacker girl in neon city',
          style: 'Cyberpunk',
          resolution: '1024x1024',
          format: 'PNG',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 5,
            collections: ['main-characters'],
            quality: 'excellent' as const,
            aiGenerated: true
          }
        },
        {
          id: 'art_neon_street',
          name: 'Neon Street',
          type: 'environment' as const,
          category: 'environment' as const,
          status: 'approved' as const,
          tags: ['environment', 'cyberpunk', 'street', 'neon'],
          src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
          prompt: 'Dark alley with neon signs and holographic ads',
          style: 'Cyberpunk',
          resolution: '1920x1080',
          format: 'PNG',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 3,
            collections: ['environments'],
            quality: 'good',
            aiGenerated: true
          }
        }
      ],
      audio: [
        {
          id: 'audio_cyber_theme',
          name: 'Synthwave Combat Theme',
          type: 'music',
          category: 'music',
          status: 'approved',
          tags: ['synthwave', 'cyberpunk', 'battle', 'electronic'],
          src: '/audio/synthwave-theme.mp3',
          duration: 180,
          prompt: 'Dark synthwave music with cyberpunk vibes',
          style: 'Synthwave',
          bpm: 140,
          key: 'D minor',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 7,
            collections: ['music-tracks'],
            quality: 'excellent',
            aiGenerated: true
          }
        }
      ],
      models: [
        {
          id: 'model_cyber_drone',
          name: 'Security Drone',
          type: '3d',
          category: 'prop',
          status: 'review',
          tags: ['drone', 'cyberpunk', 'security', 'tech'],
          src: '/models/security-drone.fbx',
          thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
          polyCount: 3200,
          prompt: 'Futuristic security drone with scanning abilities',
          style: 'Cyberpunk',
          format: 'FBX',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 2,
            collections: ['tech-props'],
            quality: 'good',
            aiGenerated: true
          }
        }
      ]
    }
  }
  
  if (promptLower.includes('fantasy') || promptLower.includes('dragon') || promptLower.includes('magic') || promptLower.includes('rpg')) {
    return {
      art: [
        {
          id: 'art_dragon_companion',
          name: 'Dragon Companion',
          type: 'character',
          category: 'character',
          status: 'approved',
          tags: ['dragon', 'fantasy', 'companion', 'magical'],
          src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          prompt: 'Majestic dragon companion with iridescent scales',
          style: 'Fantasy',
          resolution: '1024x1024',
          format: 'PNG',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 8,
            collections: ['main-characters'],
            quality: 'excellent',
            aiGenerated: true
          }
        },
        {
          id: 'art_magic_forest',
          name: 'Enchanted Forest',
          type: 'environment',
          category: 'environment',
          status: 'approved',
          tags: ['forest', 'magic', 'enchanted', 'fantasy'],
          src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
          prompt: 'Mystical forest with glowing magical elements and ancient trees',
          style: 'Fantasy',
          resolution: '1920x1080',
          format: 'PNG',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 6,
            collections: ['environments'],
            quality: 'excellent',
            aiGenerated: true
          }
        },
        {
          id: 'art_crafting_table',
          name: 'Magic Crafting Station',
          type: 'prop',
          category: 'prop',
          status: 'review',
          tags: ['crafting', 'magic', 'station', 'fantasy'],
          src: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
          prompt: 'Ornate magical crafting table with floating runes and materials',
          style: 'Fantasy',
          resolution: '1024x1024',
          format: 'PNG',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 4,
            collections: ['props'],
            quality: 'good',
            aiGenerated: true
          }
        }
      ],
      audio: [
        {
          id: 'audio_fantasy_theme',
          name: 'Epic Fantasy Theme',
          type: 'music',
          category: 'music',
          status: 'approved',
          tags: ['orchestral', 'fantasy', 'epic', 'adventure'],
          src: '/audio/fantasy-theme.mp3',
          duration: 210,
          prompt: 'Sweeping orchestral theme with magical undertones',
          style: 'Orchestral',
          bpm: 80,
          key: 'C major',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 9,
            collections: ['music-tracks'],
            quality: 'excellent',
            aiGenerated: true
          }
        },
        {
          id: 'audio_dragon_roar',
          name: 'Dragon Roar Sound',
          type: 'sfx',
          category: 'sound-fx',
          status: 'approved',
          tags: ['dragon', 'roar', 'creature', 'fantasy'],
          src: '/audio/dragon-roar.wav',
          duration: 3,
          prompt: 'Powerful dragon roar with magical resonance',
          style: 'Cinematic',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 5,
            collections: ['sound-effects'],
            quality: 'excellent',
            aiGenerated: true
          }
        }
      ],
      models: [
        {
          id: 'model_magic_sword',
          name: 'Dragonfire Blade',
          type: '3d',
          category: 'prop',
          status: 'approved',
          tags: ['sword', 'magic', 'dragon', 'weapon'],
          src: '/models/dragonfire-blade.fbx',
          thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          polyCount: 2100,
          prompt: 'Enchanted sword with dragon-forged blade and fire effects',
          style: 'Fantasy',
          format: 'FBX',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 7,
            collections: ['weapons'],
            quality: 'excellent',
            aiGenerated: true
          }
        }
      ]
    }
  }
  
  if (promptLower.includes('space') || promptLower.includes('exploration') || promptLower.includes('planet') || promptLower.includes('sci-fi')) {
    return {
      art: [
        {
          id: 'art_space_explorer',
          name: 'Space Explorer',
          type: 'character',
          category: 'character',
          status: 'approved',
          tags: ['space', 'explorer', 'astronaut', 'sci-fi'],
          src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          prompt: 'Futuristic space explorer in advanced suit',
          style: 'Sci-Fi',
          resolution: '1024x1024',
          format: 'PNG',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 6,
            collections: ['main-characters'],
            quality: 'excellent',
            aiGenerated: true
          }
        },
        {
          id: 'art_alien_planet',
          name: 'Alien Planet Surface',
          type: 'environment',
          category: 'environment',
          status: 'approved',
          tags: ['planet', 'alien', 'exploration', 'landscape'],
          src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
          prompt: 'Mysterious alien planet with unique flora and terrain',
          style: 'Sci-Fi',
          resolution: '1920x1080',
          format: 'PNG',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 4,
            collections: ['environments'],
            quality: 'good',
            aiGenerated: true
          }
        }
      ],
      audio: [
        {
          id: 'audio_space_ambient',
          name: 'Deep Space Ambience',
          type: 'ambient',
          category: 'ambient',
          status: 'approved',
          tags: ['space', 'ambient', 'exploration', 'atmospheric'],
          src: '/audio/space-ambient.mp3',
          duration: 300,
          prompt: 'Atmospheric space sounds with distant cosmic phenomena',
          style: 'Ambient',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 3,
            collections: ['ambient-tracks'],
            quality: 'good',
            aiGenerated: true
          }
        }
      ],
      models: [
        {
          id: 'model_spaceship',
          name: 'Exploration Vessel',
          type: '3d',
          category: 'prop',
          status: 'review',
          tags: ['spaceship', 'vessel', 'exploration', 'sci-fi'],
          src: '/models/exploration-vessel.fbx',
          thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
          polyCount: 8500,
          prompt: 'Advanced exploration spaceship with modular design',
          style: 'Sci-Fi',
          format: 'FBX',
          variations: [],
          linkedTo: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 2,
            collections: ['vehicles'],
            quality: 'good',
            aiGenerated: true
          }
        }
      ]
    }
  }
  
  // Default generic assets for other themes
  return {
    art: [] as ArtAsset[],
    audio: [] as AudioAsset[],
    models: [] as ModelAsset[]
  }
}

export const generateMockProject = (prompt: string): GameProject => {
  const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const title = generateGameTitle(prompt)
  const genre = detectGenre(prompt)
  const assets = generateThemeApropriateAssets(prompt, genre)
  
  return {
    id,
    title,
    description: generateGameDescription(prompt, title),
    prompt,
    status: 'concept',
    progress: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pipeline: generatePipelineStages(),
    story: createBasicStoryLoreContent(
      genre,
      generateSetting(prompt),
      generatePlotOutline(prompt),
      generateThemes(prompt)
    ),
    assets: {
      art: assets.art as ArtAsset[] || [],
      audio: assets.audio as AudioAsset[] || [],
      models: assets.models as ModelAsset[] || [],
      ui: []
    },
    gameplay: {
      mechanics: [],
      levels: [],
      balancing: {
        difficulty_curve: [1, 2, 3, 5, 7, 8, 9],
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
        performance_score: 85
      }
    },
    publishing: {
      platforms: [
        { id: 'steam', name: 'Steam', status: 'planned', requirements: ['Age rating', 'Screenshots', 'Trailer'] },
        { id: 'mobile', name: 'Mobile (iOS/Android)', status: 'planned', requirements: ['App store compliance', 'Touch controls'] }
      ],
      marketing: {
        tagline: generateTagline(prompt),
        description: generateGameDescription(prompt, title),
        screenshots: [],
        key_features: generateKeyFeatures(prompt),
        target_demographics: ['Gaming enthusiasts', 'Casual players']
      },
      distribution: {
        pricing_strategy: 'premium',
        launch_strategy: ['Early Access', 'Influencer partnerships', 'Gaming conventions'],
        post_launch_support: ['Bug fixes', 'Content updates', 'Community engagement']
      },
      monetization: {
        model: 'one-time',
        pricing: { base: 19.99 }
      }
    }
  }
}

const generateGameTitle = (prompt: string): string => {
  const keywords = extractKeywords(prompt)
  const titleTemplates = [
    `${keywords[0] || 'Mystic'} ${keywords[1] || 'Quest'}`,
    `${keywords[0] || 'Digital'} ${keywords[1] || 'Realms'}`,
    `${keywords[0] || 'Cyber'} ${keywords[1] || 'Chronicles'}`,
    `${keywords[0] || 'Neon'} ${keywords[1] || 'Legends'}`,
    `${keywords[0] || 'Shadow'} ${keywords[1] || 'Empire'}`
  ]
  
  return titleTemplates[Math.floor(Math.random() * titleTemplates.length)]
}

const generateGameDescription = (prompt: string, title: string): string => {
  const themes = extractKeywords(prompt)
  const descriptions = [
    `${title} is an immersive gaming experience that combines ${themes[0] || 'adventure'} with ${themes[1] || 'strategy'}. Players will navigate through a rich world filled with challenging puzzles and engaging storylines.`,
    `Dive into ${title}, where ${themes[0] || 'action'} meets ${themes[1] || 'mystery'}. This innovative game offers players unique mechanics and unforgettable characters in a beautifully crafted universe.`,
    `${title} revolutionizes the gaming experience by blending ${themes[0] || 'exploration'} with ${themes[1] || 'combat'}. Prepare for an epic journey that challenges both mind and reflexes.`
  ]
  
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

const generateTagline = (prompt: string): string => {
  const taglines = [
    'Where legends are born',
    'Your adventure awaits',
    'Redefining the possible',
    'Beyond imagination',
    'The next evolution'
  ]
  
  return taglines[Math.floor(Math.random() * taglines.length)]
}

const generateKeyFeatures = (prompt: string): string[] => {
  const baseFeatures = [
    'Immersive storyline',
    'Stunning visuals',
    'Innovative gameplay mechanics',
    'Rich character development',
    'Dynamic world events',
    'Multiplayer support',
    'Customizable experience',
    'Cross-platform compatibility'
  ]
  
  return baseFeatures.slice(0, 4 + Math.floor(Math.random() * 3))
}

const detectGenre = (prompt: string): string => {
  const genreKeywords = {
    'RPG': ['role', 'character', 'level', 'stats', 'fantasy', 'magic'],
    'Action': ['fight', 'combat', 'battle', 'shoot', 'fast'],
    'Adventure': ['explore', 'quest', 'journey', 'discover', 'story'],
    'Strategy': ['build', 'manage', 'plan', 'resource', 'tactical'],
    'Puzzle': ['solve', 'logic', 'brain', 'think', 'challenge'],
    'Simulation': ['simulate', 'real', 'manage', 'build', 'economy'],
    'Indie': ['unique', 'artistic', 'creative', 'experimental', 'innovative']
  }
  
  const lowerPrompt = prompt.toLowerCase()
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
      return genre
    }
  }
  
  return 'Adventure'
}

const generateSetting = (prompt: string): string => {
  const settings = [
    'A mystical realm where magic and technology coexist',
    'A post-apocalyptic world rebuilding from ashes',
    'A vibrant cyberpunk metropolis',
    'Ancient fantasy kingdoms filled with wonder',
    'Space colonies on the edge of known universe',
    'A parallel dimension with altered physics',
    'Underground societies beneath modern cities'
  ]
  
  return settings[Math.floor(Math.random() * settings.length)]
}

const generatePlotOutline = (prompt: string): string => {
  return `The story follows the player's journey through a world shaped by ${extractKeywords(prompt)[0] || 'mystery'}. As they progress, they'll uncover ancient secrets, form powerful alliances, and face increasingly challenging obstacles that test their resolve and skills.`
}

const generateThemes = (prompt: string): string[] => {
  const allThemes = [
    'Hero\'s journey',
    'Good vs Evil',
    'Redemption',
    'Discovery',
    'Friendship',
    'Sacrifice',
    'Power and corruption',
    'Coming of age',
    'Survival',
    'Innovation'
  ]
  
  return allThemes.slice(0, 3 + Math.floor(Math.random() * 2))
}

const extractKeywords = (text: string): string[] => {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'game', 'about']
  
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 5)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
}

export const generatePipelineStages = (): PipelineStage[] => {
  return [
    {
      id: 'concept',
      name: 'Concept & Planning',
      status: 'complete',
      progress: 100,
      order: 1,
      estimatedHours: 40,
      actualHours: 35
    },
    {
      id: 'story',
      name: 'Story & Narrative',
      status: 'in-progress',
      progress: 30,
      order: 2,
      dependencies: ['concept'],
      estimatedHours: 80,
      actualHours: 25
    },
    {
      id: 'assets',
      name: 'Asset Production',
      status: 'pending',
      progress: 0,
      order: 3,
      dependencies: ['story'],
      estimatedHours: 200
    },
    {
      id: 'gameplay',
      name: 'Gameplay Systems',
      status: 'pending',
      progress: 0,
      order: 4,
      dependencies: ['assets'],
      estimatedHours: 160
    },
    {
      id: 'qa',
      name: 'Quality Assurance',
      status: 'pending',
      progress: 0,
      order: 5,
      dependencies: ['gameplay'],
      estimatedHours: 120
    },
    {
      id: 'publishing',
      name: 'Publishing & Launch',
      status: 'pending',
      progress: 0,
      order: 6,
      dependencies: ['qa'],
      estimatedHours: 60
    }
  ]
}

export const getMockProjects = (): GameProject[] => {
  return [
    generateMockProject('A cyberpunk adventure game with hacking mechanics'),
    generateMockProject('Fantasy RPG with dragon companions and magic crafting'),
    generateMockProject('Space exploration game with procedural planets')
  ]
}

export const generateAIResponse = (userMessage: string, context: string): AIAssistantMessage => {
  const responses = {
    general: [
      "I'm here to help bring your game vision to life! What aspect would you like to work on?",
      "Great question! Let me suggest some creative directions for your project.",
      "I can see the potential in your idea. Let's explore some possibilities together."
    ],
    story: [
      "For your story, consider adding a compelling character arc that mirrors the player's journey.",
      "The narrative structure could benefit from branching paths that give players meaningful choices.",
      "Let's develop your world-building with rich lore that players can discover organically."
    ],
    assets: [
      "For your art direction, I recommend establishing a consistent visual style early in development.",
      "Consider creating a mood board to guide your asset creation and maintain visual cohesion.",
      "The key to great game art is balancing aesthetic appeal with functional clarity."
    ],
    gameplay: [
      "Your core game loop should provide clear goals, meaningful choices, and satisfying feedback.",
      "Consider how each mechanic serves the overall player experience and story.",
      "Playtesting early and often will help you refine the gameplay balance."
    ],
    qa: [
      "A comprehensive testing plan should cover functionality, performance, and user experience.",
      "Consider implementing automated testing for core systems to catch regressions early.",
      "User feedback is invaluable - plan for multiple rounds of external testing."
    ],
    publishing: [
      "Your marketing strategy should highlight what makes your game unique in the market.",
      "Consider building a community around your game before launch to generate excitement.",
      "Platform-specific requirements vary significantly - plan your certification process early."
    ]
  }
  
  const contextResponses = responses[context as keyof typeof responses] || responses.general
  const response = contextResponses[Math.floor(Math.random() * contextResponses.length)]
  
  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: response,
    timestamp: new Date().toISOString(),
    context: context as any
  }
}