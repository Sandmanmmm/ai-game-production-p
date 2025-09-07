import { RealGameTemplate } from './types'

export const snakeTemplate: RealGameTemplate = {
  id: 'snake-classic',
  name: 'Snake Game',
  description: 'Classic snake game with modern features and customization',
  category: 'beginner',
  complexity: 'intermediate',
  estimatedTime: '3-5 hours',
  tags: ['snake', 'arcade', 'classic', 'high-score'],

  gameStructure: {
    gameType: 'snake',
    framework: 'html5-canvas',
    coreLoop: 'Move → Eat Food → Grow → Avoid Walls/Self → Score Points',
    scenes: [
      {
        id: 'main-menu',
        name: 'Main Menu',
        type: 'menu',
        requiredAssets: ['menu-bg', 'menu-music', 'button-sounds'],
        codeSnippet: `
class MainMenu {
  constructor() {
    this.buttons = ['Start Game', 'High Scores', 'Settings']
    this.selectedButton = 0
  }
  
  handleInput(key) {
    switch(key) {
      case 'ArrowUp': this.selectedButton = Math.max(0, this.selectedButton - 1); break
      case 'ArrowDown': this.selectedButton = Math.min(this.buttons.length - 1, this.selectedButton + 1); break
      case 'Enter': this.selectButton(); break
    }
  }
}`
      },
      {
        id: 'game-play',
        name: 'Game Play',
        type: 'game',
        requiredAssets: ['snake-sprites', 'food-sprite', 'eat-sound', 'game-over-sound'],
        codeSnippet: `
class GamePlay {
  constructor() {
    this.snake = [{x: 10, y: 10}]
    this.direction = {x: 1, y: 0}
    this.food = this.generateFood()
    this.score = 0
    this.gameRunning = true
  }
  
  update() {
    if (!this.gameRunning) return
    
    this.moveSnake()
    this.checkCollisions()
    this.checkFoodEaten()
  }
}`
      }
    ],
    mechanics: [
      {
        id: 'movement',
        name: 'Snake Movement',
        description: 'Grid-based movement with direction control',
        parameters: [
          { name: 'speed', type: 'number', defaultValue: 10, description: 'Game speed (moves per second)', customizable: true },
          { name: 'gridSize', type: 'number', defaultValue: 20, description: 'Size of grid cells', customizable: false }
        ],
        codeImplementation: `
class SnakeMovement {
  constructor(gridSize) {
    this.gridSize = gridSize
    this.direction = {x: 1, y: 0}
    this.nextDirection = {x: 1, y: 0}
  }
  
  setDirection(newDirection) {
    // Prevent reversing into self
    if (newDirection.x === -this.direction.x || newDirection.y === -this.direction.y) {
      return false
    }
    this.nextDirection = newDirection
    return true
  }
  
  move(snake) {
    this.direction = this.nextDirection
    const head = {...snake[0]}
    head.x += this.direction.x
    head.y += this.direction.y
    return head
  }
}`
      },
      {
        id: 'collision',
        name: 'Collision Detection',
        description: 'Detect collisions with walls, self, and food',
        parameters: [
          { name: 'wallBounce', type: 'boolean', defaultValue: false, description: 'Allow wrapping through walls', customizable: true }
        ],
        codeImplementation: `
class CollisionSystem {
  constructor(gameWidth, gameHeight, gridSize) {
    this.gameWidth = gameWidth
    this.gameHeight = gameHeight
    this.gridSize = gridSize
  }
  
  checkWallCollision(head) {
    return head.x < 0 || head.x >= this.gameWidth / this.gridSize ||
           head.y < 0 || head.y >= this.gameHeight / this.gridSize
  }
  
  checkSelfCollision(head, snake) {
    return snake.some(segment => segment.x === head.x && segment.y === head.y)
  }
  
  checkFoodCollision(head, food) {
    return head.x === food.x && head.y === food.y
  }
}`
      }
    ]
  },

  prebuiltContent: {
    story: {
      worldLore: {
        id: 'snake-world',
        name: 'The Garden of {{THEME_NAME}}',
        geography: 'A mystical garden where {{THEME_CREATURE}} roam freely',
        politics: 'Ruled by the ancient {{THEME_KEEPER}} who maintains balance',
        culture: 'A society where growth and wisdom come through consumption',
        history: 'The eternal cycle of growth and renewal',
        technology: 'Ancient magic that sustains the garden',
        magic: 'The power of transformation through consumption'
      },
      mainStoryArc: {
        id: 'growth-arc',
        title: 'The Journey of Growth',
        description: 'Guide your {{THEME_CREATURE}} to grow and prosper in the mystical garden',
        acts: [],
        themes: ['growth', 'survival', 'wisdom'],
        tone: 'mystical' as const
      },
      chapters: [],
      characters: [
        {
          id: 'player-snake',
          name: 'The {{THEME_CREATURE}}',
          description: 'A mystical serpent seeking growth and enlightenment',
          role: 'protagonist',
          relationships: []
        },
        {
          id: 'garden-keeper',
          name: 'The {{THEME_KEEPER}}',
          description: 'Ancient guardian who provides wisdom and challenges',
          role: 'mentor',
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
        estimatedLength: 'endless' as const,
        themes: ['growth', 'survival', 'high-score'],
        contentWarnings: []
      }
    },
    assets: {
      art: ['snake-head', 'snake-body', 'food-items', 'background-tiles', 'UI-elements'],
      audio: ['move-sound', 'eat-sound', 'game-over-sound', 'background-ambient', 'high-score-jingle'],
      ui: ['score-display', 'game-over-screen', 'pause-menu', 'settings-panel']
    },
    gameplay: {
      mechanics: [
        { id: 'movement', name: 'Grid Movement', complexity: 'simple', description: 'Move the {{THEME_CREATURE}} around the grid', implemented: true },
        { id: 'growth', name: 'Growth System', complexity: 'simple', description: 'Grow longer by eating {{THEME_FOOD}}', implemented: true },
        { id: 'collision', name: 'Collision Detection', complexity: 'medium', description: 'Avoid walls and self-collision', implemented: true },
        { id: 'scoring', name: 'Scoring System', complexity: 'simple', description: 'Earn points for each {{THEME_FOOD}} consumed', implemented: true }
      ],
      levels: [
        {
          id: 'level-1',
          name: 'First Steps',
          description: 'Learn basic movement and eating',
          objectives: ['Eat 5 {{THEME_FOOD}} items', 'Survive for 30 seconds'],
          rewards: ['Achievement unlock', 'Score multiplier']
        },
        {
          id: 'level-2',
          name: 'Growing Wise',
          description: 'Master advanced movement',
          objectives: ['Reach length of 20', 'Score 500 points'],
          rewards: ['New {{THEME_FOOD}} type', 'Speed boost power-up']
        }
      ]
    }
  },

  customizationOptions: {
    themes: [
      {
        id: 'classic',
        name: 'Classic Snake',
        description: 'Traditional green snake on black background',
        assetOverrides: {
          'snake-head': 'snake-head-green.png',
          'snake-body': 'snake-body-green.png',
          'food-items': 'apple-red.png',
          'background-tiles': 'black-bg.png'
        },
        colorScheme: {
          'snake': '#00FF00',
          'food': '#FF0000',
          'background': '#000000',
          'grid': '#333333'
        }
      },
      {
        id: 'neon',
        name: 'Neon Cyber',
        description: 'Futuristic neon-themed snake game',
        assetOverrides: {
          'snake-head': 'snake-head-neon.png',
          'snake-body': 'snake-body-neon.png',
          'food-items': 'energy-orb.png',
          'background-tiles': 'cyber-grid.png'
        },
        colorScheme: {
          'snake': '#00FFFF',
          'food': '#FF00FF',
          'background': '#0A0A0A',
          'grid': '#001F3F'
        }
      }
    ],
    mechanics: [
      {
        id: 'power-ups',
        name: 'Power-Up System',
        description: 'Special items with temporary effects',
        codeModifications: ['power-up-system.js'],
        requiredAssets: ['speed-boost', 'invincibility', 'score-multiplier']
      },
      {
        id: 'obstacles',
        name: 'Dynamic Obstacles',
        description: 'Moving obstacles to increase difficulty',
        codeModifications: ['obstacle-system.js'],
        requiredAssets: ['wall-sprites', 'moving-hazards']
      }
    ],
    visuals: [
      {
        id: 'trails',
        name: 'Snake Trails',
        description: 'Visual trail effect behind the snake',
        cssModifications: ['trail-effects.css'],
        assetFilters: ['trail-*']
      },
      {
        id: 'particles',
        name: 'Particle Effects',
        description: 'Particle effects for eating and collisions',
        cssModifications: ['particle-system.css'],
        assetFilters: ['particle-*']
      }
    ],
    difficulty: [
      {
        id: 'easy',
        name: 'Garden Stroll',
        parameterAdjustments: {
          'speed': 6,
          'wallBounce': true
        }
      },
      {
        id: 'normal',
        name: 'Natural Growth',
        parameterAdjustments: {
          'speed': 10,
          'wallBounce': false
        }
      },
      {
        id: 'hard',
        name: 'Serpent Master',
        parameterAdjustments: {
          'speed': 15,
          'wallBounce': false
        }
      }
    ]
  },

  codeTemplates: {
    mainGameFile: `
// Snake Game - Main File
class SnakeGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.gridSize = 20
    this.tileCount = this.canvas.width / this.gridSize
    
    this.snake = [{x: 10, y: 10}]
    this.food = {x: 15, y: 15}
    this.dx = 0
    this.dy = 0
    this.score = 0
    
    this.setupControls()
    this.gameLoop()
  }
  
  setupControls() {
    document.addEventListener('keydown', (e) => {
      switch(e.code) {
        case 'ArrowUp':
          if (this.dy === 0) { this.dx = 0; this.dy = -1; }
          break
        case 'ArrowDown':
          if (this.dy === 0) { this.dx = 0; this.dy = 1; }
          break
        case 'ArrowLeft':
          if (this.dx === 0) { this.dx = -1; this.dy = 0; }
          break
        case 'ArrowRight':
          if (this.dx === 0) { this.dx = 1; this.dy = 0; }
          break
      }
    })
  }
  
  gameLoop() {
    setTimeout(() => {
      this.clearCanvas()
      this.moveSnake()
      this.drawSnake()
      this.drawFood()
      this.checkCollision()
      this.gameLoop()
    }, 1000 / {{GAME_SPEED}})
  }
  
  clearCanvas() {
    this.ctx.fillStyle = '{{BACKGROUND_COLOR}}'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }
  
  moveSnake() {
    const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy}
    this.snake.unshift(head)
    
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10
      this.generateFood()
      document.getElementById('score').textContent = this.score
    } else {
      this.snake.pop()
    }
  }
  
  drawSnake() {
    this.ctx.fillStyle = '{{SNAKE_COLOR}}'
    this.snake.forEach(segment => {
      this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 2, this.gridSize - 2)
    })
  }
  
  drawFood() {
    this.ctx.fillStyle = '{{FOOD_COLOR}}'
    this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2)
  }
  
  generateFood() {
    this.food = {
      x: Math.floor(Math.random() * this.tileCount),
      y: Math.floor(Math.random() * this.tileCount)
    }
  }
  
  checkCollision() {
    const head = this.snake[0]
    
    // Wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver()
      return
    }
    
    // Self collision
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        this.gameOver()
        return
      }
    }
  }
  
  gameOver() {
    alert('Game Over! Score: ' + this.score)
    this.snake = [{x: 10, y: 10}]
    this.dx = 0
    this.dy = 0
    this.score = 0
    this.generateFood()
  }
}

// Initialize game
window.addEventListener('load', () => {
  new SnakeGame()
})`,
    configFile: `
export const SNAKE_CONFIG = {
  GRID_SIZE: {{GRID_SIZE}},
  GAME_SPEED: {{GAME_SPEED}},
  INITIAL_LENGTH: 1,
  FOOD_SCORE: 10,
  
  COLORS: {
    SNAKE: '{{SNAKE_COLOR}}',
    FOOD: '{{FOOD_COLOR}}',
    BACKGROUND: '{{BACKGROUND_COLOR}}',
    GRID: '{{GRID_COLOR}}'
  },
  
  CONTROLS: {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    PAUSE: 'Space'
  }
}`,
    htmlTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{GAME_TITLE}}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="gameContainer">
        <header>
            <h1>{{GAME_TITLE}}</h1>
            <div id="scoreBoard">
                <span>Score: <span id="score">0</span></span>
                <span>High Score: <span id="highScore">0</span></span>
            </div>
        </header>
        
        <main>
            <div id="gameArea">
                <canvas id="gameCanvas" width="400" height="400"></canvas>
            </div>
            
            <div id="controls">
                <h3>Controls</h3>
                <p>Use arrow keys to move</p>
                <p>Eat {{THEME_FOOD}} to grow</p>
                <p>Avoid walls and yourself</p>
            </div>
        </main>
        
        <div id="gameOverScreen" class="hidden">
            <h2>Game Over!</h2>
            <p>Final Score: <span id="finalScore">0</span></p>
            <button onclick="location.reload()">Play Again</button>
        </div>
    </div>
    
    <script src="main.js"></script>
</body>
</html>`,
    cssTemplate: `
/* {{GAME_TITLE}} Styles */
body {
  margin: 0;
  padding: 20px;
  font-family: 'Courier New', monospace;
  background: {{PAGE_BG_COLOR}};
  color: {{TEXT_COLOR}};
  text-align: center;
}

#gameContainer {
  max-width: 800px;
  margin: 0 auto;
}

header {
  margin-bottom: 20px;
}

h1 {
  color: {{TITLE_COLOR}};
  font-size: 2.5em;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

#scoreBoard {
  font-size: 1.2em;
  margin: 10px 0;
}

#scoreBoard span {
  margin: 0 20px;
  padding: 5px 10px;
  background: {{SCORE_BG}};
  border-radius: 5px;
}

