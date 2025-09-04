import { RealGameTemplate } from '../realTemplateGenerator'

export const flappyBirdTemplate: RealGameTemplate = {
  id: 'flappy-bird',
  name: 'Flappy Bird Style Game',
  description: 'Create an endless flying game with physics-based movement and obstacles',
  category: 'beginner', 
  complexity: 'beginner',
  estimatedTime: '40 minutes',
  tags: ['endless-runner', 'physics', 'arcade', 'mobile-friendly'],
  
  gameStructure: {
    gameType: 'flappy',
    framework: 'html5-canvas', 
    coreLoop: 'Tap → Flap → Navigate Obstacles → Score → Repeat',
    scenes: [
      {
        id: 'flight-arena',
        name: 'Flight Arena',
        type: 'game',
        requiredAssets: ['flying-character', 'obstacles', 'background-layers', 'ground'],
        codeSnippet: `
class FlightArena {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.obstacles = []
    this.scrollSpeed = 2
    this.backgroundLayers = []
  }
  
  update() {
    this.scrollBackground()
    this.updateObstacles()
    this.spawnObstacles()
  }
}`
      },
      {
        id: 'flying-character',
        name: 'Flying Character',
        type: 'game',
        requiredAssets: ['character-sprites', 'flap-animation', 'collision-mask'],
        codeSnippet: `
class FlyingCharacter {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.velocity = 0
    this.gravity = 0.5
    this.flapStrength = -8
    this.rotation = 0
  }
  
  flap() {
    this.velocity = this.flapStrength
  }
  
  update() {
    this.velocity += this.gravity
    this.y += this.velocity
    this.rotation = Math.max(-25, Math.min(25, this.velocity * 3))
  }
}`
      },
      {
        id: 'obstacle-system',
        name: 'Obstacle System',
        type: 'game',
        requiredAssets: ['pipe-sprites', 'gap-indicators', 'collision-zones'],
        codeSnippet: `
class ObstacleSystem {
  constructor() {
    this.obstacles = []
    this.spawnRate = 120
    this.spawnTimer = 0
    this.gapSize = 150
  }
  
  spawnObstacle() {
    const gapPosition = Math.random() * (this.arenaHeight - this.gapSize)
    this.obstacles.push({
      x: this.arenaWidth,
      topHeight: gapPosition,
      bottomY: gapPosition + this.gapSize,
      passed: false
    })
  }
}`
      }
    ],
    mechanics: [
      {
        id: 'physics-movement',
        name: 'Physics-Based Movement',
        description: 'Gravity and momentum-based flight mechanics',
        parameters: [
          { name: 'gravity', type: 'number', defaultValue: 0.5, description: 'Downward acceleration force', customizable: true },
          { name: 'flapStrength', type: 'number', defaultValue: -8, description: 'Upward velocity on flap', customizable: true },
          { name: 'maxVelocity', type: 'number', defaultValue: 10, description: 'Terminal velocity limit', customizable: true }
        ],
        codeImplementation: `
function updatePhysics() {
  this.character.velocity += this.gravity
  
  if (this.character.velocity > this.maxVelocity) {
    this.character.velocity = this.maxVelocity
  }
  
  this.character.y += this.character.velocity
  
  // Update rotation based on velocity
  this.character.rotation = Math.max(-25, Math.min(25, this.character.velocity * 3))
}`
      },
      {
        id: 'obstacle-generation',
        name: 'Procedural Obstacles',
        description: 'Dynamic obstacle spawning with varying gaps',
        parameters: [
          { name: 'spawnRate', type: 'number', defaultValue: 120, description: 'Frames between obstacle spawns', customizable: true },
          { name: 'gapSize', type: 'number', defaultValue: 150, description: 'Size of gap between obstacles', customizable: true },
          { name: 'obstacleSpeed', type: 'number', defaultValue: 2, description: 'Horizontal movement speed', customizable: true }
        ],
        codeImplementation: `
function generateObstacles() {
  this.spawnTimer++
  
  if (this.spawnTimer >= this.spawnRate) {
    const minGapY = 50
    const maxGapY = this.height - this.gapSize - 50
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY
    
    this.obstacles.push({
      x: this.width,
      topHeight: gapY,
      bottomY: gapY + this.gapSize,
      bottomHeight: this.height - (gapY + this.gapSize),
      passed: false
    })
    
    this.spawnTimer = 0
  }
}`
      },
      {
        id: 'collision-detection',
        name: 'Collision Detection',
        description: 'Precise collision detection for obstacles and boundaries',
        parameters: [
          { name: 'collisionPadding', type: 'number', defaultValue: 2, description: 'Collision box padding in pixels', customizable: true },
          { name: 'forgivingCollision', type: 'boolean', defaultValue: false, description: 'Allow slight overlap before collision', customizable: true }
        ],
        codeImplementation: `
function checkCollisions() {
  const char = this.character
  const padding = this.collisionPadding
  
  // Boundary collisions
  if (char.y <= 0 || char.y >= this.height - char.height) {
    return true
  }
  
  // Obstacle collisions
  for (let obstacle of this.obstacles) {
    if (char.x + char.width > obstacle.x + padding &&
        char.x < obstacle.x + obstacle.width - padding) {
      
      if (char.y < obstacle.topHeight - padding ||
          char.y + char.height > obstacle.bottomY + padding) {
        return true
      }
    }
  }
  
  return false
}`
      },
      {
        id: 'endless-scrolling',
        name: 'Endless Scrolling',
        description: 'Infinite background scrolling with parallax layers',
        parameters: [
          { name: 'scrollSpeed', type: 'number', defaultValue: 2, description: 'Background scroll speed', customizable: true },
          { name: 'parallaxLayers', type: 'number', defaultValue: 3, description: 'Number of parallax background layers', customizable: true }
        ],
        codeImplementation: `
function updateScrolling() {
  this.backgroundLayers.forEach((layer, index) => {
    layer.x -= this.scrollSpeed * (1 - index * 0.2)
    
    if (layer.x <= -layer.width) {
      layer.x = 0
    }
  })
  
  // Update obstacles
  this.obstacles = this.obstacles.filter(obstacle => {
    obstacle.x -= this.scrollSpeed
    return obstacle.x > -obstacle.width
  })
}`
      }
    ]
  },
  
  prebuiltContent: {
    story: {
      worldLore: {
        id: 'flying-world',
        name: '{{THEME_NAME}} Skies',
        geography: 'Endless {{THEME_SETTING}} stretching beyond the horizon',
        politics: 'Only the most skilled {{THEME_CHARACTER}} can navigate these treacherous skies',
        culture: 'Ancient art of {{THEME_FLYING}} passed down through generations',
        history: 'Legends tell of {{THEME_CHARACTER}} who flew beyond the clouds',
        technology: 'Mysterious {{THEME_OBSTACLES}} that challenge even the bravest flyers',
        magic: 'The power of {{THEME_FLAP}} that defies gravity itself'
      },
      mainStoryArc: {
        id: 'endless-journey',
        title: 'The Infinite Flight',
        description: '{{THEME_CHARACTER}} embarks on an endless journey through {{THEME_SETTING}}',
        acts: [],
        themes: ['perseverance', 'skill', 'endless-challenge'],
        tone: 'light' as const
      },
      chapters: [],
      characters: [
        {
          id: 'player-character',
          name: '{{THEME_CHARACTER}}',
          description: 'A brave {{THEME_CHARACTER}} with mastery of {{THEME_FLYING}}',
          role: 'protagonist' as const,
          relationships: []
        }
      ],
      factions: [],
      subplots: [],
      timeline: [],
      metadata: {
        genre: 'endless-runner',
        targetAudience: 'all-ages',
        complexity: 'simple' as const,
        estimatedLength: 'short' as const,
        themes: ['skill', 'persistence', 'rhythm'],
        contentWarnings: []
      }
    },
    assets: {
      art: ['flying-character', 'obstacle-pipes', 'background-layers', 'ground-texture', 'particle-effects'],
      audio: ['flap-sound', 'score-sound', 'collision-sound', 'background-ambience'],
      ui: ['score-counter', 'game-over-screen', 'start-button', 'best-score-display']
    },
    gameplay: {
      mechanics: [
        { id: 'tap-to-flap', name: 'Tap Controls', complexity: 'simple', description: 'Single tap/click to flap wings', implemented: true },
        { id: 'physics', name: 'Physics Simulation', complexity: 'medium', description: 'Gravity and momentum', implemented: true },
        { id: 'obstacles', name: 'Obstacle Navigation', complexity: 'medium', description: 'Navigate through gaps', implemented: true },
        { id: 'scoring', name: 'Distance Scoring', complexity: 'simple', description: 'Score based on obstacles passed', implemented: true }
      ],
      levels: [
        {
          id: 'beginner-flight',
          name: 'First Flight',
          objectives: ['Pass 5 obstacles', 'Stay airborne for 30 seconds', 'Score 50 points'],
          difficulty: 1,
          mechanics: ['tap-to-flap', 'physics', 'obstacles'],
          estimated_playtime: 120,
          status: 'design'
        },
        {
          id: 'skilled-pilot',
          name: 'Skilled Pilot',
          objectives: ['Pass 25 obstacles', 'Achieve perfect rhythm', 'Score 250 points'],
          difficulty: 3,
          mechanics: ['tap-to-flap', 'physics', 'obstacles', 'scoring'],
          estimated_playtime: 300,
          status: 'design'
        },
        {
          id: 'sky-master',
          name: 'Master of the Skies',
          objectives: ['Pass 100 obstacles', 'Maintain steady altitude', 'Score 1000 points'],
          difficulty: 5,
          mechanics: ['tap-to-flap', 'physics', 'obstacles', 'scoring'],
          estimated_playtime: 600,
          status: 'design'
        }
      ]
    }
  },
  
  customizationOptions: {
    themes: [
      {
        id: 'classic-bird',
        name: 'Classic Bird',
        description: 'Traditional yellow bird flying through green pipes',
        assetOverrides: {
          'flying-character': '/templates/flappy/classic-bird.png',
          'obstacle-pipes': '/templates/flappy/classic-pipes.png'
        },
        colorScheme: {
          primary: '#70C5CE',
          secondary: '#FAD5A5', 
          accent: '#FFFF00'
        }
      },
      {
        id: 'space-explorer',
        name: 'Space Explorer',
        description: 'Rocket ship navigating through cosmic obstacles',
        assetOverrides: {
          'flying-character': '/templates/flappy/rocket-ship.png',
          'obstacle-pipes': '/templates/flappy/space-debris.png'
        },
        colorScheme: {
          primary: '#1a0033',
          secondary: '#4d0099',
          accent: '#00ffff'
        }
      },
      {
        id: 'underwater',
        name: 'Deep Sea Adventure',
        description: 'Fish swimming through coral reefs and sea plants',
        assetOverrides: {
          'flying-character': '/templates/flappy/tropical-fish.png',
          'obstacle-pipes': '/templates/flappy/coral-reefs.png'
        },
        colorScheme: {
          primary: '#004466',
          secondary: '#0099cc',
          accent: '#ff6600'
        }
      }
    ],
    mechanics: [
      {
        id: 'power-ups',
        name: 'Power-Up System',
        description: 'Collectible power-ups that provide temporary abilities',
        codeModifications: ['add-power-up-spawning', 'add-temporary-effects'],
        requiredAssets: ['power-up-sprites', 'effect-animations']
      },
      {
        id: 'combo-system',
        name: 'Combo Scoring',
        description: 'Score multipliers for consecutive successful passes',
        codeModifications: ['add-combo-tracking', 'add-score-multipliers'],
        requiredAssets: ['combo-ui', 'multiplier-effects']
      },
      {
        id: 'ghost-mode',
        name: 'Ghost Replay',
        description: 'Show ghost of best run to compete against',
        codeModifications: ['add-replay-recording', 'add-ghost-rendering'],
        requiredAssets: ['ghost-character', 'trail-effects']
      }
    ],
    visuals: [
      {
        id: 'particle-trails',
        name: 'Particle Trails',
        description: 'Visual trail effects behind the flying character',
        cssModifications: ['add-particle-trail-system'],
        assetFilters: ['particle-textures']
      },
      {
        id: 'screen-juice',
        name: 'Screen Juice Effects',
        description: 'Screen shake, flash, and impact feedback',
        cssModifications: ['add-screen-effects'],
        assetFilters: []
      },
      {
        id: 'parallax-background',
        name: 'Parallax Scrolling',
        description: 'Multiple background layers scrolling at different speeds',
        cssModifications: ['add-parallax-layers'],
        assetFilters: ['background-layers']
      }
    ],
    difficulty: [
      {
        id: 'easy',
        name: 'Gentle Breeze',
        parameterAdjustments: {
          gravity: 0.3,
          gapSize: 180,
          spawnRate: 150
        }
      },
      {
        id: 'normal',
        name: 'Steady Wind',
        parameterAdjustments: {
          gravity: 0.5,
          gapSize: 150,
          spawnRate: 120
        }
      },
      {
        id: 'hard',
        name: 'Storm Winds',
        parameterAdjustments: {
          gravity: 0.7,
          gapSize: 120,
          spawnRate: 90
        }
      }
    ]
  },
  
  codeTemplates: {
    mainGameFile: `
class {{THEME_NAME}}FlappyGame {
  constructor(config = {}) {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas?.getContext('2d')
    
    if (!this.canvas || !this.ctx) {
      console.error('Canvas not found')
      return
    }
    
    // Game dimensions
    this.width = this.canvas.width || 800
    this.height = this.canvas.height || 600
    
    // Game state
    this.gameState = 'ready' // ready, playing, gameOver
    this.score = 0
    this.bestScore = parseInt(localStorage.getItem('flappyBestScore')) || 0
    
    // Character
    this.character = {
      x: 100,
      y: this.height / 2,
      width: 40,
      height: 30,
      velocity: 0,
      rotation: 0
    }
    
    // Game settings
    this.gravity = config.gravity || {{GRAVITY}}
    this.flapStrength = config.flapStrength || {{FLAP_STRENGTH}}
    this.scrollSpeed = config.scrollSpeed || {{SCROLL_SPEED}}
    this.gapSize = config.gapSize || {{GAP_SIZE}}
    this.spawnRate = config.spawnRate || {{SPAWN_RATE}}
    
    // Game objects
    this.obstacles = []
    this.backgroundLayers = []
    this.spawnTimer = 0
    
    // Theme
    this.theme = config.theme || '{{THEME_ID}}'
    this.loadTheme()
    
    this.init()
  }
  
  loadTheme() {
    const themes = {
      'classic-bird': {
        name: 'Classic Bird',
        character: 'Yellow Bird',
        obstacles: 'Green Pipes',
        setting: 'sunny skies',
        flying: 'flapping wings',
        flap: 'wing beats',
        colors: {
          background: '#70C5CE',
          character: '#FFFF00',
          obstacles: '#228B22',
          ground: '#DEB887'
        }
      },
      'space-explorer': {
        name: 'Space Explorer',
        character: 'Rocket Ship',
        obstacles: 'Space Debris',
        setting: 'cosmic void',
        flying: 'rocket propulsion',
        flap: 'engine thrust',
        colors: {
          background: '#1a0033',
          character: '#00ffff',
          obstacles: '#666666',
          ground: '#333333'
        }
      },
      'underwater': {
        name: 'Deep Sea',
        character: 'Tropical Fish',
        obstacles: 'Coral Reefs',
        setting: 'ocean depths',
        flying: 'swimming',
        flap: 'fin strokes',
        colors: {
          background: '#004466',
          character: '#ff6600',
          obstacles: '#ff69b4',
          ground: '#8B4513'
        }
      }
    }
    
    this.themeData = themes[this.theme] || themes['classic-bird']
  }
  
  init() {
    this.setupUI()
    this.initializeBackgrounds()
    this.bindEvents()
    this.gameLoop()
  }
  
  setupUI() {
    const gameArea = document.getElementById('game-area')
    if (!gameArea) return
    
    gameArea.innerHTML = \`
      <div class="flappy-game-container">
        <header class="game-header">
          <h1>\${this.themeData.name} Flight</h1>
          <div class="score-display">
            <div class="current-score">Score: <span id="current-score">\${this.score}</span></div>
            <div class="best-score">Best: <span id="best-score">\${this.bestScore}</span></div>
          </div>
        </header>
        
        <div class="game-canvas-container">
          <canvas id="gameCanvas" width="\${this.width}" height="\${this.height}"></canvas>
          <div id="ready-screen" class="game-screen ready-screen">
            <h2>Ready to Fly?</h2>
            <p>Tap or click to flap your \${this.themeData.flying}</p>
            <p>Navigate through the \${this.themeData.obstacles.toLowerCase()}</p>
            <button id="start-btn" class="game-button">Start Flight</button>
          </div>
          <div id="game-over-screen" class="game-screen game-over-screen hidden">
            <h2>Flight Ended!</h2>
            <p>Final Score: <span id="final-score">0</span></p>
            <p id="new-best" class="hidden">New Best Score!</p>
            <button id="restart-btn" class="game-button">Fly Again</button>
          </div>
        </div>
        
        <div class="game-info">
          <div class="controls-info">
            <h3>Controls</h3>
            <p><strong>Click/Tap:</strong> Flap wings</p>
            <p><strong>Spacebar:</strong> Flap wings</p>
            <p><strong>R:</strong> Restart game</p>
          </div>
          <div class="game-stats">
            <h3>Flight Stats</h3>
            <p>Altitude: <span id="altitude">50%</span></p>
            <p>Velocity: <span id="velocity">0</span></p>
            <p>Distance: <span id="distance">0</span></p>
          </div>
        </div>
      </div>
    \`
    
    // Re-get canvas after DOM update
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas?.getContext('2d')
  }
  
  initializeBackgrounds() {
    // Create parallax background layers
    for (let i = 0; i < 3; i++) {
      this.backgroundLayers.push({
        x: 0,
        width: this.width,
        speed: 1 + i * 0.5
      })
    }
  }
  
  bindEvents() {
    // Click/tap controls
    this.canvas?.addEventListener('click', () => this.handleInput())
    this.canvas?.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.handleInput()
    })
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        this.handleInput()
      }
      if (e.code === 'KeyR') {
        this.restart()
      }
    })
    
    // UI buttons
    document.getElementById('start-btn')?.addEventListener('click', () => this.startGame())
    document.getElementById('restart-btn')?.addEventListener('click', () => this.restart())
  }
  
  handleInput() {
    if (this.gameState === 'ready') {
      this.startGame()
    } else if (this.gameState === 'playing') {
      this.flap()
    } else if (this.gameState === 'gameOver') {
      this.restart()
    }
  }
  
  startGame() {
    this.gameState = 'playing'
    document.getElementById('ready-screen')?.classList.add('hidden')
  }
  
  flap() {
    this.character.velocity = this.flapStrength
    
    // Visual feedback
    this.character.rotation = -20
    
    // Sound effect would go here
    console.log('🔊 Flap sound effect')
  }
  
  update() {
    if (this.gameState !== 'playing') return
    
    // Update character physics
    this.character.velocity += this.gravity
    this.character.y += this.character.velocity
    
    // Update rotation based on velocity
    this.character.rotation = Math.max(-25, Math.min(25, this.character.velocity * 3))
    
    // Boundary checking
    if (this.character.y <= 0 || this.character.y + this.character.height >= this.height - 50) {
      this.endGame()
      return
    }
    
    // Update obstacles
    this.updateObstacles()
    
    // Spawn new obstacles
    this.spawnObstacles()
    
    // Check collisions
    if (this.checkCollisions()) {
      this.endGame()
      return
    }
    
    // Update score
    this.updateScore()
    
    // Update UI
    this.updateUI()
  }
  
  updateObstacles() {
    // Move obstacles left
    this.obstacles.forEach(obstacle => {
      obstacle.x -= this.scrollSpeed
    })
    
    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(obstacle => obstacle.x > -100)
  }
  
  spawnObstacles() {
    this.spawnTimer++
    
    if (this.spawnTimer >= this.spawnRate) {
      const minGapY = 80
      const maxGapY = this.height - this.gapSize - 100
      const gapY = Math.random() * (maxGapY - minGapY) + minGapY
      
      this.obstacles.push({
        x: this.width,
        topHeight: gapY,
        bottomY: gapY + this.gapSize,
        bottomHeight: this.height - (gapY + this.gapSize) - 50,
        width: 80,
        passed: false
      })
      
      this.spawnTimer = 0
    }
  }
  
  checkCollisions() {
    const char = this.character
    
    for (let obstacle of this.obstacles) {
      // Check if character is within obstacle x bounds
      if (char.x + char.width > obstacle.x && char.x < obstacle.x + obstacle.width) {
        // Check if character is hitting top or bottom obstacle
        if (char.y < obstacle.topHeight || char.y + char.height > obstacle.bottomY) {
          return true
        }
      }
    }
    
    return false
  }
  
  updateScore() {
    this.obstacles.forEach(obstacle => {
      if (!obstacle.passed && obstacle.x + obstacle.width < this.character.x) {
        obstacle.passed = true
        this.score++
        console.log('🔊 Score sound effect')
      }
    })
  }
  
  updateUI() {
    // Update score display
    const currentScoreEl = document.getElementById('current-score')
    if (currentScoreEl) currentScoreEl.textContent = this.score
    
    // Update stats
    const altitude = Math.round((1 - this.character.y / this.height) * 100)
    const altitudeEl = document.getElementById('altitude')
    if (altitudeEl) altitudeEl.textContent = altitude + '%'
    
    const velocityEl = document.getElementById('velocity')
    if (velocityEl) velocityEl.textContent = Math.round(Math.abs(this.character.velocity))
    
    const distanceEl = document.getElementById('distance')
    if (distanceEl) distanceEl.textContent = this.score
  }
  
  draw() {
    if (!this.ctx) return
    
    // Clear canvas
    this.ctx.fillStyle = this.themeData.colors.background
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // Draw background layers (parallax effect)
    this.drawBackground()
    
    // Draw obstacles
    this.drawObstacles()
    
    // Draw ground
    this.drawGround()
    
    // Draw character
    this.drawCharacter()
    
    // Draw UI elements
    this.drawUI()
  }
  
  drawBackground() {
    // Simple gradient background with moving elements
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, this.lightenColor(this.themeData.colors.background, 30))
    gradient.addColorStop(1, this.themeData.colors.background)
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height - 50)
    
    // Moving background elements
    this.ctx.fillStyle = this.lightenColor(this.themeData.colors.background, 10)
    for (let i = 0; i < 5; i++) {
      const x = (Date.now() * 0.01 * (i + 1)) % (this.width + 100) - 100
      this.ctx.fillRect(x, 50 + i * 100, 60, 30)
    }
  }
  
  drawObstacles() {
    this.obstacles.forEach(obstacle => {
      this.ctx.fillStyle = this.themeData.colors.obstacles
      
      // Top obstacle
      this.ctx.fillRect(obstacle.x, 0, obstacle.width, obstacle.topHeight)
      
      // Bottom obstacle
      this.ctx.fillRect(
        obstacle.x,
        obstacle.bottomY,
        obstacle.width,
        obstacle.bottomHeight
      )
      
      // Obstacle highlights
      this.ctx.fillStyle = this.lightenColor(this.themeData.colors.obstacles, 20)
      this.ctx.fillRect(obstacle.x, 0, 5, obstacle.topHeight)
      this.ctx.fillRect(obstacle.x, obstacle.bottomY, 5, obstacle.bottomHeight)
    })
  }
  
  drawGround() {
    this.ctx.fillStyle = this.themeData.colors.ground
    this.ctx.fillRect(0, this.height - 50, this.width, 50)
    
    // Ground texture
    this.ctx.fillStyle = this.darkenColor(this.themeData.colors.ground, 20)
    for (let x = 0; x < this.width; x += 20) {
      this.ctx.fillRect(x, this.height - 50, 10, 5)
    }
  }
  
  drawCharacter() {
    const char = this.character
    
    this.ctx.save()
    this.ctx.translate(char.x + char.width / 2, char.y + char.height / 2)
    this.ctx.rotate((char.rotation * Math.PI) / 180)
    
    // Character body
    this.ctx.fillStyle = this.themeData.colors.character
    this.ctx.fillRect(-char.width / 2, -char.height / 2, char.width, char.height)
    
    // Character details (eyes, etc.)
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.beginPath()
    this.ctx.arc(-5, -5, 4, 0, 2 * Math.PI)
    this.ctx.fill()
    
    this.ctx.fillStyle = '#000000'
    this.ctx.beginPath()
    this.ctx.arc(-5, -5, 2, 0, 2 * Math.PI)
    this.ctx.fill()
    
    this.ctx.restore()
  }
  
  drawUI() {
    // Score display on canvas
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.score.toString(), this.width / 2, 80)
    
    // Shadow for better visibility
    this.ctx.fillStyle = '#000000'
    this.ctx.fillText(this.score.toString(), this.width / 2 + 2, 82)
  }
  
  endGame() {
    this.gameState = 'gameOver'
    
    // Update best score
    if (this.score > this.bestScore) {
      this.bestScore = this.score
      localStorage.setItem('flappyBestScore', this.bestScore.toString())
      document.getElementById('new-best')?.classList.remove('hidden')
    }
    
    // Show game over screen
    const gameOverScreen = document.getElementById('game-over-screen')
    const finalScore = document.getElementById('final-score')
    const bestScore = document.getElementById('best-score')
    
    if (gameOverScreen) gameOverScreen.classList.remove('hidden')
    if (finalScore) finalScore.textContent = this.score
    if (bestScore) bestScore.textContent = this.bestScore
    
    console.log('🔊 Game over sound effect')
  }
  
  restart() {
    // Reset game state
    this.gameState = 'ready'
    this.score = 0
    this.character = {
      x: 100,
      y: this.height / 2,
      width: 40,
      height: 30,
      velocity: 0,
      rotation: 0
    }
    this.obstacles = []
    this.spawnTimer = 0
    
    // Hide screens
    document.getElementById('game-over-screen')?.classList.add('hidden')
    document.getElementById('ready-screen')?.classList.remove('hidden')
    document.getElementById('new-best')?.classList.add('hidden')
    
    // Reset UI
    this.updateUI()
  }
  
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, (num >> 16) + amt)
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt)
    const B = Math.min(255, (num & 0x0000FF) + amt)
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }
  
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, (num >> 16) - amt)
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt)
    const B = Math.max(0, (num & 0x0000FF) - amt)
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }
  
  gameLoop() {
    this.update()
    this.draw()
    requestAnimationFrame(() => this.gameLoop())
  }
}

// Initialize the game
const game = new {{THEME_NAME}}FlappyGame({
  theme: '{{SELECTED_THEME}}',
  gravity: {{GRAVITY}},
  flapStrength: {{FLAP_STRENGTH}},
  gapSize: {{GAP_SIZE}},
  spawnRate: {{SPAWN_RATE}},
  scrollSpeed: {{SCROLL_SPEED}}
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
  overflow: hidden;
}

.flappy-game-container {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 3px solid {{ACCENT_COLOR}};
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.game-header h1 {
  font-size: 2.5em;
  margin: 0;
  color: {{ACCENT_COLOR}};
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  font-weight: bold;
}

.score-display {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  font-size: 1.3em;
  font-weight: bold;
}

.current-score {
  color: {{ACCENT_COLOR}};
}

.best-score {
  color: #FFD700;
}

.game-canvas-container {
  position: relative;
  display: inline-block;
  border: 4px solid {{ACCENT_COLOR}};
  border-radius: 15px;
  background: #000;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
}

#gameCanvas {
  display: block;
  border-radius: 11px;
  cursor: pointer;
}

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

.game-screen p {
  font-size: 1.4em;
  margin: 10px 0;
  opacity: 0.9;
}

.game-button {
  background: linear-gradient(145deg, {{ACCENT_COLOR}}, {{PRIMARY_COLOR}});
  border: none;
  border-radius: 15px;
  padding: 20px 40px;
  font-size: 1.3em;
  color: white;
  cursor: pointer;
  margin-top: 25px;
  transition: all 0.2s ease;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  font-weight: bold;
}

.game-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
}

.game-button:active {
  transform: translateY(0);
}

.game-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-top: 25px;
  padding-top: 25px;
  border-top: 3px solid {{ACCENT_COLOR}};
}

.controls-info, .game-stats {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.controls-info h3, .game-stats h3 {
  margin-top: 0;
  color: {{ACCENT_COLOR}};
  border-bottom: 2px solid {{ACCENT_COLOR}};
  padding-bottom: 8px;
  font-size: 1.3em;
}

.controls-info p, .game-stats p {
  margin: 8px 0;
  line-height: 1.5;
  font-size: 1.1em;
}

.controls-info strong {
  color: {{ACCENT_COLOR}};
}

.game-stats span {
  color: {{ACCENT_COLOR}};
  font-weight: bold;
}

.hidden {
  display: none !important;
}

#new-best {
  color: #FFD700;
  font-weight: bold;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
  animation: goldGlow 2s ease-in-out infinite;
}

@keyframes goldGlow {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* Mobile optimizations */
@media (max-width: 900px) {
  .flappy-game-container {
    padding: 15px;
    margin: 10px;
  }
  
  .game-header h1 {
    font-size: 2em;
  }
  
  .score-display {
    font-size: 1.1em;
  }
  
  .game-info {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  #gameCanvas {
    max-width: 100%;
    height: auto;
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
  
  .game-screen h2 {
    font-size: 2.5em;
  }
  
  .game-screen p {
    font-size: 1.2em;
  }
  
  .game-button {
    padding: 15px 30px;
    font-size: 1.1em;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  #gameCanvas {
    cursor: none;
  }
  
  .game-button:hover {
    transform: none;
  }
  
  .game-button:active {
    transform: scale(0.95);
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
const FLAPPY_CONFIG = {
  version: '1.0.0',
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  
  gameplay: {
    gravity: {{GRAVITY}},
    flapStrength: {{FLAP_STRENGTH}},
    scrollSpeed: {{SCROLL_SPEED}},
    gapSize: {{GAP_SIZE}},
    spawnRate: {{SPAWN_RATE}},
    canvasWidth: 800,
    canvasHeight: 600
  },
  
  themes: {
    'classic-bird': {
      name: 'Classic Bird',
      character: 'Yellow Bird',
      obstacles: 'Green Pipes'
    },
    'space-explorer': {
      name: 'Space Explorer',
      character: 'Rocket Ship',
      obstacles: 'Space Debris'
    },
    'underwater': {
      name: 'Deep Sea',
      character: 'Tropical Fish',
      obstacles: 'Coral Reefs'
    }
  }
}
`,
    additionalFiles: {
      'README.md': `
# {{GAME_TITLE}}

A {{THEME_NAME}}-themed endless flying game with physics-based controls and procedural obstacles.

## How to Play

1. **Click or Tap** to flap wings and stay airborne
2. **Navigate** through gaps between obstacles
3. **Survive** as long as possible to achieve high scores
4. **Master** the rhythm of flight for perfect control

## Game Features

- **Theme**: {{SELECTED_THEME_NAME}}
- **Difficulty**: {{SELECTED_DIFFICULTY_NAME}}
- **Physics**: Gravity {{GRAVITY}}, Flap {{FLAP_STRENGTH}}
- **Obstacles**: Gap size {{GAP_SIZE}}, Spawn rate {{SPAWN_RATE}}
- **Responsive**: Mobile-friendly touch controls
- **Progression**: High score tracking and achievements

## Controls

- **Click/Tap**: Flap wings (primary control)
- **Spacebar**: Alternative flap control
- **R Key**: Restart game after game over

## Game Mechanics

### Physics System
- Gravity constantly pulls character down
- Flap provides upward momentum
- Realistic momentum and rotation effects
- Smooth character animation

### Obstacle Generation
- Procedurally generated obstacle patterns
- Varying gap positions for challenge
- Horizontal scrolling at constant speed
- Progressive difficulty scaling

### Scoring System
- One point per obstacle successfully passed
- High score tracking with local storage
- Performance statistics tracking
- Achievement milestones

### Visual Effects
- Parallax background scrolling
- Character rotation based on velocity
- Smooth animations and transitions
- Theme-appropriate visual styling

## Strategy Tips

1. **Find Your Rhythm**: Develop consistent flap timing
2. **Stay Centered**: Aim for middle of gaps when possible
3. **Don't Panic**: Avoid rapid flapping in tight spots
4. **Practice Patience**: Consistent play beats aggressive flying

Soar to new heights as the ultimate {{THEME_CHARACTER}}!
      `
    }
  },
  
  generationConfig: {
    storyPromptTemplate: 'Create an endless flight story for {{THEME_NAME}} featuring {{THEME_CHARACTER}} using {{THEME_FLYING}} through {{THEME_SETTING}}',
    assetPromptTemplate: 'Generate {{THEME_NAME}} flying game assets: {{THEME_CHARACTER}} sprites, {{THEME_OBSTACLES}}, {{THEME_SETTING}} backgrounds, particle effects',
    gameplayPromptTemplate: 'Design flappy mechanics with {{SELECTED_DIFFICULTY}} difficulty, {{GRAVITY}} gravity, {{GAP_SIZE}} gap size',
    variableReplacements: {
      '{{THEME_NAME}}': 'Classic Bird',
      '{{THEME_CHARACTER}}': 'Yellow Bird',
      '{{THEME_OBSTACLES}}': 'Green Pipes',
      '{{THEME_SETTING}}': 'sunny skies',
      '{{THEME_FLYING}}': 'wing flapping',
      '{{THEME_FLAP}}': 'wing beats',
      '{{GRAVITY}}': '0.5',
      '{{FLAP_STRENGTH}}': '-8',
      '{{SCROLL_SPEED}}': '2',
      '{{GAP_SIZE}}': '150',
      '{{SPAWN_RATE}}': '120'
    }
  }
}
