import { GameProject, StoryLoreContent, AssetCollection, GameplayContent, QAContent } from './types'
import { AIMockGenerator } from './aiMockGenerator'
import { allTemplates, getTemplateById, getTemplatesByCategory } from './templates'

// Real Template System Implementation
export interface RealGameTemplate {
  id: string
  name: string
  description: string
  category: 'beginner' | 'intermediate' | 'advanced'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  tags: string[]
  
  // Template Structure
  gameStructure: GameStructure
  prebuiltContent: PrebuiltContent
  customizationOptions: CustomizationOptions
  codeTemplates: CodeTemplates
  
  // Generation Configuration
  generationConfig: GenerationConfig
}

export interface GameStructure {
  gameType: 'clicker' | 'snake' | 'flappy' | 'platformer' | 'tower-defense' | 'rpg'
  scenes: SceneTemplate[]
  mechanics: MechanicTemplate[]
  coreLoop: string
  framework: 'html5-canvas' | 'phaser' | 'three-js'
}

export interface SceneTemplate {
  id: string
  name: string
  type: 'menu' | 'game' | 'ui' | 'transition'
  requiredAssets: string[]
  codeSnippet: string
}

export interface MechanicTemplate {
  id: string
  name: string
  description: string
  codeImplementation: string
  parameters: ParameterTemplate[]
}

export interface ParameterTemplate {
  name: string
  type: 'number' | 'string' | 'boolean' | 'color'
  defaultValue: any
  description: string
  customizable: boolean
}

export interface PrebuiltContent {
  story: Partial<StoryLoreContent>
  assets: {
    art: string[]
    audio: string[]
    ui: string[]
  }
  gameplay: Partial<GameplayContent>
}

export interface CustomizationOptions {
  themes: ThemeOption[]
  mechanics: MechanicOption[]
  visuals: VisualOption[]
  difficulty: DifficultyOption[]
}

export interface ThemeOption {
  id: string
  name: string
  description: string
  assetOverrides: Record<string, string>
  colorScheme: Record<string, string>
}

export interface MechanicOption {
  id: string
  name: string
  description: string
  codeModifications: string[]
  requiredAssets: string[]
}

export interface VisualOption {
  id: string
  name: string
  description: string
  cssModifications: string[]
  assetFilters: string[]
}

export interface DifficultyOption {
  id: string
  name: string
  parameterAdjustments: Record<string, any>
}

export interface CodeTemplates {
  mainGameFile: string
  configFile: string
  htmlTemplate: string
  cssTemplate: string
  additionalFiles: Record<string, string>
}

export interface GenerationConfig {
  storyPromptTemplate: string
  assetPromptTemplate: string
  gameplayPromptTemplate: string
  variableReplacements: Record<string, string>
}

// Real Template Definitions (imported from modular files)
export const REAL_GAME_TEMPLATES: RealGameTemplate[] = allTemplates

// Real Template Generator Class
export class RealTemplateGenerator {
  
  // Get all available templates
  static getTemplates(): RealGameTemplate[] {
    return REAL_GAME_TEMPLATES
  }
  
