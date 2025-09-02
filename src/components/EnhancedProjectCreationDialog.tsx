import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles as Sparkle, Gamepad2 as GameController, Wand2 as MagicWand, 
  Zap as Lightning, Send as PaperPlaneRight, Brain, Palette, Bug, 
  Image as ImageIcon, Upload, Users, Rocket, Crown, Heart, 
  Sword, Car, Ghost, PuzzleIcon as Puzzle, Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { allTemplates, type RealGameTemplate } from '@/lib/templates'
import { realTemplateGenerator, type TemplateCustomizations } from '@/lib/realTemplateGeneratorClean'

interface EnhancedProjectCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: GameProject) => void
  onQAWorkspace?: (project: GameProject) => void
}

// Template categories and data
const TEMPLATE_CATEGORIES = {
  genre: [
    { id: 'rpg', name: 'RPG & Fantasy', icon: Sword, color: 'text-purple-400' },
    { id: 'scifi', name: 'Sci-Fi & Space', icon: Rocket, color: 'text-blue-400' },
    { id: 'arcade', name: 'Arcade & Casual', icon: GameController, color: 'text-green-400' },
    { id: 'action', name: 'Action & Platformer', icon: Lightning, color: 'text-orange-400' },
    { id: 'puzzle', name: 'Puzzle & Strategy', icon: Puzzle, color: 'text-yellow-400' },
    { id: 'racing', name: 'Racing & Sports', icon: Car, color: 'text-red-400' },
    { id: 'horror', name: 'Horror & Thriller', icon: Ghost, color: 'text-gray-400' },
    { id: 'creative', name: 'Creative & Sandbox', icon: Palette, color: 'text-pink-400' },
  ],
  style: [
    { id: 'voxel', name: 'Voxel/Minecraft-style', preview: '🟫' },
    { id: 'pixel', name: '2D Pixel Art', preview: '🎭' },
    { id: 'lowpoly', name: 'Low-poly 3D', preview: '🎪' },
    { id: 'mobile', name: 'Mobile-friendly UI', preview: '📱' },
    { id: 'artistic', name: 'Hand-drawn/Artistic', preview: '🎨' },
    { id: 'cyberpunk', name: 'Neon/Cyberpunk', preview: '⚡' },
  ],
  complexity: [
    { id: 'beginner', name: 'Beginner', description: 'Simple mechanics, quick to build', time: '1-2 hours', color: 'bg-green-500/20 text-green-400' },
    { id: 'intermediate', name: 'Intermediate', description: 'Multiple systems, moderate complexity', time: '2-4 hours', color: 'bg-yellow-500/20 text-yellow-400' },
    { id: 'advanced', name: 'Advanced', description: 'Complex gameplay, full features', time: '4+ hours', color: 'bg-red-500/20 text-red-400' },
  ]
}

// Convert real templates to display format
const FEATURED_TEMPLATES = allTemplates.map(template => ({
  id: template.id,
  name: template.name,
  category: template.gameStructure.gameType,
  style: 'modern', // Default style
  complexity: template.complexity,
  description: template.description,
  preview: `🎮`, // Placeholder emoji until we have real previews
  rating: 4.8, // Default rating
  uses: Math.floor(Math.random() * 2000) + 500, // Mock usage stats
  features: template.tags,
  estimatedTime: template.estimatedTime,
  realTemplate: template // Reference to the real template
}))

// Create template generator instance (use singleton from clean generator)
// const templateGenerator = realTemplateGenerator (already imported)

type CreationMethod = 'template' | 'describe' | 'gallery' | 'quickstart' | 'import' | 'continue'
type CreationStep = 'method' | 'template-select' | 'template-customize' | 'user-input' | 'concept' | 'generating' | 'pipeline'

