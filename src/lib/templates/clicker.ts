import { RealGameTemplate } from './types'

export const clickerTemplate: RealGameTemplate = {
  id: 'clicker-basic',
  name: 'Cookie Clicker Style Game',
  description: 'A basic incremental clicking game with upgrades and automation',
  category: 'beginner',
  complexity: 'beginner',
  estimatedTime: '2-4 hours',
  tags: ['clicker', 'incremental', 'casual', 'addictive'],

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
          description: 'Learn the basics of clicking and earning',
          objectives: ['Click 100 times', 'Buy first upgrade'],
          rewards: ['Achievement badge', 'Click power boost']
        }
      ]
    }
  },

  customizationOptions: {
    themes: [
      {
        id: 'cookies',
        name: 'Classic Cookies',
        description: 'Traditional cookie-themed clicker',
        assetOverrides: {
          'main-clickable': 'cookie-large.png',
          'background': 'bakery-bg.jpg'
        },
        colorScheme: {
          'primary': '#8B4513',
          'secondary': '#F4A460',
          'accent': '#FFD700'
        }
      },
      {
        id: 'space',
        name: 'Space Mining',
        description: 'Sci-fi themed resource collection',
        assetOverrides: {
          'main-clickable': 'asteroid.png',
          'background': 'space-bg.jpg'
        },
        colorScheme: {
          'primary': '#191970',
          'secondary': '#4169E1',
          'accent': '#00FFFF'
        }
      }
    ],
    mechanics: [
      {
        id: 'prestige',
        name: 'Prestige System',
        description: 'Reset progress for permanent bonuses',
        codeModifications: ['prestige-system.js'],
        requiredAssets: ['prestige-button', 'prestige-effect']
      }
    ],
    visuals: [
      {
        id: 'particles',
        name: 'Click Particles',
        description: 'Visual feedback for clicks',
        cssModifications: ['particle-effects.css'],
        assetFilters: ['particle-*']
      }
    ],
    difficulty: [
      {
        id: 'easy',
        name: 'Casual Mode',
        parameterAdjustments: {
          'clickPower': 2,
          'costMultiplier': 1.3
        }
      },
      {
        id: 'hard',
        name: 'Challenge Mode',
        parameterAdjustments: {
          'clickPower': 0.5,
          'costMultiplier': 2.0
        }
      }
    ]
  },

  codeTemplates: {
    mainGameFile: `
// Cookie Clicker Game - Main File
class CookieClicker {
  constructor() {
    this.cookies = 0
    this.cookiesPerSecond = 0
    this.clickPower = 1
    this.upgrades = []
    this.achievements = []
    
    this.initializeGame()
    this.startGameLoop()
  }
  
  initializeGame() {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.setupEventListeners()
    this.loadUpgrades()
  }
  
  handleClick(event) {
    this.cookies += this.clickPower
    this.createClickEffect(event.clientX, event.clientY)
    this.updateDisplay()
    this.checkAchievements()
  }
  
  gameLoop() {
    this.cookies += this.cookiesPerSecond / 60 // 60 FPS
    this.updateDisplay()
    this.draw()
    requestAnimationFrame(() => this.gameLoop())
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  new CookieClicker()
})`,
    configFile: `
export const GAME_CONFIG = {
  CLICK_POWER: {{CLICK_POWER}},
  BASE_UPGRADE_COST: {{BASE_UPGRADE_COST}},
  COST_MULTIPLIER: {{COST_MULTIPLIER}},
  SAVE_INTERVAL: 30000, // 30 seconds
  
  UPGRADES: [
    { id: 'cursor', name: 'Cursor', baseCost: 15, cps: 0.1 },
    { id: 'grandma', name: 'Grandma', baseCost: 100, cps: 1 },
    { id: 'farm', name: 'Cookie Farm', baseCost: 1100, cps: 8 }
  ],
  
  ACHIEVEMENTS: [
    { id: 'first-click', name: 'First Click', description: 'Click once', requirement: 1 },
    { id: 'baker', name: 'Baker', description: 'Bake 100 cookies', requirement: 100 }
  ]
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
            <div id="cookieCounter">0 {{THEME_ITEMS}}</div>
            <div id="cpsCounter">per second: 0</div>
        </header>
        
        <main>
            <div id="gameArea">
                <canvas id="gameCanvas" width="800" height="600"></canvas>
            </div>
            
            <aside id="sidebar">
                <div id="upgrades">
                    <h2>Upgrades</h2>
                    <div id="upgradeList"></div>
                </div>
                
                <div id="achievements">
                    <h2>Achievements</h2>
                    <div id="achievementList"></div>
                </div>
            </aside>
        </main>
    </div>
    
    <script src="main.js"></script>
</body>
</html>`,
    cssTemplate: `
/* {{GAME_TITLE}} Styles */
body {
  margin: 0;
  font-family: 'Arial', sans-serif;
  background: {{BACKGROUND_COLOR}};
  color: {{TEXT_COLOR}};
}

#gameContainer {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

header {
  background: {{PRIMARY_COLOR}};
  padding: 1rem;
  text-align: center;
  color: white;
}

main {
  display: flex;
  flex: 1;
}

#gameArea {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: {{GAME_BG_COLOR}};
}

#gameCanvas {
  border: 2px solid {{ACCENT_COLOR}};
  border-radius: 10px;
  cursor: pointer;
}

#sidebar {
  width: 300px;
  background: {{SECONDARY_COLOR}};
  padding: 1rem;
  overflow-y: auto;
}

.upgrade-item {
  background: {{UPGRADE_BG}};
  border: 1px solid {{ACCENT_COLOR}};
  border-radius: 5px;
  padding: 10px;
  margin: 5px 0;
  cursor: pointer;
  transition: background 0.2s;
}

.upgrade-item:hover {
  background: {{UPGRADE_HOVER}};
}

.upgrade-item.affordable {
  background: {{AFFORDABLE_COLOR}};
}`,
    additionalFiles: {
      'particle-system.js': `
class ParticleSystem {
  constructor() {
    this.particles = []
  }
  
  createClickParticle(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 1.0,
        decay: 0.02
      })
    }
  }
  
  update() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.1 // gravity
      particle.life -= particle.decay
      return particle.life > 0
    })
  }
  
  draw(ctx) {
    this.particles.forEach(particle => {
      ctx.globalAlpha = particle.life
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4)
    })
    ctx.globalAlpha = 1.0
  }
}`,
      'save-system.js': `
class SaveSystem {
  static save(gameData) {
    const saveData = {
      cookies: gameData.cookies,
      clickPower: gameData.clickPower,
      upgrades: gameData.upgrades,
      achievements: gameData.achievements,
      timestamp: Date.now()
    }
    localStorage.setItem('cookieClickerSave', JSON.stringify(saveData))
  }
  
  static load() {
    const saveData = localStorage.getItem('cookieClickerSave')
    if (saveData) {
      return JSON.parse(saveData)
    }
    return null
  }
  
  static clearSave() {
    localStorage.removeItem('cookieClickerSave')
  }
}`
    }
  },

  generationConfig: {
    storyPromptTemplate: `Create a {{THEME_NAME}} themed story for a clicker game where the player builds a {{THEME_ITEM}} empire. The story should be light-hearted and focus on entrepreneurship and growth.`,
    assetPromptTemplate: `Generate {{THEME_NAME}} themed assets for a clicker game including: main clickable {{THEME_ITEM}}, background scenes, upgrade icons, and UI elements. Style should be colorful and appealing.`,
    gameplayPromptTemplate: `Design engaging gameplay mechanics for a {{THEME_NAME}} clicker game with upgrades, automation, and progression systems.`,
    variableReplacements: {
      '{{THEME_NAME}}': 'Cookie',
      '{{THEME_ITEM}}': 'cookie',
      '{{THEME_ITEMS}}': 'cookies',
      '{{THEME_MASTER}}': 'Baker',
      '{{THEME_ADVISOR}}': 'Grandma',
      '{{GAME_TITLE}}': 'Cookie Empire',
      '{{CLICK_POWER}}': '1',
      '{{BASE_UPGRADE_COST}}': '10',
      '{{COST_MULTIPLIER}}': '1.5',
      '{{PRIMARY_COLOR}}': '#8B4513',
      '{{SECONDARY_COLOR}}': '#F4A460',
      '{{ACCENT_COLOR}}': '#FFD700',
      '{{BACKGROUND_COLOR}}': '#FFF8DC',
      '{{TEXT_COLOR}}': '#654321',
      '{{GAME_BG_COLOR}}': '#F0E68C',
      '{{UPGRADE_BG}}': '#DEB887',
      '{{UPGRADE_HOVER}}': '#D2B48C',
      '{{AFFORDABLE_COLOR}}': '#98FB98'
    }
  }
}