  // Rest of the old inline templates array - to be removed
  static getOldInlineTemplates(): RealGameTemplate[] {
    return [
      // Snake Game Template
      {
    name: 'Cookie Clicker Game',
    description: 'Build a classic incremental clicking game with upgrades and automation',
    category: 'beginner',
    complexity: 'beginner',
    estimatedTime: '30-45 minutes',
    tags: ['clicker', 'incremental', 'simple', 'addictive'],
    
    gameStructure: {
      gameType: 'clicker',
      framework: 'html5-canvas',
      coreLoop: 'Click → Earn Currency → Buy Upgrades → Automate → Prestige',
      scenes: [
        {
          id: 'main-game',
          name: 'Main Game Screen',
          type: 'game',
          requiredAssets: ['cookie-sprite', 'click-sound', 'background-music'],
          codeSnippet: `
class MainGameScene {
  constructor() {
    this.cookies = 0
    this.clickPower = 1
    this.autoClickers = []
  }
  
  handleClick() {
    this.cookies += this.clickPower
    this.updateDisplay()
    this.playClickSound()
  }
}`
        },
        {
          id: 'shop',
          name: 'Upgrade Shop',
          type: 'ui',
          requiredAssets: ['shop-bg', 'purchase-sound'],
          codeSnippet: `
class ShopScene {
  constructor(gameData) {
    this.gameData = gameData
    this.upgrades = this.generateUpgrades()
  }
}`
        }
      ],
      mechanics: [
        {
          id: 'clicking',
          name: 'Click Mechanics',
          description: 'Core clicking functionality with feedback',
          parameters: [
            { name: 'clickPower', type: 'number', defaultValue: 1, description: 'Cookies per click', customizable: true },
            { name: 'clickSound', type: 'boolean', defaultValue: true, description: 'Play sound on click', customizable: true }
          ],
          codeImplementation: `
function handleClick(event) {
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  if (isInsideClickable(x, y)) {
    game.cookies += game.clickPower
    createClickParticle(x, y)
    playSound('click')
    updateCookieDisplay()
  }
}`
        },
        {
          id: 'upgrades',
          name: 'Upgrade System',
          description: 'Purchase upgrades to increase efficiency',
          parameters: [
            { name: 'baseUpgradeCost', type: 'number', defaultValue: 10, description: 'Starting cost for upgrades', customizable: true },
            { name: 'costMultiplier', type: 'number', defaultValue: 1.5, description: 'Cost increase per upgrade', customizable: true }
          ],
          codeImplementation: `
class UpgradeSystem {
  constructor() {
    this.upgrades = [
      { id: 'cursor', name: 'Extra Cursor', baseCost: 10, owned: 0, cps: 0.1 },
      { id: 'grandma', name: 'Grandma', baseCost: 100, owned: 0, cps: 1 },
      { id: 'farm', name: 'Cookie Farm', baseCost: 1000, owned: 0, cps: 8 }
    ]
  }
  
  getCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.owned))
  }
  
  purchase(upgradeId) {
    const upgrade = this.upgrades.find(u => u.id === upgradeId)
    const cost = this.getCost(upgrade)
    
    if (game.cookies >= cost) {
      game.cookies -= cost
      upgrade.owned++
      this.recalculateCPS()
      return true
    }
    return false
  }
}`
        }
      ]
    },
    
    prebuiltContent: {
      story: {
        worldLore: {
          id: 'template-world',
          name: '{{THEME_NAME}} World',
          geography: 'A world where {{THEME_ITEMS}} are the most valuable resource',
          politics: 'Governed by the great {{THEME_MASTER}}s who control production',
          culture: 'A society built around {{THEME_ITEM}} creation and collection',
          history: 'The great {{THEME_ITEM}} revolution changed everything',
          technology: 'Advanced {{THEME_ITEM}} production methods',
          magic: ''
        },
        mainStoryArc: {
          id: 'main-arc',
          title: 'Rise of the {{THEME_MASTER}}',
          description: 'Build your {{THEME_ITEM}} empire from humble beginnings',
          acts: [],
          themes: ['entrepreneurship', 'growth', 'automation'],
          tone: 'light' as const
        },
        chapters: [],
        characters: [
          {
            id: 'player',
            name: 'The {{THEME_MASTER}}',
            description: 'An ambitious entrepreneur starting their {{THEME_ITEM}} business empire',
            role: 'protagonist',
            relationships: []
          },
          {
            id: 'advisor',
            name: '{{THEME_ADVISOR}}',
            description: 'An experienced guide who helps you understand the {{THEME_ITEM}} market',
            role: 'supporting',
            relationships: []
          }
        ],
        factions: [],
        subplots: [],
        timeline: [],
        metadata: {
          genre: 'casual',
          targetAudience: 'all-ages',
          complexity: 'simple' as const,
          estimatedLength: 'short' as const,
          themes: ['entrepreneurship', 'growth', 'automation'],
          contentWarnings: []
        }
      },
      assets: {
        art: ['main-clickable', 'background', 'upgrade-icons', 'particle-effects'],
        audio: ['click-sound', 'purchase-sound', 'background-music', 'achievement-sound'],
        ui: ['shop-panel', 'stats-panel', 'achievement-popup', 'progress-bars']
      },
      gameplay: {
        mechanics: [
          { id: 'clicking', name: 'Clicking', complexity: 'simple', description: 'Click to earn {{THEME_ITEMS}}', implemented: true },
          { id: 'upgrades', name: 'Upgrades', complexity: 'medium', description: 'Buy improvements to increase efficiency', implemented: true },
          { id: 'automation', name: 'Automation', complexity: 'complex', description: 'Purchase auto-clickers for passive income', implemented: true },
          { id: 'achievements', name: 'Achievements', complexity: 'medium', description: 'Unlock rewards for milestones', implemented: true }
        ],
        levels: [
          {
            id: 'level-1',
            name: 'Getting Started',
            objectives: ['Click 100 times', 'Buy first upgrade', 'Earn 1000 {{THEME_ITEMS}}'],
            difficulty: 1,
            mechanics: ['clicking'],
            estimated_playtime: 15,
            status: 'design'
          },
          {
            id: 'level-2',
            name: 'Building Empire',
            objectives: ['Buy 5 different upgrades', 'Reach 10 {{THEME_ITEMS}} per second', 'Unlock achievements'],
            difficulty: 3,
            mechanics: ['clicking', 'upgrades', 'automation'],
            estimated_playtime: 30,
            status: 'design'
          }
        ]
      }
    },
    
    customizationOptions: {
      themes: [
        {
          id: 'cookies',
          name: 'Classic Cookies',
          description: 'The original cookie clicking experience',
          assetOverrides: {
            'main-clickable': '/templates/clicker/cookie.png',
            'background': '/templates/clicker/kitchen-bg.jpg'
          },
          colorScheme: {
            primary: '#8B4513',
            secondary: '#D2B48C',
            accent: '#FFD700'
          }
        },
        {
          id: 'space-mining',
          name: 'Space Mining',
          description: 'Mine asteroids in the depths of space',
          assetOverrides: {
            'main-clickable': '/templates/clicker/asteroid.png',
            'background': '/templates/clicker/space-bg.jpg'
          },
          colorScheme: {
            primary: '#0F0F23',
            secondary: '#1E1E3F',
            accent: '#00FFFF'
          }
        },
        {
          id: 'gem-collector',
          name: 'Gem Collector',
          description: 'Collect precious gems and build a mining empire',
          assetOverrides: {
            'main-clickable': '/templates/clicker/gem.png',
            'background': '/templates/clicker/mine-bg.jpg'
          },
          colorScheme: {
            primary: '#4A0080',
            secondary: '#8A2BE2',
            accent: '#FF69B4'
          }
        }
      ],
      mechanics: [
        {
          id: 'auto-clickers',
          name: 'Auto Clickers',
          description: 'Automatic clicking for passive income',
          codeModifications: ['add-auto-click-logic', 'add-cps-calculation'],
          requiredAssets: ['auto-click-icon']
        },
        {
          id: 'achievements',
          name: 'Achievement System',
          description: 'Unlock achievements for milestones',
          codeModifications: ['add-achievement-tracking', 'add-achievement-popup'],
          requiredAssets: ['achievement-icons', 'achievement-sound']
        },
        {
          id: 'prestige',
          name: 'Prestige System',
          description: 'Reset progress for permanent bonuses',
          codeModifications: ['add-prestige-logic', 'add-prestige-currency'],
          requiredAssets: ['prestige-icon', 'prestige-effect']
        }
      ],
      visuals: [
        {
          id: 'particles',
          name: 'Click Particles',
          description: 'Show particles when clicking',
          cssModifications: ['add-particle-animations'],
          assetFilters: ['particle-sprites']
        },
        {
          id: 'animations',
          name: 'Number Animations',
          description: 'Animate numbers when they change',
          cssModifications: ['add-number-animations'],
          assetFilters: []
        },
        {
          id: 'progress-bars',
          name: 'Progress Indicators',
          description: 'Show progress bars for goals',
          cssModifications: ['add-progress-styling'],
          assetFilters: ['progress-bar-sprites']
        }
      ],
      difficulty: [
        {
          id: 'easy',
          name: 'Casual',
          parameterAdjustments: {
            clickPower: 2,
            costMultiplier: 1.3,
            autoClickerSpeed: 2
          }
        },
        {
          id: 'normal',
          name: 'Standard',
          parameterAdjustments: {
            clickPower: 1,
            costMultiplier: 1.5,
            autoClickerSpeed: 1
          }
        },
        {
          id: 'hard',
          name: 'Challenging',
          parameterAdjustments: {
            clickPower: 1,
            costMultiplier: 1.8,
            autoClickerSpeed: 0.8
          }
        }
      ]
    },
    
    codeTemplates: {
      mainGameFile: `
class {{THEME_TITLE}}ClickerGame {
  constructor(config = {}) {
    this.{{THEME_CURRENCY_LOWER}} = 0
    this.clickPower = config.clickPower || {{CLICK_POWER}}
    this.autoClickers = []
    this.upgrades = []
    this.theme = config.theme || '{{THEME_ID}}'
    this.difficulty = config.difficulty || 'normal'
    
    this.init()
  }
  
  init() {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.loadAssets()
    this.setupUI()
    this.startGameLoop()
    this.bindEvents()
  }
  
  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    if (this.isInsideClickable(x, y)) {
      this.{{THEME_CURRENCY_LOWER}} += this.clickPower
      this.createClickEffect(x, y)
      this.playSound('click')
      this.updateDisplay()
    }
  }
  
  // Auto-clicker system
  startAutoClickers() {
    setInterval(() => {
      const cps = this.calculateCPS()
      this.{{THEME_CURRENCY_LOWER}} += cps / 10 // Update 10 times per second
      this.updateDisplay()
    }, 100)
  }
  
  calculateCPS() {
    return this.upgrades.reduce((total, upgrade) => {
      return total + (upgrade.cps * upgrade.owned)
    }, 0)
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawBackground()
    this.drawClickable()
    this.drawUI()
  }
}

// Initialize the game
const game = new {{THEME_TITLE}}ClickerGame({
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  clickPower: {{CLICK_POWER}},
  enableParticles: {{ENABLE_PARTICLES}},
  enableAchievements: {{ENABLE_ACHIEVEMENTS}}
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
<body>
    <div class="game-container {{THEME_CLASS}}">
        <header class="game-header">
            <h1>{{GAME_TITLE}}</h1>
            <div class="stats-bar">
                <div class="stat">
                    <span class="stat-label">{{THEME_CURRENCY}}:</span>
                    <span id="currency-display" class="stat-value">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Per Second:</span>
                    <span id="cps-display" class="stat-value">0</span>
                </div>
            </div>
        </header>
        
        <main class="game-main">
            <div class="game-area">
                <canvas id="gameCanvas" width="600" height="400"></canvas>
            </div>
            
            <aside class="shop-panel">
                <h3>Upgrades</h3>
                <div id="upgrades-list" class="upgrades-list">
                    <!-- Upgrades will be populated by JavaScript -->
                </div>
            </aside>
        </main>
        
        {{#ENABLE_ACHIEVEMENTS}}
        <div id="achievements-panel" class="achievements-panel">
            <h3>Achievements</h3>
            <div id="achievements-list" class="achievements-list">
                <!-- Achievements will be populated by JavaScript -->
            </div>
        </div>
        {{/ENABLE_ACHIEVEMENTS}}
    </div>
    
    <script src="game.js"></script>
</body>
</html>
`,
      cssTemplate: `
.game-container {
  font-family: 'Arial', sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Theme: {{THEME_NAME}} */
.{{THEME_CLASS}} {
  --primary-color: {{PRIMARY_COLOR}};
  --secondary-color: {{SECONDARY_COLOR}};
  --accent-color: {{ACCENT_COLOR}};
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  min-height: 100vh;
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 15px;
}

.stat {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

.game-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

#gameCanvas {
  border: 3px solid var(--accent-color);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.shop-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.upgrades-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upgrade-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upgrade-item:hover {
  border-color: var(--accent-color);
  background: rgba(255, 255, 255, 0.2);
}

.upgrade-item.affordable {
  border-color: #4CAF50;
}

.upgrade-item.too-expensive {
  opacity: 0.5;
  cursor: not-allowed;
}

{{#ENABLE_PARTICLES}}
.click-particle {
  position: absolute;
  color: var(--accent-color);
  font-weight: bold;
  pointer-events: none;
  animation: floatUp 1s ease-out forwards;
}

@keyframes floatUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-50px) scale(1.2);
    opacity: 0;
  }
}
{{/ENABLE_PARTICLES}}

{{#ENABLE_ACHIEVEMENTS}}
.achievements-panel {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
}

.achievement-item.unlocked {
  background: rgba(76, 175, 80, 0.3);
}
{{/ENABLE_ACHIEVEMENTS}}

@media (max-width: 768px) {
  .game-main {
    grid-template-columns: 1fr;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 10px;
  }
}
`,
      configFile: `
const GAME_CONFIG = {
  version: '1.0.0',
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  
  themes: {
    {{#THEMES}}
    {{ID}}: {
      name: '{{NAME}}',
      currency: '{{CURRENCY}}',
      clickable: '{{CLICKABLE_ASSET}}',
      background: '{{BACKGROUND_ASSET}}',
      colors: {
        primary: '{{PRIMARY_COLOR}}',
        secondary: '{{SECONDARY_COLOR}}',
        accent: '{{ACCENT_COLOR}}'
      }
    },
    {{/THEMES}}
  },
  
  gameplay: {
    startingClickPower: {{CLICK_POWER}},
    baseCostMultiplier: {{COST_MULTIPLIER}},
    autoClickerInterval: {{AUTO_CLICKER_SPEED}},
    enableParticles: {{ENABLE_PARTICLES}},
    enableAchievements: {{ENABLE_ACHIEVEMENTS}},
    enablePrestige: {{ENABLE_PRESTIGE}}
  },
  
  upgrades: [
    {{#UPGRADES}}
    {
      id: '{{ID}}',
      name: '{{NAME}}',
      baseCost: {{BASE_COST}},
      cps: {{CPS}},
      description: '{{DESCRIPTION}}'
    },
    {{/UPGRADES}}
  ]
}
`,
      additionalFiles: {
        'README.md': `
# {{GAME_TITLE}}

A {{THEME_NAME}}-themed incremental clicker game built with HTML5 Canvas.

## How to Play

1. Click the {{THEME_CLICKABLE}} to earn {{THEME_CURRENCY}}
2. Purchase upgrades to increase your earning rate
3. Buy auto-clickers for passive income
{{#ENABLE_ACHIEVEMENTS}}4. Unlock achievements by reaching milestones{{/ENABLE_ACHIEVEMENTS}}
{{#ENABLE_PRESTIGE}}5. Use the prestige system for permanent bonuses{{/ENABLE_PRESTIGE}}

## Customizations Applied

- **Theme**: {{SELECTED_THEME_NAME}}
- **Difficulty**: {{SELECTED_DIFFICULTY_NAME}}
- **Features**: {{ENABLED_FEATURES}}

## Files Structure

- \`index.html\` - Main game page
- \`game.js\` - Core game logic
- \`styles.css\` - Styling and themes
- \`config.js\` - Game configuration
- \`assets/\` - Game assets (sprites, sounds)

## Development

This game was generated using GameForge's Real Template System. You can modify the configuration in \`config.js\` or directly edit the game logic in \`game.js\`.

Enjoy building your {{THEME_CURRENCY}} empire!
        `
      }
    },
    
    generationConfig: {
      storyPromptTemplate: 'Create a story for a {{THEME_NAME}} incremental clicker game where the player builds a {{THEME_ITEM}} empire. The setting should be {{THEME_SETTING}} and include characters like {{THEME_CHARACTERS}}.',
      assetPromptTemplate: 'Generate {{THEME_NAME}}-themed assets for a clicker game including: clickable {{THEME_ITEM}} sprite, {{THEME_SETTING}} background, upgrade icons, and {{THEME_AUDIO}} sound effects.',
      gameplayPromptTemplate: 'Design gameplay mechanics for a {{THEME_NAME}} clicker game with {{SELECTED_MECHANICS}} and {{SELECTED_DIFFICULTY}} difficulty.',
      variableReplacements: {
        '{{THEME_NAME}}': 'Cookie',
        '{{THEME_ITEM}}': 'cookie',
        '{{THEME_ITEMS}}': 'cookies',
        '{{THEME_CURRENCY}}': 'Cookies',
        '{{THEME_CURRENCY_LOWER}}': 'cookies',
        '{{THEME_MASTER}}': 'Cookie Master',
        '{{THEME_ADVISOR}}': 'Grandma'
      }
    }
  },
  
  // Snake Game Template
  {
    id: 'snake-classic',
    name: 'Classic Snake Game',
    description: 'Build the timeless snake game with modern features and customization',
    category: 'beginner',
    complexity: 'beginner',
    estimatedTime: '45-60 minutes',
    tags: ['arcade', 'classic', 'simple', 'responsive'],
    
    gameStructure: {
      gameType: 'snake',
      framework: 'html5-canvas',
      coreLoop: 'Move → Eat Food → Grow → Avoid Walls/Self → Score Points',
      scenes: [
        {
          id: 'menu',
          name: 'Main Menu',
          type: 'menu',
          requiredAssets: ['menu-bg', 'button-click'],
          codeSnippet: `
class MenuScene {
  constructor(game) {
    this.game = game
    this.setupMenu()
  }
  
  render() {
    this.drawBackground()
    this.drawTitle()
    this.drawPlayButton()
    this.drawHighScore()
  }
}`
        },
        {
          id: 'game',
          name: 'Game Scene',
          type: 'game',
          requiredAssets: ['snake-head', 'snake-body', 'food', 'game-music'],
          codeSnippet: `
class GameScene {
  constructor() {
    this.snake = [{ x: 10, y: 10 }]
    this.food = this.generateFood()
    this.direction = { x: 0, y: 0 }
    this.score = 0
  }
  
  update() {
    this.moveSnake()
    this.checkCollisions()
    this.checkFood()
  }
}`
        }
      ],
      mechanics: [
        {
          id: 'movement',
          name: 'Snake Movement',
          description: 'Smooth snake movement with direction controls',
          parameters: [
            { name: 'speed', type: 'number', defaultValue: 150, description: 'Movement speed in milliseconds', customizable: true },
            { name: 'smoothMovement', type: 'boolean', defaultValue: false, description: 'Enable smooth movement animation', customizable: true }
          ],
          codeImplementation: `
function moveSnake() {
  const head = { ...this.snake[0] }
  head.x += this.direction.x
  head.y += this.direction.y
  
  this.snake.unshift(head)
  if (!this.foodEaten) {
    this.snake.pop()
  }
  this.foodEaten = false
}`
        },
        {
          id: 'collision',
          name: 'Collision Detection',
          description: 'Wall and self-collision detection with game over',
          parameters: [
            { name: 'wallCollision', type: 'boolean', defaultValue: true, description: 'Enable wall collision', customizable: true },
            { name: 'wrapAround', type: 'boolean', defaultValue: false, description: 'Snake wraps around screen edges', customizable: true }
          ],
          codeImplementation: `
function checkCollisions() {
  const head = this.snake[0]
  
  // Wall collision
  if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
    if (this.wrapAround) {
      head.x = (head.x + this.gridWidth) % this.gridWidth
      head.y = (head.y + this.gridHeight) % this.gridHeight
    } else {
      this.gameOver()
    }
  }
  
  // Self collision
  for (let i = 1; i < this.snake.length; i++) {
    if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
      this.gameOver()
    }
  }
}`
        }
      ]
    },
    
    prebuiltContent: {
      story: {
        worldLore: {
          id: 'snake-world',
          name: '{{THEME_NAME}} Arena',
          geography: 'A {{THEME_SETTING}} where the {{THEME_CREATURE}} must survive and grow',
          politics: 'Only the longest {{THEME_CREATURE}} can claim victory',
          culture: 'Growth through consumption, survival through skill',
          history: 'An ancient game of survival and growth',
          technology: 'Simple controls, complex strategy',
          magic: ''
        },
        mainStoryArc: {
          id: 'main-arc',
          title: 'The Growing {{THEME_CREATURE}}',
          description: 'Guide your {{THEME_CREATURE}} to become the longest in the arena',
          acts: [],
          themes: ['growth', 'survival', 'skill'],
          tone: 'light' as const
        },
        chapters: [],
        characters: [],
        factions: [],
        subplots: [],
        timeline: [],
        metadata: {
          genre: 'arcade',
          targetAudience: 'all-ages',
          complexity: 'simple' as const,
          estimatedLength: 'short' as const,
          themes: ['growth', 'survival', 'skill'],
          contentWarnings: []
        }
      },
      assets: {
        art: ['snake-head', 'snake-body', 'food-sprite', 'background', 'game-over-screen'],
        audio: ['eat-sound', 'game-over-sound', 'background-music'],
        ui: ['score-display', 'menu-buttons', 'pause-overlay']
      },
      gameplay: {
        mechanics: [
          { id: 'movement', name: 'Movement', complexity: 'simple', description: 'Arrow key or WASD controls', implemented: true },
          { id: 'scoring', name: 'Scoring', complexity: 'simple', description: 'Points for eating food', implemented: true },
          { id: 'collision', name: 'Collision', complexity: 'medium', description: 'Game over on wall/self collision', implemented: true }
        ],
        levels: [
          {
            id: 'level-1',
            name: 'Classic Mode',
            objectives: ['Eat 10 food items', 'Reach score of 100', 'Survive 60 seconds'],
            difficulty: 1,
            mechanics: ['movement', 'collision', 'scoring'],
            estimated_playtime: 15,
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
          description: 'The original green snake on black background',
          assetOverrides: {
            'snake-head': '/templates/snake/classic-head.png',
            'snake-body': '/templates/snake/classic-body.png',
            'background': '/templates/snake/classic-bg.png'
          },
          colorScheme: {
            primary: '#00FF00',
            secondary: '#008800',
            accent: '#FFFF00'
          }
        },
        {
          id: 'neon',
          name: 'Neon Tron',
          description: 'Futuristic neon snake in a digital world',
          assetOverrides: {
            'snake-head': '/templates/snake/neon-head.png',
            'snake-body': '/templates/snake/neon-body.png',
            'background': '/templates/snake/neon-bg.png'
          },
          colorScheme: {
            primary: '#00FFFF',
            secondary: '#0088FF',
            accent: '#FF00FF'
          }
        },
        {
          id: 'nature',
          name: 'Nature Garden',
          description: 'A friendly snake in a garden setting',
          assetOverrides: {
            'snake-head': '/templates/snake/nature-head.png',
            'snake-body': '/templates/snake/nature-body.png',
            'background': '/templates/snake/nature-bg.png'
          },
          colorScheme: {
            primary: '#228B22',
            secondary: '#32CD32',
            accent: '#FFD700'
          }
        }
      ],
      mechanics: [
        {
          id: 'power-ups',
          name: 'Power-ups',
          description: 'Special food items with temporary effects',
          codeModifications: ['add-powerup-system', 'add-powerup-effects'],
          requiredAssets: ['powerup-sprites', 'powerup-sounds']
        },
        {
          id: 'obstacles',
          name: 'Obstacles',
          description: 'Static obstacles to avoid on the playing field',
          codeModifications: ['add-obstacle-generation', 'add-obstacle-collision'],
          requiredAssets: ['obstacle-sprites']
        },
        {
          id: 'multiplayer',
          name: 'Local Multiplayer',
          description: 'Two-player mode on the same screen',
          codeModifications: ['add-second-snake', 'add-split-controls'],
          requiredAssets: ['player2-snake-sprites']
        }
      ],
      visuals: [
        {
          id: 'trail-effects',
          name: 'Snake Trail',
          description: 'Glowing trail effect behind the snake',
          cssModifications: ['add-trail-animations'],
          assetFilters: ['trail-particles']
        },
        {
          id: 'food-animation',
          name: 'Animated Food',
          description: 'Pulsing and rotating food items',
          cssModifications: ['add-food-animations'],
          assetFilters: []
        },
        {
          id: 'screen-shake',
          name: 'Screen Shake',
          description: 'Screen shake effect on collision',
          cssModifications: ['add-shake-animation'],
          assetFilters: []
        }
      ],
      difficulty: [
        {
          id: 'easy',
          name: 'Relaxed',
          parameterAdjustments: {
            speed: 200,
            startLength: 3,
            wrapAround: true
          }
        },
        {
          id: 'normal',
          name: 'Classic',
          parameterAdjustments: {
            speed: 150,
            startLength: 1,
            wrapAround: false
          }
        },
        {
          id: 'hard',
          name: 'Lightning',
          parameterAdjustments: {
            speed: 100,
            startLength: 1,
            wrapAround: false
          }
        }
      ]
    },
    
    codeTemplates: {
      mainGameFile: `
class {{THEME_NAME}}SnakeGame {
  constructor(config = {}) {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas.getContext('2d')
    
    // Game state
    this.gridSize = 20
    this.gridWidth = this.canvas.width / this.gridSize
    this.gridHeight = this.canvas.height / this.gridSize
    
    // Snake properties
    this.snake = [{ x: Math.floor(this.gridWidth/2), y: Math.floor(this.gridHeight/2) }]
    this.direction = { x: 0, y: 0 }
    this.nextDirection = { x: 0, y: 0 }
    
    // Game settings
    this.speed = config.speed || {{SPEED}}
    this.score = 0
    this.gameRunning = false
    this.theme = config.theme || '{{THEME_ID}}'
    
    // Food
    this.food = this.generateFood()
    this.foodEaten = false
    
    this.init()
  }
  
  init() {
    this.loadTheme()
    this.bindControls()
    this.showMenu()
  }
  
  loadTheme() {
    const themes = {
      classic: { 
        snakeColor: '#00FF00', 
        foodColor: '#FF0000', 
        bgColor: '#000000',
        name: 'Snake'
      },
      neon: { 
        snakeColor: '#00FFFF', 
        foodColor: '#FF00FF', 
        bgColor: '#001122',
        name: 'Cyber Snake'
      },
      nature: { 
        snakeColor: '#228B22', 
        foodColor: '#FFD700', 
        bgColor: '#90EE90',
        name: 'Garden Snake'
      }
    }
    this.colors = themes[this.theme] || themes.classic
  }
  
  generateFood() {
    let newFood
    do {
      newFood = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight)
      }
    } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    
    return newFood
  }
  
  bindControls() {
    document.addEventListener('keydown', (e) => {
      if (!this.gameRunning) return
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 }
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 }
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 }
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 }
          break
      }
      e.preventDefault()
    })
  }
  
  startGame() {
    this.gameRunning = true
    this.snake = [{ x: Math.floor(this.gridWidth/2), y: Math.floor(this.gridHeight/2) }]
    this.direction = { x: 1, y: 0 }
    this.nextDirection = { x: 1, y: 0 }
    this.score = 0
    this.food = this.generateFood()
    this.gameLoop()
  }
  
  gameLoop() {
    if (!this.gameRunning) return
    
    this.update()
    this.render()
    
    setTimeout(() => this.gameLoop(), this.speed)
  }
  
  update() {
    // Update direction
    this.direction = { ...this.nextDirection }
    
    // Move snake
    const head = { ...this.snake[0] }
    head.x += this.direction.x
    head.y += this.direction.y
    
    // Check collisions
    if (this.checkCollision(head)) {
      this.gameOver()
      return
    }
    
    this.snake.unshift(head)
    
    // Check food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10
      this.food = this.generateFood()
      this.playEatSound()
    } else {
      this.snake.pop()
    }
  }
  
  checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
      return true
    }
    
    // Self collision
    return this.snake.some(segment => segment.x === head.x && segment.y === head.y)
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = this.colors.bgColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Draw snake
    this.ctx.fillStyle = this.colors.snakeColor
    this.snake.forEach((segment, index) => {
      this.ctx.fillRect(
        segment.x * this.gridSize, 
        segment.y * this.gridSize, 
        this.gridSize - 1, 
        this.gridSize - 1
      )
    })
    
    // Draw food
    this.ctx.fillStyle = this.colors.foodColor
    this.ctx.fillRect(
      this.food.x * this.gridSize, 
      this.food.y * this.gridSize, 
      this.gridSize - 1, 
      this.gridSize - 1
    )
    
    // Draw score
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '20px Arial'
    this.ctx.fillText('Score: ' + this.score, 10, 30)
  }
  
  gameOver() {
    this.gameRunning = false
    this.playGameOverSound()
    this.showGameOver()
  }
  
  showMenu() {
    this.ctx.fillStyle = this.colors.bgColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '32px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.colors.name, this.canvas.width/2, this.canvas.height/2 - 50)
    
    this.ctx.font = '16px Arial'
    this.ctx.fillText('Press SPACE to start', this.canvas.width/2, this.canvas.height/2 + 20)
    this.ctx.fillText('Use Arrow Keys or WASD to move', this.canvas.width/2, this.canvas.height/2 + 50)
    
    this.ctx.textAlign = 'left'
    
    const startHandler = (e) => {
      if (e.key === ' ') {
        document.removeEventListener('keydown', startHandler)
        this.startGame()
      }
    }
    document.addEventListener('keydown', startHandler)
  }
  
  showGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '32px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Game Over!', this.canvas.width/2, this.canvas.height/2 - 50)
    
    this.ctx.font = '20px Arial'
    this.ctx.fillText('Final Score: ' + this.score, this.canvas.width/2, this.canvas.height/2)
    
    this.ctx.font = '16px Arial'
    this.ctx.fillText('Press SPACE to play again', this.canvas.width/2, this.canvas.height/2 + 50)
    
    this.ctx.textAlign = 'left'
    
    const restartHandler = (e) => {
      if (e.key === ' ') {
        document.removeEventListener('keydown', restartHandler)
        this.startGame()
      }
    }
    document.addEventListener('keydown', restartHandler)
  }
  
  playEatSound() {
    // Play eat sound effect
    console.log('🍎 Nom!')
  }
  
  playGameOverSound() {
    // Play game over sound
    console.log('💀 Game Over!')
  }
}

// Initialize the game
const game = new {{THEME_NAME}}SnakeGame({
  theme: '{{SELECTED_THEME}}',
  speed: {{SPEED}},
  difficulty: '{{SELECTED_DIFFICULTY}}'
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
<body>
    <div class="game-container {{THEME_CLASS}}">
        <header class="game-header">
            <h1>{{GAME_TITLE}}</h1>
            <div class="stats">
                <div class="stat">
                    <span class="label">Score:</span>
                    <span id="score" class="value">0</span>
                </div>
                <div class="stat">
                    <span class="label">High Score:</span>
                    <span id="highscore" class="value">0</span>
                </div>
            </div>
        </header>
        
        <main class="game-main">
            <canvas id="gameCanvas" width="600" height="400"></canvas>
            <div class="controls">
                <p>Use Arrow Keys or WASD to control your snake</p>
                <p>Eat food to grow and increase your score!</p>
            </div>
        </main>
    </div>
    
    <script src="game.js"></script>
</body>
</html>
`,
      cssTemplate: `
body {
  margin: 0;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}});
  color: white;
  min-height: 100vh;
}

.game-container {
  max-width: 800px;
  margin: 0 auto;
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.game-header h1 {
  font-size: 2.5em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 15px;
}

.stat {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

.game-main {
  text-align: center;
}

#gameCanvas {
  border: 3px solid {{ACCENT_COLOR}};
  border-radius: 10px;
  background: {{PRIMARY_COLOR}};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.controls {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.controls p {
  margin: 5px 0;
}

/* Theme: {{THEME_NAME}} */
.{{THEME_CLASS}} {
  --primary-color: {{PRIMARY_COLOR}};
  --secondary-color: {{SECONDARY_COLOR}};
  --accent-color: {{ACCENT_COLOR}};
}

@media (max-width: 768px) {
  .game-container {
    padding: 10px;
  }
  
  #gameCanvas {
    max-width: 100%;
    height: auto;
  }
  
  .stats {
    flex-direction: column;
    gap: 10px;
  }
}
`,
      configFile: `
const SNAKE_CONFIG = {
  version: '1.0.0',
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  
  themes: {
    classic: {
      name: 'Classic Snake',
      snakeColor: '#00FF00',
      foodColor: '#FF0000',
      bgColor: '#000000'
    },
    neon: {
      name: 'Neon Snake',
      snakeColor: '#00FFFF',
      foodColor: '#FF00FF',
      bgColor: '#001122'
    },
    nature: {
      name: 'Garden Snake',
      snakeColor: '#228B22',
      foodColor: '#FFD700',
      bgColor: '#90EE90'
    }
  },
  
  gameplay: {
    baseSpeed: {{SPEED}},
    gridSize: 20,
    enablePowerUps: {{ENABLE_POWERUPS}},
    enableObstacles: {{ENABLE_OBSTACLES}},
    wrapAroundEdges: {{WRAP_AROUND}}
  }
}
`,
      additionalFiles: {
        'README.md': `
# {{GAME_TITLE}}

A {{THEME_NAME}}-themed Snake game built with HTML5 Canvas.

## How to Play

1. Use Arrow Keys or WASD to control your snake
2. Eat food to grow your snake and increase score
3. Avoid hitting walls or your own body
4. Try to beat your high score!

## Features

- **Theme**: {{SELECTED_THEME_NAME}}
- **Difficulty**: {{SELECTED_DIFFICULTY_NAME}}
- **Speed**: {{SPEED}}ms per move
- **Controls**: Arrow Keys or WASD
- **Scoring**: 10 points per food item

## Game Mechanics

- Snake grows by one segment for each food eaten
- Game ends when snake hits wall or itself
- Score increases with each food item consumed
- High score is saved locally

Enjoy the classic Snake experience with modern styling!
        `
      }
    },
    
    generationConfig: {
      storyPromptTemplate: 'Create a story for a {{THEME_NAME}} snake game set in {{THEME_SETTING}}. The player controls a {{THEME_CREATURE}} that must grow and survive.',
      assetPromptTemplate: 'Generate {{THEME_NAME}}-themed assets for a snake game including: {{THEME_CREATURE}} sprites, food items, {{THEME_SETTING}} background, and UI elements.',
      gameplayPromptTemplate: 'Design snake game mechanics with {{SELECTED_DIFFICULTY}} difficulty, {{SELECTED_MECHANICS}} features, and {{THEME_NAME}} theme.',
      variableReplacements: {
        '{{THEME_NAME}}': 'Classic',
        '{{THEME_CREATURE}}': 'snake',
        '{{THEME_SETTING}}': 'a simple grid arena',
        '{{SPEED}}': '150'
      }
    }
  },

  // Flappy Bird Template
  {
    id: 'flappy-bird',
    name: 'Flappy Bird Style Game',
    description: 'Create the addictive side-scrolling bird game with pipes and scoring',
    category: 'beginner',
    complexity: 'beginner',
    estimatedTime: '1-2 hours',
    tags: ['arcade', 'physics', 'endless', 'challenging'],
    
    gameStructure: {
      gameType: 'flappy',
      framework: 'html5-canvas',
      coreLoop: 'Tap/Click → Flap Wings → Navigate Pipes → Score Points → Repeat',
      scenes: [
        {
          id: 'menu',
          name: 'Main Menu',
          type: 'menu',
          requiredAssets: ['menu-bg', 'logo', 'play-button'],
          codeSnippet: `
class MenuScene {
  render() {
    this.drawBackground()
    this.drawLogo()
    this.drawPlayButton()
    this.drawInstructions()
  }
}`
        },
        {
          id: 'game',
          name: 'Flying Game',
          type: 'game',
          requiredAssets: ['bird-sprite', 'pipe-sprite', 'background', 'ground'],
          codeSnippet: `
class GameScene {
  constructor() {
    this.bird = { x: 100, y: 200, velocity: 0 }
    this.pipes = []
    this.score = 0
    this.gravity = 0.6
    this.jumpStrength = -12
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
          description: 'Gravity and jumping mechanics for the bird',
          parameters: [
            { name: 'gravity', type: 'number', defaultValue: 0.6, description: 'Downward gravity force', customizable: true },
            { name: 'jumpStrength', type: 'number', defaultValue: -12, description: 'Upward jump velocity', customizable: true }
          ],
          codeImplementation: `
function updateBird() {
  this.bird.velocity += this.gravity
  this.bird.y += this.bird.velocity
  
  // Rotation based on velocity
  this.bird.rotation = Math.min(Math.max(this.bird.velocity * 0.1, -0.5), 1.5)
}`
        },
        {
          id: 'pipes',
          name: 'Pipe Generation',
          description: 'Infinite scrolling pipes with gaps',
          parameters: [
            { name: 'pipeSpeed', type: 'number', defaultValue: 2, description: 'Horizontal pipe movement speed', customizable: true },
            { name: 'pipeGap', type: 'number', defaultValue: 150, description: 'Gap size between pipes', customizable: true }
          ],
          codeImplementation: `
function generatePipe() {
  const gapY = Math.random() * (this.canvas.height - this.pipeGap - 200) + 100
  
  this.pipes.push({
    x: this.canvas.width,
    topHeight: gapY,
    bottomY: gapY + this.pipeGap,
    passed: false
  })
}`
        }
      ]
    },
    
    prebuiltContent: {
      story: {
        worldLore: {
          id: 'flappy-world',
          name: '{{THEME_NAME}} Adventure',
          geography: 'An endless {{THEME_SETTING}} filled with obstacles',
          politics: 'Survival of the most skilled flyer',
          culture: 'Persistence and timing are everything',
          history: 'A simple concept that became legendary',
          technology: 'One-touch controls, infinite challenge',
          magic: ''
        },
        mainStoryArc: {
          id: 'main-arc',
          title: 'The Flying {{THEME_CREATURE}}',
          description: 'Help the {{THEME_CREATURE}} navigate through endless obstacles',
          acts: [],
          themes: ['persistence', 'skill', 'challenge'],
          tone: 'light' as const
        },
        chapters: [],
        characters: [],
        factions: [],
        subplots: [],
        timeline: [],
        metadata: {
          genre: 'arcade',
          targetAudience: 'all-ages',
          complexity: 'simple' as const,
          estimatedLength: 'short' as const,
          themes: ['persistence', 'skill', 'challenge'],
          contentWarnings: []
        }
      },
      assets: {
        art: ['bird-sprite', 'pipe-top', 'pipe-bottom', 'background', 'ground', 'clouds'],
        audio: ['flap-sound', 'score-sound', 'hit-sound', 'swoosh-sound'],
        ui: ['score-numbers', 'game-over-panel', 'medal-sprites']
      },
      gameplay: {
        mechanics: [
          { id: 'flying', name: 'Flying', complexity: 'simple', description: 'Tap or click to flap wings', implemented: true },
          { id: 'obstacles', name: 'Obstacles', complexity: 'medium', description: 'Navigate through pipe gaps', implemented: true },
          { id: 'scoring', name: 'Scoring', complexity: 'simple', description: 'Points for passing through pipes', implemented: true }
        ],
        levels: [
          {
            id: 'endless',
            name: 'Endless Flight',
            objectives: ['Pass through 5 pipes', 'Score 10 points', 'Beat your high score'],
            difficulty: 5,
            mechanics: ['flying', 'obstacles', 'scoring'],
            estimated_playtime: 10,
            status: 'design'
          }
        ]
      }
    },
    
    customizationOptions: {
      themes: [
        {
          id: 'classic',
          name: 'Classic Bird',
          description: 'The original yellow bird with green pipes',
          assetOverrides: {
            'bird-sprite': '/templates/flappy/classic-bird.png',
            'pipe-sprite': '/templates/flappy/green-pipe.png'
          },
          colorScheme: {
            primary: '#87CEEB',
            secondary: '#32CD32',
            accent: '#FFD700'
          }
        },
        {
          id: 'space',
          name: 'Space Rocket',
          description: 'A rocket ship navigating through asteroid fields',
          assetOverrides: {
            'bird-sprite': '/templates/flappy/rocket.png',
            'pipe-sprite': '/templates/flappy/asteroid.png'
          },
          colorScheme: {
            primary: '#000428',
            secondary: '#004e92',
            accent: '#FF6B6B'
          }
        },
        {
          id: 'underwater',
          name: 'Submarine Adventure',
          description: 'A submarine navigating underwater obstacles',
          assetOverrides: {
            'bird-sprite': '/templates/flappy/submarine.png',
            'pipe-sprite': '/templates/flappy/coral.png'
          },
          colorScheme: {
            primary: '#006994',
            secondary: '#47B5FF',
            accent: '#DDA0DD'
          }
        }
      ],
      mechanics: [
        {
          id: 'power-ups',
          name: 'Power-ups',
          description: 'Temporary abilities like shield or slow-motion',
          codeModifications: ['add-powerup-system', 'add-powerup-effects'],
          requiredAssets: ['powerup-sprites', 'powerup-sounds']
        },
        {
          id: 'multiple-birds',
          name: 'Bird Squad',
          description: 'Control multiple birds at once',
          codeModifications: ['add-multi-bird-system'],
          requiredAssets: ['additional-bird-sprites']
        }
      ],
      visuals: [
        {
          id: 'parallax',
          name: 'Parallax Background',
          description: 'Multi-layer scrolling background',
          cssModifications: ['add-parallax-layers'],
          assetFilters: ['background-layers']
        },
        {
          id: 'particles',
          name: 'Wing Particles',
          description: 'Particle effects when flapping',
          cssModifications: ['add-particle-system'],
          assetFilters: []
        }
      ],
      difficulty: [
        {
          id: 'easy',
          name: 'Gentle Glide',
          parameterAdjustments: {
            gravity: 0.4,
            pipeGap: 180,
            pipeSpeed: 1.5
          }
        },
        {
          id: 'normal',
          name: 'Classic Flight',
          parameterAdjustments: {
            gravity: 0.6,
            pipeGap: 150,
            pipeSpeed: 2
          }
        },
        {
          id: 'hard',
          name: 'Turbulent Skies',
          parameterAdjustments: {
            gravity: 0.8,
            pipeGap: 120,
            pipeSpeed: 2.5
          }
        }
      ]
    },
    
    codeTemplates: {
      mainGameFile: `
class {{THEME_NAME}}FlappyGame {
  constructor(config = {}) {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas.getContext('2d')
    
    // Game settings
    this.gravity = config.gravity || {{GRAVITY}}
    this.jumpStrength = config.jumpStrength || {{JUMP_STRENGTH}}
    this.pipeSpeed = config.pipeSpeed || {{PIPE_SPEED}}
    this.pipeGap = config.pipeGap || {{PIPE_GAP}}
    this.theme = config.theme || '{{THEME_ID}}'
    
    // Game state
    this.gameState = 'menu' // menu, playing, gameOver
    this.score = 0
    this.highScore = localStorage.getItem('flappyHighScore') || 0
    
    // Bird properties
    this.bird = {
      x: 100,
      y: this.canvas.height / 2,
      velocity: 0,
      rotation: 0,
      size: 30
    }
    
    // Pipes
    this.pipes = []
    this.pipeWidth = 80
    this.pipeSpacing = 300
    
    // Background
    this.backgroundX = 0
    
    this.init()
  }
  
  init() {
    this.loadTheme()
    this.bindControls()
    this.gameLoop()
  }
  
  loadTheme() {
    const themes = {
      classic: {
        bgColor: '#87CEEB',
        pipeColor: '#32CD32',
        birdColor: '#FFD700',
        name: 'Flappy Bird'
      },
      space: {
        bgColor: '#000428',
        pipeColor: '#FF6B6B',
        birdColor: '#00FF00',
        name: 'Space Rocket'
      },
      underwater: {
        bgColor: '#006994',
        pipeColor: '#DDA0DD',
        birdColor: '#FFE4B5',
        name: 'Submarine'
      }
    }
    this.colors = themes[this.theme] || themes.classic
  }
  
  bindControls() {
    const jump = () => {
      if (this.gameState === 'menu') {
        this.startGame()
      } else if (this.gameState === 'playing') {
        this.bird.velocity = this.jumpStrength
        this.playFlapSound()
      } else if (this.gameState === 'gameOver') {
        this.resetGame()
      }
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        jump()
        e.preventDefault()
      }
    })
    
    this.canvas.addEventListener('click', jump)
    this.canvas.addEventListener('touchstart', (e) => {
      jump()
      e.preventDefault()
    })
  }
  
  startGame() {
    this.gameState = 'playing'
    this.score = 0
    this.bird = {
      x: 100,
      y: this.canvas.height / 2,
      velocity: 0,
      rotation: 0,
      size: 30
    }
    this.pipes = []
    this.generatePipe()
  }
  
  resetGame() {
    this.gameState = 'menu'
  }
  
  generatePipe() {
    const minGapY = 100
    const maxGapY = this.canvas.height - this.pipeGap - 100
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY
    
    this.pipes.push({
      x: this.canvas.width,
      topHeight: gapY,
      bottomY: gapY + this.pipeGap,
      passed: false
    })
  }
  
  gameLoop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.gameLoop())
  }
  
  update() {
    if (this.gameState !== 'playing') return
    
    // Update bird
    this.bird.velocity += this.gravity
    this.bird.y += this.bird.velocity
    this.bird.rotation = Math.min(Math.max(this.bird.velocity * 0.1, -0.5), 1.5)
    
    // Check ground/ceiling collision
    if (this.bird.y <= 0 || this.bird.y >= this.canvas.height - 50) {
      this.gameOver()
      return
    }
    
    // Update pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i]
      pipe.x -= this.pipeSpeed
      
      // Remove off-screen pipes
      if (pipe.x + this.pipeWidth < 0) {
        this.pipes.splice(i, 1)
        continue
      }
      
      // Check collision
      if (this.checkPipeCollision(pipe)) {
        this.gameOver()
        return
      }
      
      // Check scoring
      if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
        pipe.passed = true
        this.score++
        this.playScoreSound()
        
        if (this.score > this.highScore) {
          this.highScore = this.score
          localStorage.setItem('flappyHighScore', this.highScore)
        }
      }
    }
    
    // Generate new pipes
    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - this.pipeSpacing) {
      this.generatePipe()
    }
  }
  
  checkPipeCollision(pipe) {
    const birdLeft = this.bird.x - this.bird.size / 2
    const birdRight = this.bird.x + this.bird.size / 2
    const birdTop = this.bird.y - this.bird.size / 2
    const birdBottom = this.bird.y + this.bird.size / 2
    
    const pipeLeft = pipe.x
    const pipeRight = pipe.x + this.pipeWidth
    
    // Check horizontal overlap
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      // Check vertical collision
      if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
        return true
      }
    }
    
    return false
  }
  
  gameOver() {
    this.gameState = 'gameOver'
    this.playHitSound()
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = this.colors.bgColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    if (this.gameState === 'menu') {
      this.renderMenu()
    } else if (this.gameState === 'playing') {
      this.renderGame()
    } else if (this.gameState === 'gameOver') {
      this.renderGameOver()
    }
  }
  
  renderMenu() {
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.colors.name, this.canvas.width / 2, this.canvas.height / 2 - 50)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillText('Click or Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2 + 50)
    
    this.ctx.font = '18px Arial'
    this.ctx.fillText('High Score: ' + this.highScore, this.canvas.width / 2, this.canvas.height / 2 + 100)
    
    this.ctx.textAlign = 'left'
  }
  
  renderGame() {
    // Draw pipes
    this.ctx.fillStyle = this.colors.pipeColor
    this.pipes.forEach(pipe => {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight)
      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY)
    })
    
    // Draw bird
    this.ctx.save()
    this.ctx.translate(this.bird.x, this.bird.y)
    this.ctx.rotate(this.bird.rotation)
    this.ctx.fillStyle = this.colors.birdColor
    this.ctx.fillRect(-this.bird.size / 2, -this.bird.size / 2, this.bird.size, this.bird.size)
    this.ctx.restore()
    
    // Draw ground
    this.ctx.fillStyle = '#8B4513'
    this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50)
    
    // Draw score
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '36px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.score.toString(), this.canvas.width / 2, 60)
    this.ctx.textAlign = 'left'
  }
  
  renderGameOver() {
    this.renderGame() // Draw game scene
    
    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 50)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2)
    this.ctx.fillText('High Score: ' + this.highScore, this.canvas.width / 2, this.canvas.height / 2 + 30)
    
    this.ctx.font = '18px Arial'
    this.ctx.fillText('Click or Press SPACE to Play Again', this.canvas.width / 2, this.canvas.height / 2 + 80)
    
    this.ctx.textAlign = 'left'
  }
  
  playFlapSound() {
    console.log('🐦 Flap!')
  }
  
  playScoreSound() {
    console.log('✨ Score!')
  }
  
  playHitSound() {
    console.log('💥 Hit!')
  }
}

