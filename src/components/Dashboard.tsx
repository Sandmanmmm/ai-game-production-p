import { useState } from 'react'
import { motion } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { ProjectCard, EmptyProjectCard } from '@/components/ProjectCard'
import { PipelineVisualization } from '@/components/PipelineVisualization'
import { ProjectCreationDialog } from '@/components/ProjectCreationDialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  MagnifyingGlass, 
  SortAscending,
  GridFour,
  List,
  Sparkle,
  TrendUp,
  Clock,
  Target,
  GameController
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useKV } from '@github/spark/hooks'

interface DashboardProps {
  onProjectSelect: (project: GameProject) => void
  onQAWorkspace?: (project: GameProject) => void
}

export function Dashboard({ onProjectSelect, onQAWorkspace }: DashboardProps) {
  console.log('🎯 DASHBOARD: Component mounted, onProjectSelect type:', typeof onProjectSelect)
  const [projects, setProjects] = useKV<GameProject[]>('game_projects', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'progress'>('updated')

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'progress':
        return b.progress - a.progress
      default:
        return 0
    }
  })

  const handleProjectCreated = (newProject: GameProject) => {
    console.log('💾 Saving new project:', newProject.title)
    setProjects(currentProjects => {
      const updated = [...currentProjects, newProject]
      console.log('💾 Projects updated, total count:', updated.length)
      return updated
    })
  }

  // Dashboard stats
  const totalProjects = projects.length
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0
  const activeProjects = projects.filter(p => p.status === 'development' || p.status === 'concept').length
  const completedProjects = projects.filter(p => p.status === 'complete').length

  return (
    <div className="flex-1 p-6 space-y-8 overflow-auto custom-scrollbar">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Welcome to Your Game Studio
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transform your creative ideas into amazing games with AI-powered development tools
        </p>
        
        {/* Quick Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="pt-4"
        >
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-3 text-lg gap-3 animate-pulse-glow"
          >
            <Sparkle size={24} />
            Create New Game Project
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Projects', value: totalProjects, icon: GameController, color: 'text-accent' },
          { label: 'Active Projects', value: activeProjects, icon: Clock, color: 'text-blue-400' },
          { label: 'Avg Progress', value: `${avgProgress}%`, icon: TrendUp, color: 'text-emerald-400' },
          { label: 'Completed', value: completedProjects, icon: Target, color: 'text-purple-400' }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="glass-card p-6 text-center">
              <div className={cn('w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center', 
                stat.color.replace('text-', 'bg-') + '/20'
              )}>
                <Icon size={24} className={stat.color} />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          )
        })}
      </motion.div>

      {/* Main Content */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto glass">
          <TabsTrigger value="projects" className="gap-2">
            <GridFour size={16} />
            Projects
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <Target size={16} />
            Pipeline Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Projects Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Your Game Projects</h2>
              <p className="text-muted-foreground">
                {totalProjects > 0 ? `${totalProjects} projects in development` : 'Ready to create your first game?'}
              </p>
            </div>
            
            {totalProjects > 0 && (
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64 bg-muted/30"
                  />
                </div>
                
                {/* View Mode */}
                <div className="flex items-center border border-border/50 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <GridFour size={16} />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List size={16} />
                  </Button>
                </div>
                
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="created">Recently Created</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {totalProjects === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EmptyProjectCard onCreateProject={() => setIsCreateDialogOpen(true)} />
            </div>
          ) : (
            <motion.div 
              layout
              className={cn(
                'gap-6',
                viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'
              )}
            >
              {sortedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <ProjectCard
                    project={project}
                    onClick={(project) => {
                      console.log('🎯 DASHBOARD: Project card clicked:', project.title)
                      onProjectSelect(project)
                    }}
                    className={viewMode === 'list' ? 'w-full' : ''}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* No Results */}
          {totalProjects > 0 && sortedProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/20 flex items-center justify-center">
                <MagnifyingGlass size={32} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">No projects found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms</p>
              </div>
            </motion.div>
          )}

          {/* Create Project Button (when projects exist) */}
          {totalProjects > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center pt-8"
            >
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                variant="outline"
                className="gap-2 border-accent/50 hover:border-accent text-accent hover:bg-accent/10"
              >
                <Plus size={16} />
                Create Another Project
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          {totalProjects > 0 ? (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Pipeline Overview</h2>
              <PipelineVisualization 
                stages={projects[0]?.pipeline || []}
                onStageClick={(stage) => console.log('Stage clicked:', stage)}
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 space-y-4"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                <Target size={40} className="text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Pipeline to Show</h3>
                <p className="text-muted-foreground mb-6">Create your first project to see the development pipeline in action</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                >
                  <Plus size={16} />
                  Create Your First Project
                </Button>
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Project Creation Dialog */}
      <ProjectCreationDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onProjectCreated={handleProjectCreated}
        onQAWorkspace={onQAWorkspace}
      />
    </div>
  )
}