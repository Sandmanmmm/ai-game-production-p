// Template data for enhanced project creation

export interface GameTemplate {
  id: string
  name: string
  category: 'rpg' | 'scifi' | 'arcade' | 'action' | 'puzzle' | 'racing' | 'horror' | 'creative'
  style: 'voxel' | 'pixel' | 'lowpoly' | 'mobile' | 'artistic' | 'cyberpunk'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  description: string
  preview: string // Path to preview GIF/image
  rating: number
  uses: number
  features: string[]
  estimatedTime: string
  tags: string[]
  basePrompt: string // The AI prompt that generates this type of game
  customizationOptions: {
    themes: string[]
    artStyles: string[]
    optionalFeatures: string[]
  }
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'fantasy-rpg',
    name: 'Fantasy RPG Adventure',
    category: 'rpg',
    style: 'pixel',
    complexity: 'intermediate',
    description: 'Classic RPG with combat, inventory, and epic quests in a magical world',
    preview: '/templates/fantasy-rpg-preview.gif',
    rating: 4.8,
    uses: 1240,
    features: ['Turn-based Combat', 'Inventory System', 'Quest Management', 'Character Progression', 'Magic Spells'],
    estimatedTime: '3-4 hours',
    tags: ['fantasy', 'adventure', 'magic', 'combat', 'quests'],
    basePrompt: 'A fantasy RPG adventure game with medieval setting, magic system, turn-based combat, character progression, and epic quests to save the realm',
    customizationOptions: {
      themes: ['Medieval Fantasy', 'Dark Fantasy', 'High Fantasy', 'Celtic Mythology'],
      artStyles: ['Pixel Art', '2.5D Sprites', 'Hand-drawn', 'Low-poly 3D'],
      optionalFeatures: ['Multiplayer Co-op', 'Crafting System', 'Pet Companions', 'Base Building', 'PvP Arena']
    }
  },
  {
    id: 'space-shooter',
    name: 'Space Combat Shooter',
    category: 'scifi',
    style: 'lowpoly',
    complexity: 'beginner',
    description: 'Fast-paced space combat with ship upgrades and epic boss battles',
    preview: '/templates/space-shooter-preview.gif',
    rating: 4.6,
    uses: 890,
    features: ['Ship Combat', 'Weapon Upgrades', 'Boss Battles', 'Power-ups', 'Leaderboards'],
    estimatedTime: '1-2 hours',
    tags: ['space', 'shooter', 'arcade', 'fast-paced', 'upgrades'],
    basePrompt: 'A space shooter game with fast-paced combat, ship upgrades, power-ups, and challenging boss encounters in deep space',
    customizationOptions: {
      themes: ['Military Space War', 'Alien Invasion', 'Space Pirates', 'Galactic Empire'],
      artStyles: ['Low-poly 3D', 'Retro Pixel', 'Neon Cyberpunk', 'Realistic 3D'],
      optionalFeatures: ['Multiplayer Dogfights', 'Fleet Command', 'Story Campaign', 'Ship Customization', 'Survival Mode']
    }
  },
  {
    id: 'puzzle-platformer',
    name: 'Mind-Bending Puzzler',
    category: 'puzzle',
    style: 'voxel',
    complexity: 'intermediate',
    description: 'Challenging puzzles combined with precise platforming mechanics',
    preview: '/templates/puzzle-platformer-preview.gif',
    rating: 4.9,
    uses: 650,
    features: ['Physics Puzzles', 'Portal Mechanics', 'Time Manipulation', 'Level Editor', 'Achievement System'],
    estimatedTime: '2-3 hours',
    tags: ['puzzle', 'platformer', 'physics', 'mind-bending', 'creative'],
    basePrompt: 'A puzzle-platformer game with innovative mechanics like portals, time manipulation, and physics-based challenges',
    customizationOptions: {
      themes: ['Sci-fi Laboratory', 'Mystical Temple', 'Industrial Factory', 'Abstract Dimension'],
      artStyles: ['Voxel Art', 'Minimalist', 'Colorful Cartoon', 'Monochrome'],
      optionalFeatures: ['Level Editor', 'Community Sharing', 'Speedrun Mode', 'Co-op Puzzles', 'Story Mode']
    }
  },
  {
    id: 'racing-kart',
    name: 'Kart Racing Championship',
    category: 'racing',
    style: 'lowpoly',
    complexity: 'advanced',
    description: 'High-speed kart racing with custom tracks and multiplayer tournaments',
    preview: '/templates/kart-racing-preview.gif',
    rating: 4.7,
    uses: 1100,
    features: ['Multiplayer Racing', 'Track Editor', 'Vehicle Customization', 'Tournament Mode', 'Power-ups'],
    estimatedTime: '4-5 hours',
    tags: ['racing', 'multiplayer', 'competitive', 'tracks', 'tournaments'],
    basePrompt: 'A kart racing game with multiplayer support, custom track creation, vehicle customization, and tournament competitions',
    customizationOptions: {
      themes: ['Cartoon Racing', 'Realistic Motorsport', 'Futuristic Hover Cars', 'Off-road Adventure'],
      artStyles: ['Colorful Low-poly', 'Realistic 3D', 'Cartoon Style', 'Retro Arcade'],
      optionalFeatures: ['Online Multiplayer', 'Career Mode', 'Weather Effects', 'Day/Night Cycle', 'Stunt Mode']
    }
  },
  {
    id: 'tower-defense',
    name: 'Strategic Tower Defense',
    category: 'arcade',
    style: 'pixel',
    complexity: 'intermediate',
    description: 'Defend your base with strategic tower placement and upgrades',
    preview: '/templates/tower-defense-preview.gif',
    rating: 4.5,
    uses: 780,
    features: ['Tower Placement', 'Enemy Waves', 'Upgrade System', 'Multiple Maps', 'Boss Enemies'],
    estimatedTime: '2-3 hours',
    tags: ['strategy', 'defense', 'waves', 'towers', 'tactical'],
    basePrompt: 'A tower defense game with strategic tower placement, diverse enemy waves, upgrade systems, and challenging boss battles',
    customizationOptions: {
      themes: ['Medieval Castle', 'Space Station', 'Post-apocalyptic', 'Jungle Temple'],
      artStyles: ['Pixel Art', 'Isometric 3D', 'Hand-drawn', 'Minimalist'],
      optionalFeatures: ['Hero Units', 'Co-op Mode', 'Endless Mode', 'Map Editor', 'Achievement System']
    }
  },
  {
    id: 'horror-survival',
    name: 'Survival Horror Experience',
    category: 'horror',
    style: 'artistic',
    complexity: 'advanced',
    description: 'Atmospheric horror with resource management and psychological elements',
    preview: '/templates/horror-survival-preview.gif',
    rating: 4.4,
    uses: 420,
    features: ['Atmospheric Horror', 'Resource Management', 'Stealth Mechanics', 'Psychological Elements', 'Multiple Endings'],
    estimatedTime: '4-6 hours',
    tags: ['horror', 'survival', 'atmosphere', 'psychological', 'stealth'],
    basePrompt: 'A survival horror game with atmospheric tension, resource scarcity, stealth gameplay, and psychological horror elements',
    customizationOptions: {
      themes: ['Abandoned Hospital', 'Haunted House', 'Post-apocalyptic', 'Space Station'],
      artStyles: ['Realistic 3D', 'Dark Pixel Art', 'Hand-drawn Horror', 'Film Noir'],
      optionalFeatures: ['VR Support', 'Multiplayer Co-op', 'Procedural Scares', 'Sanity System', 'Custom Monsters']
    }
  },
  {
    id: 'city-builder',
    name: 'City Building Simulator',
    category: 'creative',
    style: 'lowpoly',
    complexity: 'advanced',
    description: 'Build and manage a thriving city with complex systems and citizens',
    preview: '/templates/city-builder-preview.gif',
    rating: 4.6,
    uses: 560,
    features: ['City Planning', 'Resource Management', 'Citizen Happiness', 'Economic System', 'Disasters'],
    estimatedTime: '5-7 hours',
    tags: ['simulation', 'building', 'management', 'strategy', 'creative'],
    basePrompt: 'A city building simulation game with urban planning, resource management, citizen needs, and economic systems',
    customizationOptions: {
      themes: ['Modern Metropolis', 'Medieval Town', 'Futuristic City', 'Island Paradise'],
      artStyles: ['Low-poly 3D', 'Isometric Pixel', 'Realistic 3D', 'Stylized Cartoon'],
      optionalFeatures: ['Multiplayer Trading', 'Climate System', 'Transportation Networks', 'Cultural Districts', 'Tourism']
    }
  },
  {
    id: 'fighting-arena',
    name: 'Fighting Arena Combat',
    category: 'action',
    style: 'pixel',
    complexity: 'intermediate',
    description: 'Classic fighting game with combo systems and tournament modes',
    preview: '/templates/fighting-game-preview.gif',
    rating: 4.3,
    uses: 690,
    features: ['Combo System', 'Multiple Characters', 'Special Moves', 'Tournament Mode', 'Training Mode'],
    estimatedTime: '3-4 hours',
    tags: ['fighting', 'combat', 'competitive', 'combos', 'characters'],
    basePrompt: 'A fighting game with diverse characters, combo systems, special moves, and competitive tournament gameplay',
    customizationOptions: {
      themes: ['Street Fighting', 'Martial Arts', 'Supernatural Powers', 'Robot Combat'],
      artStyles: ['Pixel Art', 'Anime Style', 'Realistic 3D', 'Comic Book'],
      optionalFeatures: ['Online Multiplayer', 'Character Customization', 'Story Mode', 'Tag Team', 'Weapon Combat']
    }
  },
  {
    id: 'match-three',
    name: 'Match-3 Puzzle Quest',
    category: 'puzzle',
    style: 'mobile',
    complexity: 'beginner',
    description: 'Addictive match-3 gameplay with RPG progression elements',
    preview: '/templates/match-three-preview.gif',
    rating: 4.2,
    uses: 920,
    features: ['Match-3 Mechanics', 'Power-ups', 'Level Progression', 'Character Upgrades', 'Daily Challenges'],
    estimatedTime: '1-2 hours',
    tags: ['match-3', 'casual', 'mobile', 'progression', 'addictive'],
    basePrompt: 'A match-3 puzzle game with RPG elements, character progression, power-ups, and engaging level design',
    customizationOptions: {
      themes: ['Fantasy Adventure', 'Space Exploration', 'Underwater World', 'Candy Land'],
      artStyles: ['Colorful Cartoon', 'Realistic Gems', 'Fantasy Art', 'Minimalist'],
      optionalFeatures: ['Social Features', 'Guild System', 'PvP Battles', 'Events', 'Story Campaign']
    }
  },
  {
    id: 'endless-runner',
    name: 'Endless Adventure Runner',
    category: 'arcade',
    style: 'pixel',
    complexity: 'beginner',
    description: 'Fast-paced endless running with obstacles and power-ups',
    preview: '/templates/endless-runner-preview.gif',
    rating: 4.1,
    uses: 1080,
    features: ['Endless Gameplay', 'Obstacle Course', 'Power-ups', 'Character Unlocks', 'High Scores'],
    estimatedTime: '1-2 hours',
    tags: ['endless', 'runner', 'fast-paced', 'arcade', 'casual'],
    basePrompt: 'An endless runner game with dynamic obstacles, collectible power-ups, character unlocks, and high-score competition',
    customizationOptions: {
      themes: ['Urban Parkour', 'Temple Run', 'Space Corridor', 'Forest Adventure'],
      artStyles: ['Pixel Art', 'Low-poly 3D', 'Cartoon Style', 'Silhouette'],
      optionalFeatures: ['Character Abilities', 'Vehicle Modes', 'Multiplayer Racing', 'Seasonal Events', 'Customization']
    }
  }
]

