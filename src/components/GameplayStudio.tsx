import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
// Import icons directly to bypass proxy issues
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { ArrowsOut } from '@phosphor-icons/react/dist/csr/ArrowsOut'
import { ArrowsIn } from '@phosphor-icons/react/dist/csr/ArrowsIn'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'
import { TreeStructure } from '@phosphor-icons/react/dist/csr/TreeStructure'
import { ChartLine } from '@phosphor-icons/react/dist/csr/ChartLine'
import { Robot } from '@phosphor-icons/react/dist/csr/Robot'
import { Copy } from '@phosphor-icons/react/dist/csr/Copy'
import { Trash } from '@phosphor-icons/react/dist/csr/Trash'
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { Code } from '@phosphor-icons/react/dist/csr/Code'
import { FolderOpen } from '@phosphor-icons/react/dist/csr/FolderOpen'
import { File } from '@phosphor-icons/react/dist/csr/File'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'

interface GameplayStudioProps {
  projectId?: string
}

interface GameObject {
  id: string
  type: 'enemy' | 'platform' | 'powerup' | 'trigger' | 'decoration'
  name: string
  x: number
  y: number
  width: number
  height: number
  properties: Record<string, any>
}

interface AIMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  changes?: GameObject[]
}

interface GameSnapshot {
  id: string
  name: string
  timestamp: Date
  objects: GameObject[]
  preview: string // base64 image
}

const quickActions = [
  { label: 'Add Boss', icon: Lightning, prompt: 'Add a challenging boss enemy to the level' },
  { label: 'Spawn Chest', icon: Plus, prompt: 'Place a treasure chest with random loot' },
  { label: 'Change Gravity', icon: ArrowsOut, prompt: 'Adjust the gravity physics for this level' },
  { label: 'Add Platform', icon: Plus, prompt: 'Create moving platforms for traversal' },
  { label: 'Hazard Zone', icon: Lightning, prompt: 'Add a dangerous area with environmental hazards' },
  { label: 'Safe Room', icon: Plus, prompt: 'Create a safe area where players can rest and save' }
]

// CodebaseViewer Component
interface CodebaseViewerProps {
  projectId?: string
}

interface FileNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
}

