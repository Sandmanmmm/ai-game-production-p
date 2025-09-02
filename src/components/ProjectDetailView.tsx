import React from 'react'
import { motion } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Calendar } from '@phosphor-icons/react/dist/csr/Calendar'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Users } from '@phosphor-icons/react/dist/csr/Users'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { MusicNote } from '@phosphor-icons/react/dist/csr/MusicNote'
import { Cube } from '@phosphor-icons/react/dist/csr/Cube'
import { Book } from '@phosphor-icons/react/dist/csr/Book'
import { TestTube } from '@phosphor-icons/react/dist/csr/TestTube'

interface ProjectDetailViewProps {
  project: GameProject
  onBack: () => void
  onQAWorkspace: (project: GameProject) => void
}

export function ProjectDetailView({ project, onBack, onQAWorkspace }: ProjectDetailViewProps) {
  const getStatusColor = (status: GameProject['status']) => {
    switch (status) {
      case 'concept': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'development': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'testing': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'complete': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAssetCount = (type: 'art' | 'audio' | 'models' | 'ui') => {
    return project.assets?.[type]?.length || 0
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="h-10 w-10 p-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(project.status)}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
            <Button 
              onClick={() => onQAWorkspace(project)}
              className="bg-accent hover:bg-accent/90"
            >
              <Play size={16} className="mr-2" />
              Launch QA
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Project Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play size={20} className="text-accent" />
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span className="font-medium">Created:</span>
                    <span className="text-muted-foreground">{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-muted-foreground" />
                    <span className="font-medium">Last Updated:</span>
                    <span className="text-muted-foreground">{formatDate(project.updatedAt)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-muted-foreground" />
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline" className="text-xs">
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Story Overview */}
          {project.story && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book size={20} className="text-accent" />
                  Story & Narrative
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                        Genre & Setting
                      </h4>
                      <Badge variant="secondary" className="mb-2">
                        {project.story.metadata?.genre || 'Unknown Genre'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {project.story.worldLore?.geography || 'Rich world setting to be explored'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                        Target Audience
                      </h4>
                      <p className="text-sm">{project.story.metadata?.targetAudience || 'General Audience'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    Story Synopsis
                  </h4>
                  <p className="text-foreground leading-relaxed">
                    {project.story.mainStoryArc?.description || 'An engaging narrative awaits development'}
                  </p>
                </div>

                {project.story.mainStoryArc?.themes && project.story.mainStoryArc.themes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                      Core Themes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.story.mainStoryArc.themes.map((theme, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assets Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={20} className="text-accent" />
                Asset Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/20 border border-border/50">
                  <Palette size={24} className="mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold text-foreground">{getAssetCount('art')}</div>
                  <div className="text-sm text-muted-foreground">Art Assets</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted/20 border border-border/50">
                  <MusicNote size={24} className="mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold text-foreground">{getAssetCount('audio')}</div>
                  <div className="text-sm text-muted-foreground">Audio Assets</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted/20 border border-border/50">
                  <Cube size={24} className="mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold text-foreground">{getAssetCount('models')}</div>
                  <div className="text-sm text-muted-foreground">3D Models</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted/20 border border-border/50">
                  <Users size={24} className="mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold text-foreground">{getAssetCount('ui')}</div>
                  <div className="text-sm text-muted-foreground">UI Elements</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development Pipeline */}
          {project.pipeline && project.pipeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube size={20} className="text-accent" />
                  Development Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.pipeline.slice(0, 5).map((stage) => {
                    const getStageColor = (status: string) => {
                      switch (status) {
                        case 'complete': return 'bg-green-500'
                        case 'in-progress': return 'bg-blue-500'
                        case 'pending': return 'bg-gray-300'
                        case 'blocked': return 'bg-red-500'
                        default: return 'bg-gray-300'
                      }
                    }

                    return (
                      <div key={stage.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                        <div className={`w-3 h-3 rounded-full ${getStageColor(stage.status)}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{stage.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {stage.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <Progress value={stage.progress} className="h-1" />
                        </div>
                        <span className="text-sm text-muted-foreground">{stage.progress}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QA Testing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube size={20} className="text-accent" />
                Quality Assurance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {project.story?.mainStoryArc?.description || 'Enter QA mode to test gameplay mechanics and balance.'}
              </p>
              <Button 
                onClick={() => onQAWorkspace(project)}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <TestTube size={16} className="mr-2" />
                Launch QA Testing Environment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailView
