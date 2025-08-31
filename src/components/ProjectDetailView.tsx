import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject, PipelineStage } from '../lib/types'
import { PipelineVisualization } from './PipelineVisualization'
import { AIAssistant } from './AIAssistant'
import { AssetGallery } from './AssetGallery'
import { AssetEditingStudio } from './AssetEditingStudio'
import { StoryDisplay } from './StoryDisplay'
import { GameplayDisplay } from './GameplayDisplay'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { Book } from '@phosphor-icons/react/dist/csr/Book'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { GameController } from '@phosphor-icons/react/dist/csr/GameController'
import { TestTube } from '@phosphor-icons/react/dist/csr/TestTube'
import { Rocket } from '@phosphor-icons/react/dist/csr/Rocket'
import { Calendar } from '@phosphor-icons/react/dist/csr/Calendar'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Users } from '@phosphor-icons/react/dist/csr/Users'
import { Target } from '@phosphor-icons/react/dist/csr/Target'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { Robot } from '@phosphor-icons/react/dist/csr/Robot'
import { ChartLine } from '@phosphor-icons/react/dist/csr/ChartLine'
import { cn } from '../lib/utils'

interface ProjectDetailViewProps {
  project: GameProject
  onBack: () => void
  onQAWorkspace: (project: GameProject) => void
}

