import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, Zap, Brain, Palette, Gamepad2, Bug, Rocket } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface PipelineStage {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  status: 'pending' | 'active' | 'complete'
  progress: number
}

interface PipelineVisualizerProps {
  stages: PipelineStage[]
  currentStage?: string
  className?: string
}

export function PipelineVisualizer({ stages, currentStage, className }: PipelineVisualizerProps) {
  return (
    <div className={cn("relative p-6", className)}>
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-purple-500/5 to-blue-500/5 rounded-2xl blur-xl" />
      
      <div className="relative">
        {/* Pipeline flow */}
        <div className="flex items-center justify-between mb-8">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              {/* Stage Node */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: stage.status === 'active' ? 1.2 : 1,
                  opacity: 1
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                className="relative"
              >
                <div 
                  className={cn(
                    "relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                    {
                      'bg-muted border-2 border-muted-foreground/20': stage.status === 'pending',
                      'bg-accent border-2 border-accent glow-gold animate-pulse-glow': stage.status === 'active',
                      'bg-green-500 border-2 border-green-400 glow-blue': stage.status === 'complete'
                    }
                  )}
                >
                  <AnimatePresence mode="wait">
                    {stage.status === 'pending' && (
                      <motion.div
                        key="pending"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Circle 
                          size={24} 
                          className="text-muted-foreground" 
                        />
                      </motion.div>
                    )}
                    {stage.status === 'active' && (
                      <motion.div
                        key="active"
                        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <stage.icon 
                          size={24} 
                          className="text-accent-foreground"
                        />
                      </motion.div>
                    )}
                    {stage.status === 'complete' && (
                      <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CheckCircle 
                          size={24} 
                          className="text-white" 
                          weight="fill"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Progress ring for active stage */}
                {stage.status === 'active' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: -90 }}
                    className="absolute inset-0 w-16 h-16"
                  >
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-accent/20"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-accent"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: stage.progress / 100 }}
                        transition={{ duration: 0.5 }}
                        style={{
                          pathLength: stage.progress / 100,
                          strokeDasharray: "1 1"
                        }}
                      />
                    </svg>
                  </motion.div>
                )}

                {/* Pulsing dots animation for active stage */}
                {stage.status === 'active' && (
                  <motion.div
                    className="absolute inset-0 w-16 h-16 rounded-full border-2 border-accent/30"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </motion.div>

              {/* Connection line */}
              {index < stages.length - 1 && (
                <div className="relative mx-4 h-0.5 w-16 flex-1 max-w-20">
                  <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent to-purple-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ 
                      scaleX: stage.status === 'complete' ? 1 : 0
                    }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{ transformOrigin: 'left' }}
                  />
                  
                  {/* Animated particles flowing through completed connections */}
                  {stage.status === 'complete' && (
                    <>
                      {[...Array(3)].map((_, particleIndex) => (
                        <motion.div
                          key={particleIndex}
                          className="absolute top-1/2 w-1 h-1 bg-accent rounded-full -translate-y-1/2"
                          initial={{ x: 0, opacity: 0 }}
                          animate={{ 
                            x: 80, 
                            opacity: [0, 1, 1, 0] 
                          }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            delay: particleIndex * 0.5,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stage labels */}
        <div className="flex items-center justify-between">
          {stages.map((stage) => (
            <div key={`${stage.id}-label`} className="text-center w-16">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  {
                    'text-muted-foreground': stage.status === 'pending',
                    'text-accent': stage.status === 'active',
                    'text-green-400': stage.status === 'complete'
                  }
                )}
              >
                {stage.name}
              </motion.p>
              {stage.status === 'active' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-accent/80 mt-1"
                >
                  {Math.round(stage.progress)}%
                </motion.p>
              )}
            </div>
          ))}
        </div>

        {/* Current stage details */}
        <AnimatePresence mode="wait">
          {currentStage && (
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 p-4 glass-card rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Brain size={16} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Generating {currentStage.toLowerCase()} content...
                  </p>
                </div>
                <div className="ml-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap size={20} className="text-accent" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function createPipelineStages(): PipelineStage[] {
  return [
    {
      id: 'story',
      name: 'Story',
      icon: Brain,
      status: 'pending',
      progress: 0
    },
    {
      id: 'assets',
      name: 'Assets',
      icon: Palette,
      status: 'pending',
      progress: 0
    },
    {
      id: 'gameplay',
      name: 'Gameplay',
      icon: Gamepad2,
      status: 'pending',
      progress: 0
    },
    {
      id: 'qa',
      name: 'QA',
      icon: Bug,
      status: 'pending',
      progress: 0
    },
    {
      id: 'publish',
      name: 'Publish',
      icon: Rocket,
      status: 'pending',
      progress: 0
    }
  ]
}