export function EnhancedProjectCreationDialog({
  isOpen,
  onClose,
  onProjectCreated,
  onQAWorkspace
}: EnhancedProjectCreationDialogProps) {
  const [currentStep, setCurrentStep] = useState<CreationStep>('method')
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<RealGameTemplate | null>(null)
  const [templateCustomization, setTemplateCustomization] = useState<TemplateCustomizations>({
    selectedTheme: '',
    difficulty: 'normal',
    enabledMechanics: [],
    enabledVisuals: [],
    customParameters: {}
  })
  
  // NEW: User input for hybrid generation
  const [userInput, setUserInput] = useState({
    gameTitle: '',
    gameDescription: '',
    storyPrompt: '',
    additionalFeatures: [] as string[],
    creativityLevel: 'balanced' as 'minimal' | 'balanced' | 'creative',
    targetAudience: 'all-ages',
    visualStyle: ''
  })
  
  // Enhanced concept description state
  const [conceptDescription, setConceptDescription] = useState('')
  const [conceptDetails, setConceptDetails] = useState({
    genre: '',
    gameplayStyle: '',
    targetAudience: 'all-ages',
    complexity: 'medium' as 'simple' | 'medium' | 'complex',
    artStyle: '',
    mood: '',
    inspirations: '',
    uniqueFeatures: '',
    platforms: [] as string[],
    estimatedLength: 'short' as 'short' | 'medium' | 'long',
    selectedTags: [] as string[],
    storyElements: {
      hasStory: false,
      storyBrief: '',
      mainCharacter: '',
      setting: '',
      conflict: ''
    },
    gameplayElements: {
      coreLoop: '',
      controls: '',
      objectives: '',
      progression: '',
      difficulty: ''
    },
    technicalRequirements: {
      multiplayer: false,
      saveSystem: false,
      achievements: false,
      analytics: false
    }
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ stage: '', progress: 0 })

  const handleMethodSelect = (method: CreationMethod) => {
    setSelectedMethod(method)
    
    switch (method) {
      case 'template':
        setCurrentStep('template-select')
        break
      case 'describe':
        setCurrentStep('concept')
        break
      case 'quickstart':
        handleQuickStart()
        break
      default:
        toast.info(`${method} not implemented yet`)
    }
  }

  const handleTemplateSelect = (templateDisplay: any) => {
    // Extract the real template from the display wrapper
    const realTemplate = templateDisplay.realTemplate as RealGameTemplate
    setSelectedTemplate(realTemplate)
    
    // Initialize customization with template defaults
    if (realTemplate.customizationOptions.themes.length > 0) {
      setTemplateCustomization(prev => ({
        ...prev,
        selectedTheme: realTemplate.customizationOptions.themes[0].id
      }))
    }
    
    setCurrentStep('template-customize')
  }

  const handleQuickStart = async () => {
    setCurrentStep('generating')
    setIsGenerating(true)
    
    // Generate random concept
    const randomConcepts = [
      "A mystical wizard's tower defense game",
      "Cyberpunk hacker infiltration simulator", 
      "Underwater exploration with marine life",
      "Space mining colony management",
      "Medieval blacksmith crafting adventure"
    ]
    
    const randomConcept = randomConcepts[Math.floor(Math.random() * randomConcepts.length)]
    setConceptDescription(randomConcept)
    
    // Simulate quick generation
    setTimeout(() => {
      setCurrentStep('pipeline')
      // Continue with normal pipeline...
    }, 2000)
  }

  const handleConceptGeneration = async () => {
    setCurrentStep('generating')
    setIsGenerating(true)
    setGenerationProgress({ stage: 'Analyzing your concept...', progress: 10 })

    try {
      // Create a comprehensive prompt from all the collected data
      const comprehensivePrompt = buildComprehensivePrompt()

      // Progress tracking
      setGenerationProgress({ stage: 'Generating story and world...', progress: 25 })
      
      // Simulate AI generation process (in real implementation, this would call the AI service)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setGenerationProgress({ stage: 'Creating game mechanics...', progress: 50 })
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      setGenerationProgress({ stage: 'Designing assets...', progress: 75 })
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      setGenerationProgress({ stage: 'Finalizing project...', progress: 90 })

      // Generate the actual game project using AI
      const aiGenerator = new (await import('@/lib/aiMockGenerator')).AIMockGenerator()
      const generatedProject = await aiGenerator.generateFullProject(
        comprehensivePrompt,
        (stage, progress) => setGenerationProgress({ stage, progress })
      )

      // Enhance the project with our detailed concept information
      const enhancedProject = enhanceProjectWithConceptDetails(generatedProject)

      setGenerationProgress({ stage: 'Complete!', progress: 100 })
      
      // Short delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setIsGenerating(false)
      onProjectCreated(enhancedProject)
      onClose()

    } catch (error) {
      console.error('Error generating project:', error)
      toast.error('Failed to generate project. Please try again.')
      setIsGenerating(false)
      setCurrentStep('concept')
    }
  }

  const buildComprehensivePrompt = (): string => {
    let prompt = `Create a ${conceptDetails.genre} game with the following specifications:\n\n`
    
    // Core concept
    prompt += `CORE CONCEPT:\n${conceptDescription}\n\n`
    
    // Game details
    if (conceptDetails.gameplayStyle) {
      prompt += `GAMEPLAY STYLE: ${conceptDetails.gameplayStyle}\n`
    }
    if (conceptDetails.artStyle) {
      prompt += `ART STYLE: ${conceptDetails.artStyle}\n`
    }
    if (conceptDetails.mood) {
      prompt += `MOOD & TONE: ${conceptDetails.mood}\n`
    }
    
    // Target audience and complexity
    prompt += `TARGET AUDIENCE: ${conceptDetails.targetAudience}\n`
    prompt += `COMPLEXITY: ${conceptDetails.complexity}\n`
    prompt += `ESTIMATED LENGTH: ${conceptDetails.estimatedLength}\n\n`
    
    // Gameplay elements
    if (conceptDetails.gameplayElements.coreLoop) {
      prompt += `CORE GAMEPLAY LOOP:\n${conceptDetails.gameplayElements.coreLoop}\n\n`
    }
    if (conceptDetails.gameplayElements.controls) {
      prompt += `CONTROLS: ${conceptDetails.gameplayElements.controls}\n`
    }
    if (conceptDetails.gameplayElements.objectives) {
      prompt += `OBJECTIVES: ${conceptDetails.gameplayElements.objectives}\n`
    }
    if (conceptDetails.gameplayElements.progression) {
      prompt += `PROGRESSION: ${conceptDetails.gameplayElements.progression}\n\n`
    }
    
    // Story elements
    if (conceptDetails.storyElements.hasStory) {
      prompt += `STORY ELEMENTS:\n`
      if (conceptDetails.storyElements.storyBrief) {
        prompt += `Story: ${conceptDetails.storyElements.storyBrief}\n`
      }
      if (conceptDetails.storyElements.mainCharacter) {
        prompt += `Main Character: ${conceptDetails.storyElements.mainCharacter}\n`
      }
      if (conceptDetails.storyElements.setting) {
        prompt += `Setting: ${conceptDetails.storyElements.setting}\n`
      }
      if (conceptDetails.storyElements.conflict) {
        prompt += `Main Conflict: ${conceptDetails.storyElements.conflict}\n`
      }
      prompt += `\n`
    }
    
    // Inspirations and unique features
    if (conceptDetails.inspirations) {
      prompt += `INSPIRATIONS: ${conceptDetails.inspirations}\n`
    }
    if (conceptDetails.uniqueFeatures) {
      prompt += `UNIQUE FEATURES: ${conceptDetails.uniqueFeatures}\n`
    }
    
    // Tags and technical requirements
    if (conceptDetails.selectedTags.length > 0) {
      prompt += `TAGS: ${conceptDetails.selectedTags.join(', ')}\n`
    }
    if (conceptDetails.platforms.length > 0) {
      prompt += `TARGET PLATFORMS: ${conceptDetails.platforms.join(', ')}\n`
    }
    
    // Technical features
    const techFeatures: string[] = []
    if (conceptDetails.technicalRequirements.multiplayer) techFeatures.push('multiplayer support')
    if (conceptDetails.technicalRequirements.saveSystem) techFeatures.push('save/load system')
    if (conceptDetails.technicalRequirements.achievements) techFeatures.push('achievements system')
    if (conceptDetails.technicalRequirements.analytics) techFeatures.push('player analytics')
    
    if (techFeatures.length > 0) {
      prompt += `TECHNICAL FEATURES: ${techFeatures.join(', ')}\n`
    }
    
    prompt += `\nPlease create a complete game project with detailed story, gameplay mechanics, asset requirements, and implementation plan based on these specifications.`
    
    return prompt
  }

  const enhanceProjectWithConceptDetails = (baseProject: Partial<GameProject>): GameProject => {
    // Ensure we have required fields
    const enhancedProject: GameProject = {
      id: baseProject.id || `concept-${Date.now()}`,
      title: conceptDetails.storyElements.mainCharacter ? 
        `${conceptDetails.storyElements.mainCharacter}'s Adventure` : 
        `${conceptDetails.genre.charAt(0).toUpperCase() + conceptDetails.genre.slice(1)} Game`,
      description: conceptDescription,
      prompt: buildComprehensivePrompt(),
      status: baseProject.status || 'development',
      progress: baseProject.progress || 25,
      createdAt: baseProject.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipeline: baseProject.pipeline || [],
      story: baseProject.story,
      assets: baseProject.assets,
      gameplay: baseProject.gameplay,
      qa: baseProject.qa,
      publishing: baseProject.publishing
    }
    
    return enhancedProject
  }

  const renderMethodSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold gradient-text">Create Your Game</h2>
        <p className="text-muted-foreground text-lg">
          Choose how you'd like to start your game development journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Start from Template */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-border/50 hover:border-accent/50 bg-gradient-to-br from-purple-500/10 to-blue-500/10"
          onClick={() => handleMethodSelect('template')}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <GameController size={32} className="text-purple-400" />
            </div>
            <CardTitle className="text-xl">Start from Template</CardTitle>
            <CardDescription>Choose from curated game templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">Most Popular</Badge>
              <p className="text-sm text-muted-foreground text-center">
                {FEATURED_TEMPLATES.length}+ professional templates
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Describe Your Idea */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-border/50 hover:border-accent/50 bg-gradient-to-br from-green-500/10 to-cyan-500/10"
          onClick={() => handleMethodSelect('describe')}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Brain size={32} className="text-green-400" />
            </div>
            <CardTitle className="text-xl">Describe Your Idea</CardTitle>
            <CardDescription>Tell AI what you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">AI Powered</Badge>
              <p className="text-sm text-muted-foreground text-center">
                Advanced natural language processing
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Browse Gallery */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-border/50 hover:border-accent/50 bg-gradient-to-br from-orange-500/10 to-red-500/10"
          onClick={() => handleMethodSelect('gallery')}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={32} className="text-orange-400" />
            </div>
            <CardTitle className="text-xl">Browse Gallery</CardTitle>
            <CardDescription>Explore community creations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">Community</Badge>
              <p className="text-sm text-muted-foreground text-center">
                1000+ community projects
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-border/50 hover:border-accent/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
          onClick={() => handleMethodSelect('quickstart')}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Lightning size={32} className="text-yellow-400" />
            </div>
            <CardTitle className="text-xl">Quick Start</CardTitle>
            <CardDescription>Generate random game concept</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">Instant</Badge>
              <p className="text-sm text-muted-foreground text-center">
                Perfect for beginners
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Import Concept */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-border/50 hover:border-accent/50 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          onClick={() => handleMethodSelect('import')}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Upload size={32} className="text-blue-400" />
            </div>
            <CardTitle className="text-xl">Import Concept</CardTitle>
            <CardDescription>Upload design docs or assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">Advanced</Badge>
              <p className="text-sm text-muted-foreground text-center">
                Support for multiple formats
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Continue Project */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-border/50 hover:border-accent/50 bg-gradient-to-br from-pink-500/10 to-purple-500/10"
          onClick={() => handleMethodSelect('continue')}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Crown size={32} className="text-pink-400" />
            </div>
            <CardTitle className="text-xl">Continue Project</CardTitle>
            <CardDescription>Resume a saved draft</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">Resume</Badge>
              <p className="text-sm text-muted-foreground text-center">
                Pick up where you left off
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )

  const renderTemplateSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setCurrentStep('method')}>
          ← Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Choose a Template</h2>
          <p className="text-muted-foreground">Start with a proven game concept</p>
        </div>
      </div>

      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="genre">By Genre</TabsTrigger>
          <TabsTrigger value="style">By Style</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURED_TEMPLATES.map((template) => (
              <Card 
                key={template.id}
                className="cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-lg border-border/50 hover:border-accent/50"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-t-lg flex items-center justify-center">
                  <div className="text-4xl opacity-50">🎮</div>
                  {/* Placeholder for actual preview GIF */}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Heart size={16} className="text-red-400" />
                        <span className="text-sm">{template.rating}</span>
                      </div>
                      <Badge variant="secondary">{template.uses} uses</Badge>
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {template.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Est. {template.estimatedTime}</span>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        TEMPLATE_CATEGORIES.complexity.find(c => c.id === template.complexity)?.color
                      )}>
                        {template.complexity}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="genre">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TEMPLATE_CATEGORIES.genre.map((genre) => (
              <Card key={genre.id} className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardContent className="p-6 text-center">
                  <genre.icon size={32} className={cn("mx-auto mb-3", genre.color)} />
                  <h3 className="font-medium">{genre.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="style">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TEMPLATE_CATEGORIES.style.map((style) => (
              <Card key={style.id} className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">{style.preview}</div>
                  <h3 className="font-medium">{style.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="community">
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Community Templates</h3>
            <p className="text-muted-foreground">Coming soon! Share and discover community creations.</p>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )

  const renderTemplateCustomization = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setCurrentStep('template-select')}>
          ← Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Customize Template</h2>
          <p className="text-muted-foreground">Make it yours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Preview</h3>
          <Card>
            <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
              <div className="text-6xl opacity-50">🎮</div>
            </div>
            <CardHeader>
              <CardTitle>{selectedTemplate?.name}</CardTitle>
              <CardDescription>{selectedTemplate?.description}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Customization Panel */}
        <div className="space-y-6">
          {/* Theme Selection */}
          {selectedTemplate && selectedTemplate.customizationOptions.themes.length > 0 && (
            <div>
              <Label className="text-base font-medium">Game Theme</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {selectedTemplate.customizationOptions.themes.map((theme) => (
                  <Button
                    key={theme.id}
                    variant={templateCustomization.selectedTheme === theme.id ? 'default' : 'outline'}
                    onClick={() => setTemplateCustomization(prev => ({ ...prev, selectedTheme: theme.id }))}
                    className="h-auto py-3 flex flex-col text-left"
                  >
                    <div className="font-medium">{theme.name}</div>
                    <div className="text-xs opacity-75">{theme.description}</div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Selection */}
          {selectedTemplate && selectedTemplate.customizationOptions.difficulty.length > 0 && (
            <div>
              <Label className="text-base font-medium">Difficulty Level</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {selectedTemplate.customizationOptions.difficulty.map((diff) => (
                  <Button
                    key={diff.id}
                    variant={templateCustomization.difficulty === diff.id ? 'default' : 'outline'}
                    onClick={() => setTemplateCustomization(prev => ({ ...prev, difficulty: diff.id }))}
                    className="h-auto py-3"
                  >
                    {diff.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Mechanic Features */}
          {selectedTemplate && selectedTemplate.customizationOptions.mechanics.length > 0 && (
            <div>
              <Label className="text-base font-medium">Optional Features</Label>
              <div className="space-y-2 mt-2">
                {selectedTemplate.customizationOptions.mechanics.map((mechanic) => (
                  <label key={mechanic.id} className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={templateCustomization.enabledMechanics?.includes(mechanic.id)}
                      onChange={(e) => {
                        setTemplateCustomization(prev => ({
                          ...prev,
                          enabledMechanics: e.target.checked 
                            ? [...(prev.enabledMechanics || []), mechanic.id]
                            : (prev.enabledMechanics || []).filter(f => f !== mechanic.id)
                        }))
                      }}
                    />
                    <div>
                      <div className="font-medium">{mechanic.name}</div>
                      <div className="text-sm text-muted-foreground">{mechanic.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Visual Effects */}
          {selectedTemplate && selectedTemplate.customizationOptions.visuals.length > 0 && (
            <div>
              <Label className="text-base font-medium">Visual Effects</Label>
              <div className="space-y-2 mt-2">
                {selectedTemplate.customizationOptions.visuals.map((visual) => (
                  <label key={visual.id} className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={templateCustomization.enabledVisuals?.includes(visual.id)}
                      onChange={(e) => {
                        setTemplateCustomization(prev => ({
                          ...prev,
                          enabledVisuals: e.target.checked 
                            ? [...(prev.enabledVisuals || []), visual.id]
                            : (prev.enabledVisuals || []).filter(f => f !== visual.id)
                        }))
                      }}
                    />
                    <div>
                      <div className="font-medium">{visual.name}</div>
                      <div className="text-sm text-muted-foreground">{visual.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                if (!selectedTemplate) return
                setCurrentStep('user-input')
              }}
            >
              Next: Add Your Creative Input
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderUserInput = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setCurrentStep('template-customize')}>
          ← Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Add Your Creative Input</h2>
          <p className="text-muted-foreground">Combine template structure with your unique vision</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Selected Template</h3>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="text-2xl">🎮</div>
                {selectedTemplate?.name}
              </CardTitle>
              <CardDescription>{selectedTemplate?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <div className="mb-2"><strong>Category:</strong> {selectedTemplate?.category}</div>
                <div className="mb-2"><strong>Time:</strong> {selectedTemplate?.estimatedTime}</div>
                <div><strong>Foundation:</strong> Proven mechanics + Your creativity</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Input Panel */}
        <div className="space-y-6">
          {/* Game Identity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Game Identity</h3>
            
            <div>
              <Label htmlFor="gameTitle" className="text-base font-medium">Game Title *</Label>
              <Input
                id="gameTitle"
                value={userInput.gameTitle}
                onChange={(e) => setUserInput(prev => ({ ...prev, gameTitle: e.target.value }))}
                placeholder="My Awesome Game"
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="gameDescription" className="text-base font-medium">Game Description *</Label>
              <Textarea
                id="gameDescription"
                value={userInput.gameDescription}
                onChange={(e) => setUserInput(prev => ({ ...prev, gameDescription: e.target.value }))}
                placeholder="A fun and engaging game where players..."
                className="mt-2"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Creativity Level */}
          <div>
            <Label className="text-base font-medium">Creativity Level</Label>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { id: 'minimal', name: 'Template Pure', desc: 'Keep it simple, use template as-is', icon: '🎯' },
                { id: 'balanced', name: 'Enhanced', desc: 'Add some unique touches', icon: '⚖️' },
                { id: 'creative', name: 'Highly Custom', desc: 'Maximum AI enhancement', icon: '🚀' }
              ].map((level) => (
                <Card 
                  key={level.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    userInput.creativityLevel === level.id 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => setUserInput(prev => ({ ...prev, creativityLevel: level.id as any }))}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{level.icon}</div>
                    <div className="font-medium text-sm">{level.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{level.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Optional Enhancements */}
          {(userInput.creativityLevel === 'balanced' || userInput.creativityLevel === 'creative') && (
            <>
              <div>
                <Label htmlFor="storyPrompt" className="text-base font-medium">Story Direction (Optional)</Label>
                <Textarea
                  id="storyPrompt"
                  value={userInput.storyPrompt}
                  onChange={(e) => setUserInput(prev => ({ ...prev, storyPrompt: e.target.value }))}
                  placeholder="My game takes place in a magical forest where..."
                  className="mt-2"
                  rows={2}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  AI will enhance the template story with your direction
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Additional Features (Optional)</Label>
                <div className="mt-2 space-y-2">
                  {[
                    'Leaderboards', 'Power-ups', 'Multiple Levels', 'Character Customization',
                    'Save System', 'Sound Effects', 'Animations', 'Mobile Support'
                  ].map((feature) => (
                    <label key={feature} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={userInput.additionalFeatures.includes(feature)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUserInput(prev => ({
                              ...prev,
                              additionalFeatures: [...prev.additionalFeatures, feature]
                            }))
                          } else {
                            setUserInput(prev => ({
                              ...prev,
                              additionalFeatures: prev.additionalFeatures.filter(f => f !== feature)
                            }))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button 
          className="w-full" 
          size="lg"
          disabled={!userInput.gameTitle.trim() || !userInput.gameDescription.trim()}
          onClick={async () => {
            if (!selectedTemplate || !userInput.gameTitle.trim() || !userInput.gameDescription.trim()) return
            
            setCurrentStep('generating')
            setIsGenerating(true)
            
            try {
              // Generate hybrid project from template + user input
              const project = await realTemplateGenerator.generateFromTemplateWithUserInput(
                selectedTemplate,
                templateCustomization,
                userInput,
                (stage, progress) => {
                  setGenerationProgress({ stage, progress })
                }
              )
              
              // Create the project and trigger callback
              onProjectCreated(project)
              toast.success(`${project.title} created successfully!`)
              onClose()
              
            } catch (error) {
              console.error('Hybrid template generation failed:', error)
              toast.error('Failed to generate project. Please try again.')
              setCurrentStep('user-input')
            } finally {
              setIsGenerating(false)
            }
          }}
        >
          <Sparkle className="w-4 h-4 mr-2" />
          Create Hybrid Game Project
        </Button>
      </div>
    </motion.div>
  )

  const renderConceptDescription = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setCurrentStep('method')}>
          ← Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Describe Your Game Vision</h2>
          <p className="text-muted-foreground">The more details you provide, the better your game will be</p>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
          <TabsTrigger value="story">Story & World</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="main-concept" className="text-base font-medium">
                  Core Game Concept * 
                  <span className="text-sm text-muted-foreground font-normal ml-2">
                    (minimum 50 characters)
                  </span>
                </Label>
                <Textarea
                  id="main-concept"
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  placeholder="Describe your game in 2-3 sentences. What is it about? What makes it fun? Example: 'A puzzle platformer where you play as a robot who can manipulate gravity. Players solve increasingly complex levels by flipping gravity to walk on walls and ceilings while collecting energy cores.'"
                  className="min-h-24 mt-2"
                  rows={4}
                />
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-muted-foreground">
                    This is the main description that will guide the AI generation
                  </div>
                  <div className={`text-xs ${
                    conceptDescription.length < 50 
                      ? 'text-destructive' 
                      : conceptDescription.length < 200 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                  }`}>
                    {conceptDescription.length}/50 minimum
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Genre & Style</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Select value={conceptDetails.genre} onValueChange={(value) => 
                    setConceptDetails(prev => ({ ...prev, genre: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="action">Action</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="rpg">RPG</SelectItem>
                      <SelectItem value="strategy">Strategy</SelectItem>
                      <SelectItem value="puzzle">Puzzle</SelectItem>
                      <SelectItem value="platformer">Platformer</SelectItem>
                      <SelectItem value="shooter">Shooter</SelectItem>
                      <SelectItem value="racing">Racing</SelectItem>
                      <SelectItem value="simulation">Simulation</SelectItem>
                      <SelectItem value="horror">Horror</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={conceptDetails.gameplayStyle} onValueChange={(value) => 
                    setConceptDetails(prev => ({ ...prev, gameplayStyle: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Gameplay style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real-time">Real-time</SelectItem>
                      <SelectItem value="turn-based">Turn-based</SelectItem>
                      <SelectItem value="clicker">Incremental/Clicker</SelectItem>
                      <SelectItem value="arcade">Arcade</SelectItem>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="narrative">Story-driven</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Visual & Audio Style</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Select value={conceptDetails.artStyle} onValueChange={(value) => 
                    setConceptDetails(prev => ({ ...prev, artStyle: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Art style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pixel">Pixel Art</SelectItem>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="hand-drawn">Hand-drawn</SelectItem>
                      <SelectItem value="low-poly">Low Poly</SelectItem>
                      <SelectItem value="retro">Retro/Vintage</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={conceptDetails.mood} onValueChange={(value) => 
                    setConceptDetails(prev => ({ ...prev, mood: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Mood & tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lighthearted">Lighthearted</SelectItem>
                      <SelectItem value="serious">Serious</SelectItem>
                      <SelectItem value="mysterious">Mysterious</SelectItem>
                      <SelectItem value="comedic">Comedic</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="peaceful">Peaceful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Target Audience & Complexity</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Select value={conceptDetails.targetAudience} onValueChange={(value) => 
                    setConceptDetails(prev => ({ ...prev, targetAudience: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="children">Children (6-12)</SelectItem>
                      <SelectItem value="teens">Teens (13-17)</SelectItem>
                      <SelectItem value="adults">Adults (18+)</SelectItem>
                      <SelectItem value="all-ages">All Ages</SelectItem>
                      <SelectItem value="hardcore">Hardcore Gamers</SelectItem>
                      <SelectItem value="casual">Casual Players</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={conceptDetails.complexity} onValueChange={(value) => 
                    setConceptDetails(prev => ({ ...prev, complexity: value as 'simple' | 'medium' | 'complex' }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Game complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (Easy to learn)</SelectItem>
                      <SelectItem value="medium">Medium (Moderate depth)</SelectItem>
                      <SelectItem value="complex">Complex (Deep systems)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Inspirations & References</Label>
                <Input
                  value={conceptDetails.inspirations}
                  onChange={(e) => setConceptDetails(prev => ({ ...prev, inspirations: e.target.value }))}
                  placeholder="e.g., Like Zelda meets Stardew Valley..."
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  What games, movies, or books inspire this idea?
                </p>
              </div>

              <div>
                <Label className="text-base font-medium">Unique Features</Label>
                <Textarea
                  value={conceptDetails.uniqueFeatures}
                  onChange={(e) => setConceptDetails(prev => ({ ...prev, uniqueFeatures: e.target.value }))}
                  placeholder="What makes your game special and different?"
                  className="min-h-20 mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-base font-medium">Quick Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    'Single Player', 'Multiplayer', 'Co-op', 'Competitive', 
                    'Story Rich', 'Open World', 'Linear', 'Replay Value',
                    'Crafting', 'Building', 'Exploration', 'Combat',
                    'Stealth', 'Magic', 'Sci-Fi', 'Fantasy'
                  ].map((tag) => (
                    <Button 
                      key={tag} 
                      variant={conceptDetails.selectedTags.includes(tag) ? "default" : "outline"} 
                      size="sm"
                      onClick={() => {
                        setConceptDetails(prev => ({
                          ...prev,
                          selectedTags: prev.selectedTags.includes(tag) 
                            ? prev.selectedTags.filter(t => t !== tag)
                            : [...prev.selectedTags, tag]
                        }))
                      }}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gameplay" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Core Gameplay Loop</Label>
                <Textarea
                  value={conceptDetails.gameplayElements.coreLoop}
                  onChange={(e) => setConceptDetails(prev => ({ 
                    ...prev, 
                    gameplayElements: { ...prev.gameplayElements, coreLoop: e.target.value }
                  }))}
                  placeholder="What does the player do repeatedly? e.g., Collect resources → Build structures → Defend against enemies → Upgrade"
                  className="min-h-20 mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-base font-medium">Controls & Input</Label>
                <Textarea
                  value={conceptDetails.gameplayElements.controls}
                  onChange={(e) => setConceptDetails(prev => ({ 
                    ...prev, 
                    gameplayElements: { ...prev.gameplayElements, controls: e.target.value }
                  }))}
                  placeholder="How does the player interact? Mouse clicks, keyboard, touch gestures?"
                  className="min-h-16 mt-2"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-base font-medium">Win Conditions & Objectives</Label>
                <Textarea
                  value={conceptDetails.gameplayElements.objectives}
                  onChange={(e) => setConceptDetails(prev => ({ 
                    ...prev, 
                    gameplayElements: { ...prev.gameplayElements, objectives: e.target.value }
                  }))}
                  placeholder="How does the player win or succeed? What are the goals?"
                  className="min-h-16 mt-2"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Progression System</Label>
                <Textarea
                  value={conceptDetails.gameplayElements.progression}
                  onChange={(e) => setConceptDetails(prev => ({ 
                    ...prev, 
                    gameplayElements: { ...prev.gameplayElements, progression: e.target.value }
                  }))}
                  placeholder="How does the player get stronger/unlock content? Levels, upgrades, new areas?"
                  className="min-h-20 mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-base font-medium">Difficulty & Challenge</Label>
                <Textarea
                  value={conceptDetails.gameplayElements.difficulty}
                  onChange={(e) => setConceptDetails(prev => ({ 
                    ...prev, 
                    gameplayElements: { ...prev.gameplayElements, difficulty: e.target.value }
                  }))}
                  placeholder="What makes the game challenging? How does difficulty scale?"
                  className="min-h-16 mt-2"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-base font-medium">Estimated Play Length</Label>
                <Select value={conceptDetails.estimatedLength} onValueChange={(value) => 
                  setConceptDetails(prev => ({ ...prev, estimatedLength: value as 'short' | 'medium' | 'long' }))
                }>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="How long to complete?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (1-3 hours)</SelectItem>
                    <SelectItem value="medium">Medium (5-10 hours)</SelectItem>
                    <SelectItem value="long">Long (20+ hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="story" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has-story"
                checked={conceptDetails.storyElements.hasStory}
                onCheckedChange={(checked) => 
                  setConceptDetails(prev => ({ 
                    ...prev, 
                    storyElements: { ...prev.storyElements, hasStory: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="has-story" className="text-base font-medium">
                This game has a story/narrative
              </Label>
            </div>

            {conceptDetails.storyElements.hasStory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Story Brief</Label>
                    <Textarea
                      value={conceptDetails.storyElements.storyBrief}
                      onChange={(e) => setConceptDetails(prev => ({ 
                        ...prev, 
                        storyElements: { ...prev.storyElements, storyBrief: e.target.value }
                      }))}
                      placeholder="What's the main story? Keep it brief but compelling..."
                      className="min-h-24 mt-2"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Main Character(s)</Label>
                    <Input
                      value={conceptDetails.storyElements.mainCharacter}
                      onChange={(e) => setConceptDetails(prev => ({ 
                        ...prev, 
                        storyElements: { ...prev.storyElements, mainCharacter: e.target.value }
                      }))}
                      placeholder="Who is the protagonist?"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Setting & World</Label>
                    <Textarea
                      value={conceptDetails.storyElements.setting}
                      onChange={(e) => setConceptDetails(prev => ({ 
                        ...prev, 
                        storyElements: { ...prev.storyElements, setting: e.target.value }
                      }))}
                      placeholder="Where and when does the story take place?"
                      className="min-h-20 mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Main Conflict</Label>
                    <Input
                      value={conceptDetails.storyElements.conflict}
                      onChange={(e) => setConceptDetails(prev => ({ 
                        ...prev, 
                        storyElements: { ...prev.storyElements, conflict: e.target.value }
                      }))}
                      placeholder="What's the main problem to solve?"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {!conceptDetails.storyElements.hasStory && (
              <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-muted-foreground">
                  No story elements - this will be a purely gameplay-focused game
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Technical Features</Label>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="multiplayer"
                      checked={conceptDetails.technicalRequirements.multiplayer}
                      onCheckedChange={(checked) => 
                        setConceptDetails(prev => ({ 
                          ...prev, 
                          technicalRequirements: { ...prev.technicalRequirements, multiplayer: checked as boolean }
                        }))
                      }
                    />
                    <Label htmlFor="multiplayer">Multiplayer support</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="save-system"
                      checked={conceptDetails.technicalRequirements.saveSystem}
                      onCheckedChange={(checked) => 
                        setConceptDetails(prev => ({ 
                          ...prev, 
                          technicalRequirements: { ...prev.technicalRequirements, saveSystem: checked as boolean }
                        }))
                      }
                    />
                    <Label htmlFor="save-system">Save/Load system</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="achievements"
                      checked={conceptDetails.technicalRequirements.achievements}
                      onCheckedChange={(checked) => 
                        setConceptDetails(prev => ({ 
                          ...prev, 
                          technicalRequirements: { ...prev.technicalRequirements, achievements: checked as boolean }
                        }))
                      }
                    />
                    <Label htmlFor="achievements">Achievements system</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="analytics"
                      checked={conceptDetails.technicalRequirements.analytics}
                      onCheckedChange={(checked) => 
                        setConceptDetails(prev => ({ 
                          ...prev, 
                          technicalRequirements: { ...prev.technicalRequirements, analytics: checked as boolean }
                        }))
                      }
                    />
                    <Label htmlFor="analytics">Player analytics</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Target Platforms</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Web Browser', 'Desktop', 'Mobile', 'Tablet'].map((platform) => (
                    <Button 
                      key={platform} 
                      variant={conceptDetails.platforms.includes(platform) ? "default" : "outline"} 
                      size="sm"
                      onClick={() => {
                        setConceptDetails(prev => ({
                          ...prev,
                          platforms: prev.platforms.includes(platform) 
                            ? prev.platforms.filter(p => p !== platform)
                            : [...prev.platforms, platform]
                        }))
                      }}
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-4 pt-4 border-t">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkle size={16} />
            <span>
              {conceptDescription.length === 0 
                ? "Fill out the Core Game Concept in the Basic Info tab" 
                : conceptDescription.length < 50 
                ? `Add ${50 - conceptDescription.length} more characters to Core Game Concept` 
                : conceptDescription.length < 200 
                ? "Good start! More details will help" 
                : "Excellent! Ready to generate your game"
              }
            </span>
          </div>
          {conceptDescription.length > 0 && conceptDescription.length < 50 && (
            <div className="mt-1">
              <div className="w-48 bg-secondary/30 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                  style={{ width: `${Math.min((conceptDescription.length / 50) * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {conceptDescription.length}/50 characters minimum
              </div>
            </div>
          )}
        </div>
        <Button 
          className="px-8" 
          size="lg"
          disabled={!conceptDescription.trim() || conceptDescription.length < 50}
          onClick={handleConceptGeneration}
        >
          <MagicWand className="mr-2 h-4 w-4" />
          Generate Game Project
        </Button>
      </div>
    </motion.div>
  )

  const renderGeneratingPhase = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 py-8"
    >
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 mx-auto rounded-full gradient-cosmic flex items-center justify-center"
        >
          <Brain size={40} className="text-white" />
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {selectedTemplate ? 
              `Generating ${selectedTemplate.name}` :
              'AI is Analyzing Your Concept'
            }
          </h3>
          <p className="text-muted-foreground">
            {generationProgress.stage || 'Preparing your complete game development pipeline...'}
          </p>
          {generationProgress.progress > 0 && (
            <div className="w-full max-w-xs mx-auto mt-4">
              <div className="bg-secondary/30 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {generationProgress.progress}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced floating particles */}
      <div className="relative h-40 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: `hsl(${(i * 18) % 360}, 70%, 60%)`,
            }}
            initial={{ 
              x: Math.random() * 600, 
              y: 160,
              opacity: 0,
              scale: 0.5
            }}
            animate={{ 
              y: -40,
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.3]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  )

  const handleClose = () => {
    setCurrentStep('method')
    setSelectedMethod(null)
    setSelectedTemplate(null)
    setTemplateCustomization({
      selectedTheme: '',
      difficulty: 'normal',
      enabledMechanics: [],
      enabledVisuals: [],
      customParameters: {}
    })
    setConceptDescription('')
    setIsGenerating(false)
    setGenerationProgress({ stage: '', progress: 0 })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card !w-[95vw] !max-w-[95vw] border-accent/20 max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-full gradient-cosmic flex items-center justify-center">
              <Sparkle size={24} className="text-white" />
            </div>
            Enhanced Game Creation Studio
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {currentStep === 'method' && (
            <motion.div key="method">
              {renderMethodSelection()}
            </motion.div>
          )}

          {currentStep === 'template-select' && (
            <motion.div key="template-select">
              {renderTemplateSelection()}
            </motion.div>
          )}

          {currentStep === 'template-customize' && (
            <motion.div key="template-customize">
              {renderTemplateCustomization()}
            </motion.div>
          )}

          {currentStep === 'user-input' && (
            <motion.div key="user-input">
              {renderUserInput()}
            </motion.div>
          )}

          {currentStep === 'concept' && (
            <motion.div key="concept">
              {renderConceptDescription()}
            </motion.div>
          )}

          {currentStep === 'generating' && (
            <motion.div key="generating">
              {renderGeneratingPhase()}
            </motion.div>
          )}

          {currentStep === 'pipeline' && (
            <motion.div key="pipeline">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold">🚀 AI Generation Pipeline</h3>
                <p className="text-muted-foreground">
                  Your game is being created in real-time...
                </p>
                {/* This would integrate with the existing pipeline visualizer */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