// Initialize the game
const game = new {{THEME_NAME}}FlappyGame({
  theme: '{{SELECTED_THEME}}',
  gravity: {{GRAVITY}},
  jumpStrength: {{JUMP_STRENGTH}},
  pipeSpeed: {{PIPE_SPEED}},
  pipeGap: {{PIPE_GAP}}
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
<body>
    <div class="game-container {{THEME_CLASS}}">
        <header class="game-header">
            <h1>{{GAME_TITLE}}</h1>
            <p>Tap or click to flap your wings!</p>
        </header>
        
        <main class="game-main">
            <canvas id="gameCanvas" width="800" height="600"></canvas>
            <div class="instructions">
                <h3>How to Play</h3>
                <ul>
                    <li>Click or press SPACE to flap</li>
                    <li>Navigate through the pipes</li>
                    <li>Score points by passing through gaps</li>
                    <li>Don't hit the pipes or ground!</li>
                </ul>
            </div>
        </main>
    </div>
    
    <script src="game.js"></script>
</body>
</html>
`,
      cssTemplate: `
body {
  margin: 0;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}});
  color: white;
  min-height: 100vh;
}

.game-container {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.game-header h1 {
  font-size: 3em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  color: {{ACCENT_COLOR}};
}

.game-header p {
  font-size: 1.2em;
  margin: 10px 0 30px;
  opacity: 0.9;
}

#gameCanvas {
  border: 4px solid {{ACCENT_COLOR}};
  border-radius: 15px;
  background: {{PRIMARY_COLOR}};
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  user-select: none;
}

