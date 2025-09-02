import { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { generateMockProject } from '@/lib/mockData'
import { aiMockGenerator } from '@/lib/aiMockGenerator'
import { projectAPI } from '@/lib/projectAPI'
import { AuthContext } from '@/contexts/AuthContext'
import { PipelineVisualizer, createPipelineStages } from '@/components/PipelineVisualizer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { GameController } from '@phosphor-icons/react/dist/csr/GameController'
import { MagicWand } from '@phosphor-icons/react/dist/csr/MagicWand'
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { PaperPlaneRight } from '@phosphor-icons/react/dist/csr/PaperPlaneRight'
import { Brain } from '@phosphor-icons/react/dist/csr/Brain'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { Bug } from '@phosphor-icons/react/dist/csr/Bug'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProjectCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: GameProject) => void
  onQAWorkspace?: (project: GameProject) => void
}

const inspirationPrompts = [
  "A cyberpunk detective game with AI companions",
  "Medieval fantasy RPG with dragon taming",
  "Space exploration with alien diplomacy",
  "Steampunk puzzle adventure with time travel",
  "Underwater survival with sea creature allies",
  "Post-apocalyptic city builder with robots",
  "Magical cooking game in a wizard's tavern",
  "Ninja platformer with shadow manipulation"
]

