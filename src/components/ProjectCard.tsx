import { motion } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Calendar, Gamepad2 } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: GameProject
  onClick: (project: GameProject) => void
  className?: string
}

export function ProjectCard({ project, onClick, className }: ProjectCardProps) {
  const statusColors = {
    concept: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    development: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    testing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    complete: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('cursor-pointer group', className)}
      onClick={() => onClick(project)}
    >
      <Card className="glass-card p-6 h-full transition-all duration-300 group-hover:glow-purple border-border/50 group-hover:border-accent/50">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </div>
            <div className="ml-4 shrink-0">
              <Badge 
                variant="secondary" 
                className={cn(
                  'capitalize font-medium',
                  statusColors[project.status]
                )}
              >
                {project.status}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">{project.progress}%</span>
            </div>
            <Progress 
              value={project.progress} 
              className="h-2 bg-muted/50"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Gamepad2 size={14} />
              <span>{project.story?.genre || 'Adventure'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{getTimeAgo(project.updatedAt)}</span>
            </div>
          </div>

          {/* Pipeline Preview */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Current Stage</div>
            <div className="flex gap-1">
              {project.pipeline.slice(0, 6).map((stage, index) => (
                <div
                  key={stage.id}
                  className={cn(
                    'flex-1 h-1.5 rounded-full transition-colors duration-300',
                    stage.status === 'complete' ? 'bg-emerald-500/60' :
                    stage.status === 'in-progress' ? 'bg-accent/60' :
                    'bg-muted/30'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Quick Actions Area */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Click to open project
              </div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              </motion.div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Empty state card for when there are no projects
export function EmptyProjectCard({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="cursor-pointer group"
      onClick={onCreateProject}
    >
      <Card className="glass-card p-8 h-full border-2 border-dashed border-border/50 group-hover:border-accent/50 transition-all duration-300 group-hover:glow-gold">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors duration-300">
            <Gamepad2 size={32} className="text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              Create Your First Game
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Transform your creative vision into an amazing game with AI-powered assistance
            </p>
            <div className="text-accent text-sm font-medium group-hover:glow-gold">
              Click to get started →
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}