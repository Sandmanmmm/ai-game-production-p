import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise'
import { Trash } from '@phosphor-icons/react/dist/csr/Trash'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb'
import { GameController } from '@phosphor-icons/react/dist/csr/GameController'
import { Book } from '@phosphor-icons/react/dist/csr/Book'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { TestTube } from '@phosphor-icons/react/dist/csr/TestTube'
import { MonitorPlay } from '@phosphor-icons/react/dist/csr/MonitorPlay'
import { Rocket } from '@phosphor-icons/react/dist/csr/Rocket'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Circle } from '@phosphor-icons/react/dist/csr/Circle'
import { EnhancedProjectCreationDialog } from './EnhancedProjectCreationDialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface GameForgeDashboardProps {
  projects: GameProject[]
  onProjectSelect: (project: GameProject) => void
  onProjectCreate: (project: GameProject) => void
  onProjectsChange: (projects: GameProject[]) => void
  onSectionChange: (section: string) => void
}

const pipelineStages = [
  { id: 'idea', name: 'Idea', icon: Lightbulb, color: 'text-yellow-400' },
  { id: 'story', name: 'Story & Lore', icon: Book, color: 'text-blue-400' },
  { id: 'assets', name: 'Assets', icon: Palette, color: 'text-purple-400' },
  { id: 'gameplay', name: 'Gameplay', icon: GameController, color: 'text-green-400' },
  { id: 'qa', name: 'QA & Testing', icon: TestTube, color: 'text-orange-400' },
  { id: 'preview', name: 'Preview', icon: MonitorPlay, color: 'text-cyan-400' },
  { id: 'publish', name: 'Publish', icon: Rocket, color: 'text-pink-400' },
]

const gameTemplates = [
  {
    title: "Roguelike Dungeon",
    description: "Procedurally generated dungeon crawler with RPG elements",
    genre: "rpg",
    artStyle: "pixel_art",
    platform: "pc",
    thumbnail: "🏰"
  },
  {
    title: "Visual Novel Base",
    description: "Character-driven interactive story framework",
    genre: "adventure",
    artStyle: "anime",
    platform: "mobile",
    thumbnail: "📚"
  },
  {
    title: "Platformer Core",
    description: "Classic 2D platformer with physics-based gameplay",
    genre: "platform",
    artStyle: "cartoon",
    platform: "console",
    thumbnail: "🎮"
  },
  {
    title: "Space Explorer",
    description: "Sci-fi exploration game with resource management",
    genre: "simulation",
    artStyle: "realistic",
    platform: "pc",
    thumbnail: "🚀"
  },
]

const inspirationIdeas = [
  "A puzzle game where you manipulate time to solve ancient mysteries",
  "A farming simulator set on an alien planet with bioluminescent crops",
  "A detective story told through the memories of a haunted mirror",
  "A racing game where you control weather to affect track conditions",
  "A tower defense game with spell-crafting mechanics",
  "An underwater city builder with ecosystem management",
]