.instructions {
  margin-top: 30px;
  background: rgba(255, 255, 255, 0.1);
  padding: 25px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  display: inline-block;
  text-align: left;
}

.instructions h3 {
  margin-top: 0;
  color: {{ACCENT_COLOR}};
  text-align: center;
}

.instructions ul {
  margin: 15px 0;
  padding-left: 20px;
}

.instructions li {
  margin: 8px 0;
  font-size: 1.1em;
}

/* Theme: {{THEME_NAME}} */
.{{THEME_CLASS}} {
  --primary-color: {{PRIMARY_COLOR}};
  --secondary-color: {{SECONDARY_COLOR}};
  --accent-color: {{ACCENT_COLOR}};
}

@media (max-width: 900px) {
  .game-container {
    padding: 10px;
  }
  
  #gameCanvas {
    max-width: 100%;
    height: auto;
  }
  
  .game-header h1 {
    font-size: 2.5em;
  }
}

@media (max-width: 600px) {
  .game-header h1 {
    font-size: 2em;
  }
  
  .instructions {
    margin: 20px;
    padding: 15px;
  }
}
`,
      configFile: `
const FLAPPY_CONFIG = {
  version: '1.0.0',
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  
  physics: {
    gravity: {{GRAVITY}},
    jumpStrength: {{JUMP_STRENGTH}},
    terminalVelocity: 15
  },
  
  pipes: {
    speed: {{PIPE_SPEED}},
    gap: {{PIPE_GAP}},
    width: 80,
    spacing: 300
  },
  
  themes: {
    classic: {
      name: 'Flappy Bird',
      bgColor: '#87CEEB',
      pipeColor: '#32CD32',
      birdColor: '#FFD700'
    },
    space: {
      name: 'Space Rocket',
      bgColor: '#000428',
      pipeColor: '#FF6B6B',
      birdColor: '#00FF00'
    },
    underwater: {
      name: 'Submarine',
      bgColor: '#006994',
      pipeColor: '#DDA0DD',
      birdColor: '#FFE4B5'
    }
  }
}
`,
      additionalFiles: {
        'README.md': `
# {{GAME_TITLE}}

A {{THEME_NAME}}-themed Flappy Bird game with smooth physics and responsive controls.

## How to Play

1. **Click** or press **SPACE** to flap wings
2. Navigate through pipe gaps without hitting them
3. Score points by successfully passing through pipes
4. Avoid hitting the ground or ceiling
5. Try to beat your high score!

## Game Features

- **Theme**: {{SELECTED_THEME_NAME}}
- **Difficulty**: {{SELECTED_DIFFICULTY_NAME}}
- **Physics**: Realistic gravity and jump mechanics
- **Endless Gameplay**: Procedurally generated pipes
- **High Score**: Automatically saved locally

## Controls

- **Mouse Click**: Flap wings
- **Space Bar**: Flap wings
- **Touch Screen**: Tap to flap (mobile)

## Difficulty Settings

The game includes three difficulty levels that affect:
- Gravity strength
- Pipe gap size  
- Pipe movement speed
- Jump power

Challenge yourself and see how far you can fly!
        `
      }
    },
    
    generationConfig: {
      storyPromptTemplate: 'Create a story for a {{THEME_NAME}} flappy bird game where a {{THEME_CREATURE}} must navigate through {{THEME_OBSTACLES}} in {{THEME_SETTING}}.',
      assetPromptTemplate: 'Generate {{THEME_NAME}}-themed assets for a flappy bird game including: {{THEME_CREATURE}} sprite, {{THEME_OBSTACLES}}, {{THEME_SETTING}} background, and sound effects.',
      gameplayPromptTemplate: 'Design flappy bird mechanics with {{SELECTED_DIFFICULTY}} difficulty, {{GRAVITY}} gravity, and {{THEME_NAME}} theme elements.',
      variableReplacements: {
        '{{THEME_NAME}}': 'Classic',
        '{{THEME_CREATURE}}': 'bird',
        '{{THEME_OBSTACLES}}': 'pipes',
        '{{THEME_SETTING}}': 'sky',
        '{{GRAVITY}}': '0.6',
        '{{JUMP_STRENGTH}}': '-12',
        '{{PIPE_SPEED}}': '2',
        '{{PIPE_GAP}}': '150'
      }
    }
  },

  // 2D Platformer Template
  {
    id: 'platformer-2d',
    name: '2D Platformer Adventure',
    description: 'Create a classic side-scrolling platformer with levels, enemies, and power-ups',
    category: 'intermediate',
    complexity: 'intermediate',
    estimatedTime: '3-4 hours',
    tags: ['platformer', 'adventure', 'side-scrolling', 'levels'],
    
    gameStructure: {
      gameType: 'platformer',
      framework: 'html5-canvas',
      coreLoop: 'Jump → Avoid Enemies → Collect Items → Reach Goal → Progress',
      scenes: [
        {
          id: 'level-1',
          name: 'Forest Level',
          type: 'game',
          requiredAssets: ['forest-bg', 'platform-tiles', 'enemy-goomba', 'collectible-coin'],
          codeSnippet: `
class Level {
  constructor(levelData) {
    this.platforms = levelData.platforms
    this.enemies = levelData.enemies
    this.collectibles = levelData.collectibles
    this.goal = levelData.goal
    this.background = levelData.background
  }
  
  update(player) {
    this.updateEnemies()
    this.checkCollectibles(player)
    this.checkGoal(player)
  }
}`
        },
        {
          id: 'player',
          name: 'Player Character',
          type: 'game',
          requiredAssets: ['player-idle', 'player-run', 'player-jump'],
          codeSnippet: `
class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.velocityX = 0
    this.velocityY = 0
    this.onGround = false
    this.facing = 'right'
  }
  
  update() {
    this.applyPhysics()
    this.updateAnimation()
    this.handleInput()
  }
}`
        }
      ],
      mechanics: [
        {
          id: 'physics',
          name: 'Platform Physics',
          description: 'Realistic jumping and collision with platforms',
          parameters: [
            { name: 'gravity', type: 'number', defaultValue: 0.8, description: 'Downward gravity force', customizable: true },
            { name: 'jumpPower', type: 'number', defaultValue: -15, description: 'Jump velocity strength', customizable: true },
            { name: 'moveSpeed', type: 'number', defaultValue: 5, description: 'Horizontal movement speed', customizable: true }
          ],
          codeImplementation: `
function applyPhysics() {
  // Apply gravity
  if (!this.onGround) {
    this.velocityY += this.gravity
  }
  
  // Update position
  this.x += this.velocityX
  this.y += this.velocityY
  
  // Reset velocity
  this.velocityX *= 0.8 // Friction
  
  // Terminal velocity
  this.velocityY = Math.min(this.velocityY, 15)
}`
        },
        {
          id: 'collision',
          name: 'Platform Collision',
          description: 'Collision detection with platforms and enemies',
          parameters: [
            { name: 'platformSolidity', type: 'boolean', defaultValue: true, description: 'Whether platforms are solid', customizable: false }
          ],
          codeImplementation: `
