import { RealGameTemplate } from '../realTemplateGenerator'

export const platformerTemplate: RealGameTemplate = {
  id: 'platformer',
  name: 'Platformer Adventure',
  description: 'Create a side-scrolling platformer with jumping mechanics and collectibles',
  category: 'intermediate',
  complexity: 'intermediate',
  estimatedTime: '60 minutes',
  tags: ['platformer', 'side-scroller', 'jumping', 'adventure'],
  
  gameStructure: {
    gameType: 'platformer',
    framework: 'html5-canvas',
    coreLoop: 'Move → Jump → Avoid Hazards → Collect Items → Reach Goal',
    scenes: [
      {
        id: 'game-level',
        name: 'Game Level',
        type: 'game',
        requiredAssets: ['player-character', 'platforms', 'background', 'hazards', 'collectibles'],
        codeSnippet: `
class GameLevel {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.platforms = []
    this.hazards = []
    this.collectibles = []
    this.camera = { x: 0, y: 0 }
  }
  
  loadLevel(levelData) {
    this.platforms = levelData.platforms
    this.hazards = levelData.hazards
    this.collectibles = levelData.collectibles
  }
}`
      },
      {
        id: 'player-character',
        name: 'Player Character',
        type: 'game',
        requiredAssets: ['character-sprites', 'animations', 'sound-effects'],
        codeSnippet: `
class PlayerCharacter {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 32
    this.height = 48
    this.velocityX = 0
    this.velocityY = 0
    this.grounded = false
    this.health = 100
  }
  
  update() {
    this.handleInput()
    this.applyPhysics()
    this.checkCollisions()
  }
}`
      },
      {
        id: 'platform-system',
        name: 'Platform System',
        type: 'game',
        requiredAssets: ['platform-tiles', 'collision-masks', 'decorations'],
        codeSnippet: `
class PlatformSystem {
  constructor() {
    this.platforms = []
    this.movingPlatforms = []
  }
  
  addPlatform(x, y, width, height, type = 'solid') {
    this.platforms.push({
      x, y, width, height, type,
      solid: type !== 'one-way'
    })
  }
}`
      }
    ],
    mechanics: [
      {
        id: 'movement-physics',
        name: 'Movement & Physics',
        description: 'Character movement with gravity and collision detection',
        parameters: [
          { name: 'moveSpeed', type: 'number', defaultValue: 5, description: 'Horizontal movement speed', customizable: true },
          { name: 'jumpForce', type: 'number', defaultValue: -12, description: 'Jump velocity strength', customizable: true },
          { name: 'gravity', type: 'number', defaultValue: 0.8, description: 'Downward acceleration', customizable: true },
          { name: 'friction', type: 'number', defaultValue: 0.8, description: 'Ground friction coefficient', customizable: true }
        ],
        codeImplementation: `
function updatePhysics() {
  // Apply gravity
  if (!this.player.grounded) {
    this.player.velocityY += this.gravity
  }
  
  // Apply friction
  if (this.player.grounded) {
    this.player.velocityX *= this.friction
  }
  
  // Update position
  this.player.x += this.player.velocityX
  this.player.y += this.player.velocityY
  
  // Terminal velocity
  if (this.player.velocityY > 15) {
    this.player.velocityY = 15
  }
}`
      },
      {
        id: 'collision-detection',
        name: 'Collision Detection',
        description: 'Platform and hazard collision systems',
        parameters: [
          { name: 'collisionPadding', type: 'number', defaultValue: 2, description: 'Collision detection padding', customizable: true },
          { name: 'oneWayPlatforms', type: 'boolean', defaultValue: true, description: 'Enable one-way platform mechanics', customizable: true }
        ],
        codeImplementation: `
function checkCollisions() {
  this.player.grounded = false
  
  this.platforms.forEach(platform => {
    if (this.isColliding(this.player, platform)) {
      this.resolveCollision(this.player, platform)
    }
  })
  
  this.hazards.forEach(hazard => {
    if (this.isColliding(this.player, hazard)) {
      this.player.takeDamage(hazard.damage)
    }
  })
}`
      },
      {
        id: 'collectible-system',
        name: 'Collectible System',
        description: 'Items that can be collected for points or power-ups',
        parameters: [
          { name: 'collectibleTypes', type: 'number', defaultValue: 3, description: 'Number of different collectible types', customizable: true },
          { name: 'respawnCollectibles', type: 'boolean', defaultValue: false, description: 'Collectibles respawn after time', customizable: true }
        ],
        codeImplementation: `
function checkCollectibles() {
  this.collectibles = this.collectibles.filter(collectible => {
    if (this.isColliding(this.player, collectible)) {
      this.collectItem(collectible)
      return false
    }
    return true
  })
}

function collectItem(item) {
  this.score += item.value
  this.playSound('collect')
  
  if (item.type === 'powerup') {
    this.applyPowerUp(item.effect)
  }
}`
      },
      {
        id: 'camera-system',
        name: 'Camera System',
        description: 'Following camera with smooth scrolling',
        parameters: [
          { name: 'cameraSmoothing', type: 'number', defaultValue: 0.1, description: 'Camera follow smoothing factor', customizable: true },
          { name: 'cameraOffsetX', type: 'number', defaultValue: 200, description: 'Horizontal camera offset from player', customizable: true }
        ],
        codeImplementation: `
function updateCamera() {
  const targetX = this.player.x - this.cameraOffsetX
  const targetY = this.player.y - this.canvas.height / 2
  
  this.camera.x += (targetX - this.camera.x) * this.cameraSmoothing
  this.camera.y += (targetY - this.camera.y) * this.cameraSmoothing
  
  // Keep camera within level bounds
  this.camera.x = Math.max(0, Math.min(this.levelWidth - this.canvas.width, this.camera.x))
  this.camera.y = Math.max(0, Math.min(this.levelHeight - this.canvas.height, this.camera.y))
}`
      }
    ]
  },
  
  prebuiltContent: {
    story: {
      worldLore: {
        id: 'adventure-world',
        name: '{{THEME_NAME}} Kingdom',
        geography: 'Vast {{THEME_SETTING}} with treacherous platforms and hidden secrets',
        politics: 'Ancient evil threatens the peaceful {{THEME_KINGDOM}}',
        culture: 'Brave {{THEME_HEROES}} who master the art of {{THEME_MOVEMENT}}',
        history: 'Legend tells of the {{THEME_ARTIFACT}} hidden in the deepest levels',
        technology: 'Mystical {{THEME_PLATFORMS}} that defy natural laws',
        magic: 'The power of {{THEME_JUMP}} that allows traversal of impossible gaps'
      },
      mainStoryArc: {
        id: 'hero-journey',
        title: 'Quest for the {{THEME_ARTIFACT}}',
        description: '{{THEME_HERO}} must navigate dangerous {{THEME_SETTING}} to save the kingdom',
        acts: [],
        themes: ['heroism', 'adventure', 'perseverance'],
        tone: 'balanced' as const
      },
      chapters: [],
      characters: [
        {
          id: 'player-hero',
          name: '{{THEME_HERO}}',
          description: 'A courageous {{THEME_HERO}} with incredible {{THEME_MOVEMENT}} abilities',
          role: 'protagonist' as const,
          relationships: []
        }
      ],
      factions: [],
      subplots: [],
      timeline: [],
      metadata: {
        genre: 'adventure',
        targetAudience: 'all-ages',
        complexity: 'medium' as const,
        estimatedLength: 'medium' as const,
        themes: ['adventure', 'skill', 'exploration'],
        contentWarnings: []
      }
    },
    assets: {
      art: ['player-sprites', 'platform-tiles', 'background-layers', 'hazard-sprites', 'collectible-items'],
      audio: ['jump-sound', 'collect-sound', 'hurt-sound', 'background-music', 'ambient-sounds'],
      ui: ['health-bar', 'score-display', 'level-complete-screen', 'pause-menu']
    },
    gameplay: {
      mechanics: [
        { id: 'running', name: 'Running Movement', complexity: 'simple', description: 'Left/right movement controls', implemented: true },
        { id: 'jumping', name: 'Jumping Mechanics', complexity: 'medium', description: 'Variable height jumping', implemented: true },
        { id: 'platforms', name: 'Platform Interaction', complexity: 'medium', description: 'Solid and one-way platforms', implemented: true },
        { id: 'collectibles', name: 'Item Collection', complexity: 'simple', description: 'Collectible items and power-ups', implemented: true },
        { id: 'hazards', name: 'Hazard Avoidance', complexity: 'medium', description: 'Spikes, enemies, and traps', implemented: true }
      ],
      levels: [
        {
          id: 'tutorial-level',
          name: 'First Steps',
          objectives: ['Learn basic movement', 'Collect 5 items', 'Reach the exit'],
          difficulty: 1,
          mechanics: ['running', 'jumping', 'platforms', 'collectibles'],
          estimated_playtime: 300,
          status: 'design'
        },
        {
          id: 'forest-adventure',
          name: 'Forest Trek',
          objectives: ['Navigate forest platforms', 'Avoid all hazards', 'Find secret areas'],
          difficulty: 3,
          mechanics: ['running', 'jumping', 'platforms', 'collectibles', 'hazards'],
          estimated_playtime: 600,
          status: 'design'
        },
        {
          id: 'castle-challenge',
          name: 'Castle Conquest',
          objectives: ['Master precise jumping', 'Defeat mini-boss', 'Collect artifact piece'],
          difficulty: 5,
          mechanics: ['running', 'jumping', 'platforms', 'collectibles', 'hazards'],
          estimated_playtime: 900,
          status: 'design'
        }
      ]
    }
  },
  
  customizationOptions: {
    themes: [
      {
        id: 'fantasy-adventure',
        name: 'Fantasy Adventure',
        description: 'Medieval fantasy world with knights and magic',
        assetOverrides: {
          'player-sprites': '/templates/platformer/knight-hero.png',
          'platform-tiles': '/templates/platformer/stone-platforms.png'
        },
        colorScheme: {
          primary: '#8B4513',
          secondary: '#228B22',
          accent: '#FFD700'
        }
      },
      {
        id: 'sci-fi-explorer',
        name: 'Sci-Fi Explorer',
        description: 'Futuristic space station with high-tech platforms',
        assetOverrides: {
          'player-sprites': '/templates/platformer/space-hero.png',
          'platform-tiles': '/templates/platformer/tech-platforms.png'
        },
        colorScheme: {
          primary: '#2F4F4F',
          secondary: '#00CED1',
          accent: '#FF6347'
        }
      },
      {
        id: 'jungle-explorer',
        name: 'Jungle Explorer',
        description: 'Tropical jungle adventure with natural platforms',
        assetOverrides: {
          'player-sprites': '/templates/platformer/explorer-hero.png',
          'platform-tiles': '/templates/platformer/wood-platforms.png'
        },
        colorScheme: {
          primary: '#006400',
          secondary: '#8FBC8F',
          accent: '#FF8C00'
        }
      }
    ],
    mechanics: [
      {
        id: 'double-jump',
        name: 'Double Jump Ability',
        description: 'Allow player to jump twice in mid-air',
        codeModifications: ['add-double-jump-logic', 'add-jump-counter'],
        requiredAssets: ['double-jump-effects', 'air-jump-sounds']
      },
      {
        id: 'wall-jumping',
        name: 'Wall Jumping',
        description: 'Jump off walls for advanced platforming',
        codeModifications: ['add-wall-detection', 'add-wall-jump-mechanics'],
        requiredAssets: ['wall-jump-animations', 'wall-slide-effects']
      },
      {
        id: 'moving-platforms',
        name: 'Moving Platforms',
        description: 'Platforms that move in patterns',
        codeModifications: ['add-platform-movement', 'add-player-platform-sync'],
        requiredAssets: ['moving-platform-sprites', 'gear-animations']
      },
      {
        id: 'enemies',
        name: 'Enemy Characters',
        description: 'AI-controlled enemies with different behaviors',
        codeModifications: ['add-enemy-ai', 'add-combat-system'],
        requiredAssets: ['enemy-sprites', 'combat-effects']
      }
    ],
    visuals: [
      {
        id: 'parallax-background',
        name: 'Parallax Scrolling',
        description: 'Multi-layer backgrounds that scroll at different speeds',
        cssModifications: ['add-parallax-layers'],
        assetFilters: ['background-layers']
      },
      {
        id: 'particle-effects',
        name: 'Particle Effects',
        description: 'Visual effects for jumps, landings, and collections',
        cssModifications: ['add-particle-system'],
        assetFilters: ['particle-sprites']
      },
      {
        id: 'screen-transitions',
        name: 'Screen Transitions',
        description: 'Smooth transitions between levels and screens',
        cssModifications: ['add-transition-effects'],
        assetFilters: []
      }
    ],
    difficulty: [
      {
        id: 'easy',
        name: 'Casual Adventure',
        parameterAdjustments: {
          moveSpeed: 6,
          jumpForce: -15,
          gravity: 0.6
        }
      },
      {
        id: 'normal',
        name: 'Classic Platformer',
        parameterAdjustments: {
          moveSpeed: 5,
          jumpForce: -12,
          gravity: 0.8
        }
      },
      {
        id: 'hard',
        name: 'Precision Challenge',
        parameterAdjustments: {
          moveSpeed: 4,
          jumpForce: -10,
          gravity: 1.0
        }
      }
    ]
  },
  
  codeTemplates: {
    mainGameFile: `
class {{THEME_NAME}}PlatformerGame {
  constructor(config = {}) {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas?.getContext('2d')
    
    if (!this.canvas || !this.ctx) {
      console.error('Canvas not found')
      return
    }
    
    // Game settings
    this.width = this.canvas.width || 1000
    this.height = this.canvas.height || 600
    
    // Physics constants
    this.gravity = config.gravity || {{GRAVITY}}
    this.friction = config.friction || {{FRICTION}}
    this.moveSpeed = config.moveSpeed || {{MOVE_SPEED}}
    this.jumpForce = config.jumpForce || {{JUMP_FORCE}}
    
    // Game state
    this.gameState = 'playing'
    this.score = 0
    this.lives = 3
    this.currentLevel = 1
    
    // Player
    this.player = {
      x: 100,
      y: 300,
      width: 32,
      height: 48,
      velocityX: 0,
      velocityY: 0,
      grounded: false,
      health: 100,
      maxHealth: 100,
      invulnerable: false,
      invulnerabilityTimer: 0
    }
    
    // Camera
    this.camera = {
      x: 0,
      y: 0
    }
    
    // Input
    this.keys = {}
    
    // Game objects
    this.platforms = []
    this.hazards = []
    this.collectibles = []
    this.particles = []
    
    // Theme
    this.theme = config.theme || '{{THEME_ID}}'
    this.loadTheme()
    
    this.init()
  }
  
  loadTheme() {
    const themes = {
      'fantasy-adventure': {
        name: 'Fantasy Adventure',
        hero: 'Knight Hero',
        kingdom: 'Medieval Kingdom',
        setting: 'enchanted forests and stone castles',
        movement: 'heroic leaping',
        jump: 'mighty bounds',
        artifact: 'Golden Crown',
        platforms: 'ancient stone',
        colors: {
          background: '#87CEEB',
          player: '#4169E1',
          platforms: '#8B4513',
          collectibles: '#FFD700',
          hazards: '#DC143C'
        }
      },
      'sci-fi-explorer': {
        name: 'Sci-Fi Explorer',
        hero: 'Space Marine',
        kingdom: 'Space Colony',
        setting: 'futuristic space stations',
        movement: 'anti-gravity jumping',
        jump: 'boost thrusters',
        artifact: 'Power Core',
        platforms: 'metal grating',
        colors: {
          background: '#2F4F4F',
          player: '#00CED1',
          platforms: '#696969',
          collectibles: '#00FF00',
          hazards: '#FF4500'
        }
      },
      'jungle-explorer': {
        name: 'Jungle Explorer',
        hero: 'Adventure Explorer',
        kingdom: 'Hidden Temple',
        setting: 'dense tropical jungles',
        movement: 'agile climbing',
        jump: 'vine swinging',
        artifact: 'Ancient Idol',
        platforms: 'wooden bridges',
        colors: {
          background: '#228B22',
          player: '#D2691E',
          platforms: '#8B4513',
          collectibles: '#FF8C00',
          hazards: '#B22222'
        }
      }
    }
    
    this.themeData = themes[this.theme] || themes['fantasy-adventure']
  }
  
  init() {
    this.setupUI()
    this.generateLevel()
    this.bindEvents()
    this.gameLoop()
  }
  
  setupUI() {
    const gameArea = document.getElementById('game-area')
    if (!gameArea) return
    
    gameArea.innerHTML = \`
      <div class="platformer-game-container">
        <header class="game-header">
          <h1>\${this.themeData.name}</h1>
          <div class="game-stats">
            <div class="stat">Score: <span id="score">\${this.score}</span></div>
            <div class="stat">Lives: <span id="lives">\${this.lives}</span></div>
            <div class="stat">Level: <span id="level">\${this.currentLevel}</span></div>
          </div>
        </header>
        
        <div class="game-canvas-container">
          <canvas id="gameCanvas" width="\${this.width}" height="\${this.height}"></canvas>
          <div class="health-bar">
            <div class="health-fill" id="health-fill" style="width: 100%"></div>
          </div>
        </div>
        
        <div class="game-controls">
          <div class="controls-info">
            <h3>Controls</h3>
            <p><strong>A/D or Arrow Keys:</strong> Move left/right</p>
            <p><strong>W or Space:</strong> Jump</p>
            <p><strong>P:</strong> Pause game</p>
          </div>
          <div class="objective-info">
            <h3>Objective</h3>
            <p>Navigate the \${this.themeData.setting}</p>
            <p>Collect treasures and reach the exit</p>
            <p>Find the legendary \${this.themeData.artifact}</p>
          </div>
        </div>
      </div>
    \`
    
    // Re-get canvas after DOM update
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas?.getContext('2d')
  }
  
  generateLevel() {
    // Clear existing objects
    this.platforms = []
    this.hazards = []
    this.collectibles = []
    
    // Generate platforms
    // Ground platforms
    for (let x = 0; x < 2000; x += 100) {
      this.platforms.push({
        x: x,
        y: this.height - 50,
        width: 100,
        height: 50,
        type: 'solid'
      })
    }
    
    // Floating platforms
    const platformPositions = [
      { x: 200, y: 450, width: 120, height: 20 },
      { x: 400, y: 350, width: 100, height: 20 },
      { x: 600, y: 400, width: 80, height: 20 },
      { x: 800, y: 300, width: 120, height: 20 },
      { x: 1000, y: 250, width: 100, height: 20 },
      { x: 1200, y: 350, width: 150, height: 20 },
      { x: 1400, y: 200, width: 100, height: 20 },
      { x: 1600, y: 400, width: 120, height: 20 }
    ]
    
    platformPositions.forEach(pos => {
      this.platforms.push({
        ...pos,
        type: 'solid'
      })
    })
    
    // Generate hazards (spikes)
    const hazardPositions = [
      { x: 350, y: this.height - 80 },
      { x: 550, y: this.height - 80 },
      { x: 750, y: this.height - 80 },
      { x: 1100, y: this.height - 80 }
    ]
    
    hazardPositions.forEach(pos => {
      this.hazards.push({
        x: pos.x,
        y: pos.y,
        width: 30,
        height: 30,
        damage: 25
      })
    })
    
    // Generate collectibles
    const collectiblePositions = [
      { x: 250, y: 420, type: 'coin', value: 10 },
      { x: 450, y: 320, type: 'coin', value: 10 },
      { x: 650, y: 370, type: 'gem', value: 25 },
      { x: 850, y: 270, type: 'coin', value: 10 },
      { x: 1050, y: 220, type: 'powerup', value: 50 },
      { x: 1250, y: 320, type: 'coin', value: 10 },
      { x: 1450, y: 170, type: 'gem', value: 25 },
      { x: 1650, y: 370, type: 'artifact', value: 100 }
    ]
    
    collectiblePositions.forEach(pos => {
      this.collectibles.push({
        x: pos.x,
        y: pos.y,
        width: 20,
        height: 20,
        type: pos.type,
        value: pos.value,
        collected: false
      })
    })
  }
  
  bindEvents() {
    // Keyboard input
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      
      if (e.code === 'KeyP') {
        this.togglePause()
      }
    })
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
    
    // Prevent arrow key scrolling
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })
  }
  
  handleInput() {
    if (this.gameState !== 'playing') return
    
    const player = this.player
    
    // Horizontal movement
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      player.velocityX = -this.moveSpeed
    } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      player.velocityX = this.moveSpeed
    } else if (player.grounded) {
      player.velocityX *= this.friction
    }
    
    // Jumping
    if ((this.keys['KeyW'] || this.keys['Space'] || this.keys['ArrowUp']) && player.grounded) {
      player.velocityY = this.jumpForce
      player.grounded = false
      console.log('🔊 Jump sound effect')
    }
  }
  
  update() {
    if (this.gameState !== 'playing') return
    
    this.handleInput()
    this.updatePlayer()
    this.updateCamera()
    this.updateParticles()
    this.checkCollisions()
    this.updateUI()
  }
  
  updatePlayer() {
    const player = this.player
    
    // Apply gravity
    if (!player.grounded) {
      player.velocityY += this.gravity
    }
    
    // Terminal velocity
    if (player.velocityY > 15) {
      player.velocityY = 15
    }
    
    // Update position
    player.x += player.velocityX
    player.y += player.velocityY
    
    // Handle invulnerability
    if (player.invulnerable) {
      player.invulnerabilityTimer--
      if (player.invulnerabilityTimer <= 0) {
        player.invulnerable = false
      }
    }
    
    // Keep player in bounds
    if (player.x < 0) player.x = 0
    
    // Fall death
    if (player.y > this.height + 100) {
      this.playerDied()
    }
  }
  
  updateCamera() {
    const targetX = this.player.x - this.width * 0.3
    this.camera.x += (targetX - this.camera.x) * 0.1
    
    // Keep camera in bounds
    this.camera.x = Math.max(0, this.camera.x)
    this.camera.x = Math.min(2000 - this.width, this.camera.x)
  }
  
  updateParticles() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.velocityX
      particle.y += particle.velocityY
      particle.velocityY += 0.2 // gravity on particles
      particle.life--
      return particle.life > 0
    })
  }
  
  checkCollisions() {
    const player = this.player
    player.grounded = false
    
    // Platform collisions
    this.platforms.forEach(platform => {
      if (this.isColliding(player, platform)) {
        this.resolvePlatformCollision(player, platform)
      }
    })
    
    // Hazard collisions
    if (!player.invulnerable) {
      this.hazards.forEach(hazard => {
        if (this.isColliding(player, hazard)) {
          this.playerTakeDamage(hazard.damage)
        }
      })
    }
    
    // Collectible collisions
    this.collectibles.forEach(collectible => {
      if (!collectible.collected && this.isColliding(player, collectible)) {
        this.collectItem(collectible)
      }
    })
  }
  
  isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  }
  
  resolvePlatformCollision(player, platform) {
    const overlapX = Math.min(
      player.x + player.width - platform.x,
      platform.x + platform.width - player.x
    )
    const overlapY = Math.min(
      player.y + player.height - platform.y,
      platform.y + platform.height - player.y
    )
    
    if (overlapX < overlapY) {
      // Horizontal collision
      if (player.x < platform.x) {
        player.x = platform.x - player.width
      } else {
        player.x = platform.x + platform.width
      }
      player.velocityX = 0
    } else {
      // Vertical collision
      if (player.y < platform.y) {
        // Landing on top
        player.y = platform.y - player.height
        player.velocityY = 0
        player.grounded = true
      } else {
        // Hitting from below
        player.y = platform.y + platform.height
        player.velocityY = 0
      }
    }
  }
  
  collectItem(collectible) {
    collectible.collected = true
    this.score += collectible.value
    
    // Create particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: collectible.x + collectible.width / 2,
        y: collectible.y + collectible.height / 2,
        velocityX: (Math.random() - 0.5) * 6,
        velocityY: (Math.random() - 0.5) * 6,
        life: 30,
        color: this.themeData.colors.collectibles
      })
    }
    
    console.log('🔊 Collect sound effect')
    
    if (collectible.type === 'artifact') {
      this.levelComplete()
    }
  }
  
  playerTakeDamage(damage) {
    this.player.health -= damage
    this.player.invulnerable = true
    this.player.invulnerabilityTimer = 120 // 2 seconds at 60fps
    
    // Knockback
    this.player.velocityY = -8
    
    console.log('🔊 Hurt sound effect')
    
    if (this.player.health <= 0) {
      this.playerDied()
    }
  }
  
  playerDied() {
    this.lives--
    
    if (this.lives <= 0) {
      this.gameOver()
    } else {
      this.respawnPlayer()
    }
  }
  
  respawnPlayer() {
    this.player.x = 100
    this.player.y = 300
    this.player.velocityX = 0
    this.player.velocityY = 0
    this.player.health = this.player.maxHealth
    this.player.invulnerable = true
    this.player.invulnerabilityTimer = 120
  }
  
  levelComplete() {
    this.gameState = 'levelComplete'
    console.log('Level Complete!')
    // Level complete logic would go here
  }
  
  gameOver() {
    this.gameState = 'gameOver'
    console.log('Game Over!')
    // Game over logic would go here
  }
  
  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused'
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing'
    }
  }
  
  updateUI() {
    // Update score
    const scoreEl = document.getElementById('score')
    if (scoreEl) scoreEl.textContent = this.score
    
    // Update lives
    const livesEl = document.getElementById('lives')
    if (livesEl) livesEl.textContent = this.lives
    
    // Update health bar
    const healthFill = document.getElementById('health-fill')
    if (healthFill) {
      const healthPercent = (this.player.health / this.player.maxHealth) * 100
      healthFill.style.width = healthPercent + '%'
      
      // Color based on health
      if (healthPercent > 60) {
        healthFill.style.backgroundColor = '#00FF00'
      } else if (healthPercent > 30) {
        healthFill.style.backgroundColor = '#FFFF00'
      } else {
        healthFill.style.backgroundColor = '#FF0000'
      }
    }
  }
  
  draw() {
    if (!this.ctx) return
    
    // Clear canvas
    this.ctx.fillStyle = this.themeData.colors.background
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // Save context for camera transform
    this.ctx.save()
    this.ctx.translate(-this.camera.x, -this.camera.y)
    
    // Draw background elements
    this.drawBackground()
    
    // Draw platforms
    this.drawPlatforms()
    
    // Draw hazards
    this.drawHazards()
    
    // Draw collectibles
    this.drawCollectibles()
    
    // Draw player
    this.drawPlayer()
    
    // Draw particles
    this.drawParticles()
    
    // Restore context
    this.ctx.restore()
    
    // Draw UI (not affected by camera)
    this.drawUI()
  }
  
  drawBackground() {
    // Simple gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, this.lightenColor(this.themeData.colors.background, 30))
    gradient.addColorStop(1, this.themeData.colors.background)
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, 2000, this.height)
    
    // Background decorations
    this.ctx.fillStyle = this.lightenColor(this.themeData.colors.background, 10)
    for (let x = 0; x < 2000; x += 200) {
      this.ctx.fillRect(x + 50, 100, 30, 150)
      this.ctx.fillRect(x + 150, 200, 25, 100)
    }
  }
  
  drawPlatforms() {
    this.ctx.fillStyle = this.themeData.colors.platforms
    
    this.platforms.forEach(platform => {
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      
      // Platform highlight
      this.ctx.fillStyle = this.lightenColor(this.themeData.colors.platforms, 20)
      this.ctx.fillRect(platform.x, platform.y, platform.width, 5)
      this.ctx.fillStyle = this.themeData.colors.platforms
    })
  }
  
  drawHazards() {
    this.ctx.fillStyle = this.themeData.colors.hazards
    
    this.hazards.forEach(hazard => {
      // Draw spikes as triangles
      this.ctx.beginPath()
      this.ctx.moveTo(hazard.x, hazard.y + hazard.height)
      this.ctx.lineTo(hazard.x + hazard.width / 2, hazard.y)
      this.ctx.lineTo(hazard.x + hazard.width, hazard.y + hazard.height)
      this.ctx.closePath()
      this.ctx.fill()
    })
  }
  
  drawCollectibles() {
    this.collectibles.forEach(collectible => {
      if (collectible.collected) return
      
      let color = this.themeData.colors.collectibles
      if (collectible.type === 'gem') color = '#FF1493'
      if (collectible.type === 'artifact') color = '#9400D3'
      
      this.ctx.fillStyle = color
      
      // Draw as circles with animation
      const time = Date.now() * 0.005
      const bounce = Math.sin(time + collectible.x * 0.01) * 3
      
      this.ctx.beginPath()
      this.ctx.arc(
        collectible.x + collectible.width / 2,
        collectible.y + collectible.height / 2 + bounce,
        collectible.width / 2,
        0,
        2 * Math.PI
      )
      this.ctx.fill()
      
      // Sparkle effect
      if (collectible.type === 'artifact') {
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.beginPath()
        this.ctx.arc(
          collectible.x + collectible.width / 2 - 3,
          collectible.y + collectible.height / 2 - 3 + bounce,
          2,
          0,
          2 * Math.PI
        )
        this.ctx.fill()
      }
    })
  }
  
  drawPlayer() {
    const player = this.player
    
    // Player blinks when invulnerable
    if (player.invulnerable && Math.floor(player.invulnerabilityTimer / 5) % 2) {
      return
    }
    
    this.ctx.fillStyle = this.themeData.colors.player
    this.ctx.fillRect(player.x, player.y, player.width, player.height)
    
    // Player face
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.beginPath()
    this.ctx.arc(player.x + 8, player.y + 12, 3, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.beginPath()
    this.ctx.arc(player.x + 24, player.y + 12, 3, 0, 2 * Math.PI)
    this.ctx.fill()
    
    // Direction indicator
    if (player.velocityX > 0) {
      this.ctx.fillStyle = '#000000'
      this.ctx.fillRect(player.x + 20, player.y + 20, 8, 4)
    } else if (player.velocityX < 0) {
      this.ctx.fillStyle = '#000000'
      this.ctx.fillRect(player.x + 4, player.y + 20, 8, 4)
    }
  }
  
  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.fillStyle = particle.color
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI)
      this.ctx.fill()
    })
  }
  
  drawUI() {
    if (this.gameState === 'paused') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      this.ctx.fillRect(0, 0, this.width, this.height)
      
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.font = '48px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('PAUSED', this.width / 2, this.height / 2)
      this.ctx.font = '24px Arial'
      this.ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 50)
    }
  }
  
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, (num >> 16) + amt)
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt)
    const B = Math.min(255, (num & 0x0000FF) + amt)
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }
  
  gameLoop() {
    this.update()
    this.draw()
    requestAnimationFrame(() => this.gameLoop())
  }
}

// Initialize the game
const game = new {{THEME_NAME}}PlatformerGame({
  theme: '{{SELECTED_THEME}}',
  gravity: {{GRAVITY}},
  moveSpeed: {{MOVE_SPEED}},
  jumpForce: {{JUMP_FORCE}},
  friction: {{FRICTION}}
})
`,
    htmlTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{GAME_TITLE}}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body class="{{THEME_CLASS}}">
    <div id="game-area" class="game-area">
        <!-- Game content will be dynamically generated -->
    </div>
    
    <script src="game.js"></script>
</body>
</html>
`,
    cssTemplate: `
body {
  margin: 0;
  padding: 0;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}});
  color: white;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