export function GameForgeDashboard({ 
  projects, 
  onProjectSelect, 
  onProjectCreate, 
  onProjectsChange,
  onSectionChange 
}: GameForgeDashboardProps) {
  const [gameIdea, setGameIdea] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('adventure')
  const [isEnhancedDialogOpen, setIsEnhancedDialogOpen] = useState(false)
  const [selectedArtStyle, setSelectedArtStyle] = useState('realistic')
  const [selectedPlatform, setSelectedPlatform] = useState('pc')
  const [selectedMood, setSelectedMood] = useState('balanced')
  const [selectedComplexity, setSelectedComplexity] = useState('medium')
  const [currentInspiration, setCurrentInspiration] = useState(inspirationIdeas[0])
  const [activeProject, setActiveProject] = useState<GameProject | null>(null)
  
  // Modifier visibility state
  const [visibleModifiers, setVisibleModifiers] = useState<string[]>(['genre', 'artStyle', 'platform'])
  
  // Available modifiers configuration
  const availableModifiers = {
    genre: { label: 'Genre', icon: '🎮' },
    artStyle: { label: 'Art Style', icon: '🎨' },
    platform: { label: 'Platform', icon: '💻' },
    mood: { label: 'Mood & Tone', icon: '🎭' },
    complexity: { label: 'Complexity', icon: '🎯' }
  }

  // Set the first project as active on load
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      setActiveProject(projects[0])
    }
  }, [projects, activeProject])

  // Modifier management functions
  const addModifier = (modifierKey: string) => {
    if (!visibleModifiers.includes(modifierKey)) {
      setVisibleModifiers([...visibleModifiers, modifierKey])
    }
  }

  const removeModifier = (modifierKey: string) => {
    setVisibleModifiers(visibleModifiers.filter(key => key !== modifierKey))
  }

  const getHiddenModifiers = () => {
    return Object.keys(availableModifiers).filter(key => !visibleModifiers.includes(key))
  }

  // Render individual modifier dropdowns
  const renderModifier = (modifierKey: string) => {
    const modifier = availableModifiers[modifierKey as keyof typeof availableModifiers]
    
    switch (modifierKey) {
      case 'genre':
        return (
          <div key={modifierKey} className="relative">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="action">Action</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="rpg">RPG</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
                <SelectItem value="simulation">Simulation</SelectItem>
                <SelectItem value="puzzle">Puzzle</SelectItem>
                <SelectItem value="horror">Horror</SelectItem>
                <SelectItem value="platform">Platformer</SelectItem>
                <SelectItem value="racing">Racing</SelectItem>
              </SelectContent>
            </Select>
            <button 
              onClick={() => removeModifier(modifierKey)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        )
      
      case 'artStyle':
        return (
          <div key={modifierKey} className="relative">
            <Select value={selectedArtStyle} onValueChange={setSelectedArtStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Art Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">🌟 Realistic</SelectItem>
                <SelectItem value="cartoon">🎨 Cartoon</SelectItem>
                <SelectItem value="pixel_art">🕹️ Pixel Art</SelectItem>
                <SelectItem value="anime">✨ Anime</SelectItem>
                <SelectItem value="minimalist">⚡ Minimalist</SelectItem>
                <SelectItem value="cyberpunk">🌃 Cyberpunk</SelectItem>
                <SelectItem value="steampunk">⚙️ Steampunk</SelectItem>
                <SelectItem value="watercolor">🎭 Watercolor</SelectItem>
                <SelectItem value="low_poly">💎 Low Poly</SelectItem>
                <SelectItem value="oil_painting">🖼️ Oil Painting</SelectItem>
                <SelectItem value="sketch">✏️ Hand-drawn Sketch</SelectItem>
                <SelectItem value="neon">💡 Neon</SelectItem>
                <SelectItem value="gothic">🏰 Gothic</SelectItem>
                <SelectItem value="retro">📼 Retro</SelectItem>
                <SelectItem value="cel_shaded">🎪 Cel-shaded</SelectItem>
                <SelectItem value="photorealistic">📸 Photorealistic</SelectItem>
                <SelectItem value="abstract">🌀 Abstract</SelectItem>
                <SelectItem value="noir">🎬 Film Noir</SelectItem>
                <SelectItem value="vaporwave">🌅 Vaporwave</SelectItem>
                <SelectItem value="studio_ghibli">🌿 Studio Ghibli</SelectItem>
              </SelectContent>
            </Select>
            <button 
              onClick={() => removeModifier(modifierKey)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        )
      
      case 'platform':
        return (
          <div key={modifierKey} className="relative">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pc">PC</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="console">Console</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>
            <button 
              onClick={() => removeModifier(modifierKey)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        )
      
      case 'mood':
        return (
          <div key={modifierKey} className="relative">
            <Select value={selectedMood} onValueChange={setSelectedMood}>
              <SelectTrigger>
                <SelectValue placeholder="Mood & Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">🌑 Dark & Mysterious</SelectItem>
                <SelectItem value="lighthearted">☀️ Lighthearted & Fun</SelectItem>
                <SelectItem value="epic">⚔️ Epic & Heroic</SelectItem>
                <SelectItem value="peaceful">🌸 Peaceful & Relaxing</SelectItem>
                <SelectItem value="intense">⚡ Intense & Thrilling</SelectItem>
                <SelectItem value="whimsical">🎭 Whimsical & Quirky</SelectItem>
                <SelectItem value="serious">🎯 Serious & Dramatic</SelectItem>
                <SelectItem value="nostalgic">💭 Nostalgic & Nostalgic</SelectItem>
                <SelectItem value="surreal">🌀 Surreal & Abstract</SelectItem>
                <SelectItem value="balanced">⚖️ Balanced & Varied</SelectItem>
              </SelectContent>
            </Select>
            <button 
              onClick={() => removeModifier(modifierKey)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        )
      
      case 'complexity':
        return (
          <div key={modifierKey} className="relative">
            <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
              <SelectTrigger>
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">🟢 Simple & Casual</SelectItem>
                <SelectItem value="medium">🟡 Medium Complexity</SelectItem>
                <SelectItem value="complex">🟠 Complex & Deep</SelectItem>
                <SelectItem value="hardcore">🔴 Hardcore & Challenging</SelectItem>
                <SelectItem value="accessible">💚 Accessible to All</SelectItem>
                <SelectItem value="strategic">🧠 Strategic & Thoughtful</SelectItem>
                <SelectItem value="fast_paced">💨 Fast-paced & Action</SelectItem>
                <SelectItem value="slow_burn">🕐 Slow-burn & Methodical</SelectItem>
              </SelectContent>
            </Select>
            <button 
              onClick={() => removeModifier(modifierKey)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        )
      
      default:
        return null
    }
  }

  const generateInspiration = () => {
    const randomIdea = inspirationIdeas[Math.floor(Math.random() * inspirationIdeas.length)]
    setCurrentInspiration(randomIdea)
    setGameIdea(randomIdea)
  }

  const getProjectProgress = (project: GameProject) => {
    const stages = ['idea', 'story', 'assets', 'gameplay', 'qa', 'preview', 'publish']
    let completedStages = 1 // Always has idea
    
    if (project.story?.plotOutline) completedStages++
    if (project.assets) completedStages++
    if (project.gameplay?.mechanics && project.gameplay.mechanics.length > 0) completedStages++
    // QA and preview are more complex to determine
    
    return Math.floor((completedStages / stages.length) * 100)
  }

  const getStageStatus = (project: GameProject, stageId: string) => {
    switch (stageId) {
      case 'idea': return 'complete'
      case 'story': return project.story?.plotOutline ? 'complete' : 'pending'
      case 'assets': return project.assets ? 'complete' : 'pending'
      case 'gameplay': return (project.gameplay?.mechanics && project.gameplay.mechanics.length > 0) ? 'complete' : 'pending'
      default: return 'pending'
    }
  }

  const handleGenerateProject = () => {
    if (!gameIdea.trim()) {
      toast.error('Please describe your game idea first!')
      return
    }

    // Create enhanced description with modifiers
    const modifierText = `${selectedGenre} game with ${selectedArtStyle} art style for ${selectedPlatform}, ${selectedMood} mood, ${selectedComplexity} complexity`
    const enhancedDescription = `${gameIdea}\n\nProject Details: ${modifierText}`

    const newProject: GameProject = {
      id: `project-${Date.now()}`,
      title: gameIdea.split(' ').slice(0, 4).join(' '), // First 4 words as title
      description: enhancedDescription,
      prompt: gameIdea,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 10,
      status: 'development',
      pipeline: [],
      story: undefined,
      assets: {
        art: [],
        audio: [],
        models: [],
        ui: []
      },
      gameplay: undefined
    }

    onProjectCreate(newProject)
    setGameIdea('')
    toast.success(`🎮 ${modifierText} project created!`)
  }

  const handleProjectAction = (project: GameProject, action: 'open' | 'regenerate' | 'delete') => {
    switch (action) {
      case 'open':
        onProjectSelect(project)
        break
      case 'regenerate':
        toast.success('Regenerating project assets... ♻️')
        break
      case 'delete':
        const updatedProjects = projects.filter(p => p.id !== project.id)
        onProjectsChange(updatedProjects)
        if (activeProject?.id === project.id) {
          setActiveProject(updatedProjects[0] || null)
        }
        toast.success('Project deleted successfully')
        break
    }
  }

  const handleTemplateSelect = (template: typeof gameTemplates[0]) => {
    setGameIdea(template.description)
    setSelectedGenre(template.genre)
    setSelectedArtStyle(template.artStyle)
    setSelectedPlatform(template.platform)
  }

  const handleStageClick = (stageId: string) => {
    if (activeProject) {
      setActiveProject(activeProject)
      onProjectSelect(activeProject)
      onSectionChange(stageId)
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header / Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-accent via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Welcome back to GameForge 🎮
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Turn your ideas into fully playable games with AI. Describe your vision and watch it come to life.
            </p>
          </div>

          {/* Game Idea Input */}
          <Card className="glass-card p-6 max-w-4xl mx-auto">
            <div className="space-y-4">
              <Textarea
                placeholder="Describe your next game idea... (e.g., 'A puzzle platformer where you play as a robot learning emotions')"
                value={gameIdea}
                onChange={(e) => setGameIdea(e.target.value)}
                className="min-h-[100px] text-lg resize-none"
              />
              
              {/* Dynamic Modifier Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {visibleModifiers.map(modifierKey => renderModifier(modifierKey))}
                
                {/* Add Modifier Button */}
                {getHiddenModifiers().length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-dashed">
                        <Plus size={16} className="mr-2" />
                        Add Modifier
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {getHiddenModifiers().map(modifierKey => {
                        const modifier = availableModifiers[modifierKey as keyof typeof availableModifiers]
                        return (
                          <DropdownMenuItem 
                            key={modifierKey}
                            onClick={() => addModifier(modifierKey)}
                          >
                            <span className="mr-2">{modifier.icon}</span>
                            {modifier.label}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleGenerateProject}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
                >
                  <Sparkle size={20} className="mr-2" />
                  Generate New Project
                </Button>
                <Button
                  onClick={generateInspiration}
                  variant="outline"
                  size="lg"
                >
                  <Lightbulb size={20} className="mr-2" />
                  Get Inspiration
                </Button>
                <Button
                  onClick={() => setIsEnhancedDialogOpen(true)}
                  variant="outline"
                  size="lg"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  🧪 Enhanced Creation
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Project Overview Cards */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Projects</h2>
              <Button 
                variant="ghost" 
                onClick={() => onSectionChange('dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                View All Projects →
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="group"
                >
                  <Card className="glass-card p-6 h-full transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                    <div className="space-y-4">
                      {/* Project Thumbnail */}
                      <div className="aspect-video bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-lg flex items-center justify-center text-4xl">
                        🎮
                      </div>

                      {/* Project Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg line-clamp-1">{project.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {project.story?.genre || 'Adventure'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      {/* Progress Pipeline */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{getProjectProgress(project)}%</span>
                        </div>
                        <div className="flex gap-1">
                          {pipelineStages.slice(0, 5).map((stage) => {
                            const status = getStageStatus(project, stage.id)
                            return (
                              <div
                                key={stage.id}
                                className={cn(
                                  "flex-1 h-2 rounded-full transition-colors",
                                  status === 'complete' ? 'bg-accent' : 'bg-muted'
                                )}
                              />
                            )
                          })}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          onClick={() => handleProjectAction(project, 'open')}
                          className="flex-1"
                        >
                          <Play size={16} className="mr-1" />
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProjectAction(project, 'regenerate')}
                        >
                          <ArrowsClockwise size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProjectAction(project, 'delete')}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Production Pipeline Visualization */}
        {activeProject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Production Pipeline</h2>
              <p className="text-muted-foreground">
                Working on: <span className="text-accent font-medium">{activeProject.title}</span>
              </p>
            </div>

            <Card className="glass-card p-6">
              <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
                {pipelineStages.map((stage, index) => {
                  const status = getStageStatus(activeProject, stage.id)
                  const Icon = stage.icon
                  
                  return (
                    <motion.div
                      key={stage.id}
                      className="flex flex-col items-center space-y-2 min-w-[120px] cursor-pointer group"
                      onClick={() => handleStageClick(stage.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Stage Icon */}
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                        status === 'complete' 
                          ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25' 
                          : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                      )}>
                        {status === 'complete' ? (
                          <CheckCircle size={24} />
                        ) : (
                          <Icon size={24} />
                        )}
                      </div>

                      {/* Stage Name */}
                      <span className={cn(
                        "text-sm font-medium text-center transition-colors",
                        status === 'complete' ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'
                      )}>
                        {stage.name}
                      </span>

                      {/* Connection Line */}
                      {index < pipelineStages.length - 1 && (
                        <div className={cn(
                          "absolute top-8 left-[calc(100%-2rem)] w-8 h-0.5 transition-colors",
                          status === 'complete' ? 'bg-accent' : 'bg-muted'
                        )} />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Templates & Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-foreground">Quick Start Templates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gameTemplates.map((template, index) => (
              <motion.div
                key={template.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card 
                  className="glass-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="text-center space-y-3">
                    <div className="text-3xl">{template.thumbnail}</div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">{template.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex gap-1 justify-center">
                      <Badge variant="outline" className="text-xs">{template.genre}</Badge>
                      <Badge variant="outline" className="text-xs">{template.platform}</Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-foreground">Recently Edited</h2>
            
            <div className="space-y-3">
              {projects.slice(0, 3).map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <Card 
                    className="glass-card p-4 cursor-pointer transition-all duration-300 hover:bg-muted/5"
                    onClick={() => onProjectSelect(project)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                          🎮
                        </div>
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last edited: {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock size={16} />
                        <span className="text-sm">{getProjectProgress(project)}% complete</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
      
      {/* Enhanced Project Creation Dialog */}
      <EnhancedProjectCreationDialog
        isOpen={isEnhancedDialogOpen}
        onClose={() => setIsEnhancedDialogOpen(false)}
        onProjectCreated={onProjectCreate}
      />
    </div>
  )
}