function checkPlatformCollisions(platforms) {
  this.onGround = false
  
  platforms.forEach(platform => {
    if (this.intersects(platform)) {
      // Land on top
      if (this.velocityY > 0 && this.bottom <= platform.top + 10) {
        this.y = platform.top - this.height
        this.velocityY = 0
        this.onGround = true
      }
      // Hit from below
      else if (this.velocityY < 0 && this.top >= platform.bottom - 10) {
        this.y = platform.bottom
        this.velocityY = 0
      }
      // Side collisions
      else if (this.velocityX > 0) {
        this.x = platform.left - this.width
      }
      else if (this.velocityX < 0) {
        this.x = platform.right
      }
    }
  })
}`
        }
      ]
    },
    
    prebuiltContent: {
      story: {
        worldLore: {
          id: 'platformer-world',
          name: '{{THEME_NAME}} Kingdom',
          geography: 'A vast {{THEME_SETTING}} with multiple themed regions',
          politics: 'The {{THEME_VILLAIN}} has taken over the kingdom',
          culture: 'Heroes must collect power-ups and overcome challenges',
          history: 'A once peaceful land now filled with obstacles',
          technology: 'Magical platforms and mysterious power-ups',
          magic: 'Ancient {{THEME_MAGIC}} flows through the land'
        },
        mainStoryArc: {
          id: 'main-arc',
          title: 'The {{THEME_HERO}}\'s Quest',
          description: 'Journey through multiple worlds to save the {{THEME_KINGDOM}}',
          acts: [],
          themes: ['heroism', 'adventure', 'progression'],
          tone: 'light' as const
        },
        chapters: [],
        characters: [
          {
            id: 'hero',
            name: '{{THEME_HERO}}',
            description: 'The brave protagonist on a quest to save the kingdom',
            role: 'protagonist' as const,
            relationships: []
          },
          {
            id: 'villain',
            name: '{{THEME_VILLAIN}}',
            description: 'The evil force that has corrupted the kingdom',
            role: 'antagonist' as const,
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
          themes: ['heroism', 'adventure', 'progression'],
          contentWarnings: []
        }
      },
      assets: {
        art: [
          'hero-idle', 'hero-run', 'hero-jump', 'hero-fall',
          'enemy-goomba', 'enemy-spider', 'enemy-bird',
          'platform-grass', 'platform-stone', 'platform-ice',
          'collectible-coin', 'collectible-gem', 'collectible-key',
          'powerup-mushroom', 'powerup-flower', 'powerup-star',
          'background-forest', 'background-cave', 'background-sky'
        ],
        audio: [
          'jump-sound', 'land-sound', 'coin-collect', 'powerup-get',
          'enemy-defeat', 'level-complete', 'background-music'
        ],
        ui: [
          'lives-counter', 'score-display', 'level-progress', 'pause-menu'
        ]
      },
      gameplay: {
        mechanics: [
          { id: 'jumping', name: 'Jumping', complexity: 'simple', description: 'Precise platform jumping', implemented: true },
          { id: 'enemies', name: 'Enemy AI', complexity: 'medium', description: 'Various enemy movement patterns', implemented: true },
          { id: 'collectibles', name: 'Collectibles', complexity: 'simple', description: 'Coins, gems, and power-ups', implemented: true },
          { id: 'levels', name: 'Level Progression', complexity: 'medium', description: 'Multiple levels with increasing difficulty', implemented: true }
        ],
        levels: [
          {
            id: 'level-1',
            name: 'Sunny Meadows',
            objectives: ['Reach the flag', 'Collect 50 coins', 'Defeat 3 enemies'],
            difficulty: 2,
            mechanics: ['jumping', 'enemies', 'collectibles'],
            estimated_playtime: 300,
            status: 'design'
          },
          {
            id: 'level-2',
            name: 'Dark Forest',
            objectives: ['Navigate the tree maze', 'Find the hidden key', 'Avoid spider enemies'],
            difficulty: 4,
            mechanics: ['jumping', 'enemies', 'collectibles'],
            estimated_playtime: 450,
            status: 'design'
          },
          {
            id: 'level-3',
            name: 'Mountain Peak',
            objectives: ['Climb to the summit', 'Use moving platforms', 'Defeat the boss'],
            difficulty: 6,
            mechanics: ['jumping', 'enemies', 'boss-fight'],
            estimated_playtime: 600,
            status: 'design'
          }
        ]
      }
    },
    
    customizationOptions: {
      themes: [
        {
          id: 'mario-style',
          name: 'Mushroom Kingdom',
          description: 'Classic Mario-inspired world with pipes and goombas',
          assetOverrides: {
            'hero-idle': '/templates/platformer/mario-idle.png',
            'enemy-goomba': '/templates/platformer/goomba.png',
            'platform-grass': '/templates/platformer/grass-platform.png'
          },
          colorScheme: {
            primary: '#87CEEB',
            secondary: '#228B22',
            accent: '#FFD700'
          }
        },
        {
          id: 'sonic-style',
          name: 'Speed Zone',
          description: 'Fast-paced world with loops and speed boosts',
          assetOverrides: {
            'hero-idle': '/templates/platformer/sonic-idle.png',
            'platform-grass': '/templates/platformer/speed-platform.png'
          },
          colorScheme: {
            primary: '#4169E1',
            secondary: '#00CED1',
            accent: '#FF1493'
          }
        },
        {
          id: 'medieval',
          name: 'Castle Realm',
          description: 'Medieval castle setting with knights and dragons',
          assetOverrides: {
            'hero-idle': '/templates/platformer/knight-idle.png',
            'enemy-goomba': '/templates/platformer/skeleton.png',
            'platform-grass': '/templates/platformer/stone-platform.png'
          },
          colorScheme: {
            primary: '#2F4F4F',
            secondary: '#8B4513',
            accent: '#DC143C'
          }
        }
      ],
      mechanics: [
        {
          id: 'double-jump',
          name: 'Double Jump',
          description: 'Allow player to jump twice in mid-air',
          codeModifications: ['add-double-jump-mechanic'],
          requiredAssets: ['double-jump-effect']
        },
        {
          id: 'wall-jump',
          name: 'Wall Jumping',
          description: 'Jump off walls to reach higher platforms',
          codeModifications: ['add-wall-jump-mechanic'],
          requiredAssets: ['wall-jump-particles']
        },
        {
          id: 'power-ups',
          name: 'Power-Up System',
          description: 'Collectible power-ups that enhance abilities',
          codeModifications: ['add-powerup-system'],
          requiredAssets: ['powerup-sprites', 'powerup-effects']
        }
      ],
      visuals: [
        {
          id: 'parallax',
          name: 'Parallax Scrolling',
          description: 'Multi-layer background scrolling for depth',
          cssModifications: ['add-parallax-system'],
          assetFilters: ['background-layers']
        },
        {
          id: 'particles',
          name: 'Particle Effects',
          description: 'Dust, sparks, and other visual effects',
          cssModifications: ['add-particle-system'],
          assetFilters: []
        },
        {
          id: 'animations',
          name: 'Advanced Animations',
          description: 'Smooth character and enemy animations',
          cssModifications: ['add-animation-system'],
          assetFilters: ['animation-frames']
        }
      ],
      difficulty: [
        {
          id: 'easy',
          name: 'Adventure Mode',
          parameterAdjustments: {
            gravity: 0.6,
            jumpPower: -18,
            enemySpeed: 1,
            lives: 5
          }
        },
        {
          id: 'normal',
          name: 'Classic Mode',
          parameterAdjustments: {
            gravity: 0.8,
            jumpPower: -15,
            enemySpeed: 2,
            lives: 3
          }
        },
        {
          id: 'hard',
          name: 'Expert Mode',
          parameterAdjustments: {
            gravity: 1.0,
            jumpPower: -12,
            enemySpeed: 3,
            lives: 1
          }
        }
      ]
    },
    
    codeTemplates: {
      mainGameFile: `
class {{THEME_NAME}}PlatformerGame {
  constructor(config = {}) {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas.getContext('2d')
    
    // Game settings
    this.gravity = config.gravity || {{GRAVITY}}
    this.theme = config.theme || '{{THEME_ID}}'
    this.difficulty = config.difficulty || 'normal'
    
    // Game state
    this.currentLevel = 0
    this.score = 0
    this.lives = {{LIVES}}
    this.gameState = 'menu' // menu, playing, paused, gameOver, levelComplete
    
    // Player
    this.player = new Player(100, 300)
    
    // Level data
    this.levels = this.generateLevels()
    this.camera = { x: 0, y: 0 }
    
    this.init()
  }
  
  init() {
    this.loadTheme()
    this.bindControls()
    this.loadLevel(0)
    this.gameLoop()
  }
  
  loadTheme() {
    const themes = {
      'mario-style': {
        name: 'Mushroom Kingdom',
        heroColor: '#FF0000',
        platformColor: '#8B4513',
        bgColor: '#87CEEB'
      },
      'sonic-style': {
        name: 'Speed Zone',
        heroColor: '#0000FF',
        platformColor: '#32CD32',
        bgColor: '#ADD8E6'
      },
      'medieval': {
        name: 'Castle Realm',
        heroColor: '#C0C0C0',
        platformColor: '#696969',
        bgColor: '#2F4F4F'
      }
    }
    this.colors = themes[this.theme] || themes['mario-style']
  }
  
  generateLevels() {
    return [
      {
        id: 0,
        name: 'Sunny Meadows',
        platforms: [
          { x: 0, y: 450, width: 200, height: 50 },
          { x: 300, y: 350, width: 150, height: 20 },
          { x: 500, y: 250, width: 100, height: 20 },
          { x: 700, y: 150, width: 200, height: 20 },
          { x: 1000, y: 400, width: 300, height: 50 }
        ],
        enemies: [
          { x: 350, y: 320, type: 'goomba' },
          { x: 750, y: 120, type: 'goomba' }
        ],
        collectibles: [
          { x: 250, y: 400, type: 'coin' },
          { x: 400, y: 300, type: 'coin' },
          { x: 550, y: 200, type: 'coin' },
          { x: 800, y: 100, type: 'gem' }
        ],
        goal: { x: 1100, y: 350 },
        background: 'forest'
      }
      // More levels would be generated here
    ]
  }
  
  bindControls() {
    this.keys = {}
    
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true
      
      if (e.key === ' ' && this.gameState === 'menu') {
        this.startGame()
      }
      
      e.preventDefault()
    })
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false
    })
  }
  
  startGame() {
    this.gameState = 'playing'
    this.currentLevel = 0
    this.score = 0
    this.lives = {{LIVES}}
    this.loadLevel(0)
  }
  
  loadLevel(levelIndex) {
    if (levelIndex >= this.levels.length) {
      this.gameState = 'gameComplete'
      return
    }
    
    const level = this.levels[levelIndex]
    this.currentLevelData = level
    
    // Reset player position
    this.player.x = 100
    this.player.y = 300
    this.player.velocityX = 0
    this.player.velocityY = 0
    
    // Reset camera
    this.camera.x = 0
    this.camera.y = 0
    
    // Initialize level entities
    this.platforms = [...level.platforms]
    this.enemies = level.enemies.map(e => new Enemy(e.x, e.y, e.type))
    this.collectibles = [...level.collectibles]
  }
  
  gameLoop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.gameLoop())
  }
  
  update() {
    if (this.gameState !== 'playing') return
    
    this.player.update(this)
    this.updateCamera()
    this.updateEnemies()
    this.checkCollectibles()
    this.checkGoal()
    this.checkPlayerDeath()
  }
  
  updateCamera() {
    // Follow player with some lag
    const targetX = this.player.x - this.canvas.width / 2
    const targetY = this.player.y - this.canvas.height / 2
    
    this.camera.x += (targetX - this.camera.x) * 0.1
    this.camera.y += (targetY - this.camera.y) * 0.1
    
    // Keep camera in bounds
    this.camera.x = Math.max(0, this.camera.x)
    this.camera.y = Math.max(-200, Math.min(0, this.camera.y))
  }
  
  updateEnemies() {
    this.enemies.forEach(enemy => {
      enemy.update(this.platforms)
      
      // Check player collision
      if (this.player.intersects(enemy)) {
        if (this.player.velocityY > 0 && this.player.y < enemy.y) {
          // Player jumped on enemy
          enemy.defeated = true
          this.player.velocityY = -8
          this.score += 100
        } else {
          // Player hit by enemy
          this.playerHit()
        }
      }
    })
    
    // Remove defeated enemies
    this.enemies = this.enemies.filter(enemy => !enemy.defeated)
  }
  
  checkCollectibles() {
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i]
      const distance = Math.sqrt(
        Math.pow(this.player.x - collectible.x, 2) + 
        Math.pow(this.player.y - collectible.y, 2)
      )
      
      if (distance < 30) {
        this.collectibles.splice(i, 1)
        
        if (collectible.type === 'coin') {
          this.score += 10
        } else if (collectible.type === 'gem') {
          this.score += 50
        }
        
        this.playCollectSound()
      }
    }
  }
  
  checkGoal() {
    const goal = this.currentLevelData.goal
    const distance = Math.sqrt(
      Math.pow(this.player.x - goal.x, 2) + 
      Math.pow(this.player.y - goal.y, 2)
    )
    
    if (distance < 50) {
      this.levelComplete()
    }
  }
  
  levelComplete() {
    this.score += 1000
    this.currentLevel++
    
    if (this.currentLevel >= this.levels.length) {
      this.gameState = 'gameComplete'
    } else {
      this.gameState = 'levelComplete'
      setTimeout(() => {
        this.loadLevel(this.currentLevel)
        this.gameState = 'playing'
      }, 2000)
    }
  }
  
  playerHit() {
    this.lives--
    
    if (this.lives <= 0) {
      this.gameState = 'gameOver'
    } else {
      // Respawn player at level start
      this.player.x = 100
      this.player.y = 300
      this.player.velocityX = 0
      this.player.velocityY = 0
    }
  }
  
  checkPlayerDeath() {
    // Fell off the map
    if (this.player.y > this.canvas.height + 100) {
      this.playerHit()
    }
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = this.colors.bgColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Apply camera transform
    this.ctx.save()
    this.ctx.translate(-this.camera.x, -this.camera.y)
    
    if (this.gameState === 'playing' || this.gameState === 'paused') {
      this.renderLevel()
    }
    
    this.ctx.restore()
    
    // Render UI
    this.renderUI()
    
    if (this.gameState === 'menu') {
      this.renderMenu()
    } else if (this.gameState === 'gameOver') {
      this.renderGameOver()
    } else if (this.gameState === 'levelComplete') {
      this.renderLevelComplete()
    }
  }
  
  renderLevel() {
    // Draw platforms
    this.ctx.fillStyle = this.colors.platformColor
    this.platforms.forEach(platform => {
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    })
    
    // Draw collectibles
    this.collectibles.forEach(collectible => {
      this.ctx.fillStyle = collectible.type === 'coin' ? '#FFD700' : '#FF69B4'
      this.ctx.beginPath()
      this.ctx.arc(collectible.x, collectible.y, 15, 0, Math.PI * 2)
      this.ctx.fill()
    })
    
    // Draw enemies
    this.enemies.forEach(enemy => enemy.render(this.ctx))
    
    // Draw player
    this.player.render(this.ctx, this.colors.heroColor)
    
    // Draw goal
    const goal = this.currentLevelData.goal
    this.ctx.fillStyle = '#00FF00'
    this.ctx.fillRect(goal.x - 25, goal.y - 50, 50, 100)
  }
  
  renderUI() {
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '24px Arial'
    this.ctx.fillText('Score: ' + this.score, 20, 40)
    this.ctx.fillText('Lives: ' + this.lives, 20, 70)
    this.ctx.fillText('Level: ' + (this.currentLevel + 1), 20, 100)
  }
  
  renderMenu() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.colors.name, this.canvas.width / 2, this.canvas.height / 2 - 50)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2 + 50)
    
    this.ctx.textAlign = 'left'
  }
  
  renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 50)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2)
    
    this.ctx.textAlign = 'left'
  }
  
  renderLevelComplete() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.fillStyle = '#00FF00'
    this.ctx.font = '48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Level Complete!', this.canvas.width / 2, this.canvas.height / 2)
    
    this.ctx.textAlign = 'left'
  }
  
  playCollectSound() {
    console.log('💰 Coin collected!')
  }
}

