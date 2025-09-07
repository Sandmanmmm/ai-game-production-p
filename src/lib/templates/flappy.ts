import { RealGameTemplate } from './types'

export const flappyTemplate: RealGameTemplate = {
  id: 'flappy-bird',
  name: 'Flappy Bird Style Game',
  description: 'Side-scrolling game with gravity and obstacle avoidance',
  category: 'beginner',
  complexity: 'intermediate',
  estimatedTime: '4-6 hours',
  tags: ['flappy', 'arcade', 'physics', 'endless'],

  gameStructure: {
    gameType: 'flappy',
    framework: 'html5-canvas',
    coreLoop: 'Tap/Click → Flap Wings → Avoid Obstacles → Score Points → Repeat',
    scenes: [
      {
        id: 'main-menu',
        name: 'Main Menu',
        type: 'menu',
        requiredAssets: ['menu-bg', 'title-logo', 'play-button'],
        codeSnippet: `
class MainMenu {
  constructor() {
    this.playButton = {x: 200, y: 300, width: 100, height: 50}
    this.highScore = this.loadHighScore()
  }
  
  handleClick(x, y) {
    if (this.isInsideButton(x, y, this.playButton)) {
      game.setState('playing')
    }
  }
}`
      },
      {
        id: 'gameplay',
        name: 'Main Gameplay',
        type: 'game',
        requiredAssets: ['bird-sprite', 'pipe-sprite', 'background', 'flap-sound'],
        codeSnippet: `
class GamePlay {
  constructor() {
    this.bird = {x: 100, y: 200, velocity: 0, size: 30}
    this.pipes = []
    this.score = 0
    this.gravity = 0.5
    this.flapPower = -10
  }
  
  update() {
    this.updateBird()
    this.updatePipes()
    this.checkCollisions()
  }
}`
      }
    ],
    mechanics: [
      {
        id: 'physics',
        name: 'Bird Physics',
        description: 'Gravity-based movement with flap controls',
        parameters: [
          { name: 'gravity', type: 'number', defaultValue: 0.5, description: 'Downward acceleration', customizable: true },
          { name: 'flapPower', type: 'number', defaultValue: -10, description: 'Upward velocity on flap', customizable: true },
          { name: 'maxVelocity', type: 'number', defaultValue: 15, description: 'Maximum fall speed', customizable: true }
        ],
        codeImplementation: `
class BirdPhysics {
  constructor(gravity = 0.5, flapPower = -10, maxVelocity = 15) {
    this.gravity = gravity
    this.flapPower = flapPower
    this.maxVelocity = maxVelocity
  }
  
  update(bird) {
    // Apply gravity
    bird.velocity += this.gravity
    
    // Limit fall speed
    if (bird.velocity > this.maxVelocity) {
      bird.velocity = this.maxVelocity
    }
    
    // Update position
    bird.y += bird.velocity
  }
  
  flap(bird) {
    bird.velocity = this.flapPower
    // Add subtle rotation for visual effect
    bird.rotation = -0.3
  }
}`
      },
      {
        id: 'obstacles',
        name: 'Pipe Generation',
        description: 'Procedural obstacle generation and movement',
        parameters: [
          { name: 'pipeSpeed', type: 'number', defaultValue: 2, description: 'Speed of pipe movement', customizable: true },
          { name: 'pipeGap', type: 'number', defaultValue: 150, description: 'Gap between pipe pairs', customizable: true },
          { name: 'pipeSpacing', type: 'number', defaultValue: 300, description: 'Distance between pipe pairs', customizable: true }
        ],
        codeImplementation: `
class PipeManager {
  constructor(gameWidth, gameHeight, pipeSpeed = 2, pipeGap = 150, pipeSpacing = 300) {
    this.gameWidth = gameWidth
    this.gameHeight = gameHeight
    this.pipeSpeed = pipeSpeed
    this.pipeGap = pipeGap
    this.pipeSpacing = pipeSpacing
    this.pipes = []
    this.lastPipeX = gameWidth
  }
  
  update() {
    // Move existing pipes
    this.pipes.forEach(pipe => {
      pipe.x -= this.pipeSpeed
    })
    
    // Remove off-screen pipes
    this.pipes = this.pipes.filter(pipe => pipe.x > -pipe.width)
    
    // Add new pipes
    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.gameWidth - this.pipeSpacing) {
      this.addPipe()
    }
  }
  
  addPipe() {
    const gapY = Math.random() * (this.gameHeight - this.pipeGap - 100) + 50
    
    this.pipes.push({
      x: this.gameWidth,
      topHeight: gapY,
      bottomY: gapY + this.pipeGap,
      bottomHeight: this.gameHeight - (gapY + this.pipeGap),
      width: 50,
      passed: false
    })
  }
}`
      }
    ]
  },

  prebuiltContent: {
    story: {
      worldLore: {
        id: 'sky-world',
        name: 'The Endless {{THEME_REALM}}',
        geography: 'An infinite sky filled with floating {{THEME_OBSTACLES}}',
        politics: 'Governed by the laws of flight and gravity',
        culture: 'A world where only the most skilled {{THEME_CREATURES}} can navigate safely',
        history: 'The eternal challenge of the {{THEME_REALM}}',
        technology: 'Ancient {{THEME_OBSTACLES}} that test the worthiness of travelers',
        magic: 'The mystical power of flight'
      },
      mainStoryArc: {
        id: 'flight-journey',
        title: 'The Flight of the {{THEME_CREATURE}}',
        description: 'Navigate through an endless sky filled with challenges',
        acts: [],
        themes: ['perseverance', 'skill', 'rhythm'],
        tone: 'challenging' as const
      },
      chapters: [],
      characters: [
        {
          id: 'player-bird',
          name: 'The {{THEME_CREATURE}}',
          description: 'A brave flyer attempting to navigate the treacherous {{THEME_REALM}}',
          role: 'protagonist',
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
        themes: ['skill', 'timing', 'perseverance'],
        contentWarnings: []
      }
    },
    assets: {
      art: ['bird-sprites', 'pipe-sprites', 'background-layers', 'ground-tile', 'particle-effects'],
      audio: ['flap-sound', 'score-sound', 'hit-sound', 'swoosh-sound', 'background-ambient'],
      ui: ['score-display', 'game-over-screen', 'medal-sprites', 'button-sprites']
    },
    gameplay: {
      mechanics: [
        { id: 'flying', name: 'Flight Control', complexity: 'simple', description: 'Tap to flap and stay airborne', implemented: true },
        { id: 'obstacles', name: 'Obstacle Avoidance', complexity: 'medium', description: 'Navigate through {{THEME_OBSTACLES}}', implemented: true },
        { id: 'scoring', name: 'Scoring System', complexity: 'simple', description: 'Earn points for passing obstacles', implemented: true },
        { id: 'physics', name: 'Realistic Physics', complexity: 'medium', description: 'Gravity and momentum simulation', implemented: true }
      ],
      levels: [
        {
          id: 'endless',
          name: 'Endless Flight',
          description: 'Fly as far as you can through the {{THEME_REALM}}',
          objectives: ['Pass 1 {{THEME_OBSTACLE}}', 'Score 10 points', 'Score 50 points'],
          rewards: ['Bronze medal', 'Silver medal', 'Gold medal']
        }
      ]
    }
  },

  customizationOptions: {
    themes: [
      {
        id: 'classic',
        name: 'Classic Bird',
        description: 'Traditional yellow bird with green pipes',
        assetOverrides: {
          'bird-sprites': 'bird-yellow.png',
          'pipe-sprites': 'pipes-green.png',
          'background-layers': 'sky-day.png'
        },
        colorScheme: {
          'bird': '#FFD700',
          'pipes': '#228B22',
          'background': '#87CEEB',
          'ground': '#DEB887'
        }
      },
      {
        id: 'space',
        name: 'Space Explorer',
        description: 'Rocket ship navigating through asteroid fields',
        assetOverrides: {
          'bird-sprites': 'rocket-ship.png',
          'pipe-sprites': 'asteroids.png',
          'background-layers': 'space-nebula.png'
        },
        colorScheme: {
          'bird': '#C0C0C0',
          'pipes': '#696969',
          'background': '#000000',
          'ground': '#2F4F4F'
        }
      },
      {
        id: 'underwater',
        name: 'Ocean Adventure',
        description: 'Fish swimming through coral reefs',
        assetOverrides: {
          'bird-sprites': 'fish-tropical.png',
          'pipe-sprites': 'coral-reefs.png',
          'background-layers': 'ocean-depths.png'
        },
        colorScheme: {
          'bird': '#FF6347',
          'pipes': '#FF7F50',
          'background': '#006994',
          'ground': '#8FBC8F'
        }
      }
    ],
    mechanics: [
      {
        id: 'power-ups',
        name: 'Special Abilities',
        description: 'Temporary power-ups to help navigation',
        codeModifications: ['power-up-system.js'],
        requiredAssets: ['shield-powerup', 'slow-motion', 'extra-life']
      },
      {
        id: 'moving-pipes',
        name: 'Dynamic Obstacles',
        description: 'Pipes that move up and down',
        codeModifications: ['moving-obstacles.js'],
        requiredAssets: ['animated-pipe-sprites']
      }
    ],
    visuals: [
      {
        id: 'parallax',
        name: 'Parallax Scrolling',
        description: 'Multi-layer background scrolling',
        cssModifications: ['parallax-effects.css'],
        assetFilters: ['bg-layer-*']
      },
      {
        id: 'particles',
        name: 'Flight Particles',
        description: 'Particle trail behind the bird',
        cssModifications: ['particle-trail.css'],
        assetFilters: ['particle-*']
      }
    ],
    difficulty: [
      {
        id: 'easy',
        name: 'Gentle Breeze',
        parameterAdjustments: {
          'gravity': 0.3,
          'pipeSpeed': 1.5,
          'pipeGap': 180
        }
      },
      {
        id: 'normal',
        name: 'Steady Wind',
        parameterAdjustments: {
          'gravity': 0.5,
          'pipeSpeed': 2,
          'pipeGap': 150
        }
      },
      {
        id: 'hard',
        name: 'Storm Flight',
        parameterAdjustments: {
          'gravity': 0.7,
          'pipeSpeed': 3,
          'pipeGap': 120
        }
      }
    ]
  },

  codeTemplates: {
    mainGameFile: `
// Flappy Bird Game - Main File
class FlappyGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.gameState = 'menu' // menu, playing, gameOver
    
    // Game objects
    this.bird = {
      x: 100,
      y: 200,
      velocity: 0,
      size: 20,
      rotation: 0
    }
    
    this.pipes = []
    this.score = 0
    this.highScore = this.loadHighScore()
    
    // Game settings
    this.gravity = {{GRAVITY}}
    this.flapPower = {{FLAP_POWER}}
    this.pipeSpeed = {{PIPE_SPEED}}
    this.pipeGap = {{PIPE_GAP}}
    
    this.setupControls()
    this.gameLoop()
  }
  
  setupControls() {
    // Mouse and touch controls
    this.canvas.addEventListener('click', () => this.handleInput())
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.handleInput()
    })
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        this.handleInput()
      }
    })
  }
  
  handleInput() {
    switch(this.gameState) {
      case 'menu':
        this.startGame()
        break
      case 'playing':
        this.flapBird()
        break
      case 'gameOver':
        this.resetGame()
        break
    }
  }
  
  startGame() {
    this.gameState = 'playing'
    this.resetBird()
    this.pipes = []
    this.score = 0
  }
  
  flapBird() {
    this.bird.velocity = this.flapPower
    this.bird.rotation = -0.3
    this.playSound('flap')
  }
  
  gameLoop() {
    this.update()
    this.draw()
    requestAnimationFrame(() => this.gameLoop())
  }
  
  update() {
    if (this.gameState !== 'playing') return
    
    // Update bird physics
    this.bird.velocity += this.gravity
    this.bird.y += this.bird.velocity
    
    // Rotate bird based on velocity
    this.bird.rotation = Math.max(-0.5, Math.min(0.5, this.bird.velocity * 0.05))
    
    // Update pipes
    this.updatePipes()
    
    // Check collisions
    this.checkCollisions()
    
    // Check boundaries
    if (this.bird.y > this.canvas.height - 50 || this.bird.y < 0) {
      this.gameOver()
    }
  }
  
  updatePipes() {
    // Move pipes
    this.pipes.forEach(pipe => {
      pipe.x -= this.pipeSpeed
      
      // Check if bird passed pipe
      if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
        pipe.passed = true
        this.score++
        this.playSound('score')
        document.getElementById('score').textContent = this.score
      }
    })
    
    // Remove off-screen pipes
    this.pipes = this.pipes.filter(pipe => pipe.x > -pipe.width)
    
    // Add new pipes
    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 300) {
      this.addPipe()
    }
  }
  
  addPipe() {
    const gapY = Math.random() * (this.canvas.height - this.pipeGap - 100) + 50
    
    this.pipes.push({
      x: this.canvas.width,
      topHeight: gapY,
      bottomY: gapY + this.pipeGap,
      bottomHeight: this.canvas.height - 50 - (gapY + this.pipeGap),
      width: 50,
      passed: false
    })
  }
  
  checkCollisions() {
    this.pipes.forEach(pipe => {
      // Check collision with top pipe
      if (this.bird.x + this.bird.size > pipe.x &&
          this.bird.x < pipe.x + pipe.width &&
          this.bird.y < pipe.topHeight) {
        this.gameOver()
      }
      
      // Check collision with bottom pipe
      if (this.bird.x + this.bird.size > pipe.x &&
          this.bird.x < pipe.x + pipe.width &&
          this.bird.y + this.bird.size > pipe.bottomY) {
        this.gameOver()
      }
    })
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '{{BACKGROUND_COLOR}}'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    if (this.gameState === 'menu') {
      this.drawMenu()
    } else {
      this.drawGame()
    }
    
    if (this.gameState === 'gameOver') {
      this.drawGameOver()
    }
  }
  
  drawGame() {
    // Draw pipes
    this.ctx.fillStyle = '{{PIPE_COLOR}}'
    this.pipes.forEach(pipe => {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight)
      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight)
    })
    
    // Draw ground
    this.ctx.fillStyle = '{{GROUND_COLOR}}'
    this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50)
    
    // Draw bird
    this.ctx.save()
    this.ctx.translate(this.bird.x + this.bird.size/2, this.bird.y + this.bird.size/2)
    this.ctx.rotate(this.bird.rotation)
    this.ctx.fillStyle = '{{BIRD_COLOR}}'
    this.ctx.fillRect(-this.bird.size/2, -this.bird.size/2, this.bird.size, this.bird.size)
    this.ctx.restore()
  }
  
  drawMenu() {
    this.ctx.fillStyle = '{{TEXT_COLOR}}'
    this.ctx.font = '48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('{{GAME_TITLE}}', this.canvas.width/2, this.canvas.height/2 - 50)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillText('Click to Start', this.canvas.width/2, this.canvas.height/2 + 50)
    this.ctx.fillText('High Score: ' + this.highScore, this.canvas.width/2, this.canvas.height/2 + 100)
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.fillStyle = '{{TEXT_COLOR}}'
    this.ctx.font = '36px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Game Over', this.canvas.width/2, this.canvas.height/2 - 50)
    this.ctx.fillText('Score: ' + this.score, this.canvas.width/2, this.canvas.height/2)
    this.ctx.fillText('High Score: ' + this.highScore, this.canvas.width/2, this.canvas.height/2 + 50)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillText('Click to Restart', this.canvas.width/2, this.canvas.height/2 + 100)
  }
  
  gameOver() {
    this.gameState = 'gameOver'
    this.playSound('hit')
    
    if (this.score > this.highScore) {
      this.highScore = this.score
      this.saveHighScore()
    }
  }
  
  resetGame() {
    this.gameState = 'menu'
    this.resetBird()
    this.pipes = []
    this.score = 0
  }
  
  resetBird() {
    this.bird.x = 100
    this.bird.y = 200
    this.bird.velocity = 0
    this.bird.rotation = 0
  }
  
  loadHighScore() {
    return parseInt(localStorage.getItem('flappyHighScore') || '0')
  }
  
  saveHighScore() {
    localStorage.setItem('flappyHighScore', this.highScore.toString())
  }
  
  playSound(soundName) {
    // Sound implementation would go here
    console.log('Playing sound:', soundName)
  }
}

// Initialize game
window.addEventListener('load', () => {
  new FlappyGame()
})`,
    configFile: `
export const FLAPPY_CONFIG = {
  GRAVITY: {{GRAVITY}},
  FLAP_POWER: {{FLAP_POWER}},
  PIPE_SPEED: {{PIPE_SPEED}},
  PIPE_GAP: {{PIPE_GAP}},
  PIPE_SPACING: 300,
  
  BIRD: {
    SIZE: 20,
    START_X: 100,
    START_Y: 200
  },
  
  COLORS: {
    BIRD: '{{BIRD_COLOR}}',
    PIPES: '{{PIPE_COLOR}}',
    BACKGROUND: '{{BACKGROUND_COLOR}}',
    GROUND: '{{GROUND_COLOR}}',
    TEXT: '{{TEXT_COLOR}}'
  },
  
  SOUNDS: {
    FLAP: 'flap.wav',
    SCORE: 'score.wav',
    HIT: 'hit.wav'
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
            <div id="scoreDisplay">
                <span>Score: <span id="score">0</span></span>
                <span>Best: <span id="highScore">0</span></span>
            </div>
        </header>
        
        <main>
            <div id="gameArea">
                <canvas id="gameCanvas" width="400" height="600"></canvas>
            </div>
            
            <div id="instructions">
                <h3>How to Play</h3>
                <p>🖱️ Click or tap to flap</p>
                <p>⌨️ Use spacebar or arrow up</p>
                <p>🎯 Navigate through {{THEME_OBSTACLES}}</p>
                <p>🏆 Beat your high score!</p>
            </div>
        </main>
    </div>
    
    <script src="main.js"></script>
</body>
</html>`,
    cssTemplate: `
/* {{GAME_TITLE}} Styles */
body {
  margin: 0;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, {{BG_GRADIENT_START}}, {{BG_GRADIENT_END}});
  color: {{TEXT_COLOR}};
  text-align: center;
  min-height: 100vh;
}

#gameContainer {
  max-width: 600px;
  margin: 0 auto;
}

header {
  margin-bottom: 20px;
}

h1 {
  color: {{TITLE_COLOR}};
  font-size: 3em;
  text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
  margin: 0;
  font-weight: bold;
}

#scoreDisplay {
  font-size: 1.3em;
  margin: 15px 0;
}

#scoreDisplay span {
  margin: 0 15px;
  padding: 8px 15px;
  background: {{SCORE_BG}};
  border-radius: 20px;
  border: 2px solid {{SCORE_BORDER}};
  display: inline-block;
  min-width: 100px;
}

#gameArea {
  display: inline-block;
  border: 4px solid {{GAME_BORDER}};
  border-radius: 15px;
  background: {{GAME_FRAME_BG}};
  padding: 10px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
}

#gameCanvas {
  display: block;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.1s;
}

#gameCanvas:active {
  transform: scale(0.98);
}

#instructions {
  background: {{INSTRUCTIONS_BG}};
  border-radius: 15px;
  padding: 20px;
  margin: 20px auto;
  max-width: 400px;
  border: 2px solid {{INSTRUCTIONS_BORDER}};
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

#instructions h3 {
  margin-top: 0;
  color: {{INSTRUCTIONS_TITLE}};
  font-size: 1.5em;
}

#instructions p {
  margin: 8px 0;
  color: {{INSTRUCTIONS_TEXT}};
  font-size: 1.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* Responsive design */
@media (max-width: 600px) {
  body { padding: 10px; }
  h1 { font-size: 2em; }
  #scoreDisplay { font-size: 1.1em; }
  #scoreDisplay span { margin: 0 5px; padding: 5px 10px; }
  #gameArea { padding: 5px; }
  #instructions { padding: 15px; }
}

/* Loading animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.loading {
  animation: pulse 1.5s infinite;
}`,
    additionalFiles: {
      'physics-engine.js': `
class PhysicsEngine {
  constructor(gravity = 0.5, maxVelocity = 15) {
    this.gravity = gravity
    this.maxVelocity = maxVelocity
  }
  
  applyGravity(object) {
    object.velocity += this.gravity
    if (object.velocity > this.maxVelocity) {
      object.velocity = this.maxVelocity
    }
  }
  
  updatePosition(object) {
    object.y += object.velocity
  }
  
  applyImpulse(object, force) {
    object.velocity = force
  }
}`,
      'collision-detector.js': `
class CollisionDetector {
  static checkRectangleCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  }
  
  static checkCircleRectangleCollision(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.width/2)
    const distY = Math.abs(circle.y - rect.y - rect.height/2)
    
    if (distX > (rect.width/2 + circle.radius)) return false
    if (distY > (rect.height/2 + circle.radius)) return false
    
    if (distX <= (rect.width/2)) return true
    if (distY <= (rect.height/2)) return true
    
    const dx = distX - rect.width/2
    const dy = distY - rect.height/2
    return (dx*dx + dy*dy <= (circle.radius*circle.radius))
  }
}`,
      'particle-effects.js': `
class ParticleEffect {
  constructor() {
    this.particles = []
  }
  
  createFlapParticles(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + Math.random() * 10 - 5,
        y: y + Math.random() * 10 - 5,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        life: 1.0,
        decay: 0.05,
        size: Math.random() * 3 + 1
      })
    }
  }
  
  update() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life -= particle.decay
      return particle.life > 0
    })
  }
  
  draw(ctx) {
    this.particles.forEach(particle => {
      ctx.globalAlpha = particle.life
      ctx.fillStyle = '#FFF'
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0
  }
}`
    }
  },

  generationConfig: {
    storyPromptTemplate: `Create a {{THEME_NAME}} themed story for a flappy bird style game where the player controls a {{THEME_CREATURE}} navigating through the {{THEME_REALM}}. Focus on the challenge of flight and perseverance.`,
    assetPromptTemplate: `Generate {{THEME_NAME}} themed visual assets for a flappy bird game including: {{THEME_CREATURE}} sprites with animation frames, {{THEME_OBSTACLES}} designs, {{THEME_REALM}} backgrounds, and smooth scrolling elements.`,
    gameplayPromptTemplate: `Design engaging flappy bird gameplay with {{THEME_NAME}} elements, including obstacle patterns, scoring mechanics, and visual feedback systems.`,
    variableReplacements: {
      '{{THEME_NAME}}': 'Sky Adventure',
      '{{THEME_CREATURE}}': 'Bird',
      '{{THEME_OBSTACLES}}': 'Pipes',
      '{{THEME_REALM}}': 'Sky Kingdom',
      '{{GAME_TITLE}}': 'Sky Flyer',
      '{{GRAVITY}}': '0.5',
      '{{FLAP_POWER}}': '-10',
      '{{PIPE_SPEED}}': '2',
      '{{PIPE_GAP}}': '150',
      '{{BIRD_COLOR}}': '#FFD700',
      '{{PIPE_COLOR}}': '#228B22',
      '{{BACKGROUND_COLOR}}': '#87CEEB',
      '{{GROUND_COLOR}}': '#DEB887',
      '{{TEXT_COLOR}}': '#FFFFFF',
      '{{TITLE_COLOR}}': '#FFD700',
      '{{BG_GRADIENT_START}}': '#87CEEB',
      '{{BG_GRADIENT_END}}': '#B0E0E6',
      '{{SCORE_BG}}': 'rgba(255,255,255,0.2)',
      '{{SCORE_BORDER}}': '#FFD700',
      '{{GAME_BORDER}}': '#4169E1',
      '{{GAME_FRAME_BG}}': 'rgba(255,255,255,0.1)',
      '{{INSTRUCTIONS_BG}}': 'rgba(255,255,255,0.9)',
      '{{INSTRUCTIONS_BORDER}}': '#4169E1',
      '{{INSTRUCTIONS_TITLE}}': '#2E8B57',
      '{{INSTRUCTIONS_TEXT}}': '#333333'
    }
  }
}
