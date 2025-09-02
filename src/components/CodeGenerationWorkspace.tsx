import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  generateCode, 
  CodeGenerationRequest, 
  PROGRAMMING_LANGUAGES, 
  GAME_FRAMEWORKS 
} from '../lib/aiAPI'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { cn } from '@/lib/utils'

// Icons
import { Code } from '@phosphor-icons/react/dist/csr/Code'
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { Brain } from '@phosphor-icons/react/dist/csr/Brain'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'
import { Copy } from '@phosphor-icons/react/dist/csr/Copy'
import { Download } from '@phosphor-icons/react/dist/csr/Download'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk'
import { FileCode } from '@phosphor-icons/react/dist/csr/FileCode'
import { Rocket } from '@phosphor-icons/react/dist/csr/Rocket'
import { GameController } from '@phosphor-icons/react/dist/csr/GameController'
import { Cpu } from '@phosphor-icons/react/dist/csr/Cpu'
import { Globe } from '@phosphor-icons/react/dist/csr/Globe'
import { Phone } from '@phosphor-icons/react/dist/csr/Phone'

interface CodeGenerationWorkspaceProps {
  projectId?: string
  onContentChange?: (content: any) => void
  className?: string
}

interface GeneratedCode {
  id: string
  code: string
  language: string
  framework?: string
  prompt: string
  complexity: string
  gameType?: string
  provider: string
  generatedAt: string
}

const GAME_TYPES = [
  { value: 'platformer', label: '2D Platformer', icon: '🏃' },
  { value: 'rpg', label: 'RPG', icon: '⚔️' },
  { value: 'puzzle', label: 'Puzzle Game', icon: '🧩' },
  { value: 'shooter', label: 'Shooter', icon: '🎯' },
  { value: 'strategy', label: 'Strategy', icon: '♟️' },
  { value: 'racing', label: 'Racing', icon: '🏎️' },
  { value: 'arcade', label: 'Arcade', icon: '🕹️' },
  { value: 'simulation', label: 'Simulation', icon: '🌍' },
] as const

const CODE_TEMPLATES = [
  {
    name: 'Player Controller',
    description: 'Basic player movement and input handling',
    prompt: 'Create a player controller with WASD movement, jumping, and basic physics',
    complexity: 'medium' as const,
  },
  {
    name: 'Game Manager',
    description: 'Core game state management system',
    prompt: 'Create a game manager that handles game states, scoring, and level progression',
    complexity: 'medium' as const,
  },
  {
    name: 'Inventory System',
    description: 'Item management and inventory UI',
    prompt: 'Create an inventory system with item slots, drag and drop, and item stacking',
    complexity: 'complex' as const,
  },
  {
    name: 'AI Behavior',
    description: 'NPC behavior and pathfinding',
    prompt: 'Create an AI system for NPCs with basic pathfinding and decision making',
    complexity: 'complex' as const,
  },
  {
    name: 'Save System',
    description: 'Game save and load functionality',
    prompt: 'Create a save system that can serialize game state and player progress',
    complexity: 'medium' as const,
  },
  {
    name: 'Audio Manager',
    description: 'Sound effects and music management',
    prompt: 'Create an audio manager with sound pools, volume controls, and music transitions',
    complexity: 'simple' as const,
  },
] as const

