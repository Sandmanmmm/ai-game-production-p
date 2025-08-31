import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  MessageSquare,
  Code,
  Volume2,
  VolumeX,
  Zap,
  Bug,
  CheckCircle
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface QAWorkspaceProps {
  project: GameProject
  onClose: () => void
}

interface AIMessage {
  id: string
  type: 'system' | 'suggestion' | 'observation' | 'fix'
  content: string
  timestamp: number
}

interface GameState {
  isPlaying: boolean
  currentLevel: number
  playerHealth: number
  score: number
  enemies: number
  logs: string[]
}

const mockAIResponses = [
  { type: 'observation', content: 'Player cleared Level 1 in 12 seconds. Seems too easy - consider adding more obstacles.' },
  { type: 'suggestion', content: 'Try increasing enemy spawn rate from 2 to 3 per wave. This should improve difficulty balance.' },
  { type: 'fix', content: 'I noticed the jump mechanics feel sluggish. Increase jumpForce from 8 to 12 for better responsiveness.' },
  { type: 'observation', content: 'Great combo system! Players are discovering the chain mechanics naturally.' },
  { type: 'suggestion', content: 'The boss fight could use a visual indicator for attack patterns. Want me to generate some particle effects?' }
]

export function QAWorkspace({ project, onClose }: QAWorkspaceProps) {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    currentLevel: 1,
    playerHealth: 100,
    score: 0,
    enemies: 3,
    logs: []
  })
  
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [gameData, setGameData] = useState(JSON.stringify(project.gameplay || {}, null, 2))
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<NodeJS.Timeout>()

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: AIMessage = {
      id: 'welcome',
      type: 'system',
      content: `Welcome to QA Mode for "${project.title}"! I'm your AI testing assistant. Start the game preview to begin analyzing gameplay balance and mechanics.`,
      timestamp: Date.now()
    }
    setAiMessages([welcomeMessage])
  }, [project.title])

  // Game simulation loop
  useEffect(() => {
    if (gameState.isPlaying) {
      gameLoopRef.current = setInterval(() => {
        setGameState(prev => {
          const newLogs = [...prev.logs]
          const random = Math.random()
          
          // Simulate gameplay events
          if (random < 0.3) {
            newLogs.push(`[${new Date().toLocaleTimeString()}] Player defeated enemy! Score: ${prev.score + 10}`)
            
            // Trigger AI observation occasionally
            if (Math.random() < 0.4) {
              setTimeout(() => addAIMessage(), 2000)
            }
            
            return {
              ...prev,
              score: prev.score + 10,
              enemies: Math.max(0, prev.enemies - 1),
              logs: newLogs.slice(-8) // Keep last 8 logs
            }
          } else if (random < 0.1) {
            newLogs.push(`[${new Date().toLocaleTimeString()}] Player took damage! Health: ${Math.max(0, prev.playerHealth - 10)}`)
            return {
              ...prev,
              playerHealth: Math.max(0, prev.playerHealth - 10),
              logs: newLogs.slice(-8)
            }
          }
          
          // Level progression
          if (prev.enemies === 0) {
            newLogs.push(`[${new Date().toLocaleTimeString()}] Level ${prev.currentLevel} Complete! Moving to Level ${prev.currentLevel + 1}`)
            return {
              ...prev,
              currentLevel: prev.currentLevel + 1,
              enemies: prev.currentLevel + 2,
              logs: newLogs.slice(-8)
            }
          }
          
          return prev
        })
      }, 1500)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState.isPlaying])

  const addAIMessage = () => {
    const randomResponse = mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)]
    const newMessage: AIMessage = {
      id: Date.now().toString(),
      type: randomResponse.type as AIMessage['type'],
      content: randomResponse.content,
      timestamp: Date.now()
    }
    setAiMessages(prev => [...prev, newMessage])
  }

  const handlePlayPause = () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }))
    
    if (!gameState.isPlaying) {
      toast.success('Game preview started! AI assistant is now analyzing gameplay...')
    }
  }

  const handleReset = () => {
    setGameState({
      isPlaying: false,
      currentLevel: 1,
      playerHealth: 100,
      score: 0,
      enemies: 3,
      logs: []
    })
    toast.info('Game state reset')
  }

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: chatInput,
      timestamp: Date.now()
    }
    
    setAiMessages(prev => [...prev, userMessage])
    setChatInput('')
    
    // Mock AI response
    setTimeout(() => {
      const response: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'suggestion',
        content: `I understand you want to "${chatInput}". Let me analyze the current game state and provide some recommendations...`,
        timestamp: Date.now()
      }
      setAiMessages(prev => [...prev, response])
    }, 1000)
  }

  const getMessageIcon = (type: AIMessage['type']) => {
    switch (type) {
      case 'observation': return <Bug className="w-4 h-4" />
      case 'suggestion': return <Zap className="w-4 h-4" />
      case 'fix': return <Settings className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getMessageColor = (type: AIMessage['type']) => {
    switch (type) {
      case 'observation': return 'text-blue-400'
      case 'suggestion': return 'text-yellow-400'
      case 'fix': return 'text-green-400'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Immersive Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Bug className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">QA Testing Studio</h1>
              <p className="text-sm text-muted-foreground">{project.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-8">
            <Badge variant={gameState.isPlaying ? 'default' : 'secondary'} className="gap-1">
              {gameState.isPlaying ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Testing
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                  Paused
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMusicEnabled(!musicEnabled)}
            className="gap-2"
          >
            {musicEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Focus Music
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="relative z-10 h-[calc(100vh-4rem)] flex">
        {/* Left Panel - AI Assistant Chat */}
        <div className="w-80 border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col">
          <div className="h-12 border-b border-border/50 flex items-center px-4 bg-card/50">
            <MessageSquare className="w-5 h-5 text-accent mr-2" />
            <span className="font-medium text-foreground">AI Testing Assistant</span>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {aiMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-xs">
                  <div className={getMessageColor(message.type)}>
                    {getMessageIcon(message.type)}
                  </div>
                  <span className="capitalize text-muted-foreground">{message.type}</span>
                  <span className="text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-foreground bg-muted/30 rounded-lg p-3">
                  {message.content}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-border/50 bg-card/50">
            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI assistant about gameplay balance..."
                className="flex-1 min-h-0 h-10 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button size="sm" onClick={handleSendMessage}>
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Center Panel - Game Preview */}
        <div className="flex-1 flex flex-col bg-black/20">
          {/* Game Controls */}
          <div className="h-12 border-b border-border/50 bg-card/30 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button
                variant={gameState.isPlaying ? "secondary" : "default"}
                size="sm"
                onClick={handlePlayPause}
                className="gap-2"
              >
                {gameState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {gameState.isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Level:</span>
                <Badge>{gameState.currentLevel}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Health:</span>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${gameState.playerHealth}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Score:</span>
                <span className="text-accent font-mono">{gameState.score}</span>
              </div>
            </div>
          </div>

          {/* Game Canvas/Preview */}
          <div className="flex-1 relative p-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl h-full max-h-96 bg-card/50 border-border/50 p-6">
              <div className="h-full flex flex-col">
                <div className="flex-1 bg-muted/20 rounded-lg p-4 overflow-hidden relative">
                  <div className="text-center text-muted-foreground mb-4">
                    <Code className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{project.title} - Game Preview</p>
                  </div>
                  
                  {/* Mock Game Visualization */}
                  <div className="grid grid-cols-8 gap-1 max-w-xs mx-auto">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div
                        key={i}
                        className={`
                          aspect-square rounded-sm transition-colors duration-300
                          ${i === 28 ? 'bg-accent' : // Player position
                            [5, 12, 19, 33, 41, 55].includes(i) && gameState.enemies > 0 ? 'bg-destructive' : // Enemies
                            [7, 15, 23, 31, 39, 47].includes(i) ? 'bg-primary/30' : // Collectibles
                            'bg-muted/40'
                          }
                        `}
                      />
                    ))}
                  </div>

                  {gameState.isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-4 right-4 text-xs bg-accent/20 text-accent px-2 py-1 rounded"
                    >
                      ⚡ Live Preview
                    </motion.div>
                  )}
                </div>

                {/* Game Logs */}
                <div className="mt-4 h-24 bg-black/50 rounded-lg p-2 overflow-y-auto custom-scrollbar">
                  <div className="font-mono text-xs space-y-1">
                    {gameState.logs.map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-green-400"
                      >
                        {log}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Panel - Game Data Editor */}
        <div className="w-80 border-l border-border/50 bg-card/30 backdrop-blur-sm flex flex-col">
          <div className="h-12 border-b border-border/50 flex items-center px-4 bg-card/50">
            <Code className="w-5 h-5 text-accent mr-2" />
            <span className="font-medium text-foreground">Game Data</span>
          </div>
          
          <div className="flex-1 p-4">
            <Textarea
              value={gameData}
              onChange={(e) => setGameData(e.target.value)}
              className="w-full h-full font-mono text-xs resize-none bg-black/20 border-muted/50"
              placeholder="Edit game mechanics, balance values, and rules..."
            />
          </div>

          <div className="p-4 border-t border-border/50 bg-card/50">
            <Button 
              size="sm" 
              className="w-full gap-2"
              onClick={() => {
                toast.success('Game data updated! Changes reflected in preview.')
                addAIMessage()
              }}
            >
              <CheckCircle className="w-4 h-4" />
              Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}