function CodebaseViewer({ projectId }: CodebaseViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fileContent, setFileContent] = useState('')
  
  // Mock file tree structure
  const [fileTree] = useState<FileNode[]>([
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'folder',
          path: 'src/components',
          children: [
            { name: 'GameplayStudio.tsx', type: 'file', path: 'src/components/GameplayStudio.tsx' },
            { name: 'Dashboard.tsx', type: 'file', path: 'src/components/Dashboard.tsx' },
            { name: 'AIAssistant.tsx', type: 'file', path: 'src/components/AIAssistant.tsx' },
          ]
        },
        {
          name: 'lib',
          type: 'folder',
          path: 'src/lib',
          children: [
            { name: 'types.ts', type: 'file', path: 'src/lib/types.ts' },
            { name: 'utils.ts', type: 'file', path: 'src/lib/utils.ts' },
            { name: 'mockData.ts', type: 'file', path: 'src/lib/mockData.ts' },
          ]
        },
        { name: 'App.tsx', type: 'file', path: 'src/App.tsx' },
        { name: 'main.tsx', type: 'file', path: 'src/main.tsx' },
      ]
    },
    { name: 'package.json', type: 'file', path: 'package.json' },
    { name: 'vite.config.ts', type: 'file', path: 'vite.config.ts' },
    { name: 'tailwind.config.js', type: 'file', path: 'tailwind.config.js' },
  ])

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath)
    // In a real implementation, this would fetch the file content
    setFileContent(`// Content of ${filePath}
// This would show the actual file content from your project
// For now, this is a placeholder showing the file structure

export default function ExampleComponent() {
  return (
    <div className="p-4">
      <h1>File: ${filePath}</h1>
      <p>This is where the actual file content would be displayed</p>
      <p>with syntax highlighting and editing capabilities.</p>
    </div>
  )
}`)
  }

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: depth * 16 }}>
        <Button
          variant="ghost"
          size="sm"
          className={`w-full justify-start gap-2 h-8 ${
            selectedFile === node.path ? 'bg-accent/20 text-accent' : ''
          }`}
          onClick={() => {
            if (node.type === 'file') {
              handleFileSelect(node.path)
            }
          }}
        >
          {node.type === 'folder' ? (
            <FolderOpen size={16} />
          ) : (
            <File size={16} />
          )}
          <span className="text-sm">{node.name}</span>
        </Button>
        {node.children && renderFileTree(node.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div className={`flex h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* File Tree Sidebar */}
      <div className="w-80 border-r border-border/30 bg-muted/20">
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Project Files</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <ArrowsOut size={16} />
            </Button>
          </div>
          
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          {renderFileTree(fileTree)}
        </ScrollArea>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="p-4 border-b border-border/30 bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={20} />
              <span className="font-medium">
                {selectedFile || 'Select a file to view'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Read-Only</Badge>
              <Button size="sm" variant="outline">
                Copy
              </Button>
              <Button size="sm" variant="outline">
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 relative">
          {selectedFile ? (
            <ScrollArea className="h-full">
              <pre className="p-4 text-sm font-mono bg-muted/10 min-h-full">
                <code className="text-foreground">{fileContent}</code>
              </pre>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <File size={64} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Project Codebase</h3>
                <p className="text-muted-foreground max-w-md">
                  Select a file from the tree on the left to view its contents.
                  This full-screen editor gives you complete access to your project's code structure.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function GameplayStudio({ projectId }: GameplayStudioProps) {
  const [activeTab, setActiveTab] = useState('level-designer')
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [selectedObject, setSelectedObject] = useState<GameObject | null>(null)
  const [gameObjects, setGameObjects] = useState<GameObject[]>([])
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [snapshots, setSnapshots] = useState<GameSnapshot[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Sample game objects for demo
  useEffect(() => {
    const sampleObjects: GameObject[] = [
      {
        id: '1',
        type: 'platform',
        name: 'Ground Platform',
        x: 0,
        y: 400,
        width: 800,
        height: 50,
        properties: { solid: true, material: 'stone' }
      },
      {
        id: '2',
        type: 'enemy',
        name: 'Goblin',
        x: 200,
        y: 350,
        width: 40,
        height: 50,
        properties: { health: 100, speed: 50, damage: 25, ai: 'patrol' }
      },
      {
        id: '3',
        type: 'powerup',
        name: 'Health Potion',
        x: 400,
        y: 360,
        width: 30,
        height: 40,
        properties: { healAmount: 50, respawnTime: 30 }
      }
    ]
    setGameObjects(sampleObjects)
    
    // Sample AI conversation
    const sampleMessages: AIMessage[] = [
      {
        id: '1',
        type: 'ai',
        content: 'Welcome to Gameplay Studio! I\'m ready to help you design amazing levels. What would you like to create?',
        timestamp: new Date()
      }
    ]
    setAIMessages(sampleMessages)
  }, [])

  const handleSendPrompt = () => {
    if (!currentPrompt.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentPrompt,
      timestamp: new Date()
    }

    // Simulate AI response
    const aiResponse: AIMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `I'll help you with that! I've analyzed your request: "${currentPrompt}". Here's what I suggest...`,
      timestamp: new Date(),
      changes: [] // Would contain actual changes
    }

    setAIMessages(prev => [...prev, userMessage, aiResponse])
    setCurrentPrompt('')
    createSnapshot(`After: ${currentPrompt}`)
  }

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setCurrentPrompt(action.prompt)
    handleSendPrompt()
  }

  const createSnapshot = (name: string) => {
    const snapshot: GameSnapshot = {
      id: Date.now().toString(),
      name,
      timestamp: new Date(),
      objects: [...gameObjects],
      preview: '' // Would be canvas screenshot
    }
    setSnapshots(prev => [snapshot, ...prev.slice(0, 9)]) // Keep last 10
  }

  const renderCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#0f0f23')
    gradient.addColorStop(0.5, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw animated grid
    ctx.strokeStyle = '#333366'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.3
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Draw game objects with enhanced visuals
    gameObjects.forEach(obj => {
      // Shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // Object colors with gradient
      let fillColor, strokeColor
      switch (obj.type) {
        case 'platform':
          fillColor = '#8B4513'
          strokeColor = '#A0522D'
          break
        case 'enemy':
          fillColor = '#FF4444'
          strokeColor = '#FF6666'
          break
        case 'powerup':
          fillColor = '#44FF44'
          strokeColor = '#66FF66'
          break
        case 'trigger':
          fillColor = '#4444FF'
          strokeColor = '#6666FF'
          break
        default:
          fillColor = '#CCCCCC'
          strokeColor = '#FFFFFF'
      }

      // Create gradient fill
      const objGradient = ctx.createLinearGradient(obj.x, obj.y, obj.x, obj.y + obj.height)
      objGradient.addColorStop(0, fillColor)
      objGradient.addColorStop(1, fillColor + '80') // Add transparency

      ctx.fillStyle = objGradient
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

      // Border
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)

      // Selection highlight with glow effect
      if (selectedObject?.id === obj.id) {
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 15
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 3
        ctx.strokeRect(obj.x - 3, obj.y - 3, obj.width + 6, obj.height + 6)
        
        // Pulsing inner glow
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 8
        ctx.strokeStyle = '#FFFF00'
        ctx.lineWidth = 1
        ctx.strokeRect(obj.x - 1, obj.y - 1, obj.width + 2, obj.height + 2)
      }

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Label with background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(obj.x - 2, obj.y - 20, obj.name.length * 8 + 4, 16)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 12px Arial'
      ctx.fillText(obj.name, obj.x, obj.y - 8)

      // Health bars for enemies
      if (obj.type === 'enemy' && obj.properties.health) {
        const healthWidth = 40
        const healthHeight = 4
        const healthY = obj.y - 25
        
        // Background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
        ctx.fillRect(obj.x, healthY, healthWidth, healthHeight)
        
        // Health
        const healthPercent = obj.properties.health / 100
        ctx.fillStyle = healthPercent > 0.5 ? '#4AFF4A' : healthPercent > 0.25 ? '#FFFF4A' : '#FF4A4A'
        ctx.fillRect(obj.x, healthY, healthWidth * healthPercent, healthHeight)
      }
    })

    // Draw connection lines for selected object (showing relationships)
    if (selectedObject) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      
      // Draw lines to nearby objects (simple proximity for demo)
      gameObjects.forEach(obj => {
        if (obj.id !== selectedObject.id) {
          const distance = Math.sqrt(
            Math.pow(obj.x - selectedObject.x, 2) + 
            Math.pow(obj.y - selectedObject.y, 2)
          )
          
          if (distance < 150) { // Show connections within 150 pixels
            ctx.beginPath()
            ctx.moveTo(selectedObject.x + selectedObject.width / 2, selectedObject.y + selectedObject.height / 2)
            ctx.lineTo(obj.x + obj.width / 2, obj.y + obj.height / 2)
            ctx.stroke()
          }
        }
      })
      
      ctx.setLineDash([])
    }
  }

  useEffect(() => {
    renderCanvas()
  }, [gameObjects, selectedObject, zoom])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    // Find clicked object
    const clicked = gameObjects.find(obj => 
      x >= obj.x && x <= obj.x + obj.width &&
      y >= obj.y && y <= obj.y + obj.height
    )

    setSelectedObject(clicked || null)
    
    // Add spawn effect for selection
    if (clicked) {
      // Could add particle effect here
      console.log(`Selected: ${clicked.name}`)
    }
  }

  const addGameObject = (type: GameObject['type'], x: number, y: number) => {
    const newObject: GameObject = {
      id: Date.now().toString(),
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x,
      y,
      width: type === 'platform' ? 100 : 40,
      height: type === 'platform' ? 20 : 40,
      properties: {
        ...(type === 'enemy' && { health: 100, speed: 50, damage: 25, ai: 'patrol' }),
        ...(type === 'powerup' && { effect: 'health', value: 50 }),
        ...(type === 'platform' && { solid: true, material: 'stone' })
      }
    }
    
    setGameObjects(prev => [...prev, newObject])
    setSelectedObject(newObject)
    
    // Create snapshot for this action
    createSnapshot(`Added ${newObject.name}`)
  }

  const handleCanvasRightClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    // For now, add a platform at click position
    addGameObject('platform', x - 50, y - 10)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-cosmic flex items-center justify-center">
                <TreeStructure size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">🎮 Gameplay Studio</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Level & Mechanics Editor</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={isPlaying ? "destructive" : "default"}
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-2"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Stop' : 'Play Test'}
            </Button>
            <Button variant="outline" onClick={() => createSnapshot('Manual Save')}>
              <FloppyDisk size={16} className="mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-border/30">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full bg-muted/30">
            <TabsTrigger value="level-designer" className="flex items-center gap-2">
              <TreeStructure size={16} />
              Level Designer
            </TabsTrigger>
            <TabsTrigger value="mechanics" className="flex items-center gap-2">
              <Gear size={16} />
              Mechanics & Systems
            </TabsTrigger>
            <TabsTrigger value="ai-behaviors" className="flex items-center gap-2">
              <Robot size={16} />
              AI Behaviors
            </TabsTrigger>
            <TabsTrigger value="balancing" className="flex items-center gap-2">
              <ChartLine size={16} />
              Balancing Tools
            </TabsTrigger>
            <TabsTrigger value="codebase" className="flex items-center gap-2">
              <Code size={16} />
              Codebase
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 flex">
        <Tabs value={activeTab} className="flex-1 flex">
          <TabsContent value="level-designer" className="flex-1 flex m-0">
            {/* Left Panel - AI Gameplay Editor */}
            <Card className="w-80 flex flex-col border-r">
              <div className="p-4 border-b border-border/30">
                <div className="flex items-center gap-2 mb-4">
                  <ChatCircle size={20} className="text-primary" />
                  <h3 className="font-semibold">AI Director</h3>
                  <Badge variant="secondary" className="ml-auto">
                    <Sparkle size={12} className="mr-1" />
                    Active
                  </Badge>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action)}
                      className="text-xs"
                    >
                      <action.icon size={12} className="mr-1" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {aiMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground ml-4'
                            : 'bg-muted text-foreground mr-4'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border/30">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Tell me what to change... (e.g., 'Make enemies faster', 'Add lava cave theme')"
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendPrompt()
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleSendPrompt}
                  disabled={!currentPrompt.trim()}
                  className="w-full mt-2"
                >
                  <Lightning size={16} className="mr-2" />
                  Apply Changes
                </Button>
              </div>
            </Card>

            {/* Center Panel - Live Game Preview */}
            <div className="flex-1 flex flex-col bg-slate-900">
              <div className="p-3 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-sm text-white">{isPlaying ? 'LIVE' : 'PAUSED'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-sm">Zoom:</span>
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => setZoom(value[0])}
                      min={25}
                      max={200}
                      step={25}
                      className="w-24"
                    />
                    <span className="text-sm w-12">{zoom}%</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                    <ArrowsOut size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                    <Eye size={16} />
                  </Button>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="relative border-2 border-primary/30 rounded-lg overflow-hidden shadow-2xl canvas-glow">
                  {/* Object Creation Toolbar */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/10 h-8 w-8 p-0"
                        onClick={() => addGameObject('platform', 100, 300)}
                        title="Add Platform"
                      >
                        ━
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/10 h-8 w-8 p-0"
                        onClick={() => addGameObject('enemy', 200, 300)}
                        title="Add Enemy"
                      >
                        👹
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/10 h-8 w-8 p-0"
                        onClick={() => addGameObject('powerup', 300, 300)}
                        title="Add Power-up"
                      >
                        💎
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/10 h-8 w-8 p-0"
                        onClick={() => addGameObject('trigger', 400, 300)}
                        title="Add Trigger"
                      >
                        ⚡
                      </Button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
                    <p className="mb-1"><strong>Controls:</strong></p>
                    <p>• Left Click: Select objects</p>
                    <p>• Right Click: Quick add platform</p>
                    <p>• Toolbar: Add specific objects</p>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    onClick={handleCanvasClick}
                    onContextMenu={handleCanvasRightClick}
                    className="cursor-crosshair"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                  />
                </div>
              </div>
            </div>

            {/* Right Panel - Properties & Systems Inspector */}
            <Card className="w-80 flex flex-col border-l">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gear size={16} />
                  Inspector
                </h3>
              </div>

              <ScrollArea className="flex-1">
                <Tabs defaultValue="properties" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 p-1">
                    <TabsTrigger value="properties" className="text-xs">Props</TabsTrigger>
                    <TabsTrigger value="systems" className="text-xs">Systems</TabsTrigger>
                    <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
                    <TabsTrigger value="balance" className="text-xs">Balance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="properties" className="p-4 space-y-4">
                    {selectedObject ? (
                      <>
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input value={selectedObject.name} className="mt-1" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-sm font-medium">X</label>
                            <Input type="number" value={selectedObject.x} className="mt-1" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Y</label>
                            <Input type="number" value={selectedObject.y} className="mt-1" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-sm font-medium">Width</label>
                            <Input type="number" value={selectedObject.width} className="mt-1" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Height</label>
                            <Input type="number" value={selectedObject.height} className="mt-1" />
                          </div>
                        </div>

                        <Separator />

                        {/* Object-specific properties */}
                        {selectedObject.type === 'enemy' && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Health</label>
                              <Slider
                                value={[selectedObject.properties.health || 100]}
                                max={1000}
                                step={10}
                                className="mt-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {selectedObject.properties.health || 100} HP
                              </span>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Speed</label>
                              <Slider
                                value={[selectedObject.properties.speed || 50]}
                                max={200}
                                step={5}
                                className="mt-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {selectedObject.properties.speed || 50} units/s
                              </span>
                            </div>

                            <div>
                              <label className="text-sm font-medium">AI Behavior</label>
                              <Select value={selectedObject.properties.ai || 'patrol'}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="patrol">Patrol</SelectItem>
                                  <SelectItem value="chase">Chase Player</SelectItem>
                                  <SelectItem value="guard">Guard Area</SelectItem>
                                  <SelectItem value="wander">Random Wander</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Copy size={14} className="mr-1" />
                            Clone
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1">
                            <Trash size={14} className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <TreeStructure size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Select an object to edit properties</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="systems" className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Physics</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Collision Detection</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Sound Effects</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Particle Systems</span>
                        <Switch />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="p-4 space-y-4">
                    <Button className="w-full" variant="outline">
                      <Robot size={16} className="mr-2" />
                      AI Autotune
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Let AI analyze and optimize game balance automatically
                    </p>
                  </TabsContent>

                  <TabsContent value="balance" className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Difficulty Curve</label>
                        <Select defaultValue="normal">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Player Progress</label>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Early Game</span>
                            <span>85%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>

              {/* Snapshots */}
              <div className="p-4 border-t border-border/30">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} />
                  <span className="text-sm font-medium">Version History</span>
                </div>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {snapshots.map((snapshot) => (
                      <Button
                        key={snapshot.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                      >
                        <Clock size={12} className="mr-2" />
                        {snapshot.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </TabsContent>

          {/* Other tabs content - placeholder for now */}
          <TabsContent value="mechanics" className="flex-1 flex items-center justify-center m-0">
            <div className="text-center">
              <Gear size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Mechanics & Systems</h3>
              <p className="text-muted-foreground">Advanced gameplay mechanics editor coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="ai-behaviors" className="flex-1 flex items-center justify-center m-0">
            <div className="text-center">
              <Robot size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">AI Behaviors</h3>
              <p className="text-muted-foreground">Intelligent NPC behavior editor coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="balancing" className="flex-1 flex items-center justify-center m-0">
            <div className="text-center">
              <ChartLine size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Balancing Tools</h3>
              <p className="text-muted-foreground">Game balance analytics and tuning tools coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="codebase" className="flex-1 flex flex-col m-0 p-0">
            <CodebaseViewer projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
