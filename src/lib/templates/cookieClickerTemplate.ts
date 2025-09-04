import { RealGameTemplate } from '../realTemplateGenerator'

export const cookieClickerTemplate: RealGameTemplate = {
  id: 'cookie-clicker',
  name: 'Cookie Clicker Style Game',
  description: 'Build an addictive incremental clicking game with upgrades and automation',
  category: 'beginner',
  complexity: 'beginner',
  estimatedTime: '30 minutes',
  tags: ['clicker', 'incremental', 'idle', 'upgrades'],
  
  gameStructure: {
    gameType: 'clicker',
    framework: 'html5-canvas',
    coreLoop: 'Click → Earn Currency → Buy Upgrades → Automate → Prestige',
    scenes: [
      {
        id: 'main-game',
        name: 'Main Clicker',
        type: 'game',
        requiredAssets: ['clickable-item', 'upgrade-icons', 'background'],
        codeSnippet: `
class ClickerGame {
  constructor() {
    this.currency = 0
    this.clickPower = 1
    this.autoGenerators = []
    this.upgrades = []
  }
  
  handleClick() {
    this.currency += this.clickPower
    this.updateDisplay()
  }
}`
      },
      {
        id: 'shop',
        name: 'Upgrade Shop',
        type: 'ui',
        requiredAssets: ['shop-bg', 'upgrade-icons', 'buy-button'],
        codeSnippet: `
class ShopSystem {
  constructor(game) {
    this.game = game
    this.upgrades = this.generateUpgrades()
  }
  
  buyUpgrade(upgradeId) {
    const upgrade = this.upgrades[upgradeId]
    if (this.game.currency >= upgrade.cost) {
      this.game.currency -= upgrade.cost
      upgrade.apply(this.game)
    }
  }
}`
      }
    ],
    mechanics: [
      {
        id: 'clicking',
        name: 'Manual Clicking',
        description: 'Core clicking mechanic that generates currency',
        parameters: [
          { name: 'clickPower', type: 'number', defaultValue: 1, description: 'Currency per click', customizable: true },
          { name: 'clickCooldown', type: 'number', defaultValue: 0, description: 'Milliseconds between clicks', customizable: true }
        ],
        codeImplementation: `
function handleClick() {
  if (Date.now() - this.lastClick > this.clickCooldown) {
    this.currency += this.clickPower
    this.triggerClickEffects()
    this.lastClick = Date.now()
  }
}`
      },
      {
        id: 'auto-generation',
        name: 'Automatic Generation',
        description: 'Passive income from purchased generators',
        parameters: [
          { name: 'autoInterval', type: 'number', defaultValue: 1000, description: 'Generation interval in milliseconds', customizable: true },
          { name: 'baseGeneration', type: 'number', defaultValue: 1, description: 'Base generation amount', customizable: true }
        ],
        codeImplementation: `
function autoGenerate() {
  this.autoGenerators.forEach(generator => {
    if (generator.active) {
      this.currency += generator.power * generator.quantity
    }
  })
}`
      },
      {
        id: 'upgrades',
        name: 'Upgrade System',
        description: 'Purchasable improvements that enhance gameplay',
        parameters: [
          { name: 'upgradeCount', type: 'number', defaultValue: 10, description: 'Number of different upgrades', customizable: true },
          { name: 'costMultiplier', type: 'number', defaultValue: 1.15, description: 'Cost increase per purchase', customizable: true }
        ],
        codeImplementation: `
function buyUpgrade(upgradeId) {
  const upgrade = this.upgrades[upgradeId]
  if (this.currency >= upgrade.currentCost) {
    this.currency -= upgrade.currentCost
    upgrade.level++
    upgrade.currentCost *= this.costMultiplier
    upgrade.apply(this)
  }
}`
      }
    ]
  },
  
  prebuiltContent: {
    story: {
      worldLore: {
        id: 'clicker-world',
        name: '{{THEME_NAME}} Empire',
        geography: 'A vast {{THEME_SETTING}} where {{THEME_ITEM}} holds mysterious power',
        politics: 'The one who clicks fastest rules them all',
        culture: 'Society built around the sacred art of {{THEME_ACTION}}',
        history: 'Legend says the first {{THEME_ITEM}} contained infinite potential',
        technology: 'Advanced clicking mechanisms and automated {{THEME_GENERATORS}}',
        magic: 'Each click channels the ancient energy of {{THEME_MAGIC}}'
      },
      mainStoryArc: {
        id: 'main-arc',
        title: 'Rise of the {{THEME_HERO}}',
        description: 'From humble beginnings with a single {{THEME_ITEM}} to building a vast {{THEME_EMPIRE}}',
        acts: [],
        themes: ['progression', 'automation', 'exponential growth'],
        tone: 'light' as const
      },
      chapters: [],
      characters: [
        {
          id: 'player',
          name: '{{THEME_HERO}}',
          description: 'The ambitious {{THEME_HERO}} who discovered the power of {{THEME_ACTION}}',
          role: 'protagonist' as const,
          relationships: []
        }
      ],
      factions: [],
      subplots: [],
      timeline: [],
      metadata: {
        genre: 'incremental',
        targetAudience: 'all-ages',
        complexity: 'simple' as const,
        estimatedLength: 'epic' as const,
        themes: ['progression', 'automation', 'achievement'],
        contentWarnings: []
      }
    },
    assets: {
      art: ['clickable-item', 'currency-icon', 'upgrade-icons', 'background', 'progress-bar'],
      audio: ['click-sound', 'purchase-sound', 'milestone-sound', 'background-music'],
      ui: ['shop-panel', 'stats-display', 'achievement-popup', 'prestige-interface']
    },
    gameplay: {
      mechanics: [
        { id: 'clicking', name: 'Manual Clicking', complexity: 'simple', description: 'Click to generate resources', implemented: true },
        { id: 'automation', name: 'Auto Generation', complexity: 'medium', description: 'Passive resource generation', implemented: true },
        { id: 'upgrades', name: 'Upgrade System', complexity: 'medium', description: 'Purchasable improvements', implemented: true },
        { id: 'prestige', name: 'Prestige System', complexity: 'complex', description: 'Reset for permanent bonuses', implemented: false }
      ],
      levels: [
        {
          id: 'early-game',
          name: 'First Clicks',
          objectives: ['Click 100 times', 'Buy first upgrade', 'Reach 1000 currency'],
          difficulty: 1,
          mechanics: ['clicking', 'upgrades'],
          estimated_playtime: 300,
          status: 'design'
        },
        {
          id: 'mid-game',
          name: 'Automation Era',
          objectives: ['Buy first generator', 'Reach 1M currency', 'Unlock 5 upgrades'],
          difficulty: 3,
          mechanics: ['clicking', 'automation', 'upgrades'],
          estimated_playtime: 1800,
          status: 'design'
        },
        {
          id: 'late-game',
          name: 'Prestige Master',
          objectives: ['Reach prestige threshold', 'Reset for bonuses', 'Build ultimate empire'],
          difficulty: 5,
          mechanics: ['clicking', 'automation', 'upgrades', 'prestige'],
          estimated_playtime: 3600,
          status: 'design'
        }
      ]
    }
  },
  
  customizationOptions: {
    themes: [
      {
        id: 'cookies',
        name: 'Cookie Empire',
        description: 'Classic cookie clicking with grandmas and factories',
        assetOverrides: {
          'clickable-item': '/templates/clicker/cookie.png',
          'currency-icon': '/templates/clicker/cookie-currency.png'
        },
        colorScheme: {
          primary: '#D2691E',
          secondary: '#F4A460',
          accent: '#FFD700'
        }
      },
      {
        id: 'space-mining',
        name: 'Cosmic Mining Corp',
        description: 'Mine asteroids and build a galactic empire',
        assetOverrides: {
          'clickable-item': '/templates/clicker/asteroid.png',
          'currency-icon': '/templates/clicker/minerals.png'
        },
        colorScheme: {
          primary: '#191970',
          secondary: '#4169E1',
          accent: '#00CED1'
        }
      },
      {
        id: 'gem-collector',
        name: 'Gem Collection Guild',
        description: 'Collect magical gems and build mystical contraptions',
        assetOverrides: {
          'clickable-item': '/templates/clicker/gem.png',
          'currency-icon': '/templates/clicker/gem-currency.png'
        },
        colorScheme: {
          primary: '#800080',
          secondary: '#DA70D6',
          accent: '#FF69B4'
        }
      }
    ],
    mechanics: [
      {
        id: 'auto-clickers',
        name: 'Auto-Clickers',
        description: 'Automated clicking devices that work while you\'re away',
        codeModifications: ['add-auto-click-system', 'add-offline-progress'],
        requiredAssets: ['auto-clicker-icons', 'auto-click-effects']
      },
      {
        id: 'prestige-system',
        name: 'Prestige System',
        description: 'Reset progress for permanent bonuses and multipliers',
        codeModifications: ['add-prestige-mechanics', 'add-permanent-upgrades'],
        requiredAssets: ['prestige-interface', 'prestige-effects']
      },
      {
        id: 'achievements',
        name: 'Achievement System',
        description: 'Unlock badges and rewards for reaching milestones',
        codeModifications: ['add-achievement-tracking', 'add-badge-system'],
        requiredAssets: ['achievement-badges', 'unlock-effects']
      }
    ],
    visuals: [
      {
        id: 'click-effects',
        name: 'Click Particle Effects',
        description: 'Satisfying visual feedback for each click',
        cssModifications: ['add-click-particles'],
        assetFilters: ['particle-systems']
      },
      {
        id: 'number-animations',
        name: 'Floating Numbers',
        description: 'Animated numbers showing currency gains',
        cssModifications: ['add-floating-numbers'],
        assetFilters: []
      },
      {
        id: 'progress-bars',
        name: 'Animated Progress',
        description: 'Smooth progress bars for upgrades and goals',
        cssModifications: ['add-progress-animations'],
        assetFilters: []
      }
    ],
    difficulty: [
      {
        id: 'casual',
        name: 'Casual Clicking',
        parameterAdjustments: {
          clickPower: 2,
          upgradeCount: 15,
          costMultiplier: 1.1
        }
      },
      {
        id: 'normal',
        name: 'Standard Challenge',
        parameterAdjustments: {
          clickPower: 1,
          upgradeCount: 10,
          costMultiplier: 1.15
        }
      },
      {
        id: 'hardcore',
        name: 'Clicker Master',
        parameterAdjustments: {
          clickPower: 1,
          upgradeCount: 8,
          costMultiplier: 1.25
        }
      }
    ]
  },
  
  codeTemplates: {
    mainGameFile: `
class {{THEME_NAME}}ClickerGame {
  constructor(config = {}) {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas?.getContext('2d')
    
    // Game state
    this.currency = 0
    this.clickPower = config.clickPower || {{CLICK_POWER}}
    this.totalClicks = 0
    this.startTime = Date.now()
    
    // Generators and upgrades
    this.autoGenerators = []
    this.upgrades = []
    this.achievements = []
    
    // Theme
    this.theme = config.theme || '{{THEME_ID}}'
    this.loadTheme()
    
    // Initialize
    this.init()
  }
  
  loadTheme() {
    const themes = {
      cookies: {
        name: 'Cookie Empire',
        item: 'Cookie',
        currency: 'Cookies',
        action: 'baking',
        generators: ['Grandma', 'Factory', 'Mine', 'Time Machine']
      },
      'space-mining': {
        name: 'Cosmic Mining',
        item: 'Asteroid',
        currency: 'Minerals',
        action: 'mining',
        generators: ['Drone', 'Space Station', 'Planet Cracker', 'Wormhole Generator']
      },
      'gem-collector': {
        name: 'Gem Collection',
        item: 'Gem',
        currency: 'Magic Gems',
        action: 'collecting',
        generators: ['Crystal Garden', 'Mystic Portal', 'Dragon Hoard', 'Celestial Forge']
      }
    }
    this.themeData = themes[this.theme] || themes.cookies
  }
  
  init() {
    this.setupUI()
    this.initializeUpgrades()
    this.bindEvents()
    this.gameLoop()
    this.loadSaveData()
  }
  
  setupUI() {
    const gameArea = document.getElementById('game-area')
    gameArea.innerHTML = \`
      <div class="clicker-game">
        <header class="game-header">
          <h1>\${this.themeData.name}</h1>
          <div class="currency-display">
            <span class="currency-amount">\${this.formatNumber(this.currency)}</span>
            <span class="currency-name">\${this.themeData.currency}</span>
          </div>
        </header>
        
        <main class="game-main">
          <div class="click-area">
            <button id="main-clicker" class="main-clicker">
              <div class="clicker-item">\${this.themeData.item}</div>
              <div class="click-power">+\${this.formatNumber(this.clickPower)} per click</div>
            </button>
          </div>
          
          <div class="shop-area">
            <h2>Upgrades</h2>
            <div id="upgrades-list" class="upgrades-list"></div>
            
            <h2>Generators</h2>
            <div id="generators-list" class="generators-list"></div>
          </div>
          
          <div class="stats-area">
            <h3>Statistics</h3>
            <div class="stat">Total Clicks: <span id="total-clicks">\${this.totalClicks}</span></div>
            <div class="stat">Per Second: <span id="per-second">0</span></div>
            <div class="stat">Play Time: <span id="play-time">0s</span></div>
          </div>
        </main>
      </div>
    \`
  }
  
  initializeUpgrades() {
    // Click power upgrades
    for (let i = 0; i < {{UPGRADE_COUNT}}; i++) {
      this.upgrades.push({
        id: \`click-upgrade-\${i}\`,
        name: \`\${this.themeData.action} Power \${i + 1}\`,
        description: \`Increases click power by \${i + 1}\`,
        baseCost: Math.pow(10, i + 1),
        currentCost: Math.pow(10, i + 1),
        level: 0,
        maxLevel: 100,
        effect: () => this.clickPower += i + 1
      })
    }
    
    // Auto generators
    this.themeData.generators.forEach((name, i) => {
      this.autoGenerators.push({
        id: \`generator-\${i}\`,
        name: name,
        description: \`Automatically generates \${this.themeData.currency.toLowerCase()}\`,
        baseCost: Math.pow(15, i + 1) * 10,
        currentCost: Math.pow(15, i + 1) * 10,
        quantity: 0,
        baseProduction: Math.pow(2, i),
        currentProduction: 0
      })
    })
  }
  
  bindEvents() {
    const clicker = document.getElementById('main-clicker')
    clicker?.addEventListener('click', (e) => this.handleClick(e))
    clicker?.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.handleClick(e)
    })
    
    // Prevent context menu on right click
    clicker?.addEventListener('contextmenu', (e) => e.preventDefault())
  }
  
  handleClick(e) {
    this.currency += this.clickPower
    this.totalClicks++
    
    // Visual feedback
    this.createClickEffect(e.clientX, e.clientY)
    
    // Update display
    this.updateDisplay()
    
    // Check achievements
    this.checkAchievements()
  }
  
  createClickEffect(x, y) {
    const effect = document.createElement('div')
    effect.className = 'click-effect'
    effect.textContent = '+' + this.formatNumber(this.clickPower)
    effect.style.left = x + 'px'
    effect.style.top = y + 'px'
    effect.style.position = 'fixed'
    effect.style.pointerEvents = 'none'
    effect.style.zIndex = '1000'
    effect.style.color = '#00ff00'
    effect.style.fontWeight = 'bold'
    effect.style.animation = 'floatUp 1s ease-out forwards'
    
    document.body.appendChild(effect)
    setTimeout(() => effect.remove(), 1000)
  }
  
  buyUpgrade(upgradeId) {
    const upgrade = this.upgrades.find(u => u.id === upgradeId)
    if (!upgrade || this.currency < upgrade.currentCost || upgrade.level >= upgrade.maxLevel) return
    
    this.currency -= upgrade.currentCost
    upgrade.level++
    upgrade.effect()
    upgrade.currentCost = Math.floor(upgrade.baseCost * Math.pow({{COST_MULTIPLIER}}, upgrade.level))
    
    this.updateDisplay()
    this.playSound('purchase')
  }
  
  buyGenerator(generatorId) {
    const generator = this.autoGenerators.find(g => g.id === generatorId)
    if (!generator || this.currency < generator.currentCost) return
    
    this.currency -= generator.currentCost
    generator.quantity++
    generator.currentProduction = generator.baseProduction * generator.quantity
    generator.currentCost = Math.floor(generator.baseCost * Math.pow({{COST_MULTIPLIER}}, generator.quantity))
    
    this.updateDisplay()
    this.playSound('purchase')
  }
  
  autoGenerate() {
    let totalPerSecond = 0
    this.autoGenerators.forEach(generator => {
      if (generator.quantity > 0) {
        const production = generator.currentProduction / 10 // Per 100ms
        this.currency += production
        totalPerSecond += generator.currentProduction
      }
    })
    
    document.getElementById('per-second').textContent = this.formatNumber(totalPerSecond)
  }
  
  updateDisplay() {
    // Update currency display
    const currencyAmount = document.querySelector('.currency-amount')
    if (currencyAmount) {
      currencyAmount.textContent = this.formatNumber(this.currency)
    }
    
    // Update click power display
    const clickPower = document.querySelector('.click-power')
    if (clickPower) {
      clickPower.textContent = '+' + this.formatNumber(this.clickPower) + ' per click'
    }
    
    // Update upgrades
    this.updateUpgradesDisplay()
    
    // Update generators
    this.updateGeneratorsDisplay()
    
    // Update stats
    const totalClicksEl = document.getElementById('total-clicks')
    if (totalClicksEl) {
      totalClicksEl.textContent = this.formatNumber(this.totalClicks)
    }
    
    const playTimeEl = document.getElementById('play-time')
    if (playTimeEl) {
      const playTime = Math.floor((Date.now() - this.startTime) / 1000)
      playTimeEl.textContent = this.formatTime(playTime)
    }
  }
  
  updateUpgradesDisplay() {
    const container = document.getElementById('upgrades-list')
    if (!container) return
    
    container.innerHTML = ''
    this.upgrades.forEach(upgrade => {
      const canAfford = this.currency >= upgrade.currentCost
      const maxed = upgrade.level >= upgrade.maxLevel
      
      const upgradeEl = document.createElement('div')
      upgradeEl.className = \`upgrade \${canAfford && !maxed ? 'affordable' : ''} \${maxed ? 'maxed' : ''}\`
      upgradeEl.innerHTML = \`
        <div class="upgrade-info">
          <div class="upgrade-name">\${upgrade.name}</div>
          <div class="upgrade-description">\${upgrade.description}</div>
          <div class="upgrade-level">Level: \${upgrade.level}\${maxed ? ' (MAX)' : ''}</div>
        </div>
        <div class="upgrade-cost">\${maxed ? 'MAXED' : this.formatNumber(upgrade.currentCost)}</div>
      \`
      
      if (!maxed) {
        upgradeEl.addEventListener('click', () => this.buyUpgrade(upgrade.id))
      }
      
      container.appendChild(upgradeEl)
    })
  }
  
  updateGeneratorsDisplay() {
    const container = document.getElementById('generators-list')
    if (!container) return
    
    container.innerHTML = ''
    this.autoGenerators.forEach(generator => {
      const canAfford = this.currency >= generator.currentCost
      
      const generatorEl = document.createElement('div')
      generatorEl.className = \`generator \${canAfford ? 'affordable' : ''}\`
      generatorEl.innerHTML = \`
        <div class="generator-info">
          <div class="generator-name">\${generator.name}</div>
          <div class="generator-description">\${generator.description}</div>
          <div class="generator-stats">
            Owned: \${generator.quantity} | 
            Production: \${this.formatNumber(generator.currentProduction)}/sec
          </div>
        </div>
        <div class="generator-cost">\${this.formatNumber(generator.currentCost)}</div>
      \`
      
      generatorEl.addEventListener('click', () => this.buyGenerator(generator.id))
      container.appendChild(generatorEl)
    })
  }
  
  formatNumber(num) {
    if (num < 1000) return Math.floor(num).toString()
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K'
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M'
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B'
    return (num / 1000000000000).toFixed(1) + 'T'
  }
  
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) return \`\${hours}h \${minutes}m \${secs}s\`
    if (minutes > 0) return \`\${minutes}m \${secs}s\`
    return \`\${secs}s\`
  }
  
  checkAchievements() {
    // Achievement checking logic would go here
    // This is a simplified version
    if (this.totalClicks === 100 && !this.hasAchievement('first-hundred')) {
      this.unlockAchievement('first-hundred', 'First Hundred Clicks!')
    }
    
    if (this.currency >= 1000 && !this.hasAchievement('first-thousand')) {
      this.unlockAchievement('first-thousand', 'First Thousand \${this.themeData.currency}!')
    }
  }
  
  hasAchievement(id) {
    return this.achievements.includes(id)
  }
  
  unlockAchievement(id, name) {
    this.achievements.push(id)
    this.showAchievementNotification(name)
  }
  
  showAchievementNotification(name) {
    const notification = document.createElement('div')
    notification.className = 'achievement-notification'
    notification.innerHTML = \`
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <div class="achievement-title">Achievement Unlocked!</div>
        <div class="achievement-name">\${name}</div>
      </div>
    \`
    
    document.body.appendChild(notification)
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.5s ease-out forwards'
      setTimeout(() => notification.remove(), 500)
    }, 3000)
  }
  
  gameLoop() {
    this.autoGenerate()
    this.updateDisplay()
    setTimeout(() => this.gameLoop(), 100)
  }
  
  saveGame() {
    const saveData = {
      currency: this.currency,
      clickPower: this.clickPower,
      totalClicks: this.totalClicks,
      startTime: this.startTime,
      upgrades: this.upgrades.map(u => ({ id: u.id, level: u.level, currentCost: u.currentCost })),
      autoGenerators: this.autoGenerators.map(g => ({ id: g.id, quantity: g.quantity, currentCost: g.currentCost })),
      achievements: this.achievements,
      theme: this.theme
    }
    
    localStorage.setItem('clickerGameSave', JSON.stringify(saveData))
  }
  
  loadSaveData() {
    const saveData = localStorage.getItem('clickerGameSave')
    if (!saveData) return
    
    try {
      const data = JSON.parse(saveData)
      this.currency = data.currency || 0
      this.clickPower = data.clickPower || {{CLICK_POWER}}
      this.totalClicks = data.totalClicks || 0
      this.startTime = data.startTime || Date.now()
      this.achievements = data.achievements || []
      
      // Restore upgrades
      if (data.upgrades) {
        data.upgrades.forEach(savedUpgrade => {
          const upgrade = this.upgrades.find(u => u.id === savedUpgrade.id)
          if (upgrade) {
            upgrade.level = savedUpgrade.level
            upgrade.currentCost = savedUpgrade.currentCost
          }
        })
      }
      
      // Restore generators
      if (data.autoGenerators) {
        data.autoGenerators.forEach(savedGen => {
          const generator = this.autoGenerators.find(g => g.id === savedGen.id)
          if (generator) {
            generator.quantity = savedGen.quantity
            generator.currentCost = savedGen.currentCost
            generator.currentProduction = generator.baseProduction * generator.quantity
          }
        })
      }
      
      this.updateDisplay()
    } catch (error) {
      console.error('Failed to load save data:', error)
    }
  }
  
  playSound(type) {
    // Sound effect placeholder
    console.log(\`🔊 \${type} sound effect\`)
  }
}

// Initialize the game
const game = new {{THEME_NAME}}ClickerGame({
  theme: '{{SELECTED_THEME}}',
  clickPower: {{CLICK_POWER}},
  upgradeCount: {{UPGRADE_COUNT}},
  costMultiplier: {{COST_MULTIPLIER}}
})

// Auto-save every 30 seconds
setInterval(() => {
  game.saveGame()
}, 30000)

// Save on page unload
window.addEventListener('beforeunload', () => {
  game.saveGame()
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
    <div id="game-area" class="game-container {{THEME_CLASS}}">
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
  user-select: none;
}

.clicker-game {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-header h1 {
  font-size: 3em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  color: {{ACCENT_COLOR}};
}

.currency-display {
  font-size: 2em;
  font-weight: bold;
  margin-top: 10px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.game-main {
  display: grid;
  grid-template-columns: 1fr 1fr 300px;
  gap: 30px;
  align-items: start;
}

.click-area {
  text-align: center;
}

.main-clicker {
  background: linear-gradient(145deg, {{ACCENT_COLOR}}, {{PRIMARY_COLOR}});
  border: none;
  border-radius: 20px;
  width: 300px;
  height: 300px;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.1s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.main-clicker:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
}

.main-clicker:active {
  transform: scale(0.95);
}

.clicker-item {
  font-size: 6em;
  margin-bottom: 10px;
}

.click-power {
  font-size: 1.2em;
  font-weight: bold;
  opacity: 0.9;
}

.shop-area {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  max-height: 600px;
  overflow-y: auto;
}

.shop-area h2 {
  margin-top: 0;
  color: {{ACCENT_COLOR}};
  border-bottom: 2px solid {{ACCENT_COLOR}};
  padding-bottom: 10px;
}

.upgrade, .generator {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upgrade:hover, .generator:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.upgrade.affordable, .generator.affordable {
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
}

.upgrade.maxed {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  cursor: default;
}

.upgrade-info, .generator-info {
  flex: 1;
}

.upgrade-name, .generator-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.upgrade-description, .generator-description {
  font-size: 0.9em;
  opacity: 0.8;
  margin-bottom: 5px;
}

.upgrade-level, .generator-stats {
  font-size: 0.8em;
  opacity: 0.7;
}

.upgrade-cost, .generator-cost {
  font-weight: bold;
  color: {{ACCENT_COLOR}};
}

.stats-area {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.stats-area h3 {
  margin-top: 0;
  color: {{ACCENT_COLOR}};
  border-bottom: 2px solid {{ACCENT_COLOR}};
  padding-bottom: 10px;
}

.stat {
  margin-bottom: 10px;
  font-size: 1.1em;
}

.click-effect {
  animation: floatUp 1s ease-out forwards;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px);
  }
}

.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, {{ACCENT_COLOR}}, {{PRIMARY_COLOR}});
  color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 15px;
  animation: slideIn 0.5s ease-out;
  z-index: 1000;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.achievement-icon {
  font-size: 2em;
}

.achievement-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.achievement-name {
  opacity: 0.9;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .game-main {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
  
  .stats-area {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .game-main {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .main-clicker {
    width: 250px;
    height: 250px;
  }
  
  .clicker-item {
    font-size: 4em;
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
const CLICKER_CONFIG = {
  version: '1.0.0',
  theme: '{{SELECTED_THEME}}',
  difficulty: '{{SELECTED_DIFFICULTY}}',
  
  gameplay: {
    clickPower: {{CLICK_POWER}},
    upgradeCount: {{UPGRADE_COUNT}},
    costMultiplier: {{COST_MULTIPLIER}},
    autoSaveInterval: 30000,
    maxLevel: 100
  },
  
  themes: {
    cookies: {
      name: 'Cookie Empire',
      item: 'Cookie',
      currency: 'Cookies',
      action: 'baking'
    },
    'space-mining': {
      name: 'Cosmic Mining',
      item: 'Asteroid',
      currency: 'Minerals',
      action: 'mining'
    },
    'gem-collector': {
      name: 'Gem Collection',
      item: 'Gem',
      currency: 'Magic Gems',
      action: 'collecting'
    }
  }
}
`,
    additionalFiles: {
      'README.md': `
# {{GAME_TITLE}}

A {{THEME_NAME}}-themed incremental clicking game with automation and progression systems.

## How to Play

1. **Click** the main item to generate currency
2. **Buy Upgrades** to increase your clicking power
3. **Purchase Generators** for automatic currency production
4. **Unlock Achievements** by reaching various milestones
5. **Build Your Empire** and become the ultimate {{THEME_HERO}}!

## Game Features

- **Theme**: {{SELECTED_THEME_NAME}}
- **Difficulty**: {{SELECTED_DIFFICULTY_NAME}}
- **Click Power**: {{CLICK_POWER}} per click
- **Progression**: Exponential growth with {{UPGRADE_COUNT}} upgrades
- **Automation**: Multiple generator types for passive income
- **Persistence**: Auto-save every 30 seconds
- **Achievements**: Milestone rewards and badges

## Game Mechanics

### Clicking System
- Manual clicking generates immediate currency
- Click power increases with upgrades
- Visual feedback with particle effects
- Touch-friendly mobile support

### Upgrade System
- {{UPGRADE_COUNT}} different upgrade types
- Exponential cost scaling ({{COST_MULTIPLIER}}x per level)
- Maximum level caps prevent infinite scaling
- Cost-effectiveness optimization

### Automation System  
- 4 generator types with unique production rates
- Passive income generation every 100ms
- Offline progress calculation
- Exponential production scaling

### Achievement System
- Milestone-based achievement unlocks
- Visual notification system
- Progress tracking and statistics
- Leaderboard integration ready

## Strategy Tips

1. **Early Game**: Focus on click power upgrades
2. **Mid Game**: Balance upgrades with generators
3. **Late Game**: Optimize generator efficiency
4. **Achievement Hunting**: Complete all milestones

Enjoy building your {{THEME_NAME}} empire!
      `
    }
  },
  
  generationConfig: {
    storyPromptTemplate: 'Create an engaging incremental clicker story for {{THEME_NAME}} where the player builds {{THEME_EMPIRE}} through {{THEME_ACTION}}',
    assetPromptTemplate: 'Generate {{THEME_NAME}}-themed clicker game assets including: {{THEME_ITEM}} sprites, currency icons, upgrade buttons, {{THEME_GENERATORS}} illustrations',
    gameplayPromptTemplate: 'Design clicker mechanics with {{SELECTED_DIFFICULTY}} difficulty, {{CLICK_POWER}} click power, and {{THEME_NAME}} progression system',
    variableReplacements: {
      '{{THEME_NAME}}': 'Cookie',
      '{{THEME_ITEM}}': 'Cookie',
      '{{THEME_CURRENCY}}': 'Cookies',
      '{{THEME_ACTION}}': 'clicking',
      '{{THEME_EMPIRE}}': 'Cookie Empire',
      '{{THEME_HERO}}': 'Cookie Clicker',
      '{{THEME_SETTING}}': 'magical bakery',
      '{{THEME_GENERATORS}}': 'Grandmas and Factories',
      '{{THEME_MAGIC}}': 'ancient baking secrets',
      '{{CLICK_POWER}}': '1',
      '{{UPGRADE_COUNT}}': '10',
      '{{COST_MULTIPLIER}}': '1.15'
    }
  }
}