// Player class
class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 30
    this.height = 40
    this.velocityX = 0
    this.velocityY = 0
    this.onGround = false
    this.facing = 'right'
    this.moveSpeed = {{MOVE_SPEED}}
    this.jumpPower = {{JUMP_POWER}}
  }
  
  update(game) {
    this.handleInput(game.keys)
    this.applyPhysics(game.gravity)
    this.checkPlatformCollisions(game.platforms)
  }
  
  handleInput(keys) {
    // Horizontal movement
    if (keys['a'] || keys['arrowleft']) {
      this.velocityX = -this.moveSpeed
      this.facing = 'left'
    } else if (keys['d'] || keys['arrowright']) {
      this.velocityX = this.moveSpeed
      this.facing = 'right'
    } else {
      this.velocityX *= 0.8 // Friction
    }
    
    // Jumping
    if ((keys[' '] || keys['w'] || keys['arrowup']) && this.onGround) {
      this.velocityY = this.jumpPower
      this.onGround = false
    }
  }
  
  applyPhysics(gravity) {
    if (!this.onGround) {
      this.velocityY += gravity
    }
    
    // Update position
    this.x += this.velocityX
    this.y += this.velocityY
    
    // Terminal velocity
    this.velocityY = Math.min(this.velocityY, 15)
  }
  
  checkPlatformCollisions(platforms) {
    this.onGround = false
    
    platforms.forEach(platform => {
      if (this.intersectsPlatform(platform)) {
        // Landing on top
        if (this.velocityY > 0 && this.y <= platform.y) {
          this.y = platform.y - this.height
          this.velocityY = 0
          this.onGround = true
        }
        // Hitting from below
        else if (this.velocityY < 0 && this.y >= platform.y + platform.height) {
          this.y = platform.y + platform.height
          this.velocityY = 0
        }
        // Side collisions
        else if (this.velocityX > 0) {
          this.x = platform.x - this.width
        }
        else if (this.velocityX < 0) {
          this.x = platform.x + platform.width
        }
      }
    })
  }
  
  intersectsPlatform(platform) {
    return this.x < platform.x + platform.width &&
           this.x + this.width > platform.x &&
           this.y < platform.y + platform.height &&
           this.y + this.height > platform.y
  }
  
  intersects(other) {
    return this.x < other.x + other.width &&
           this.x + this.width > other.x &&
           this.y < other.y + other.height &&
           this.y + this.height > other.y
  }
  
  render(ctx, color) {
    ctx.fillStyle = color
    ctx.fillRect(this.x, this.y, this.width, this.height)
    
    // Simple face
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(this.x + 8, this.y + 8, 4, 4)
    ctx.fillRect(this.x + 18, this.y + 8, 4, 4)
  }
}

// Enemy class
class Enemy {
  constructor(x, y, type) {
    this.x = x
    this.y = y
    this.width = 25
    this.height = 25
    this.type = type
    this.speed = 1
    this.direction = -1
    this.defeated = false
  }
  
  update(platforms) {
    if (this.defeated) return
    
    // Simple AI: move back and forth
    this.x += this.speed * this.direction
    
    // Check if at edge of platform or hit wall
    let onPlatform = false
    platforms.forEach(platform => {
      if (this.y + this.height >= platform.y &&
          this.y + this.height <= platform.y + platform.height + 5 &&
          this.x + this.width > platform.x &&
          this.x < platform.x + platform.width) {
        onPlatform = true
      }
    })
    
    if (!onPlatform) {
      this.direction *= -1
      this.x += this.speed * this.direction * 2
    }
  }
  
  render(ctx) {
    if (this.defeated) return
    
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(this.x, this.y, this.width, this.height)
    
    // Simple enemy face
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(this.x + 5, this.y + 5, 3, 3)
    ctx.fillRect(this.x + 15, this.y + 5, 3, 3)
  }
}

// Initialize the game
const game = new {{THEME_NAME}}PlatformerGame({
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  gravity: {{GRAVITY}},
  jumpPower: {{JUMP_POWER}},
  moveSpeed: {{MOVE_SPEED}}
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
<body>
    <div class="game-container {{THEME_CLASS}}">
        <header class="game-header">
            <h1>{{GAME_TITLE}}</h1>
            <p class="subtitle">A {{THEME_NAME}} Adventure</p>
        </header>
        
        <main class="game-main">
            <canvas id="gameCanvas" width="1000" height="600"></canvas>
            <div class="game-info">
                <div class="controls">
                    <h3>Controls</h3>
                    <div class="control-grid">
                        <div class="control">
                            <kbd>A</kbd><kbd>D</kbd>
                            <span>Move Left/Right</span>
                        </div>
                        <div class="control">
                            <kbd>SPACE</kbd>
                            <span>Jump</span>
                        </div>
                    </div>
                </div>
                
                <div class="objectives">
                    <h3>Objectives</h3>
                    <ul>
                        <li>Navigate through platforms</li>
                        <li>Collect coins and gems</li>
                        <li>Defeat enemies by jumping on them</li>
                        <li>Reach the green goal flag</li>
                    </ul>
                </div>
            </div>
        </main>
    </div>
    
    <script src="game.js"></script>
</body>
</html>
`,
      cssTemplate: `
body {
  margin: 0;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}});
  color: white;
  min-height: 100vh;
}