.platformer-game-container {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 3px solid {{ACCENT_COLOR}};
  max-width: 1100px;
  width: 100%;
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.game-header h1 {
  font-size: 2.5em;
  margin: 0 0 15px 0;
  color: {{ACCENT_COLOR}};
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  font-weight: bold;
}

.game-stats {
  display: flex;
  justify-content: space-around;
  font-size: 1.2em;
  font-weight: bold;
}

.stat {
  color: {{ACCENT_COLOR}};
}

.game-canvas-container {
  position: relative;
  display: inline-block;
  border: 4px solid {{ACCENT_COLOR}};
  border-radius: 15px;
  background: #000;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
  width: 100%;
  max-width: 1000px;
}

#gameCanvas {
  display: block;
  border-radius: 11px;
  width: 100%;
  max-width: 1000px;
  height: auto;
}

.health-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 200px;
  height: 20px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid {{ACCENT_COLOR}};
  border-radius: 10px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: #00FF00;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 8px;
}

.game-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-top: 25px;
  padding-top: 25px;
  border-top: 3px solid {{ACCENT_COLOR}};
}

.controls-info, .objective-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.controls-info h3, .objective-info h3 {
  margin-top: 0;
  color: {{ACCENT_COLOR}};
  border-bottom: 2px solid {{ACCENT_COLOR}};
  padding-bottom: 8px;
  font-size: 1.3em;
}

