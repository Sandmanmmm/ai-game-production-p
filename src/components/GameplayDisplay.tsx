import { motion } from 'framer-motion'
import { GameplayContent, GameMechanic, Level } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { GameController } from '@phosphor-icons/react/dist/csr/GameController'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'
import { Target } from '@phosphor-icons/react/dist/csr/Target'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Trophy } from '@phosphor-icons/react/dist/csr/Trophy'
import { TrendUp } from '@phosphor-icons/react/dist/csr/TrendUp'
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { MapTrifold } from '@phosphor-icons/react/dist/csr/MapTrifold'
import { cn } from '@/lib/utils'

interface GameplayDisplayProps {
  gameplay: GameplayContent
  className?: string
}

export function GameplayDisplay({ gameplay, className }: GameplayDisplayProps) {
  const getComplexityColor = (complexity: GameMechanic['complexity']) => {
    switch (complexity) {
      case 'simple': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      case 'complex': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'text-emerald-400'
    if (difficulty <= 6) return 'text-amber-400'
    if (difficulty <= 8) return 'text-orange-400'
    return 'text-red-400'
  }

  const getStatusColor = (status: Level['status']) => {
    switch (status) {
      case 'complete': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      case 'prototype': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'design': return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const averageDifficulty = gameplay.levels.length > 0 
    ? gameplay.levels.reduce((sum, level) => sum + level.difficulty, 0) / gameplay.levels.length
    : 0

  const completedLevels = gameplay.levels.filter(level => level.status === 'complete').length
  const totalPlaytime = gameplay.levels.reduce((sum, level) => sum + level.estimated_playtime, 0)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Gameplay Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full gradient-cosmic flex items-center justify-center">
              <GameController size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Gameplay Systems</h2>
              <p className="text-muted-foreground text-sm">AI-Generated Game Mechanics</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-accent">{gameplay.mechanics.length}</div>
              <div className="text-xs text-muted-foreground">Mechanics</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-400">{gameplay.levels.length}</div>
              <div className="text-xs text-muted-foreground">Levels</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-emerald-400">{completedLevels}</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-purple-400">{totalPlaytime}m</div>
              <div className="text-xs text-muted-foreground">Total Playtime</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Game Mechanics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
              <Gear size={20} className="text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Core Mechanics</h3>
              <p className="text-muted-foreground text-sm">
                {gameplay.mechanics.length} Mechanics Designed
              </p>
            </div>
          </div>

          {gameplay.mechanics.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Gear size={48} className="text-muted-foreground mx-auto" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">No Mechanics Yet</h4>
                <p className="text-muted-foreground text-sm">
                  Game mechanics will appear here as they're generated by AI
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameplay.mechanics.map((mechanic, index) => (
                <motion.div
                  key={mechanic.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Card className="p-4 glass-card hover:glow-blue transition-all duration-300">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground">{mechanic.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs", getComplexityColor(mechanic.complexity))}>
                              {mechanic.complexity}
                            </Badge>
                            {mechanic.implemented && (
                              <div className="flex items-center gap-1">
                                <CheckCircle size={12} className="text-emerald-400" />
                                <span className="text-xs text-emerald-400">Implemented</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <Lightning size={16} className="text-blue-400" />
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {mechanic.description}
                      </p>

                      {mechanic.dependencies && mechanic.dependencies.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Dependencies:</p>
                          <div className="flex flex-wrap gap-1">
                            {mechanic.dependencies.map(dep => (
                              <Badge key={dep} variant="outline" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Level Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-cosmic flex items-center justify-center">
                <MapTrifold size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Level Design</h3>
                <p className="text-muted-foreground text-sm">
                  {gameplay.levels.length} Levels Planned
                </p>
              </div>
            </div>
            
            {gameplay.levels.length > 0 && (
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground">Avg Difficulty</div>
                <div className={cn("text-lg font-bold", getDifficultyColor(averageDifficulty))}>
                  {averageDifficulty.toFixed(1)}/10
                </div>
              </div>
            )}
          </div>

          {gameplay.levels.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <MapTrifold size={48} className="text-muted-foreground mx-auto" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">No Levels Yet</h4>
                <p className="text-muted-foreground text-sm">
                  Level designs will appear here as they're generated by AI
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {gameplay.levels.map((level, index) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card className="p-4 glass-card hover:glow-purple transition-all duration-300">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-foreground">{level.name}</h4>
                            <Badge className={cn("text-xs", getStatusColor(level.status))}>
                              {level.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Target size={14} className={getDifficultyColor(level.difficulty)} />
                              <span className="text-muted-foreground">Difficulty:</span>
                              <span className={cn("font-medium", getDifficultyColor(level.difficulty))}>
                                {level.difficulty}/10
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-blue-400" />
                              <span className="text-muted-foreground">Playtime:</span>
                              <span className="font-medium text-blue-400">{level.estimated_playtime}m</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <GameController size={14} className="text-purple-400" />
                              <span className="text-muted-foreground">Mechanics:</span>
                              <span className="font-medium text-purple-400">{level.mechanics.length}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {level.status === 'complete' && (
                            <Button size="sm" variant="ghost" className="gap-1">
                              <Play size={14} />
                              Test
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Objectives */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Objectives
                        </p>
                        <div className="space-y-1">
                          {level.objectives.map((objective, objIndex) => (
                            <div key={objIndex} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                              <span className="text-muted-foreground">{objective}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mechanics Used */}
                      {level.mechanics.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Mechanics Used
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {level.mechanics.map(mechanic => (
                              <Badge key={mechanic} variant="outline" className="text-xs">
                                {mechanic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Difficulty Curve Visualization */}
      {gameplay.levels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                <TrendUp size={20} className="text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Difficulty Curve</h3>
                <p className="text-muted-foreground text-sm">Level progression analysis</p>
              </div>
            </div>

            <div className="space-y-4">
              {gameplay.balancing.difficulty_curve.map((difficulty, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Level {index + 1}</span>
                    <span className={cn("font-medium", getDifficultyColor(difficulty))}>
                      {difficulty}/10
                    </span>
                  </div>
                  <Progress 
                    value={difficulty * 10} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}