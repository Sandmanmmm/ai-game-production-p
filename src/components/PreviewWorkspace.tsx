import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// Import icons directly to bypass proxy issues
import { MonitorPlay } from '@phosphor-icons/react/dist/csr/MonitorPlay'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'
import { ArrowsOut } from '@phosphor-icons/react/dist/csr/ArrowsOut'
import { ArrowsIn } from '@phosphor-icons/react/dist/csr/ArrowsIn'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise'
import { DeviceMobile } from '@phosphor-icons/react/dist/csr/DeviceMobile'
import { Desktop } from '@phosphor-icons/react/dist/csr/Desktop'
import { DeviceTablet } from '@phosphor-icons/react/dist/csr/DeviceTablet'
import { GameController } from '@phosphor-icons/react/dist/csr/GameController'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Bug } from '@phosphor-icons/react/dist/csr/Bug'
import { SpeakerHigh } from '@phosphor-icons/react/dist/csr/SpeakerHigh'
import { SpeakerX } from '@phosphor-icons/react/dist/csr/SpeakerX'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface PreviewWorkspaceProps {
  projectId?: string
  className?: string
}

type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'console'
type PreviewMode = 'development' | 'staging' | 'production'

export function PreviewWorkspace({ projectId, className }: PreviewWorkspaceProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('development')
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState([75])
  const [fps, setFps] = useState(60)
  const [resolution, setResolution] = useState('1920x1080')

  // Simulate game running
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      // Update FPS simulation
      setFps(prev => 60 + Math.sin(Date.now() / 1000) * 5)
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying])

  const deviceDimensions = {
    desktop: { width: '100%', height: '100%', maxWidth: '1920px', aspectRatio: '16/9' },
    tablet: { width: '768px', height: '1024px', maxWidth: '768px', aspectRatio: '3/4' },
    mobile: { width: '375px', height: '667px', maxWidth: '375px', aspectRatio: '9/16' },
    console: { width: '100%', height: '100%', maxWidth: '1920px', aspectRatio: '16/9' }
  }

  const deviceIcons = {
    desktop: Desktop,
    tablet: DeviceTablet,
    mobile: DeviceMobile,
    console: GameController
  }

  const previewModeColors = {
    development: 'text-blue-400 bg-blue-400/20',
    staging: 'text-yellow-400 bg-yellow-400/20',
    production: 'text-green-400 bg-green-400/20'
  }

  const enterFullscreen = () => {
    setIsFullscreen(true)
    setShowControls(false)
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    }
  }

  const exitFullscreen = () => {
    setIsFullscreen(false)
    setShowControls(true)
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }

  const GamePreview = () => (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
      {/* Simulated Game Content */}
      <div className="relative w-full h-full">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 opacity-80" />
        
        {/* Animated Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%'
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="absolute w-2 h-2 bg-white rounded-full"
            />
          ))}
        </div>

        {/* Game UI Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Health Bar */}
          <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white text-sm mb-2">Health</div>
            <div className="w-48 h-3 bg-red-900/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-red-400"
                initial={{ width: '100%' }}
                animate={{ width: ['100%', '85%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Score */}
          <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white text-2xl font-bold">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                12,450
              </motion.span>
            </div>
            <div className="text-gray-400 text-xs">SCORE</div>
          </div>

          {/* Center Message */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
                EPIC ADVENTURE
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Your AI-Generated Game Preview
              </p>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold"
              >
                Press SPACE to Continue
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Performance Overlay */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
          <div>FPS: {Math.floor(fps)}</div>
          <div>Mode: {previewMode}</div>
          <div>Device: {deviceType}</div>
        </div>
      )}
    </div>
  )

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <GamePreview />
        
        {/* Fullscreen Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:text-accent"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={exitFullscreen}
              className="text-white hover:text-accent"
            >
              <ArrowsIn size={16} />
            </Button>
          </div>
        </motion.div>

        {/* Show/Hide Controls */}
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={() => setShowControls(!showControls)}
        />
      </motion.div>
    )
  }

  return (
    <div className={cn('h-full flex flex-col bg-background', className)}>
      {/* Header */}
      <div className="border-b border-border/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <MonitorPlay size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Game Preview</h1>
              <p className="text-muted-foreground">Full-screen preview of your game in production</p>
            </div>
          </div>
          
          <Badge className={cn('text-xs font-medium', previewModeColors[previewMode])}>
            {previewMode.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Preview Controls Sidebar */}
        <div className="w-80 border-r border-border/30 p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Preview Settings</h3>
            
            {/* Device Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Device Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(deviceIcons).map(([type, Icon]) => (
                  <Button
                    key={type}
                    variant={deviceType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceType(type as DeviceType)}
                    className="flex items-center gap-2"
                  >
                    <Icon size={16} />
                    <span className="capitalize">{type}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preview Mode</label>
              <Select value={previewMode} onValueChange={(value: PreviewMode) => setPreviewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Resolution</label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1920 × 1080 (Full HD)</SelectItem>
                  <SelectItem value="1280x720">1280 × 720 (HD)</SelectItem>
                  <SelectItem value="3840x2160">3840 × 2160 (4K)</SelectItem>
                  <SelectItem value="2560x1440">2560 × 1440 (QHD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Audio Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Audio</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="shrink-0"
                >
                  {isMuted ? <SpeakerX size={16} /> : <SpeakerHigh size={16} />}
                </Button>
                <div className="flex-1">
                  <Slider
                    value={isMuted ? [0] : volume}
                    onValueChange={setVolume}
                    disabled={isMuted}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{isMuted ? 0 : volume[0]}%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Control Actions */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Preview Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <ArrowCounterClockwise size={16} />
                Restart
              </Button>
            </div>
            <Button
              onClick={enterFullscreen}
              className="w-full flex items-center gap-2"
            >
              <ArrowsOut size={16} />
              Enter Fullscreen
            </Button>
          </div>

          <Separator />

          {/* Debug Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Bug size={16} />
              Debug Info
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">FPS:</span>
                <span className="text-foreground font-mono">{Math.floor(fps)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memory:</span>
                <span className="text-foreground font-mono">124 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Load Time:</span>
                <span className="text-foreground font-mono">2.3s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build:</span>
                <span className="text-foreground font-mono">v1.2.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              <div 
                className="h-full rounded-lg overflow-hidden"
                style={{
                  ...deviceDimensions[deviceType],
                  margin: '0 auto'
                }}
              >
                <GamePreview />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