.controls-info p, .objective-info p {
  margin: 8px 0;
  line-height: 1.5;
  font-size: 1.1em;
}

.controls-info strong {
  color: {{ACCENT_COLOR}};
}

/* Game screen overlays */
.game-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  border-radius: 11px;
  text-align: center;
}

.game-screen h2 {
  font-size: 3em;
  margin: 0 0 20px 0;
  color: {{ACCENT_COLOR}};
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.hidden {
  display: none !important;
}

/* Responsive Design */
@media (max-width: 1100px) {
  .platformer-game-container {
    padding: 15px;
    margin: 10px;
  }
}

@media (max-width: 800px) {
  .game-header h1 {
    font-size: 2em;
  }
  
  .game-stats {
    font-size: 1em;
  }
  
  .game-controls {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .health-bar {
    width: 150px;
    height: 15px;
  }
}

@media (max-width: 600px) {
  body {
    align-items: flex-start;
    padding-top: 10px;
  }
  
  .game-header h1 {
    font-size: 1.8em;
  }
  
  .controls-info, .objective-info {
    padding: 15px;
  }
  
  .health-bar {
    width: 120px;
    height: 12px;
  }
}

/* Mobile touch optimizations */
@media (hover: none) and (pointer: coarse) {
  #gameCanvas {
    cursor: none;
  }
}

/* Theme: {{THEME_NAME}} */
.{{THEME_CLASS}} {
  --primary-color: {{PRIMARY_COLOR}};
  --secondary-color: {{SECONDARY_COLOR}};
  --accent-color: {{ACCENT_COLOR}};
}
`,
    configFile: `
const PLATFORMER_CONFIG = {
  version: '1.0.0',
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  
  gameplay: {
    gravity: {{GRAVITY}},
    moveSpeed: {{MOVE_SPEED}},
    jumpForce: {{JUMP_FORCE}},
    friction: {{FRICTION}},
    canvasWidth: 1000,
    canvasHeight: 600
  },
  
  themes: {
    'fantasy-adventure': {
      name: 'Fantasy Adventure',
      hero: 'Knight Hero',
      kingdom: 'Medieval Kingdom'
    },
    'sci-fi-explorer': {
      name: 'Sci-Fi Explorer', 
      hero: 'Space Marine',
      kingdom: 'Space Colony'
    },
    'jungle-explorer': {
      name: 'Jungle Explorer',
      hero: 'Adventure Explorer',
      kingdom: 'Hidden Temple'
    }
  }
}
`,
    additionalFiles: {
      'README.md': `
# {{GAME_TITLE}}

A {{THEME_NAME}} side-scrolling platformer adventure with jumping mechanics and exploration.

## How to Play

1. **Move** using A/D keys or arrow keys
2. **Jump** with W key or spacebar  
3. **Collect** treasures and power-ups
4. **Avoid** hazards like spikes and enemies
5. **Reach** the exit to complete each level

## Game Features

- **Theme**: {{SELECTED_THEME_NAME}}
- **Difficulty**: {{SELECTED_DIFFICULTY_NAME}}
- **Physics**: Gravity {{GRAVITY}}, Jump {{JUMP_FORCE}}, Speed {{MOVE_SPEED}}
- **Health System**: Take damage and regenerate over time
- **Collectibles**: Coins, gems, and special artifacts
- **Progressive Levels**: Multiple themed environments

## Controls

- **A/D or Arrow Keys**: Move left and right
- **W or Spacebar**: Jump (variable height based on hold time)
- **P**: Pause/unpause game

## Game Mechanics

### Movement System
- Smooth horizontal movement with momentum
- Variable jump height based on input duration
- Ground friction and air resistance
- Wall collision detection

### Physics Engine
- Realistic gravity simulation
- Platform collision resolution
- Hazard interaction system
- Collectible magnetism effects

### Health & Lives
- Health bar with visual feedback
- Temporary invulnerability after taking damage
- Multiple lives system with respawn points
- Health regeneration over time

### Level Design
- Hand-crafted platform layouts
- Strategic hazard placement
- Hidden collectible locations
- Progressive difficulty scaling

## Strategy Tips

1. **Time Your Jumps**: Learn the precise timing for each gap
2. **Explore Thoroughly**: Search for hidden collectibles and secrets
3. **Master the Physics**: Use momentum for longer jumps
4. **Watch Your Health**: Avoid unnecessary risks when low on health

Embark on the ultimate {{THEME_NAME}} adventure!
      `
    }
  },
  
  generationConfig: {
    storyPromptTemplate: 'Create an adventure platformer story for {{THEME_NAME}} featuring {{THEME_HERO}} in {{THEME_SETTING}} seeking {{THEME_ARTIFACT}}',
    assetPromptTemplate: 'Generate {{THEME_NAME}} platformer assets: {{THEME_HERO}} sprites, {{THEME_PLATFORMS}}, {{THEME_SETTING}} backgrounds, collectibles',
    gameplayPromptTemplate: 'Design platformer mechanics with {{SELECTED_DIFFICULTY}} difficulty, {{GRAVITY}} gravity, {{MOVE_SPEED}} movement speed',
    variableReplacements: {
      '{{THEME_NAME}}': 'Fantasy Adventure',
      '{{THEME_HERO}}': 'Knight Hero',
      '{{THEME_KINGDOM}}': 'Medieval Kingdom',
      '{{THEME_SETTING}}': 'enchanted forests and stone castles',
      '{{THEME_MOVEMENT}}': 'heroic leaping',
      '{{THEME_JUMP}}': 'mighty bounds',
      '{{THEME_ARTIFACT}}': 'Golden Crown',
      '{{THEME_PLATFORMS}}': 'ancient stone platforms',
      '{{GRAVITY}}': '0.8',
      '{{MOVE_SPEED}}': '5',
      '{{JUMP_FORCE}}': '-12',
      '{{FRICTION}}': '0.8'
    }
  }
}