export function ProjectCreationDialog({
  isOpen,
  onClose,
  onProjectCreated,
  onQAWorkspace
}: ProjectCreationDialogProps) {
  const { user, token } = useContext(AuthContext)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<'input' | 'generating' | 'pipeline'>('input')
  const [pipelineStages, setPipelineStages] = useState(createPipelineStages())
  const [currentPipelineStage, setCurrentPipelineStage] = useState<string>('')
  const [generatedProject, setGeneratedProject] = useState<GameProject | null>(null)

  const handleCreateProject = async () => {
    if (!prompt.trim() || isGenerating) return

    // Check authentication
    if (!user || !token) {
      toast.error('Please log in to create a project.')
      return
    }

    setIsGenerating(true)
    setCurrentPhase('generating')

    try {
      // Create initial project in database
      console.log('🎮 Creating project with prompt:', prompt)
      
      // Generate a base project locally first
      const baseProject = generateMockProject(prompt)
      
      // Save to database via API
      const savedProject = await projectAPI.createProject({
        title: baseProject.title,
        description: baseProject.description,
        prompt: prompt,
        status: 'concept',
        progress: 0,
        pipeline: createPipelineStages().map((stage, index) => ({
          id: stage.id,
          name: stage.name,
          status: 'pending' as const,
          progress: 0,
          order: index + 1
        }))
      })

      console.log('✅ Project saved to database:', savedProject.id)
      setGeneratedProject(savedProject)

      // Switch to pipeline view
      setTimeout(() => {
        setCurrentPhase('pipeline')
        startAIPipeline(savedProject)
      }, 1500)

    } catch (error) {
      console.error('❌ Error creating project:', error)
      toast.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsGenerating(false)
      setCurrentPhase('input')
    }
  }

  const startAIPipeline = async (currentProject: GameProject) => {
    const stages = [...pipelineStages]
    
    try {
      // Update pipeline progress with special QA completion visual
      const pipelineProgress = (stageId: string, progress: number) => {
        setPipelineStages(currentStages => 
          currentStages.map(stage => {
            if (stage.id === stageId) {
              return {
                ...stage,
                status: progress === 100 ? 'complete' : 'active',
                progress
              }
            }
            return stage
          })
        )
        setCurrentPipelineStage(stageId)
        
        // Special handling for QA stage completion
        if (stageId === 'qa' && progress === 10) {
          // Notify that QA is starting and will open workspace
          toast.info('🔬 Starting QA Analysis - Will open Testing Studio when complete...', { 
            duration: 3000 
          })
        }
        
        if (stageId === 'qa' && progress === 100) {
          // Add visual indicator that QA is opening
          setTimeout(() => {
            setPipelineStages(currentStages => 
              currentStages.map(stage => {
                if (stage.id === 'qa') {
                  return {
                    ...stage,
                    name: 'QA Testing (Opening Studio...)',
                    status: 'complete' as const
                  }
                }
                return stage
              })
            )
          }, 500)
        }
      }

      // QA Ready callback - opens QA workspace when QA stage completes
      const onQAReady = async (generatedContent?: Partial<GameProject>): Promise<boolean> => {
        console.log('🔬 QA Ready callback triggered!', { currentProject, onQAWorkspace, generatedContent })
        
        if (currentProject && onQAWorkspace) {
          try {
            // Update project in database with AI-generated content
            const enhancedProject: GameProject = {
              ...currentProject,
              ...generatedContent,
              pipeline: stages.map(stage => ({
                id: stage.id,
                name: stage.name,
                status: stage.id === 'qa' ? 'complete' : stage.id === 'publish' ? 'pending' : 'complete',
                progress: stage.id === 'publish' ? 0 : 100,
                order: stages.indexOf(stage) + 1
              }))
            }
            
            // Save enhanced project to database
            console.log('💾 Updating project in database with AI content...')
            const updatedProject = await projectAPI.updateProject(currentProject.id, enhancedProject)
            
            console.log('🔬 Opening QA workspace for project:', updatedProject.title)
            
            // Close dialog and notify parent
            onProjectCreated(updatedProject)
            handleClose()
            
            // Add toast notification
            toast.success('🔬 QA Testing complete! Opening QA Studio...', { duration: 2000 })
            
            setTimeout(() => {
              onQAWorkspace(updatedProject)
            }, 800)
            return true
          } catch (error) {
            console.error('❌ Error updating project for QA:', error)
            toast.error('Failed to prepare QA workspace')
            return false
          }
        }
        
        console.warn('🔬 QA Ready callback called but missing project or workspace handler')
        return false
      }

      // Generate story, assets, gameplay, and QA with visual feedback
      console.log('🚀 Starting AI pipeline generation...')
      const generatedContent = await aiMockGenerator.generateFullProject(
        prompt, 
        pipelineProgress,
        onQAReady
      )

      console.log('✅ AI pipeline generation completed', { generatedContent })

      // If QA callback wasn't triggered or didn't handle it, complete normally
      if (currentProject && Object.keys(generatedContent).length > 0) {
        console.log('⚠️ Falling back to normal project completion (no QA workspace or not handled)')
        
        try {
          const enhancedProject: GameProject = {
            ...currentProject,
            ...generatedContent,
            pipeline: stages.map(stage => ({
              id: stage.id,
              name: stage.name,
              status: stage.id === 'publish' ? 'pending' : 'complete',
              progress: stage.id === 'publish' ? 0 : 100,
              order: stages.indexOf(stage) + 1
            }))
          }

          // Update project in database with AI content
          console.log('💾 Updating completed project in database...')
          const updatedProject = await projectAPI.updateProject(currentProject.id, enhancedProject)
          
          // Final completion
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          onProjectCreated(updatedProject)
          toast.success('🎮 Game project created successfully!')
          
          handleClose()
        } catch (error) {
          console.error('❌ Error updating completed project:', error)
          toast.error('Project created but failed to save AI content')
          onProjectCreated(currentProject)
          handleClose()
        }
      } else {
        console.log('🔬 QA workspace flow completed, skipping normal completion')
      }

    } catch (error) {
      console.error('Error in AI pipeline:', error)
      toast.error('Error generating AI content. Using basic project.')
      
      if (currentProject) {
        onProjectCreated(currentProject)
      }
      handleClose()
    }
  }

  const handleClose = () => {
    setIsGenerating(false)
    setCurrentPhase('input')
    setCurrentPipelineStage('')
    setPipelineStages(createPipelineStages())
    setGeneratedProject(null)
    setPrompt('')
    onClose()
  }

  const useInspirationPrompt = (inspirationPrompt: string) => {
    setPrompt(inspirationPrompt)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card max-w-4xl border-accent/20 max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-full gradient-cosmic flex items-center justify-center">
              <Sparkle size={24} className="text-white" />
            </div>
            Create New Game Project
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {currentPhase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Main Input */}
              <div className="space-y-3">
                <Label htmlFor="game-prompt" className="text-base font-medium">
                  Describe your game idea
                </Label>
                <Textarea
                  id="game-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell me about your dream game... What genre? What's the story? What makes it unique?"
                  className="min-h-24 bg-muted/30 border-border/50 focus:border-accent/50 transition-colors resize-none"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  The more details you provide, the better I can help bring your vision to life!
                </p>
              </div>

              {/* Inspiration Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Need inspiration? Try these ideas:
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {inspirationPrompts.slice(0, 6).map((inspirationPrompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      onClick={() => useInspirationPrompt(inspirationPrompt)}
                      className="glass p-3 rounded-lg text-left hover:glow-purple transition-all duration-200 text-sm border border-border/30 hover:border-accent/30"
                    >
                      {inspirationPrompt}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="border-border/50 hover:border-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!prompt.trim()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium gap-2 px-6"
                >
                  <Sparkle size={16} />
                  Create Game Project
                </Button>
              </div>
            </motion.div>
          )}

          {currentPhase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 py-8"
            >
              {/* AI Generation Animation */}
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto rounded-full gradient-cosmic flex items-center justify-center"
                >
                  <Brain size={32} className="text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    AI Analyzing Your Concept...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Preparing to generate your complete game project
                  </p>
                </div>
              </div>

              {/* Floating particles */}
              <div className="relative h-32 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-accent/60 rounded-full"
                    initial={{ 
                      x: Math.random() * 400, 
                      y: 120,
                      opacity: 0 
                    }}
                    animate={{ 
                      y: -20,
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {currentPhase === 'pipeline' && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-bold text-foreground">
                  🚀 AI Generation Pipeline
                </h3>
                <p className="text-muted-foreground">
                  Watch as AI creates your game content in real-time
                </p>
              </div>

              <PipelineVisualizer 
                stages={pipelineStages}
                currentStage={currentPipelineStage}
                className="mb-8"
              />

              {/* Current activity indicator */}
              {currentPipelineStage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-4 glass-card rounded-lg"
                >
                  <div className="flex items-center justify-center gap-3 text-accent">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      {currentPipelineStage === 'story' && <Brain size={20} />}
                      {currentPipelineStage === 'assets' && <Palette size={20} />}
                      {currentPipelineStage === 'gameplay' && <GameController size={20} />}
                      {currentPipelineStage === 'qa' && <Bug size={20} />}
                    </motion.div>
                    <span className="font-medium">
                      {currentPipelineStage === 'qa' 
                        ? 'Preparing QA Testing Studio...' 
                        : `Generating ${currentPipelineStage.charAt(0).toUpperCase() + currentPipelineStage.slice(1)}...`
                      }
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}