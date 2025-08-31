import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject, PipelineStage } from '@/lib/types'
import { PipelineVisualization } from '@/components/PipelineVisualization'
import { AIAssistant } from '@/components/AIAssistant'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft,
  BookOpen,
  Palette,
  GameController,
  TestTube,
  Rocket,
  Calendar,
  Clock,
  Users,
  Target,
  Sparkle,
  Play,
  Pause,
  Robot
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ProjectDetailViewProps {
  project: GameProject
  onBack: () => void
}

export function ProjectDetailView({ project, onBack }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isAIMinimized, setIsAIMinimized] = useState(false)

  const getStatusColor = (status: string) => {
    const colors = {
      concept: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      development: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      testing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      complete: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    }
    return colors[status as keyof typeof colors] || colors.concept
  }

  const currentStage = project.pipeline.find(stage => stage.status === 'in-progress') || 
    project.pipeline.find(stage => stage.status === 'pending')

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className={cn('capitalize', getStatusColor(project.status))}>
                    {project.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {project.story?.genre || 'Adventure'}
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Play size={16} />
                Continue Development
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsAIMinimized(!isAIMinimized)}
                className="gap-2"
              >
                <Robot size={16} />
                {isAIMinimized ? 'Show' : 'Hide'} AI Assistant
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 mb-2 glass">
              <TabsTrigger value="overview" className="gap-2">
                <Target size={16} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="story" className="gap-2">
                <BookOpen size={16} />
                Story & Lore
              </TabsTrigger>
              <TabsTrigger value="assets" className="gap-2">
                <Palette size={16} />
                Assets
              </TabsTrigger>
              <TabsTrigger value="gameplay" className="gap-2">
                <GameController size={16} />
                Gameplay
              </TabsTrigger>
              <TabsTrigger value="qa" className="gap-2">
                <TestTube size={16} />
                QA & Testing
              </TabsTrigger>
              <TabsTrigger value="publishing" className="gap-2">
                <Rocket size={16} />
                Publishing
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="overview" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-8 max-w-4xl">
                    {/* Project Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <h2 className="text-xl font-semibold text-foreground">Project Summary</h2>
                      <Card className="glass-card p-6">
                        <p className="text-foreground leading-relaxed">{project.description}</p>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 glass rounded-lg">
                            <div className="text-2xl font-bold text-accent mb-1">{project.progress}%</div>
                            <div className="text-sm text-muted-foreground">Overall Progress</div>
                            <Progress value={project.progress} className="mt-2 h-2" />
                          </div>
                          <div className="text-center p-4 glass rounded-lg">
                            <div className="text-2xl font-bold text-foreground mb-1">
                              {project.pipeline.filter(s => s.status === 'complete').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Completed Stages</div>
                          </div>
                          <div className="text-center p-4 glass rounded-lg">
                            <div className="text-2xl font-bold text-foreground mb-1">
                              {currentStage?.name || 'Planning'}
                            </div>
                            <div className="text-sm text-muted-foreground">Current Stage</div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Development Pipeline */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-4"
                    >
                      <h2 className="text-xl font-semibold text-foreground">Development Pipeline</h2>
                      <PipelineVisualization 
                        stages={project.pipeline}
                        onStageClick={(stage) => console.log('Stage clicked:', stage)}
                      />
                    </motion.div>

                    {/* Key Features */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-4"
                    >
                      <h2 className="text-xl font-semibold text-foreground">Key Features</h2>
                      <Card className="glass-card p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {project.publishing?.marketing.key_features?.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-accent" />
                              <span className="text-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="story" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-4xl">
                    <h2 className="text-xl font-semibold text-foreground">Story & Narrative</h2>
                    
                    {/* Story Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="glass-card p-6">
                        <h3 className="font-semibold text-foreground mb-3">Genre & Setting</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Genre:</span>
                            <Badge variant="secondary">{project.story?.genre}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Target Audience:</span>
                            <span className="text-foreground text-sm">{project.story?.targetAudience}</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="glass-card p-6">
                        <h3 className="font-semibold text-foreground mb-3">Themes</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.story?.themes?.map((theme, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    </div>

                    {/* Plot Outline */}
                    <Card className="glass-card p-6">
                      <h3 className="font-semibold text-foreground mb-3">Plot Outline</h3>
                      <p className="text-foreground leading-relaxed">{project.story?.plotOutline}</p>
                    </Card>

                    {/* Setting */}
                    <Card className="glass-card p-6">
                      <h3 className="font-semibold text-foreground mb-3">World & Setting</h3>
                      <p className="text-foreground leading-relaxed">{project.story?.setting}</p>
                    </Card>

                    {/* Characters Placeholder */}
                    <Card className="glass-card p-6">
                      <h3 className="font-semibold text-foreground mb-3">Characters</h3>
                      <div className="text-center py-8 text-muted-foreground">
                        <Users size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Character development coming soon...</p>
                        <Button variant="outline" className="mt-4 gap-2">
                          <Sparkle size={16} />
                          Generate Characters with AI
                        </Button>
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="assets" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-4xl">
                    <h2 className="text-xl font-semibold text-foreground">Asset Production</h2>
                    
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                        <Palette size={40} className="text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Assets Coming Soon</h3>
                        <p className="text-muted-foreground mb-6">AI-powered asset generation will help create art, audio, and 3D models for your game</p>
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                          <Sparkle size={16} />
                          Start Asset Production
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="gameplay" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-4xl">
                    <h2 className="text-xl font-semibold text-foreground">Gameplay Systems</h2>
                    
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                        <GameController size={40} className="text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Gameplay Design</h3>
                        <p className="text-muted-foreground mb-6">Define core mechanics, level design, and player progression systems</p>
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                          <Sparkle size={16} />
                          Design Gameplay
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="qa" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-4xl">
                    <h2 className="text-xl font-semibold text-foreground">Quality Assurance</h2>
                    
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                        <TestTube size={40} className="text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Testing & QA</h3>
                        <p className="text-muted-foreground mb-6">Comprehensive testing plans, bug tracking, and quality metrics</p>
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                          <Sparkle size={16} />
                          Setup Testing
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="publishing" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-4xl">
                    <h2 className="text-xl font-semibold text-foreground">Publishing Strategy</h2>
                    
                    {/* Marketing Overview */}
                    <Card className="glass-card p-6">
                      <h3 className="font-semibold text-foreground mb-4">Marketing</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-muted-foreground">Tagline:</span>
                          <p className="text-foreground font-medium">{project.publishing?.marketing.tagline}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target Demographics:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.publishing?.marketing.target_demographics?.map((demo, index) => (
                              <Badge key={index} variant="outline">{demo}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Platforms */}
                    <Card className="glass-card p-6">
                      <h3 className="font-semibold text-foreground mb-4">Target Platforms</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.publishing?.platforms?.map((platform, index) => (
                          <div key={index} className="glass p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground">{platform.name}</span>
                              <Badge variant="secondary" className={getStatusColor(platform.status)}>
                                {platform.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {platform.requirements.length} requirements
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <AnimatePresence>
        {!isAIMinimized && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-l border-border/30 bg-card/30"
          >
            <AIAssistant
              context={activeTab as any}
              onToggleMinimize={() => setIsAIMinimized(true)}
              className="h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant Minimized */}
      <AIAssistant
        isMinimized={isAIMinimized}
        onToggleMinimize={() => setIsAIMinimized(false)}
      />
    </div>
  )
}