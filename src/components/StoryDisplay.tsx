import { motion } from 'framer-motion'
import { StoryContent, Character } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Book } from '@phosphor-icons/react/dist/csr/Book'
import { User } from '@phosphor-icons/react/dist/csr/User'
import { Crown } from '@phosphor-icons/react/dist/csr/Crown'
import { Sword } from '@phosphor-icons/react/dist/csr/Sword'
import { Users } from '@phosphor-icons/react/dist/csr/Users'
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { Target } from '@phosphor-icons/react/dist/csr/Target'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { cn } from '@/lib/utils'

interface StoryDisplayProps {
  story: StoryContent
  className?: string
}

export function StoryDisplay({ story, className }: StoryDisplayProps) {
  const getRoleIcon = (role: Character['role']) => {
    switch (role) {
      case 'protagonist': return <Crown size={16} className="text-amber-400" />
      case 'antagonist': return <Sword size={16} className="text-red-400" />
      case 'supporting': return <Heart size={16} className="text-blue-400" />
      default: return <User size={16} className="text-gray-400" />
    }
  }

  const getRoleColor = (role: Character['role']) => {
    switch (role) {
      case 'protagonist': return 'border-amber-500/30 bg-amber-500/10'
      case 'antagonist': return 'border-red-500/30 bg-red-500/10'
      case 'supporting': return 'border-blue-500/30 bg-blue-500/10'
      default: return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  const getAttributeColor = (value: number) => {
    if (value >= 8) return 'text-emerald-400'
    if (value >= 6) return 'text-blue-400'
    if (value >= 4) return 'text-amber-400'
    return 'text-gray-400'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Story Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full gradient-cosmic flex items-center justify-center">
              <Book size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Story Overview</h2>
              <p className="text-muted-foreground text-sm">AI-Generated Narrative Structure</p>
            </div>
          </div>

          {/* Genre and Setting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-accent" />
                <span className="font-medium text-foreground">Genre</span>
              </div>
              <Badge variant="secondary" className="text-base px-4 py-2">
                {story.genre}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-accent" />
                <span className="font-medium text-foreground">Target Audience</span>
              </div>
              <p className="text-muted-foreground">{story.targetAudience}</p>
            </div>
          </div>

          {/* Setting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-accent" />
              <span className="font-medium text-foreground">Setting</span>
            </div>
            <Card className="p-4 bg-muted/20 border-border/50">
              <p className="text-foreground leading-relaxed">{story.setting}</p>
            </Card>
          </div>

          {/* Plot Outline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkle size={16} className="text-accent" />
              <span className="font-medium text-foreground">Plot Outline</span>
            </div>
            <Card className="p-4 bg-muted/20 border-border/50">
              <p className="text-foreground leading-relaxed">{story.plotOutline}</p>
            </Card>
          </div>

          {/* Themes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Book size={16} className="text-accent" />
              <span className="font-medium text-foreground">Core Themes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {story.themes.map((theme, index) => (
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Badge variant="outline" className="px-3 py-1">
                    {theme}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Character Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
              <Users size={20} className="text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Characters</h3>
              <p className="text-muted-foreground text-sm">
                {story.characters.length} Characters Generated
              </p>
            </div>
          </div>

          {story.characters.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Users size={48} className="text-muted-foreground mx-auto" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">No Characters Yet</h4>
                <p className="text-muted-foreground text-sm">
                  Characters will appear here as they're generated by AI
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {story.characters.map((character, index) => (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Card className={cn(
                    "p-4 glass-card transition-all duration-300 hover:glow-gold",
                    getRoleColor(character.role)
                  )}>
                    <div className="space-y-4">
                      {/* Character Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground">{character.name}</h4>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(character.role)}
                            <Badge variant="outline" className="text-xs capitalize">
                              {character.role}
                            </Badge>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                          <User size={20} className="text-foreground" />
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {character.description}
                      </p>

                      {/* Backstory */}
                      {character.backstory && (
                        <div className="p-3 bg-muted/10 rounded-lg border border-border/30">
                          <p className="text-xs text-muted-foreground italic">
                            "{character.backstory}"
                          </p>
                        </div>
                      )}

                      {/* Attributes */}
                      {character.attributes && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Attributes
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(character.attributes).map(([attr, value]) => (
                              <div key={attr} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="capitalize text-muted-foreground">{attr}</span>
                                  <span className={cn("font-bold", getAttributeColor(value as number))}>
                                    {value}/10
                                  </span>
                                </div>
                                <Progress 
                                  value={(value as number) * 10} 
                                  className="h-1"
                                />
                              </div>
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
    </div>
  )
}