.game-container {
  max-width: 1200px;
  margin: 0 auto;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-header h1 {
  font-size: 3.5em;
  margin: 0;
  text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
  color: {{ACCENT_COLOR}};
}

.subtitle {
  font-size: 1.3em;
  margin: 10px 0;
  opacity: 0.9;
}

.game-main {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

#gameCanvas {
  border: 4px solid {{ACCENT_COLOR}};
  border-radius: 15px;
  background: {{PRIMARY_COLOR}};
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
}

.game-info {
  flex: 1;
  min-width: 200px;
}

.controls, .objectives {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  margin-bottom: 20px;
}

.controls h3, .objectives h3 {
  margin-top: 0;
  color: {{ACCENT_COLOR}};
  border-bottom: 2px solid {{ACCENT_COLOR}};
  padding-bottom: 10px;
}

.control-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control {
  display: flex;
  align-items: center;
  gap: 15px;
}

kbd {
  background: linear-gradient(135deg, #ffffff, #e0e0e0);
  color: #333;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  min-width: 40px;
  text-align: center;
  display: inline-block;
}

.objectives ul {
  margin: 15px 0;
  padding-left: 20px;
}

.objectives li {
  margin: 10px 0;
  font-size: 1.1em;
}

/* Theme: {{THEME_NAME}} */
.{{THEME_CLASS}} {
  --primary-color: {{PRIMARY_COLOR}};
  --secondary-color: {{SECONDARY_COLOR}};
  --accent-color: {{ACCENT_COLOR}};
}

@media (max-width: 1200px) {
  .game-main {
    flex-direction: column;
    align-items: center;
  }
  
  #gameCanvas {
    max-width: 100%;
    height: auto;
  }
  
  .game-info {
    width: 100%;
    max-width: 600px;
  }
}

@media (max-width: 768px) {
  .game-container {
    padding: 10px;
  }
  
  .game-header h1 {
    font-size: 2.5em;
  }
  
  .controls, .objectives {
    padding: 15px;
  }
}
`,
      configFile: `
const PLATFORMER_CONFIG = {
  version: '1.0.0',
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  
  physics: {
    gravity: {{GRAVITY}},
    jumpPower: {{JUMP_POWER}},
    moveSpeed: {{MOVE_SPEED}},
    friction: 0.8,
    terminalVelocity: 15
  },
  
  gameplay: {
    lives: {{LIVES}},
    levelCount: 3,
    enemySpeed: 2,
    collectibleValue: {
      coin: 10,
      gem: 50,
      levelComplete: 1000
    }
  },
  
  themes: {
    'mario-style': {
      name: 'Mushroom Kingdom',
      heroColor: '#FF0000',
      platformColor: '#8B4513',
      bgColor: '#87CEEB'
    },
    'sonic-style': {
      name: 'Speed Zone',
      heroColor: '#0000FF',
      platformColor: '#32CD32',
      bgColor: '#ADD8E6'
    },
    'medieval': {
      name: 'Castle Realm',
      heroColor: '#C0C0C0',
      platformColor: '#696969',
      bgColor: '#2F4F4F'
    }
  }
}
`,
      additionalFiles: {
        'README.md': `
# {{GAME_TITLE}}

A classic {{THEME_NAME}}-themed 2D platformer with multiple levels, enemies, and collectibles.

## How to Play

### Controls
- **A** or **←**: Move left
- **D** or **→**: Move right  
- **SPACE** or **W** or **↑**: Jump

### Objectives
1. Navigate through each level's platforms
2. Collect coins (10 points) and gems (50 points)
3. Defeat enemies by jumping on top of them (100 points)
4. Reach the green flag to complete the level
5. Complete all levels to win the game

## Game Features

- **Theme**: {{SELECTED_THEME_NAME}}
- **Difficulty**: {{SELECTED_DIFFICULTY_NAME}}
- **Lives**: {{LIVES}}
- **Levels**: 3 unique levels with increasing difficulty
- **Physics**: Realistic jumping and collision detection
- **Enemies**: Various enemy types with AI movement
- **Collectibles**: Coins, gems, and power-ups

## Gameplay Mechanics

### Physics System
- Gravity-based jumping with customizable strength
- Platform collision detection
- Momentum and friction effects
- Terminal velocity limits

### Enemy AI
- Patrol-based movement patterns
- Platform edge detection
- Defeat enemies by jumping on them from above
- Contact damage when hit from the side

### Level Progression
1. **Sunny Meadows**: Easy introduction level
2. **Dark Forest**: Medium difficulty with more enemies
3. **Mountain Peak**: Hard final level with complex platforming

### Scoring System
- Coins: 10 points each
- Gems: 50 points each  
- Enemy defeats: 100 points each
- Level completion: 1000 points bonus

Try to achieve the highest score while completing all levels!
        `
      }
    },
    
    generationConfig: {
      storyPromptTemplate: 'Create a story for a {{THEME_NAME}} platformer game where {{THEME_HERO}} must journey through {{THEME_KINGDOM}} to defeat {{THEME_VILLAIN}}.',
      assetPromptTemplate: 'Generate {{THEME_NAME}}-themed assets for a platformer game including: {{THEME_HERO}} sprites, platform tiles, enemy sprites, collectibles, and {{THEME_SETTING}} backgrounds.',
      gameplayPromptTemplate: 'Design platformer mechanics with {{SELECTED_DIFFICULTY}} difficulty, {{GRAVITY}} gravity, {{JUMP_POWER}} jump power, and {{THEME_NAME}} theme elements.',
      variableReplacements: {
        '{{THEME_NAME}}': 'Mario Style',
        '{{THEME_HERO}}': 'Mario',
        '{{THEME_VILLAIN}}': 'Bowser',
        '{{THEME_KINGDOM}}': 'Mushroom Kingdom',
        '{{THEME_SETTING}}': 'colorful meadows and castles',
        '{{THEME_MAGIC}}': 'power-ups',
        '{{GRAVITY}}': '0.8',
        '{{JUMP_POWER}}': '-15',
        '{{MOVE_SPEED}}': '5',
        '{{LIVES}}': '3'
      }
    }
  }
  // More templates can be added here: Tower Defense, RPG, Racing, etc.
]

// Real Template Generator Class
export class RealTemplateGenerator {
  private aiGenerator: AIMockGenerator
  
  constructor() {
    this.aiGenerator = new AIMockGenerator()
  }
  
  async generateFromTemplate(
    template: RealGameTemplate,
    customizations: TemplateCustomizations,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<GameProject> {
    onProgress?.('Initializing template generation...', 5)
    
    // 1. Apply customizations to template
    const customizedTemplate = this.applyCustomizations(template, customizations)
    
    // 2. Generate enhanced content using AI
    onProgress?.('Generating story content...', 25)
    const story = await this.generateEnhancedStory(customizedTemplate, customizations)
    
    onProgress?.('Creating template assets...', 50)
    const assets = await this.generateTemplateAssets(customizedTemplate, customizations)
    
    onProgress?.('Building gameplay systems...', 75)
    const gameplay = await this.generateTemplateGameplay(customizedTemplate, customizations)
    
    // 3. Create final project
    onProgress?.('Finalizing project...', 95)
    const project = this.createGameProject(customizedTemplate, {
      story,
      assets,
      gameplay
    })
    
    onProgress?.('Template generation complete!', 100)
    return project
  }

  // NEW: Hybrid template + user input generation
  async generateFromTemplateWithUserInput(
    template: RealGameTemplate, 
    customizations: TemplateCustomizations,
    userInput: {
      gameTitle: string
      gameDescription: string
      storyPrompt?: string
      additionalFeatures?: string[]
      creativityLevel: 'minimal' | 'balanced' | 'creative'
      targetAudience?: string
      visualStyle?: string
    },
    onProgress?: (stage: string, progress: number) => void
  ): Promise<GameProject> {
    onProgress?.('Processing user input...', 5)
    
    // 1. Enhance customizations with user input
    const enhancedCustomizations = await this.enhanceCustomizationsWithUserInput(
      template, 
      customizations, 
      userInput
    )
    
    onProgress?.('Applying template foundation...', 15)
    // 2. Apply enhanced customizations to template
    const customizedTemplate = this.applyCustomizations(template, enhancedCustomizations)
    
    onProgress?.('Generating AI-enhanced content...', 30)
    // 3. Generate AI content that complements the template
    const aiEnhancements = await this.generateAIEnhancements(
      template, 
      userInput, 
      customizedTemplate
    )
    
    onProgress?.('Merging template with user creativity...', 60)
    // 4. Merge template structure with user creativity
    const hybridContent = await this.mergeTemplateWithUserInput(
      customizedTemplate,
      aiEnhancements,
      userInput
    )
    
    onProgress?.('Generating final game code...', 85)
    // 5. Create the hybrid game project
    const project = this.createHybridGameProject(
      customizedTemplate, 
      hybridContent, 
      userInput
    )
    
    onProgress?.('Hybrid game generation complete!', 100)
    return project
  }
  
  private applyCustomizations(template: RealGameTemplate, customizations: TemplateCustomizations): RealGameTemplate {
    const customized = { ...template }
    
    // Apply theme customizations
    if (customizations.selectedTheme) {
      const theme = template.customizationOptions.themes.find(t => t.id === customizations.selectedTheme)
      if (theme) {
        customized.generationConfig.variableReplacements = {
          ...customized.generationConfig.variableReplacements,
          ...this.generateThemeReplacements(theme)
        }
      }
    }
    
    // Apply difficulty customizations
    if (customizations.difficulty) {
      const difficulty = template.customizationOptions.difficulty.find(d => d.id === customizations.difficulty)
      if (difficulty) {
        // Apply parameter adjustments to mechanics
        customized.gameStructure.mechanics.forEach(mechanic => {
          mechanic.parameters.forEach(param => {
            if (difficulty.parameterAdjustments[param.name]) {
              param.defaultValue = difficulty.parameterAdjustments[param.name]
            }
          })
        })
      }
    }
    
    // Apply mechanic customizations
    if (customizations.enabledMechanics) {
      const enabledMechanics = template.customizationOptions.mechanics.filter(m => 
        customizations.enabledMechanics?.includes(m.id)
      )
      customized.generationConfig.variableReplacements['{{ENABLED_FEATURES}}'] = 
        enabledMechanics.map(m => m.name).join(', ')
    }
    
    return customized
  }
  
  private generateThemeReplacements(theme: ThemeOption): Record<string, string> {
    const baseReplacements: Record<string, string> = {}
    
    // Theme-specific replacements based on theme ID
    switch (theme.id) {
      case 'cookies':
        baseReplacements['{{THEME_NAME}}'] = 'Cookie'
        baseReplacements['{{THEME_ITEM}}'] = 'cookie'
        baseReplacements['{{THEME_CURRENCY}}'] = 'Cookies'
        baseReplacements['{{THEME_SETTING}}'] = 'a cozy kitchen'
        baseReplacements['{{THEME_AUDIO}}'] = 'crunchy'
        break
      case 'space-mining':
        baseReplacements['{{THEME_NAME}}'] = 'Space Mining'
        baseReplacements['{{THEME_ITEM}}'] = 'mineral'
        baseReplacements['{{THEME_CURRENCY}}'] = 'Minerals'
        baseReplacements['{{THEME_SETTING}}'] = 'the depths of space'
        baseReplacements['{{THEME_AUDIO}}'] = 'sci-fi'
        break
      case 'gem-collector':
        baseReplacements['{{THEME_NAME}}'] = 'Gem Collection'
        baseReplacements['{{THEME_ITEM}}'] = 'gem'
        baseReplacements['{{THEME_CURRENCY}}'] = 'Gems'
        baseReplacements['{{THEME_SETTING}}'] = 'a mystical mine'
        baseReplacements['{{THEME_AUDIO}}'] = 'crystalline'
        break
    }
    
    return baseReplacements
  }
  
  private async generateEnhancedStory(
    template: RealGameTemplate, 
    customizations: TemplateCustomizations
  ): Promise<StoryLoreContent> {
    // Use template's prebuilt story as base
    const baseStory = template.prebuiltContent.story
    
    // Enhance with AI generation using template-specific prompts
    const enhancedPrompt = this.replaceVariables(
      template.generationConfig.storyPromptTemplate,
      template.generationConfig.variableReplacements
    )
    
    // Generate additional story content
    const aiStory = await this.aiGenerator.generateStory(enhancedPrompt)
    
    // Merge template base with AI enhancements
    return {
      ...aiStory,
      worldLore: {
        ...aiStory.worldLore,
        name: this.replaceVariables(baseStory.worldLore?.name || 'Template World', template.generationConfig.variableReplacements)
      },
      mainStoryArc: {
        ...aiStory.mainStoryArc,
        title: this.replaceVariables(baseStory.mainStoryArc?.title || 'Template Story', template.generationConfig.variableReplacements),
        description: this.replaceVariables(baseStory.mainStoryArc?.description || '', template.generationConfig.variableReplacements)
      },
      characters: [
        ...(baseStory.characters || []),
        ...aiStory.characters.slice(0, 2) // Add 2 AI-generated characters
      ]
    }
  }
  
  private async generateTemplateAssets(
    template: RealGameTemplate,
    customizations: TemplateCustomizations
  ): Promise<AssetCollection> {
    // Generate assets based on template requirements and theme
    const assetPrompt = this.replaceVariables(
      template.generationConfig.assetPromptTemplate,
      template.generationConfig.variableReplacements
    )
    
    const assets = await this.aiGenerator.generateAssets(assetPrompt, 'casual')
    
    // Apply theme-specific asset overrides if available
    if (customizations.selectedTheme) {
      const theme = template.customizationOptions.themes.find(t => t.id === customizations.selectedTheme)
      if (theme?.assetOverrides) {
        // Replace specific assets with theme variants
        Object.entries(theme.assetOverrides).forEach(([assetKey, assetPath]) => {
          const artAsset = assets.art.find(a => a.name.toLowerCase().includes(assetKey))
          if (artAsset) {
            artAsset.thumbnail = assetPath
            artAsset.tags = [...artAsset.tags, theme.id]
          }
        })
      }
    }
    
    return assets
  }
  
  private async generateTemplateGameplay(
    template: RealGameTemplate,
    customizations: TemplateCustomizations
  ): Promise<GameplayContent> {
    // Use template's prebuilt gameplay as base
    const baseGameplay = template.prebuiltContent.gameplay
    
    // Enhance with AI generation
    const gameplayPrompt = this.replaceVariables(
      template.generationConfig.gameplayPromptTemplate,
      template.generationConfig.variableReplacements
    )
    
    const aiGameplay = await this.aiGenerator.generateGameplay(gameplayPrompt)
    
    // Merge template mechanics with AI enhancements
    return {
      ...aiGameplay,
      mechanics: [
        ...(baseGameplay.mechanics || []),
        ...aiGameplay.mechanics.slice(0, 2) // Add 2 AI-enhanced mechanics
      ],
      levels: [
        ...(baseGameplay.levels || []),
        ...aiGameplay.levels.slice(0, 3) // Add AI-generated levels
      ]
    }
  }
  
  private createGameProject(
    template: RealGameTemplate,
    generatedContent: {
      story: StoryLoreContent
      assets: AssetCollection  
      gameplay: GameplayContent
    }
  ): GameProject {
    // Create a complete game project with template structure + AI content
    return {
      id: `template-${template.id}-${Date.now()}`,
      title: this.replaceVariables('{{THEME_NAME}} {{TEMPLATE_TYPE}}', {
        ...template.generationConfig.variableReplacements,
        '{{TEMPLATE_TYPE}}': template.name
      }),
      description: template.description,
      prompt: `Generated from template: ${template.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'development',
      progress: 75,
      
      // Generated content
      story: generatedContent.story,
      assets: generatedContent.assets,
      gameplay: generatedContent.gameplay,
      
      // Pipeline status
      pipeline: [
        {
          id: 'story',
          name: 'Story & Lore',
          status: 'complete' as const,
          progress: 100,
          order: 1
        },
        {
          id: 'assets',
          name: 'Asset Creation',
          status: 'complete' as const,
          progress: 100,
          order: 2
        },
        {
          id: 'gameplay',
          name: 'Gameplay Systems',
          status: 'complete' as const,
          progress: 100,
          order: 3
        },
        {
          id: 'qa',
          name: 'Quality Assurance',
          status: 'pending' as const,
          progress: 0,
          order: 4
        }
      ]
    }
  }
  
  private replaceVariables(template: string, replacements: Record<string, string>): string {
    let result = template
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(key, 'g'), value)
    })
    return result
  }
  
  getTemplate(templateId: string): RealGameTemplate | undefined {
    return REAL_GAME_TEMPLATES.find(t => t.id === templateId)
  }
  
  getTemplatesByCategory(category: 'beginner' | 'intermediate' | 'advanced'): RealGameTemplate[] {
    return REAL_GAME_TEMPLATES.filter(t => t.category === category)
  }
  
  // Generate interactive preview for template selection
  async generateTemplatePreview(templateId: string): Promise<string> {
    const template = this.getTemplate(templateId)
    if (!template) return ''
    
    // Create a mini-implementation for preview
    const previewCode = `
      <div class="template-preview" style="width: 300px; height: 200px; border: 2px solid #ccc; position: relative;">
        <div class="preview-title">${template.name}</div>
        <div class="preview-game-area" style="background: ${template.customizationOptions.themes[0].colorScheme.primary};">
          ${this.generatePreviewHTML(template)}
        </div>
        <div class="preview-stats">
          <span>Complexity: ${template.complexity}</span>
          <span>Time: ${template.estimatedTime}</span>
        </div>
      </div>
    `
    
    return previewCode
  }
  
  private generatePreviewHTML(template: RealGameTemplate): string {
    switch (template.gameStructure.gameType) {
      case 'clicker':
        return `
          <div class="clickable-preview" style="width: 60px; height: 60px; background: #8B4513; border-radius: 50%; margin: 20px auto; cursor: pointer;"></div>
          <div class="stats-preview">Score: 1,234</div>
        `
      default:
        return '<div class="generic-preview">Game Preview</div>'
    }
  }
}

// Template Customization Interface
export interface TemplateCustomizations {
  selectedTheme?: string
  difficulty?: string
  enabledMechanics?: string[]
  enabledVisuals?: string[]
  customParameters?: Record<string, any>
  selectedMechanics?: string[]
  selectedVisuals?: string[]
  gameTitle?: string
  description?: string
}

// User input interface for hybrid generation
export interface UserGameInput {
  gameTitle: string
  gameDescription: string
  storyPrompt?: string
  additionalFeatures?: string[]
  creativityLevel: 'minimal' | 'balanced' | 'creative'
  targetAudience?: string
  visualStyle?: string
}

// Export singleton
export const realTemplateGenerator = new RealTemplateGenerator()
