import { motion } from 'framer-motion'
import { PipelineStage } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb'
import { Book } from '@phosphor-icons/react/dist/csr/Book'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { GameController } from '@phosphor-icons/react/dist/csr/GameController'
import { TestTube } from '@phosphor-icons/react/dist/csr/TestTube'
import { Rocket } from '@phosphor-icons/react/dist/csr/Rocket'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { XCircle } from '@phosphor-icons/react/dist/csr/XCircle'
import { Warning } from '@phosphor-icons/react/dist/csr/Warning'
import { cn } from '@/lib/utils'

interface PipelineVisualizationProps {
  stages: PipelineStage[]
  onStageClick?: (stage: PipelineStage) => void
  className?: string
}

const stageIcons = {
  concept: Lightbulb,
  story: Book,
  assets: Palette,
  gameplay: GameController,
  qa: TestTube,
  publishing: Rocket
}

const statusConfig = {
  pending: {
    color: 'text-muted-foreground',
    bg: 'bg-muted/20',
    border: 'border-muted/30',
    icon: Clock,
    badge: 'bg-muted/20 text-muted-foreground'
  },
  'in-progress': {
    color: 'text-accent',
    bg: 'bg-accent/20',
    border: 'border-accent/40',
    icon: Clock,
    badge: 'bg-accent/20 text-accent'
  },
  complete: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    icon: CheckCircle,
    badge: 'bg-emerald-500/20 text-emerald-400'
  },
  blocked: {
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    icon: XCircle,
    badge: 'bg-red-500/20 text-red-400'
  }
}

export function PipelineVisualization({ stages, onStageClick, className }: PipelineVisualizationProps) {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Pipeline Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Development Pipeline</h2>
        <p className="text-muted-foreground">Track your game's journey from concept to release</p>
      </div>

      {/* Pipeline Stages */}
      <div className="relative">
        {/* Connection Lines */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent/40 via-accent/20 to-muted/20 transform -translate-x-0.5 z-0" />
        
        <div className="space-y-8">
          {sortedStages.map((stage, index) => {
            const StageIcon = stageIcons[stage.id as keyof typeof stageIcons] || Lightbulb
            const StatusIcon = statusConfig[stage.status].icon
            const config = statusConfig[stage.status]
            
            const isEven = index % 2 === 0
            
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: isEven ? -50 : 50, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ 
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: 'easeOut'
                }}
                className="relative"
              >
                {/* Central Node */}
                <div className="absolute left-1/2 top-6 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={cn(
                      'w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                      config.bg,
                      config.border,
                      'shadow-lg'
                    )}
                  >
                    <StageIcon size={24} className={config.color} />
                  </motion.div>
                </div>

                {/* Stage Card */}
                <div className={cn(
                  'flex items-center',
                  isEven ? 'justify-start' : 'justify-end'
                )}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'w-80 cursor-pointer',
                      isEven ? 'mr-8' : 'ml-8'
                    )}
                    onClick={() => onStageClick?.(stage)}
                  >
                    <Card className={cn(
                      'glass-card p-4 transition-all duration-300 hover:glow-purple',
                      config.border,
                      'border-opacity-30 hover:border-opacity-60'
                    )}>
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">{stage.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn('text-xs font-medium', config.badge)}>
                              {stage.status.replace('-', ' ')}
                            </Badge>
                            <StatusIcon size={16} className={config.color} />
                          </div>
                        </div>

                        {/* Progress */}
                        {stage.status !== 'pending' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-foreground font-medium">{stage.progress}%</span>
                            </div>
                            <Progress 
                              value={stage.progress} 
                              className="h-1.5 bg-muted/30"
                            />
                          </div>
                        )}

                        {/* Time Estimates */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {stage.estimatedHours && (
                            <span>Est: {stage.estimatedHours}h</span>
                          )}
                          {stage.actualHours && (
                            <span>Spent: {stage.actualHours}h</span>
                          )}
                          {stage.dependencies && stage.dependencies.length > 0 && (
                            <span>Depends on: {stage.dependencies.length} stage(s)</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Pipeline Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
      >
        {Object.entries(
          stages.reduce((acc, stage) => {
            acc[stage.status] = (acc[stage.status] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([status, count]) => {
          const config = statusConfig[status as keyof typeof statusConfig]
          const StatusIcon = config.icon
          
          return (
            <Card key={status} className="glass-card p-3">
              <div className="flex items-center gap-2">
                <StatusIcon size={16} className={config.color} />
                <span className="text-sm font-medium text-foreground capitalize">
                  {status.replace('-', ' ')}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {count}
                </Badge>
              </div>
            </Card>
          )
        })}
      </motion.div>
    </div>
  )
}