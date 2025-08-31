import { GameProject, PipelineStage, AIAssistantMessage } from './types'

export const generateMockProject = (prompt: string): GameProject => {
  const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const title = generateGameTitle(prompt)
  
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
    story: {
      genre: detectGenre(prompt),
      setting: generateSetting(prompt),
      characters: [],
      plotOutline: generatePlotOutline(prompt),
      themes: generateThemes(prompt),
      targetAudience: 'Teen and Adult gamers'
    },
    assets: {
      art: [
        {
          id: 'art_hero_concept',
          name: 'Hero Character Concept',
          type: 'character',
          category: 'character',
          status: 'approved',
          tags: ['hero', 'character', 'concept'],
          thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
        },
        {
          id: 'art_environment',
          name: 'Forest Environment',
          type: 'environment',
          category: 'environment',
          status: 'in-progress',
          tags: ['forest', 'environment', 'background'],
          thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'
        },
        {
          id: 'art_ui_mockup',
          name: 'Game UI Mockup',
          type: 'ui',
          category: 'ui',
          status: 'review',
          tags: ['ui', 'interface', 'hud'],
          thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop'
        }
      ],
      audio: [
        {
          id: 'audio_theme',
          name: 'Main Theme Music',
          type: 'music',
          category: 'music',
          status: 'approved',
          tags: ['theme', 'orchestral', 'epic'],
          duration: 180
        },
        {
          id: 'audio_combat',
          name: 'Combat Sound Effects',
          type: 'sfx',
          category: 'sound-fx',
          status: 'in-progress',
          tags: ['combat', 'sfx', 'action'],
          duration: 45
        }
      ],
      models: [
        {
          id: 'model_hero',
          name: 'Hero 3D Model',
          type: '3d',
          category: 'character',
          status: 'review',
          tags: ['hero', 'low-poly', 'rigged'],
          polyCount: 5420
        },
        {
          id: 'model_sword',
          name: 'Magic Sword',
          type: '3d',
          category: 'prop',
          status: 'approved',
          tags: ['weapon', 'magic', 'prop'],
          polyCount: 1200
        }
      ],
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