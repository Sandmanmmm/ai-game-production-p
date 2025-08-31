import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { generateMockProject } from '@/lib/mockData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkle, 
  GameController, 
  Wand, 
  Lightning,
  PaperPlaneRight
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ProjectCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: GameProject) => void
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
  onProjectCreated
}: ProjectCreationDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)

  const generationSteps = [
    { label: 'Analyzing your idea...', icon: Sparkle },
    { label: 'Generating core concept...', icon: Wand },
    { label: 'Creating story outline...', icon: GameController },
    { label: 'Setting up development pipeline...', icon: Lightning },
    { label: 'Finalizing project...', icon: PaperPlaneRight }
  ]

  const handleCreateProject = async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setGenerationStep(0)

    // Simulate AI generation with step-by-step progress
    for (let i = 0; i < generationSteps.length; i++) {
      setGenerationStep(i)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
    }

    // Generate the actual project
    const newProject = generateMockProject(prompt)
    
    // Final step
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onProjectCreated(newProject)
    
    // Reset state
    setIsGenerating(false)
    setGenerationStep(0)
    setPrompt('')
    onClose()
  }

  const useInspirationPrompt = (inspirationPrompt: string) => {
    setPrompt(inspirationPrompt)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl border-accent/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-full gradient-cosmic flex items-center justify-center">
              <Sparkle size={24} className="text-white" />
            </div>
            Create New Game Project
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!isGenerating ? (
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
                  onClick={onClose}
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
          ) : (
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
                  <Sparkle size={32} className="text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    AI Creating Your Game...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This may take a moment while I craft your perfect game project
                  </p>
                </div>
              </div>

              {/* Generation Steps */}
              <div className="space-y-4">
                {generationSteps.map((step, index) => {
                  const StepIcon = step.icon
                  const isActive = index === generationStep
                  const isComplete = index < generationStep
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className={cn(
                        'flex items-center gap-4 p-3 rounded-lg transition-all duration-300',
                        isActive && 'bg-accent/20 border border-accent/30',
                        isComplete && 'opacity-60'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                        isActive && 'bg-accent text-accent-foreground animate-pulse-glow',
                        isComplete && 'bg-emerald-500/20 text-emerald-400',
                        !isActive && !isComplete && 'bg-muted/50 text-muted-foreground'
                      )}>
                        <StepIcon size={16} />
                      </div>
                      <span className={cn(
                        'font-medium transition-colors duration-300',
                        isActive && 'text-accent',
                        isComplete && 'text-emerald-400',
                        !isActive && !isComplete && 'text-muted-foreground'
                      )}>
                        {step.label}
                      </span>
                      {isActive && (
                        <div className="ml-auto">
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-2 h-2 rounded-full bg-accent"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                              className="w-2 h-2 rounded-full bg-accent"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                              className="w-2 h-2 rounded-full bg-accent"
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}