export const TEMPLATE_CATEGORIES = {
  genre: [
    { id: 'rpg', name: 'RPG & Fantasy', icon: 'Sword', color: 'text-purple-400', count: 1 },
    { id: 'scifi', name: 'Sci-Fi & Space', icon: 'Rocket', color: 'text-blue-400', count: 1 },
    { id: 'arcade', name: 'Arcade & Casual', icon: 'GameController', color: 'text-green-400', count: 2 },
    { id: 'action', name: 'Action & Platformer', icon: 'Lightning', color: 'text-orange-400', count: 1 },
    { id: 'puzzle', name: 'Puzzle & Strategy', icon: 'Puzzle', color: 'text-yellow-400', count: 2 },
    { id: 'racing', name: 'Racing & Sports', icon: 'Car', color: 'text-red-400', count: 1 },
    { id: 'horror', name: 'Horror & Thriller', icon: 'Ghost', color: 'text-gray-400', count: 1 },
    { id: 'creative', name: 'Creative & Sandbox', icon: 'Palette', color: 'text-pink-400', count: 1 },
  ],
  style: [
    { id: 'voxel', name: 'Voxel/Minecraft-style', preview: '🟫', description: 'Blocky, 3D voxel art', count: 1 },
    { id: 'pixel', name: '2D Pixel Art', preview: '🎭', description: 'Retro 8-bit and 16-bit sprites', count: 4 },
    { id: 'lowpoly', name: 'Low-poly 3D', preview: '🎪', description: 'Simple 3D models with flat shading', count: 3 },
    { id: 'mobile', name: 'Mobile-friendly UI', preview: '📱', description: 'Touch-optimized interfaces', count: 1 },
    { id: 'artistic', name: 'Hand-drawn/Artistic', preview: '🎨', description: 'Unique artistic styles', count: 1 },
    { id: 'cyberpunk', name: 'Neon/Cyberpunk', preview: '⚡', description: 'Futuristic neon aesthetics', count: 0 },
  ],
  complexity: [
    { 
      id: 'beginner', 
      name: 'Beginner', 
      description: 'Simple mechanics, quick to build', 
      time: '1-2 hours', 
      color: 'bg-green-500/20 text-green-400',
      count: 3
    },
    { 
      id: 'intermediate', 
      name: 'Intermediate', 
      description: 'Multiple systems, moderate complexity', 
      time: '2-4 hours', 
      color: 'bg-yellow-500/20 text-yellow-400',
      count: 4
    },
    { 
      id: 'advanced', 
      name: 'Advanced', 
      description: 'Complex gameplay, full features', 
      time: '4+ hours', 
      color: 'bg-red-500/20 text-red-400',
      count: 3
    },
  ]
}

