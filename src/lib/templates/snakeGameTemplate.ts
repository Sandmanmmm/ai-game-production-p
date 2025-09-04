import { RealGameTemplate } from '../realTemplateGenerator'

export const snakeGameTemplate: RealGameTemplate = {
  id: 'snake-game',
  name: 'Snake Game',
  description: 'Create a classic arcade-style snake game with modern enhancements',
  category: 'beginner',
  complexity: 'beginner',
  estimatedTime: '45 minutes',
  tags: ['arcade', 'classic', 'snake', 'retro'],
  
  gameStructure: {
    gameType: 'snake',
    framework: 'html5-canvas',
    coreLoop: 'Move → Collect Food → Grow → Avoid Walls/Self → Score',
    scenes: [
      {
        id: 'game-arena',
        name: 'Game Arena',
        type: 'game',
        requiredAssets: ['snake-head', 'snake-body', 'food-items', 'arena-background'],
        codeSnippet: `
class SnakeGameArena {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.grid = this.createGrid()
  }
  
  createGrid() {
    const grid = []
    for (let y = 0; y < this.height; y++) {
      grid[y] = new Array(this.width).fill(0)
    }
    return grid
  }
}`
      },
      {
        id: 'snake-entity',
        name: 'Snake Entity',
        type: 'game',
        requiredAssets: ['snake-segments', 'movement-animations'],
        codeSnippet: `
class Snake {
  constructor(x, y) {
    this.body = [{ x, y }]
    this.direction = { x: 1, y: 0 }
    this.growing = false
  }
  
  move() {
    const head = { ...this.body[0] }
    head.x += this.direction.x
    head.y += this.direction.y
    this.body.unshift(head)
    
    if (!this.growing) {
      this.body.pop()
    } else {
      this.growing = false
    }
  }
}`
      },
      {
        id: 'food-system',
        name: 'Food System',
        type: 'game',
        requiredAssets: ['food-sprites', 'collection-effects'],
        codeSnippet: `
class FoodSystem {
  constructor(arena) {
    this.arena = arena
    this.foods = []
    this.spawnFood()
  }
  
  spawnFood() {
    let x, y
    do {
      x = Math.floor(Math.random() * this.arena.width)
      y = Math.floor(Math.random() * this.arena.height)
    } while (this.arena.isOccupied(x, y))
    
    this.foods.push({ x, y, type: 'normal' })
  }
}`
      }
    ],
    mechanics: [
      {
        id: 'snake-movement',
        name: 'Snake Movement',
        description: 'Directional movement with smooth animation',
        parameters: [
          { name: 'speed', type: 'number', defaultValue: 150, description: 'Movement speed in milliseconds', customizable: true },
          { name: 'smoothMovement', type: 'boolean', defaultValue: false, description: 'Enable smooth animation', customizable: true }
        ],
        codeImplementation: `
function moveSnake() {
  if (this.gameOver) return
  
  const head = { ...this.snake.body[0] }
  head.x += this.snake.direction.x
  head.y += this.snake.direction.y
  
  // Boundary checking
  if (head.x < 0 || head.x >= this.arena.width || 
      head.y < 0 || head.y >= this.arena.height) {
    this.gameOver = true
    return
  }
  
  // Self collision
  if (this.snake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
    this.gameOver = true
    return
  }
  
  this.snake.body.unshift(head)
  
  if (!this.snake.growing) {
    this.snake.body.pop()
  } else {
    this.snake.growing = false
  }
}`
      },
      {
        id: 'collision-detection',
        name: 'Collision Detection',
        description: 'Detect collisions with food, walls, and self',
        parameters: [
          { name: 'wallBounce', type: 'boolean', defaultValue: false, description: 'Bounce off walls instead of dying', customizable: true },
          { name: 'selfInvulnerable', type: 'boolean', defaultValue: false, description: 'Allow passing through self', customizable: true }
        ],
        codeImplementation: `
function checkCollisions() {
  const head = this.snake.body[0]
  
  // Food collision
  const foodIndex = this.foods.findIndex(food => 
    food.x === head.x && food.y === head.y
  )
  
  if (foodIndex !== -1) {
    this.collectFood(this.foods[foodIndex])
    this.foods.splice(foodIndex, 1)
    this.spawnFood()
  }
  
  // Wall collision
  if (!this.wallBounce && (head.x < 0 || head.x >= this.width || 
      head.y < 0 || head.y >= this.height)) {
    this.gameOver = true
  }
  
  // Self collision
  if (!this.selfInvulnerable && 
      this.snake.body.slice(1).some(segment => 
        segment.x === head.x && segment.y === head.y)) {
    this.gameOver = true
  }
}`
      },
      {
        id: 'scoring-system',
        name: 'Scoring System',
        description: 'Score calculation with multipliers and bonuses',
        parameters: [
          { name: 'baseScore', type: 'number', defaultValue: 10, description: 'Points per food item', customizable: true },
          { name: 'lengthMultiplier', type: 'number', defaultValue: 1, description: 'Score multiplier per snake segment', customizable: true },
          { name: 'speedBonus', type: 'boolean', defaultValue: true, description: 'Bonus points for high speed', customizable: true }
        ],
        codeImplementation: `
function calculateScore(food) {
  let score = this.baseScore
  
  if (this.lengthMultiplier > 1) {
    score *= Math.pow(this.lengthMultiplier, this.snake.body.length - 1)
  }
  
  if (this.speedBonus && this.speed < 100) {
    score *= 2 // Speed bonus
  }
  
  if (food.type === 'bonus') {
    score *= 5
  }
  
  this.score += score
  return score
}`
      }
    ]
  },
  
  prebuiltContent: {
    story: {
      worldLore: {
        id: 'snake-world',
        name: '{{THEME_NAME}} Realm',
        geography: 'A boundless {{THEME_SETTING}} where {{THEME_SNAKE}} roams eternally',
        politics: 'Survival of the longest and most cunning',
        culture: 'Ancient traditions of growth through consumption',
        history: 'Tales speak of the first {{THEME_SNAKE}} who achieved infinite length',
        technology: 'Mystical {{THEME_FOOD}} that grants power and size',
        magic: 'The sacred art of {{THEME_MOVEMENT}} without collision'
      },
      mainStoryArc: {
        id: 'growth-saga',
        title: 'The Endless Growth',
        description: 'A {{THEME_SNAKE}} seeks to become the ultimate being through strategic consumption',
        acts: [],
        themes: ['survival', 'growth', 'strategy'],
        tone: 'balanced' as const
      },
      chapters: [],
      characters: [
        {
          id: 'player-snake',
          name: '{{THEME_SNAKE}}',
          description: 'A determined {{THEME_SNAKE}} on a quest for ultimate growth',
          role: 'protagonist' as const,
          relationships: []
        }
      ],
      factions: [],
      subplots: [],
      timeline: [],
      metadata: {
        genre: 'arcade',
        targetAudience: 'all-ages',
        complexity: 'simple' as const,
        estimatedLength: 'short' as const,
        themes: ['survival', 'growth', 'reflex'],
        contentWarnings: []
      }
    },
    assets: {
      art: ['snake-head', 'snake-body', 'food-items', 'arena-grid', 'score-display'],
      audio: ['move-sound', 'eat-sound', 'game-over-sound', 'background-music'],
      ui: ['game-over-screen', 'high-score-display', 'pause-menu', 'controls-info']
    },
    gameplay: {
      mechanics: [
        { id: 'movement', name: 'Directional Movement', complexity: 'simple', description: 'Arrow key snake control', implemented: true },
        { id: 'growth', name: 'Snake Growth', complexity: 'simple', description: 'Grow when eating food', implemented: true },
        { id: 'collision', name: 'Collision Detection', complexity: 'medium', description: 'Wall and self collision', implemented: true },
        { id: 'scoring', name: 'Score Tracking', complexity: 'simple', description: 'Points and high scores', implemented: true }
      ],
      levels: [
        {
          id: 'easy-mode',
          name: 'Garden Snake',
          objectives: ['Reach length 10', 'Score 100 points', 'Survive 60 seconds'],
          difficulty: 1,
          mechanics: ['movement', 'growth', 'collision'],
          estimated_playtime: 180,
          status: 'design'
        },
        {
          id: 'normal-mode',
          name: 'Jungle Serpent',
          objectives: ['Reach length 20', 'Score 500 points', 'Survive 120 seconds'],
          difficulty: 3,
          mechanics: ['movement', 'growth', 'collision', 'scoring'],
          estimated_playtime: 300,
          status: 'design'
        },
        {
          id: 'expert-mode',
          name: 'Ancient Python',
          objectives: ['Reach length 50', 'Score 2000 points', 'Master perfect movement'],
          difficulty: 5,
          mechanics: ['movement', 'growth', 'collision', 'scoring'],
          estimated_playtime: 600,
          status: 'design'
        }
      ]
    }
  },
  
  customizationOptions: {
    themes: [
      {
        id: 'classic',
        name: 'Classic Snake',
        description: 'Traditional green snake with simple graphics',
        assetOverrides: {
          'snake-head': '/templates/snake/classic-head.png',
          'snake-body': '/templates/snake/classic-body.png'
        },
        colorScheme: {
          primary: '#00AA00',
          secondary: '#008800',
          accent: '#FF0000'
        }
      },
      {
        id: 'neon',
        name: 'Neon Cyber Snake',
        description: 'Futuristic neon snake in a digital world',
        assetOverrides: {
          'snake-head': '/templates/snake/neon-head.png',
          'snake-body': '/templates/snake/neon-body.png'
        },
        colorScheme: {
          primary: '#00FFFF',
          secondary: '#FF00FF',
          accent: '#FFFF00'
        }
      },
      {
        id: 'nature',
        name: 'Forest Guardian',
        description: 'Earth-toned snake in a natural forest setting',
        assetOverrides: {
          'snake-head': '/templates/snake/nature-head.png',
          'snake-body': '/templates/snake/nature-body.png'
        },
        colorScheme: {
          primary: '#8B4513',
          secondary: '#228B22',
          accent: '#FF4500'
        }
      }
    ],
    mechanics: [
      {
        id: 'power-ups',
        name: 'Power-Up System',
        description: 'Special foods that grant temporary abilities',
        codeModifications: ['add-power-up-spawning', 'add-effect-system'],
        requiredAssets: ['power-up-sprites', 'effect-animations']
      },
      {
        id: 'multiplayer',
        name: 'Local Multiplayer',
        description: 'Two-player snake competition on same screen',
        codeModifications: ['add-second-player', 'add-split-controls'],
        requiredAssets: ['player2-snake', 'multiplayer-ui']
      },
      {
        id: 'obstacles',
        name: 'Arena Obstacles',
        description: 'Static obstacles that create maze-like challenges',
        codeModifications: ['add-obstacle-generation', 'add-maze-logic'],
        requiredAssets: ['obstacle-sprites', 'maze-backgrounds']
      }
    ],
    visuals: [
      {
        id: 'particle-effects',
        name: 'Particle Effects',
        description: 'Visual effects for eating, movement, and collisions',
        cssModifications: ['add-particle-system'],
        assetFilters: ['particle-textures']
      },
      {
        id: 'smooth-animation',
        name: 'Smooth Movement',
        description: 'Interpolated movement between grid positions',
        cssModifications: ['add-smooth-transitions'],
        assetFilters: []
      },
      {
        id: 'screen-shake',
        name: 'Screen Shake',
        description: 'Camera shake effects for collisions and eating',
        cssModifications: ['add-screen-shake-keyframes'],
        assetFilters: []
      }
    ],
    difficulty: [
      {
        id: 'easy',
        name: 'Garden Snake',
        parameterAdjustments: {
          speed: 200,
          wallBounce: true,
          baseScore: 15
        }
      },
      {
        id: 'normal',
        name: 'Wild Serpent',
        parameterAdjustments: {
          speed: 150,
          wallBounce: false,
          baseScore: 10
        }
      },
      {
        id: 'hard',
        name: 'Viper Master',
        parameterAdjustments: {
          speed: 100,
          wallBounce: false,
          baseScore: 5
        }
      }
    ]
  },
  
  codeTemplates: {
    mainGameFile: `
class {{THEME_NAME}}SnakeGame {
  constructor(config = {}) {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas?.getContext('2d')
    
    if (!this.canvas || !this.ctx) {
      console.error('Canvas not found')
      return
    }
    
    // Game settings
    this.gridSize = 20
    this.canvasWidth = this.canvas.width || 800
    this.canvasHeight = this.canvas.height || 600
    this.cols = Math.floor(this.canvasWidth / this.gridSize)
    this.rows = Math.floor(this.canvasHeight / this.gridSize)
    
    // Game state
    this.snake = {
      body: [{ x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) }],
      direction: { x: 1, y: 0 },
      growing: false
    }
    
    this.food = this.generateFood()
    this.score = 0
    this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0
    this.gameOver = false
    this.gamePaused = false
    
    // Config
    this.speed = config.speed || {{SPEED}}
    this.wallBounce = config.wallBounce || {{WALL_BOUNCE}}
    this.baseScore = config.baseScore || {{BASE_SCORE}}
    this.theme = config.theme || '{{THEME_ID}}'
    
    this.loadTheme()
    this.init()
  }
  
  loadTheme() {
    const themes = {
      classic: {
        name: 'Classic Snake',
        snake: 'Green Serpent',
        food: 'Red Apple',
        setting: 'garden maze',
        movement: 'slithering',
        colors: {
          snake: '#00AA00',
          food: '#FF0000',
          background: '#000000',
          grid: '#333333'
        }
      },
      neon: {
        name: 'Neon Cyber',
        snake: 'Cyber Serpent',
        food: 'Data Cube',
        setting: 'digital matrix',
        movement: 'data streaming',
        colors: {
          snake: '#00FFFF',
          food: '#FFFF00',
          background: '#000033',
          grid: '#003366'
        }
      },
      nature: {
        name: 'Forest Guardian',
        snake: 'Earth Serpent',
        food: 'Forest Berry',
        setting: 'ancient forest',
        movement: 'natural flowing',
        colors: {
          snake: '#8B4513',
          food: '#FF4500',
          background: '#001100',
          grid: '#003300'
        }
      }
    }
    
    this.themeData = themes[this.theme] || themes.classic
  }
  
  init() {
    this.setupUI()
    this.bindEvents()
    this.gameLoop()
  }
  
  setupUI() {
    const gameArea = document.getElementById('game-area')
    if (!gameArea) return
    
    gameArea.innerHTML = \`
      <div class="snake-game-container">
        <header class="game-header">
          <h1>\${this.themeData.name} Game</h1>
          <div class="score-display">
            <div class="current-score">Score: <span id="current-score">\${this.score}</span></div>
            <div class="high-score">High Score: <span id="high-score">\${this.highScore}</span></div>
          </div>
        </header>
        
        <div class="game-canvas-container">
          <canvas id="gameCanvas" width="\${this.canvasWidth}" height="\${this.canvasHeight}"></canvas>
          <div id="game-over-screen" class="game-over-screen hidden">
            <h2>Game Over!</h2>
            <p>Final Score: <span id="final-score">0</span></p>
            <p id="high-score-message" class="hidden">New High Score!</p>
            <button id="restart-btn" class="restart-button">Play Again</button>
          </div>
          <div id="pause-screen" class="pause-screen hidden">
            <h2>Paused</h2>
            <p>Press SPACE to continue</p>
          </div>
        </div>
        
        <div class="game-controls">
          <div class="controls-info">
            <p><strong>Controls:</strong></p>
            <p>Arrow Keys: Move</p>
            <p>Space: Pause/Resume</p>
            <p>R: Restart</p>
          </div>
          <div class="game-stats">
            <p>Length: <span id="snake-length">\${this.snake.body.length}</span></p>
            <p>Speed: <span id="game-speed">\${this.speed}ms</span></p>
          </div>
        </div>
      </div>
    \`
    
    // Re-get canvas reference after DOM update
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas?.getContext('2d')
  }
  
  bindEvents() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e))
    
    const restartBtn = document.getElementById('restart-btn')
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart())
    }
    
    // Prevent arrow key scrolling
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })
  }
  
  handleKeyPress(e) {
    if (this.gameOver && e.code === 'KeyR') {
      this.restart()
      return
    }
    
    if (e.code === 'Space') {
      this.togglePause()
      return
    }
    
    if (this.gamePaused || this.gameOver) return
    
    const head = this.snake.body[0]
    
    switch (e.code) {
      case 'ArrowUp':
        if (this.snake.direction.y === 0) {
          this.snake.direction = { x: 0, y: -1 }
        }
        break
      case 'ArrowDown':
        if (this.snake.direction.y === 0) {
          this.snake.direction = { x: 0, y: 1 }
        }
        break
      case 'ArrowLeft':
        if (this.snake.direction.x === 0) {
          this.snake.direction = { x: -1, y: 0 }
        }
        break
      case 'ArrowRight':
        if (this.snake.direction.x === 0) {
          this.snake.direction = { x: 1, y: 0 }
        }
        break
    }
  }
  
  generateFood() {
    let food
    do {
      food = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows)
      }
    } while (this.snake.body.some(segment => segment.x === food.x && segment.y === food.y))
    
    return food
  }
  
  moveSnake() {
    if (this.gameOver || this.gamePaused) return
    
    const head = { ...this.snake.body[0] }
    head.x += this.snake.direction.x
    head.y += this.snake.direction.y
    
    // Boundary handling
    if (this.wallBounce) {
      if (head.x < 0) head.x = this.cols - 1
      if (head.x >= this.cols) head.x = 0
      if (head.y < 0) head.y = this.rows - 1
      if (head.y >= this.rows) head.y = 0
    } else {
      if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
        this.endGame()
        return
      }
    }
    
    // Self collision
    if (this.snake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.endGame()
      return
    }
    
    this.snake.body.unshift(head)
    
    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.collectFood()
    } else if (!this.snake.growing) {
      this.snake.body.pop()
    } else {
      this.snake.growing = false
    }
  }
  
  collectFood() {
    this.snake.growing = true
    this.score += this.baseScore
    
    // Speed bonus
    if (this.speed < 100) {
      this.score += 5
    }
    
    // Length bonus
    if (this.snake.body.length > 10) {
      this.score += Math.floor(this.snake.body.length / 10)
    }
    
    this.food = this.generateFood()
    this.updateDisplay()
    
    // Increase difficulty slightly
    if (this.speed > 80 && this.snake.body.length % 5 === 0) {
      this.speed = Math.max(80, this.speed - 5)
    }
  }
  
  updateDisplay() {
    const currentScoreEl = document.getElementById('current-score')
    const snakeLengthEl = document.getElementById('snake-length')
    const gameSpeedEl = document.getElementById('game-speed')
    
    if (currentScoreEl) currentScoreEl.textContent = this.score
    if (snakeLengthEl) snakeLengthEl.textContent = this.snake.body.length
    if (gameSpeedEl) gameSpeedEl.textContent = this.speed + 'ms'
  }
  
  draw() {
    if (!this.ctx) return
    
    // Clear canvas
    this.ctx.fillStyle = this.themeData.colors.background
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
    
    // Draw grid
    this.ctx.strokeStyle = this.themeData.colors.grid
    this.ctx.lineWidth = 1
    
    for (let x = 0; x <= this.cols; x++) {
      this.ctx.beginPath()
      this.ctx.moveTo(x * this.gridSize, 0)
      this.ctx.lineTo(x * this.gridSize, this.canvasHeight)
      this.ctx.stroke()
    }
    
    for (let y = 0; y <= this.rows; y++) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y * this.gridSize)
      this.ctx.lineTo(this.canvasWidth, y * this.gridSize)
      this.ctx.stroke()
    }
    
    // Draw snake
    this.snake.body.forEach((segment, index) => {
      this.ctx.fillStyle = index === 0 ? 
        this.lightenColor(this.themeData.colors.snake, 20) : 
        this.themeData.colors.snake
      
      this.ctx.fillRect(
        segment.x * this.gridSize + 1,
        segment.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      )
      
      // Snake head details
      if (index === 0) {
        this.ctx.fillStyle = '#FFFFFF'
        const centerX = segment.x * this.gridSize + this.gridSize / 2
        const centerY = segment.y * this.gridSize + this.gridSize / 2
        
        // Eyes
        this.ctx.beginPath()
        this.ctx.arc(centerX - 3, centerY - 3, 2, 0, 2 * Math.PI)
        this.ctx.fill()
        this.ctx.beginPath()
        this.ctx.arc(centerX + 3, centerY - 3, 2, 0, 2 * Math.PI)
        this.ctx.fill()
      }
    })
    
    // Draw food
    this.ctx.fillStyle = this.themeData.colors.food
    this.ctx.beginPath()
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2,
      this.food.y * this.gridSize + this.gridSize / 2,
      this.gridSize / 2 - 2,
      0,
      2 * Math.PI
    )
    this.ctx.fill()
    
    // Food highlight
    this.ctx.fillStyle = this.lightenColor(this.themeData.colors.food, 40)
    this.ctx.beginPath()
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2 - 2,
      this.food.y * this.gridSize + this.gridSize / 2 - 2,
      3,
      0,
      2 * Math.PI
    )
    this.ctx.fill()
  }
  
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16)
      .slice(1)
  }
  
  togglePause() {
    this.gamePaused = !this.gamePaused
    const pauseScreen = document.getElementById('pause-screen')
    if (pauseScreen) {
      pauseScreen.classList.toggle('hidden', !this.gamePaused)
    }
  }
  
  endGame() {
    this.gameOver = true
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score
      localStorage.setItem('snakeHighScore', this.highScore.toString())
      
      const highScoreMsg = document.getElementById('high-score-message')
      if (highScoreMsg) highScoreMsg.classList.remove('hidden')
    }
    
    // Show game over screen
    const gameOverScreen = document.getElementById('game-over-screen')
    const finalScore = document.getElementById('final-score')
    const highScoreDisplay = document.getElementById('high-score')
    
    if (gameOverScreen) gameOverScreen.classList.remove('hidden')
    if (finalScore) finalScore.textContent = this.score
    if (highScoreDisplay) highScoreDisplay.textContent = this.highScore
  }
  
  restart() {
    this.snake = {
      body: [{ x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) }],
      direction: { x: 1, y: 0 },
      growing: false
    }
    
    this.food = this.generateFood()
    this.score = 0
    this.gameOver = false
    this.gamePaused = false
    this.speed = {{SPEED}}
    
    // Hide screens
    const gameOverScreen = document.getElementById('game-over-screen')
    const pauseScreen = document.getElementById('pause-screen')
    const highScoreMsg = document.getElementById('high-score-message')
    
    if (gameOverScreen) gameOverScreen.classList.add('hidden')
    if (pauseScreen) pauseScreen.classList.add('hidden')
    if (highScoreMsg) highScoreMsg.classList.add('hidden')
    
    this.updateDisplay()
  }
  
  gameLoop() {
    this.moveSnake()
    this.draw()
    setTimeout(() => this.gameLoop(), this.speed)
  }
}

// Initialize the game
const game = new {{THEME_NAME}}SnakeGame({
  theme: '{{SELECTED_THEME}}',
  speed: {{SPEED}},
  wallBounce: {{WALL_BOUNCE}},
  baseScore: {{BASE_SCORE}}
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
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}});
  color: white;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

.snake-game-container {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 2px solid {{ACCENT_COLOR}};
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
  letter-spacing: 2px;
}

.score-display {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 1.2em;
  font-weight: bold;
}

.current-score {
  color: {{ACCENT_COLOR}};
}

.high-score {
  color: #FFD700;
}

.game-canvas-container {
  position: relative;
  display: inline-block;
  border: 3px solid {{ACCENT_COLOR}};
  border-radius: 10px;
  background: #000;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
}

#gameCanvas {
  display: block;
  border-radius: 7px;
}

.game-over-screen, .pause-screen {
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
  border-radius: 7px;
}

.game-over-screen h2, .pause-screen h2 {
  font-size: 3em;
  margin: 0;
  color: {{ACCENT_COLOR}};
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.game-over-screen p, .pause-screen p {
  font-size: 1.5em;
  margin: 10px 0;
}

.restart-button {
  background: linear-gradient(145deg, {{ACCENT_COLOR}}, {{PRIMARY_COLOR}});
  border: none;
  border-radius: 10px;
  padding: 15px 30px;
  font-size: 1.2em;
  color: white;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.restart-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}

.restart-button:active {
  transform: translateY(0);
}

.game-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid {{ACCENT_COLOR}};
}

.controls-info, .game-stats {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  backdrop-filter: blur(5px);
}

.controls-info p, .game-stats p {
  margin: 5px 0;
  line-height: 1.4;
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

#high-score-message {
  color: #FFD700;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* Responsive Design */
@media (max-width: 900px) {
  .snake-game-container {
    padding: 15px;
  }
  
  .game-header h1 {
    font-size: 2em;
  }
  
  .score-display {
    font-size: 1em;
  }
  
  .game-controls {
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
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
  
  .game-header h1 {
    font-size: 1.5em;
  }
  
  .game-over-screen h2 {
    font-size: 2em;
  }
  
  .controls-info, .game-stats {
    padding: 10px;
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
const SNAKE_CONFIG = {
  version: '1.0.0',
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  
  gameplay: {
    speed: {{SPEED}},
    baseScore: {{BASE_SCORE}},
    wallBounce: {{WALL_BOUNCE}},
    gridSize: 20,
    canvasWidth: 800,
    canvasHeight: 600
  },
  
  themes: {
    classic: {
      name: 'Classic Snake',
      snake: 'Green Serpent',
      food: 'Red Apple'
    },
    neon: {
      name: 'Neon Cyber',
      snake: 'Cyber Serpent', 
      food: 'Data Cube'
    },
    nature: {
      name: 'Forest Guardian',
      snake: 'Earth Serpent',
      food: 'Forest Berry'
    }
  }
}
`,
    additionalFiles: {
      'README.md': `
# {{GAME_TITLE}}

A {{THEME_NAME}}-themed snake game with modern features and customizable difficulty.

## How to Play

1. **Move** your snake using arrow keys
2. **Collect Food** to grow longer and earn points
3. **Avoid Collisions** with walls and your own body
4. **Achieve High Scores** and master perfect movement

## Game Features

- **Theme**: {{SELECTED_THEME_NAME}}
- **Difficulty**: {{SELECTED_DIFFICULTY_NAME}}
- **Speed**: {{SPEED}}ms per move
- **Scoring**: {{BASE_SCORE}} points per food
- **Boundaries**: {{WALL_BEHAVIOR}}
- **Auto-Save**: High scores saved locally

## Controls

- **Arrow Keys**: Move snake (Up, Down, Left, Right)
- **Spacebar**: Pause/Resume game
- **R Key**: Restart game (when game over)

## Game Mechanics

### Movement System
- Grid-based movement with {{SPEED}}ms timing
- Direction changes only allowed perpendicular to current direction
- Smooth visual feedback and animations

### Collision Detection
- Wall collision: {{WALL_BEHAVIOR}}
- Self collision: Game over
- Food collision: Snake grows and score increases

### Scoring System
- Base score: {{BASE_SCORE}} points per food
- Speed bonus: Extra points for fast gameplay
- Length bonus: Bonus points for longer snakes
- High score tracking with local storage

### Progressive Difficulty
- Speed increases as snake grows longer
- More challenging movement patterns
- Achievement-based progression

## Strategy Tips

1. **Plan Your Path**: Think several moves ahead
2. **Use the Center**: Stay away from edges when possible  
3. **Create Space**: Don't trap yourself in corners
4. **Speed Control**: Use pause strategically

Become the ultimate {{THEME_SNAKE}} master!
      `
    }
  },
  
  generationConfig: {
    storyPromptTemplate: 'Create an engaging arcade story for {{THEME_NAME}} featuring {{THEME_SNAKE}} in {{THEME_SETTING}} with {{THEME_MOVEMENT}} mechanics',
    assetPromptTemplate: 'Generate {{THEME_NAME}} snake game assets: {{THEME_SNAKE}} sprites, {{THEME_FOOD}} items, {{THEME_SETTING}} backgrounds',
    gameplayPromptTemplate: 'Design snake mechanics with {{SELECTED_DIFFICULTY}} difficulty, {{SPEED}}ms speed, {{WALL_BEHAVIOR}} boundaries',
    variableReplacements: {
      '{{THEME_NAME}}': 'Classic',
      '{{THEME_SNAKE}}': 'Green Snake',
      '{{THEME_FOOD}}': 'Red Apple',
      '{{THEME_SETTING}}': 'grid arena',
      '{{THEME_MOVEMENT}}': 'directional slithering',
      '{{SPEED}}': '150',
      '{{BASE_SCORE}}': '10',
      '{{WALL_BOUNCE}}': 'false',
      '{{WALL_BEHAVIOR}}': 'Game Over on Impact'
    }
  }
}