export function ProjectDetailView({ project, onBack, onQAWorkspace }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isAIMinimized, setIsAIMinimized] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)

  console.log('🚨 ProjectDetailView MOUNTED:', {
    projectId: project?.id,
    projectTitle: project?.title,
    activeTab: activeTab,
    hasAssets: !!project?.assets
  })

  // Add state change logger
  const handleTabChange = (newTab: string) => {
    console.log('🎯 TAB CHANGED:', { from: activeTab, to: newTab })
    setActiveTab(newTab)
  }

  const handleEditAsset = (asset: any) => {
    console.log('Edit asset clicked:', asset)
    setEditingAsset(asset)
  }

  const handleCloseAssetEditor = () => {
    setEditingAsset(null)
  }

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
      {(() => {
        console.log('🔥 ProjectDetailView RENDER:', Date.now())
        return null
      })()}
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 mb-2 glass">
              <TabsTrigger value="overview" className="gap-2">
                <Target size={16} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="story" className="gap-2">
                <Book size={16} />
                Story & Lore
              </TabsTrigger>
              <TabsTrigger value="assets" className="gap-2" onClick={() => console.log('🎯 Assets tab clicked!')}>
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

            {(() => {
              console.log('🎯 TAB DEBUG:', {
                activeTab: activeTab,
                tabValue: activeTab,
                isAssetsTab: activeTab === 'assets',
                projectExists: !!project,
                projectId: project?.id,
                hasAssets: !!project?.assets
              })
              return null
            })()}

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
                  <div className="space-y-6 max-w-6xl">
                    {project.story ? (
                      <StoryDisplay story={project.story} />
                    ) : (
                      <Card className="glass-card p-8 text-center space-y-4">
                        <Book size={48} className="text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Story Coming Soon</h3>
                          <p className="text-muted-foreground mb-6">
                            AI will generate your story, characters, and world-building
                          </p>
                          <Button variant="outline" className="gap-2">
                            <Sparkle size={16} />
                            Generate Story with AI
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="assets" className="h-full m-0 p-6">
                {(() => {
                  console.log('🎨 ASSETS TABCONTENT RENDERING:', {
                    activeTab: activeTab,
                    isAssetsTab: activeTab === 'assets',
                    project: project,
                    projectAssets: project?.assets,
                    shouldRender: true
                  })
                  return null
                })()}
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-6xl">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">Asset Production</h2>
                      {project.assets && (project.assets.art.length > 0 || project.assets.audio.length > 0 || project.assets.models.length > 0) && (
                        <Button variant="outline" size="sm" className="gap-2">
                          <Sparkle size={14} />
                          Generate More Assets
                        </Button>
                      )}
                    </div>
                    
                    {(() => {
                      console.log('🎨 ProjectDetailView - Project Assets:', project.assets)
                      console.log('🎨 Full Project Object:', project)
                      console.log('🎨 Art Assets:', project.assets?.art)
                      console.log('🎨 Audio Assets:', project.assets?.audio)
                      console.log('🎨 Model Assets:', project.assets?.models)
                      console.log('🎨 Art Assets Length:', project.assets?.art?.length || 0)
                      console.log('🎨 Audio Assets Length:', project.assets?.audio?.length || 0)
                      console.log('🎨 Model Assets Length:', project.assets?.models?.length || 0)
                      console.log('🎨 Active Tab:', activeTab)
                      console.log('🎨 Should Show AssetGallery:', activeTab === 'assets' && !!project.assets)
                      return null
                    })()}
                    
                    {/* TEMPORARY: Always show AssetGallery for debugging */}
                    {project.assets ? (
                      <>
                        <div style={{padding: '10px', background: 'rgba(255,0,0,0.1)', margin: '10px 0'}}>
                          <strong>DEBUG: Rendering AssetGallery with:</strong>
                          <br />Art: {project.assets.art?.length || 0} assets
                          <br />Audio: {project.assets.audio?.length || 0} assets  
                          <br />Models: {project.assets.models?.length || 0} assets
                        </div>
                        <AssetGallery
                          artAssets={project.assets.art || []}
                          audioAssets={project.assets.audio || []}
                          modelAssets={project.assets.models || []}
                          onEdit={handleEditAsset}
                        />
                      </>
                    ) : (
                      <Card className="glass-card p-8 text-center space-y-4">
                        <Palette size={48} className="text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Assets Coming Soon</h3>
                          <p className="text-muted-foreground mb-6">
                            AI will generate concept art, music, sound effects, and 3D models for your game
                          </p>
                          <Button variant="outline" className="gap-2">
                            <Sparkle size={16} />
                            Generate Assets with AI
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="gameplay" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-6xl">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">Gameplay Systems</h2>
                      {project.gameplay && project.gameplay.mechanics.length > 0 && (
                        <Button variant="outline" size="sm" className="gap-2">
                          <ChartLine size={14} />
                          Analyze Balance
                        </Button>
                      )}
                    </div>
                    
                    {project.gameplay && (project.gameplay.mechanics.length > 0 || project.gameplay.levels.length > 0) ? (
                      <GameplayDisplay gameplay={project.gameplay} />
                    ) : (
                      <Card className="glass-card p-8 text-center space-y-4">
                        <GameController size={48} className="text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Gameplay Coming Soon</h3>
                          <p className="text-muted-foreground mb-6">
                            AI will design game mechanics, levels, and balancing systems
                          </p>
                          <Button variant="outline" className="gap-2">
                            <Sparkle size={16} />
                            Generate Gameplay with AI
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="qa" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-4xl">
                    <h2 className="text-xl font-semibold text-foreground">Quality Assurance</h2>
                    
                    <div className="grid gap-6">
                      {/* Immersive QA Workspace Card */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="glass-card p-8 cursor-pointer group relative overflow-hidden"
                        onClick={() => onQAWorkspace(project)}
                      >
                        {/* Background Effects */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-4 right-4 w-32 h-32 bg-accent/30 rounded-full blur-2xl" />
                          <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-500/30 rounded-full blur-2xl" />
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-accent to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TestTube size={28} className="text-black" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
                                  Enter QA Studio
                                </h3>
                                <p className="text-muted-foreground">Immersive full-screen testing environment</p>
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: [0, -5, 5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                              className="text-accent opacity-75"
                            >
                              🚀
                            </motion.div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-accent rounded-full" />
                                <span className="text-sm font-medium text-foreground">AI Test Assistant</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Live AI feedback and suggestions</p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-sm font-medium text-foreground">Live Game Preview</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Real-time gameplay simulation</p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                <span className="text-sm font-medium text-foreground">Code Editor</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Instant balance adjustments</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-border/20">
                            <div className="text-sm text-muted-foreground">
                              Transform QA into a creative coding jam session
                            </div>
                            <div className="flex items-center gap-2 text-accent font-medium">
                              <span>Launch Studio</span>
                              <motion.div
                                animate={{ x: [0, 4, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                →
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Traditional QA Features */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="glass-card p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <ChartLine size={20} className="text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">Test Analytics</h4>
                                <p className="text-sm text-muted-foreground">Performance metrics and insights</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Test Coverage</span>
                                <span className="text-foreground">0%</span>
                              </div>
                              <Progress value={0} className="h-2" />
                            </div>
                          </div>
                        </Card>

                        <Card className="glass-card p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <TestTube size={20} className="text-green-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">Automated Tests</h4>
                                <p className="text-sm text-muted-foreground">AI-generated test scenarios</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tests Passed</span>
                                <span className="text-foreground">0/0</span>
                              </div>
                              <Progress value={0} className="h-2" />
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="publishing" className="h-full m-0 p-6">
                <ScrollArea className="h-full custom-scrollbar">
                  <div className="space-y-6 max-w-4xl">
                    <h2 className="text-xl font-semibold text-foreground">Publishing & Launch</h2>
                    
                    {project.publishing ? (
                      <>
                        {/* Marketing Overview */}
                        <Card className="glass-card p-6">
                          <h3 className="font-semibold text-foreground mb-4">Marketing</h3>
                          <div className="space-y-3">
                            <div>
                              <span className="text-muted-foreground">Tagline:</span>
                              <p className="text-foreground font-medium">{project.publishing.marketing.tagline}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Target Demographics:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {project.publishing.marketing.target_demographics?.map((demo, index) => (
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
                            {project.publishing.platforms?.map((platform, index) => (
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
                      </>
                    ) : (
                      <div className="text-center py-16 space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                          <Rocket size={40} className="text-accent" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Launch Strategy</h3>
                          <p className="text-muted-foreground mb-6">Platform distribution, marketing campaigns, and post-launch support</p>
                          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                            <Sparkle size={16} />
                            Plan Launch
                          </Button>
                        </div>
                      </div>
                    )}
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

      {/* Asset Editing Studio - Full Screen Overlay */}
      {editingAsset && (
        <AssetEditingStudio
          asset={editingAsset}
          onClose={handleCloseAssetEditor}
        />
      )}
    </div>
  )
}