#gameArea {
  display: inline-block;
  border: 3px solid {{BORDER_COLOR}};
  border-radius: 10px;
  background: {{GAME_BG}};
  margin: 20px;
}

#gameCanvas {
  display: block;
  background: {{CANVAS_BG}};
}

#controls {
  background: {{CONTROLS_BG}};
  border-radius: 10px;
  padding: 15px;
  margin: 20px auto;
  max-width: 300px;
}

#controls h3 {
  margin-top: 0;
  color: {{CONTROLS_TITLE}};
}

#controls p {
  margin: 5px 0;
  color: {{CONTROLS_TEXT}};
}

#gameOverScreen {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: {{GAME_OVER_BG}};
  border: 3px solid {{GAME_OVER_BORDER}};
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  z-index: 1000;
}

#gameOverScreen.hidden {
  display: none;
}

#gameOverScreen h2 {
  color: {{GAME_OVER_TITLE}};
  margin-top: 0;
}

#gameOverScreen button {
  background: {{BUTTON_BG}};
  color: {{BUTTON_TEXT}};
  border: 2px solid {{BUTTON_BORDER}};
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 1.1em;
  cursor: pointer;
  margin-top: 15px;
}

#gameOverScreen button:hover {
  background: {{BUTTON_HOVER}};
}`,
    additionalFiles: {
      'high-score.js': `