export const INSPIRATION_PROMPTS = [
  "A cyberpunk detective game with AI companions and hacking mechanics",
  "Medieval fantasy RPG with dragon taming and kingdom building",
  "Space exploration game with alien diplomacy and trade systems",
  "Steampunk puzzle adventure with time manipulation devices",
  "Underwater survival game with bioluminescent creatures",
  "Post-apocalyptic city builder with robot workforce management",
  "Magical cooking game in a wizard's enchanted tavern",
  "Ninja platformer with shadow manipulation and stealth combat",
  "Victorian-era ghost hunting with supernatural investigation tools",
  "Tribal civilization game with elemental magic systems",
  "Interdimensional postal service with reality-hopping mechanics",
  "Mushroom forest ecosystem simulator with symbiotic relationships"
]

export const QUICK_START_CONCEPTS = [
  "A mystical wizard's tower defense against shadow creatures",
  "Cyberpunk hacker infiltrating corporate mega-structures", 
  "Underwater city exploration with bioluminescent sea life",
  "Space mining colony management on hostile alien worlds",
  "Medieval blacksmith crafting legendary weapons and armor",
  "Time-traveling detective solving historical mysteries",
  "Elemental mage academy with spell crafting systems",
  "Robot uprising survival in a futuristic metropolis",
  "Pirate ship management with treasure hunting expeditions",
  "Interdimensional cafe serving customers from multiple realities"
]

