import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, Gamepad2, Brain, Image, Zap, Upload, 
  Users, Crown, Heart, Star, Clock, TrendingUp 
} from 'lucide-react'

export function ProjectCreationMockup() {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Enhanced Project Creation Experience</h1>
        <p className="text-xl text-muted-foreground">
          Comprehensive analysis and mockup of the improved GameForge creation flow
        </p>
      </div>

      {/* Method Selection Mockup */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            Phase 1: Method Selection
          </CardTitle>
          <CardDescription>
            Multiple pathways to game creation, inspired by Rosebud AI's approach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Gamepad2 className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Start from Template</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  10+ curated game templates
                </p>
                <Badge className="bg-purple-500/20 text-purple-300">Most Popular</Badge>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-cyan-500/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Describe Your Idea</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  AI-powered concept generation
                </p>
                <Badge className="bg-green-500/20 text-green-300">AI Powered</Badge>
              </CardContent>
            </Card>

            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                  <Image className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="font-semibold mb-2">Browse Gallery</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  1000+ community projects
                </p>
                <Badge className="bg-orange-500/20 text-orange-300">Community</Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Template Selection Mockup */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-accent" />
            Phase 2: Template Selection & Customization
          </CardTitle>
          <CardDescription>
            Visual template gallery with real-time customization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Categories */}
          <div>
            <h3 className="font-semibold mb-3">Template Categories</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: 'RPG & Fantasy', icon: '⚔️', count: 3 },
                { name: 'Sci-Fi & Space', icon: '🚀', count: 2 },
                { name: 'Puzzle & Strategy', icon: '🧩', count: 4 },
                { name: 'Racing & Sports', icon: '🏎️', count: 2 }
              ].map((cat, i) => (
                <Card key={i} className="cursor-pointer hover:bg-accent/10 transition-colors">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <div className="text-sm font-medium">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">{cat.count} templates</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Featured Template */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-purple-500/30">
              <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-t-lg flex items-center justify-center">
                <div className="text-4xl opacity-70">🏰</div>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Fantasy RPG Adventure</CardTitle>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm">4.8</span>
                  </div>
                </div>
                <CardDescription>
                  Classic RPG with combat, inventory, and epic quests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {['Combat', 'Inventory', 'Quests', 'Magic'].map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>3-4 hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>1.2k uses</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customization Panel */}
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="text-lg">Customize Template</CardTitle>
                <CardDescription>Personalize your game concept</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Game Theme</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Medieval Fantasy', 'Dark Fantasy'].map((theme) => (
                      <Button key={theme} variant="outline" size="sm" className="h-auto py-2">
                        {theme}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Art Style</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Pixel Art', '3D Low-poly'].map((style) => (
                      <Button key={style} variant="outline" size="sm" className="h-auto py-2">
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Optional Features</h4>
                  <div className="space-y-2">
                    {['Multiplayer Co-op', 'Crafting System'].map((feature) => (
                      <label key={feature} className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced AI Pipeline */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" />
            Phase 3: Enhanced AI Generation Pipeline
          </CardTitle>
          <CardDescription>
            Multi-stage concept refinement with real-time previews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pipeline Stages */}
          <div className="space-y-4">
            {[
              { name: 'Concept Analysis', progress: 100, status: 'complete' },
              { name: 'Concept Validation', progress: 100, status: 'complete' },
              { name: 'Content Generation', progress: 75, status: 'active' },
              { name: 'Integration & Testing', progress: 0, status: 'pending' }
            ].map((stage, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      stage.status === 'complete' ? 'bg-green-500/20' :
                      stage.status === 'active' ? 'bg-blue-500/20' :
                      'bg-gray-500/20'
                    }`}>
                      {stage.status === 'complete' ? '✓' : 
                       stage.status === 'active' ? '⚡' : '⋯'}
                    </div>
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{stage.progress}%</span>
                </div>
                <Progress value={stage.progress} className="h-2" />
              </div>
            ))}
          </div>

          {/* Real-time Previews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    ✓
                  </div>
                  Story & Characters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Generated 3 main characters, 5 story chapters, 12 dialogue trees
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    ⚡
                  </div>
                  Assets & Art
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Creating 15 sprites, 8 backgrounds, 6 UI elements...
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center">
                    ⋯
                  </div>
                  Gameplay Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Pending asset completion...
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Community Features */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            Phase 4: Community & Social Features
          </CardTitle>
          <CardDescription>
            Community-driven templates and collaborative creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Featured Community Projects</h3>
              <div className="space-y-3">
                {[
                  { name: 'Cyberpunk Detective', author: '@codemaster', likes: 245 },
                  { name: 'Dragon Tamer RPG', author: '@fantasyfan', likes: 189 },
                  { name: 'Space Colony Sim', author: '@scifi_dev', likes: 156 }
                ].map((project, i) => (
                  <Card key={i} className="border-accent/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">by {project.author}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-400" />
                          <span className="text-sm">{project.likes}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Remix & Collaborate</h3>
              <div className="space-y-3">
                <Card className="border-purple-500/30">
                  <CardContent className="p-4 text-center">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <div className="font-medium mb-1">Template Sharing</div>
                    <div className="text-sm text-muted-foreground">
                      Publish your creations as community templates
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-500/30">
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <div className="font-medium mb-1">Team Projects</div>
                    <div className="text-sm text-muted-foreground">
                      Collaborate with other developers
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Metrics */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent" />
            Expected Impact & Metrics
          </CardTitle>
          <CardDescription>
            Projected improvements from the enhanced creation experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-green-400">+150%</div>
              <div className="text-sm font-medium">User Engagement</div>
              <div className="text-xs text-muted-foreground">Average session time</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-400">85%</div>
              <div className="text-sm font-medium">Completion Rate</div>
              <div className="text-xs text-muted-foreground">Start to finish</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-purple-400">+300%</div>
              <div className="text-sm font-medium">Template Usage</div>
              <div className="text-xs text-muted-foreground">vs pure text input</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Timeline */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle>Implementation Timeline</CardTitle>
          <CardDescription>
            Suggested 10-week development plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { phase: 'Sprint 1-2: Foundation', tasks: 'Multi-path selection, basic templates', weeks: '2 weeks' },
              { phase: 'Sprint 3-4: Templates & Previews', tasks: 'Template gallery, customization UI', weeks: '2 weeks' },
              { phase: 'Sprint 5-6: Advanced Generation', tasks: 'Multi-stage pipeline, real-time previews', weeks: '2 weeks' },
              { phase: 'Sprint 7-8: Social Features', tasks: 'Community gallery, sharing system', weeks: '2 weeks' },
              { phase: 'Sprint 9-10: Polish & Launch', tasks: 'Performance optimization, bug fixes', weeks: '2 weeks' }
            ].map((sprint, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border/30 rounded-lg">
                <div>
                  <div className="font-medium">{sprint.phase}</div>
                  <div className="text-sm text-muted-foreground">{sprint.tasks}</div>
                </div>
                <Badge variant="outline">{sprint.weeks}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