export function CodeGenerationWorkspace({ 
  projectId, 
  onContentChange, 
  className 
}: CodeGenerationWorkspaceProps) {
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'huggingface' | 'replicate' | 'local'>('huggingface')
  const [codePrompt, setCodePrompt] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [selectedFramework, setSelectedFramework] = useState<string>('')
  const [selectedGameType, setSelectedGameType] = useState('platformer')
  const [selectedComplexity, setSelectedComplexity] = useState<'simple' | 'medium' | 'complex'>('medium')

  // Generated code history
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([])
  const [selectedCode, setSelectedCode] = useState<GeneratedCode | null>(null)

  // UI state
  const [activeTab, setActiveTab] = useState('generate')

  const handleGenerateCode = async (templatePrompt?: string) => {
    const prompt = templatePrompt || codePrompt
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const response = await generateCode({
        prompt,
        language: selectedLanguage,
        framework: selectedFramework || undefined,
        gameType: selectedGameType,
        complexity: selectedComplexity,
        provider: selectedProvider,
      })

      if (response.success && response.data) {
        const newCode: GeneratedCode = {
          id: response.data.id,
          code: response.data.code,
          language: selectedLanguage,
          framework: selectedFramework,
          prompt,
          complexity: selectedComplexity,
          gameType: selectedGameType,
          provider: selectedProvider,
          generatedAt: response.data.metadata.generatedAt,
        }
        
        setGeneratedCodes(prev => [newCode, ...prev])
        setSelectedCode(newCode)
        setActiveTab('editor')
      } else {
        // Fallback to mock generation
        const mockCode = generateMockCode(prompt, selectedLanguage, selectedFramework)
        const newCode: GeneratedCode = {
          id: Date.now().toString(),
          code: mockCode,
          language: selectedLanguage,
          framework: selectedFramework,
          prompt,
          complexity: selectedComplexity,
          gameType: selectedGameType,
          provider: selectedProvider,
          generatedAt: new Date().toISOString(),
        }
        
        setGeneratedCodes(prev => [newCode, ...prev])
        setSelectedCode(newCode)
        setActiveTab('editor')
      }
    } catch (error) {
      console.error('Code generation failed:', error)
      // Fallback generation
      const mockCode = generateMockCode(prompt, selectedLanguage, selectedFramework)
      const newCode: GeneratedCode = {
        id: Date.now().toString(),
        code: mockCode,
        language: selectedLanguage,
        framework: selectedFramework,
        prompt,
        complexity: selectedComplexity,
        gameType: selectedGameType,
        provider: selectedProvider,
        generatedAt: new Date().toISOString(),
      }
      
      setGeneratedCodes(prev => [newCode, ...prev])
      setSelectedCode(newCode)
      setActiveTab('editor')
    } finally {
      setIsGenerating(false)
      if (!templatePrompt) {
        setCodePrompt('')
      }
    }
  }

  const generateMockCode = (prompt: string, language: string, framework?: string) => {
    const timestamp = new Date().toISOString()
    
    if (language === 'javascript') {
      if (framework === 'phaser') {
        return `// Generated by GameForge AI - ${timestamp}
// Prompt: ${prompt}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.player = null
    this.cursors = null
  }

  preload() {
    // Load game assets
    this.load.image('player', 'assets/player.png')
    this.load.image('ground', 'assets/ground.png')
    this.load.image('background', 'assets/background.png')
  }

  create() {
    // Create background
    this.add.image(400, 300, 'background')

    // Create player
    this.player = this.physics.add.sprite(100, 450, 'player')
    this.player.setBounce(0.2)
    this.player.setCollideWorldBounds(true)

    // Create ground
    const platforms = this.physics.add.staticGroup()
    platforms.create(400, 568, 'ground').setScale(2).refreshBody()

    // Player physics
    this.physics.add.collider(this.player, platforms)

    // Input controls
    this.cursors = this.input.keyboard.createCursorKeys()
  }

  update() {
    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160)
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160)
    } else {
      this.player.setVelocityX(0)
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330)
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: GameScene
}

// Start the game
const game = new Phaser.Game(config)`
      } else {
        return `// Generated by GameForge AI - ${timestamp}
// Prompt: ${prompt}

class GameEngine {
  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.gameState = 'playing'
    this.score = 0
    this.init()
  }

  init() {
    this.canvas.width = 800
    this.canvas.height = 600
    document.body.appendChild(this.canvas)
    
    this.bindEvents()
    this.gameLoop()
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      this.handleInput(e.key)
    })
  }

  handleInput(key) {
    switch(key) {
      case 'ArrowLeft':
        // Move left
        break
      case 'ArrowRight':
        // Move right
        break
      case ' ':
        // Jump or action
        break
    }
  }

  update() {
    // Game logic updates
    if (this.gameState === 'playing') {
      this.updateGameObjects()
      this.checkCollisions()
      this.updateScore()
    }
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#87CEEB'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Render game objects
    this.renderPlayer()
    this.renderUI()
  }

  renderPlayer() {
    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.fillRect(100, 100, 50, 50)
  }

  renderUI() {
    this.ctx.fillStyle = '#333'
    this.ctx.font = '20px Arial'
    this.ctx.fillText(\`Score: \${this.score}\`, 10, 30)
  }

  gameLoop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.gameLoop())
  }
}

// Initialize the game
const game = new GameEngine()`
      }
    }
    
    return `// Generated by GameForge AI - ${timestamp}
// Language: ${language}
// Framework: ${framework || 'None'}
// Prompt: ${prompt}

// This is a mock generated code example.
// In production, this would be generated by the selected AI provider.

console.log('Game code generated successfully!')
console.log('Prompt:', '${prompt}')
console.log('Language:', '${language}')
console.log('Framework:', '${framework || 'None'}')

// Your generated game code would appear here...`
  }

  const handleCopyCode = () => {
    if (selectedCode) {
      navigator.clipboard.writeText(selectedCode.code)
    }
  }

  const renderGenerationPanel = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Lightning className="w-6 h-6 text-accent" />
          Code Generator
          {isGenerating && (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="ml-auto"
            >
              <Gear className="w-4 h-4 text-accent" />
            </motion.div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* AI Provider Selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block">AI Provider</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'huggingface', label: 'HuggingFace', color: 'orange' },
              { value: 'replicate', label: 'Replicate', color: 'blue' },
              { value: 'local', label: 'Local', color: 'green' }
            ].map(provider => (
              <Button
                key={provider.value}
                size="sm"
                variant={selectedProvider === provider.value ? 'default' : 'outline'}
                className="text-xs"
                onClick={() => setSelectedProvider(provider.value as any)}
                disabled={isGenerating}
              >
                {provider.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Language and Framework */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Framework</Label>
            <Select value={selectedFramework} onValueChange={setSelectedFramework} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {GAME_FRAMEWORKS.map((framework) => (
                  <SelectItem key={framework} value={framework}>
                    {framework}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Game Type and Complexity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Game Type</Label>
            <Select value={selectedGameType} onValueChange={setSelectedGameType} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAME_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Complexity</Label>
            <Select value={selectedComplexity} onValueChange={setSelectedComplexity as any} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="complex">Complex</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Code Templates */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Templates</Label>
          <div className="grid grid-cols-2 gap-2">
            {CODE_TEMPLATES.slice(0, 6).map((template) => (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                className="text-xs h-auto p-2 flex flex-col items-start"
                onClick={() => handleGenerateCode(template.prompt)}
                disabled={isGenerating}
              >
                <span className="font-medium">{template.name}</span>
                <span className="text-muted-foreground text-[10px] leading-tight">
                  {template.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Prompt */}
        <div className="flex-1 flex flex-col">
          <Label className="text-sm font-medium mb-2">Custom Code Generation</Label>
          <Textarea
            placeholder="Describe the game code you want to generate..."
            value={codePrompt}
            onChange={(e) => setCodePrompt(e.target.value)}
            className="flex-1 min-h-24 resize-none"
            disabled={isGenerating}
          />
          <Button 
            onClick={() => handleGenerateCode()}
            disabled={isGenerating || !codePrompt.trim()}
            className="mt-3 w-full"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Gear className="w-4 h-4 mr-2 animate-spin" />
                Generating Code...
              </>
            ) : (
              <>
                <Code className="w-4 h-4 mr-2" />
                Generate Code
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderCodeEditor = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCode className="w-5 h-5 text-accent" />
            Code Editor
          </CardTitle>
          {selectedCode && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedCode.language}
              </Badge>
              {selectedCode.framework && (
                <Badge variant="outline" className="text-xs">
                  {selectedCode.framework}
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={handleCopyCode}>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        {selectedCode ? (
          <ScrollArea className="h-full">
            <pre className="p-4 text-sm font-mono bg-muted/20 h-full">
              <code>{selectedCode.code}</code>
            </pre>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Generate code to see it here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderCodeHistory = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          Generation History
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {generatedCodes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No generated code yet</p>
              </div>
            ) : (
              generatedCodes.map((code) => (
                <Card
                  key={code.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedCode?.id === code.id ? "bg-accent/10 border-accent" : "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedCode(code)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {code.language}
                        </Badge>
                        {code.framework && (
                          <Badge variant="outline" className="text-xs">
                            {code.framework}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(code.generatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm truncate">{code.prompt}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Rocket className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-bold">Code Generation Workspace</h1>
          </div>
          <TabsList>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 p-4">
          <TabsContent value="generate" className="h-full">
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-8">
                {renderGenerationPanel()}
              </div>
              <div className="col-span-4">
                {renderCodeHistory()}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="editor" className="h-full">
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-8">
                {renderCodeEditor()}
              </div>
              <div className="col-span-4">
                {renderCodeHistory()}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="h-full">
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-4">
                {renderCodeHistory()}
              </div>
              <div className="col-span-8">
                {renderCodeEditor()}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