class HighScoreManager {
  constructor() {
    this.storageKey = 'snakeHighScore'
  }
  
  getHighScore() {
    return parseInt(localStorage.getItem(this.storageKey) || '0')
  }
  
  setHighScore(score) {
    const currentHigh = this.getHighScore()
    if (score > currentHigh) {
      localStorage.setItem(this.storageKey, score.toString())
      return true // New high score
    }
    return false
  }
  
  updateDisplay() {
    document.getElementById('highScore').textContent = this.getHighScore()
  }
}`,
      'sound-manager.js': `
class SoundManager {
  constructor() {
    this.sounds = {}
    this.enabled = true
  }
  
  loadSound(name, url) {
    this.sounds[name] = new Audio(url)
    this.sounds[name].preload = 'auto'
  }
  
  playSound(name) {
    if (this.enabled && this.sounds[name]) {
      this.sounds[name].currentTime = 0
      this.sounds[name].play().catch(e => console.log('Audio play failed:', e))
    }
  }
  
  toggleSound() {
    this.enabled = !this.enabled
    return this.enabled
  }
}`
    }
  },

  generationConfig: {
    storyPromptTemplate: `Create a {{THEME_NAME}} themed story for a snake game where the player controls a {{THEME_CREATURE}} in a mystical garden. Focus on growth, wisdom, and the journey of transformation.`,
    assetPromptTemplate: `Generate {{THEME_NAME}} themed visual assets for a snake game including: {{THEME_CREATURE}} sprites, {{THEME_FOOD}} items, mystical garden backgrounds, and magical UI elements.`,
    gameplayPromptTemplate: `Design engaging snake gameplay with {{THEME_NAME}} elements, including special {{THEME_FOOD}} types, power-ups, and progression mechanics.`,
    variableReplacements: {
      '{{THEME_NAME}}': 'Mystical Serpent',
      '{{THEME_CREATURE}}': 'Serpent',
      '{{THEME_FOOD}}': 'Crystal Fruit',
      '{{THEME_KEEPER}}': 'Garden Guardian',
      '{{GAME_TITLE}}': 'Serpent\'s Journey',
      '{{GRID_SIZE}}': '20',
      '{{GAME_SPEED}}': '10',
      '{{SNAKE_COLOR}}': '#00FF00',
      '{{FOOD_COLOR}}': '#FF0000',
      '{{BACKGROUND_COLOR}}': '#000000',
      '{{GRID_COLOR}}': '#333333',
      '{{PAGE_BG_COLOR}}': '#1a1a2e',
      '{{TEXT_COLOR}}': '#eee',
      '{{TITLE_COLOR}}': '#00ff41',
      '{{SCORE_BG}}': 'rgba(0,255,65,0.2)',
      '{{BORDER_COLOR}}': '#00ff41',
      '{{GAME_BG}}': '#16213e',
      '{{CANVAS_BG}}': '#0f0f23',
      '{{CONTROLS_BG}}': 'rgba(0,255,65,0.1)',
      '{{CONTROLS_TITLE}}': '#00ff41',
      '{{CONTROLS_TEXT}}': '#ccc',
      '{{GAME_OVER_BG}}': '#1a1a2e',
      '{{GAME_OVER_BORDER}}': '#ff0040',
      '{{GAME_OVER_TITLE}}': '#ff0040',
      '{{BUTTON_BG}}': '#00ff41',
      '{{BUTTON_TEXT}}': '#000',
      '{{BUTTON_BORDER}}': '#00ff41',
      '{{BUTTON_HOVER}}': '#00cc33'
    }
  }
}