export const GENRE_TAGS = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Puzzle', 'Racing', 'Sports',
  'Fighting', 'Shooter', 'Platformer', 'Simulation', 'Sandbox', 'Horror',
  'Mystery', 'Survival', 'Roguelike', 'Tower Defense', 'Casual', 'Arcade',
  'Educational', 'Music', 'Party', 'Trivia', 'Card', 'Board'
]

export const THEME_TAGS = [
  'Fantasy', 'Sci-Fi', 'Cyberpunk', 'Steampunk', 'Medieval', 'Modern',
  'Post-Apocalyptic', 'Space', 'Underwater', 'Desert', 'Forest', 'Urban',
  'Mystical', 'Dark', 'Colorful', 'Minimalist', 'Retro', 'Futuristic',
  'Cartoon', 'Realistic', 'Abstract', 'Noir', 'Western', 'Victorian'
]

export const MECHANIC_TAGS = [
  'Combat', 'Crafting', 'Building', 'Exploration', 'Dialogue', 'Trading',
  'Multiplayer', 'Co-op', 'PvP', 'Turn-based', 'Real-time', 'Physics',
  'AI Companions', 'Procedural', 'Narrative', 'Sandbox', 'Progression',
  'Customization', 'Resource Management', 'Time Manipulation', 'Stealth',
  'Magic', 'Technology', 'Vehicles', 'Pets', 'Guilds', 'Events'
]
