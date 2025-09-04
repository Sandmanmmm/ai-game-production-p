import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// Import icons directly to bypass proxy issues
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { Image } from '@phosphor-icons/react/dist/csr/Image'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Download } from '@phosphor-icons/react/dist/csr/Download'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { MusicNote } from '@phosphor-icons/react/dist/csr/MusicNote'
import { Cube } from '@phosphor-icons/react/dist/csr/Cube'
import { MonitorPlay } from '@phosphor-icons/react/dist/csr/MonitorPlay'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { SortAscending } from '@phosphor-icons/react/dist/csr/SortAscending'
import { GridFour } from '@phosphor-icons/react/dist/csr/GridFour'
import { List } from '@phosphor-icons/react/dist/csr/List'
import { Upload } from '@phosphor-icons/react/dist/csr/Upload'
import { Shuffle } from '@phosphor-icons/react/dist/csr/Shuffle'
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { Link } from '@phosphor-icons/react/dist/csr/Link'
import { Tag } from '@phosphor-icons/react/dist/csr/Tag'
import { Sliders } from '@phosphor-icons/react/dist/csr/Sliders'
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { ArtAsset, AudioAsset, ModelAsset, UIAsset, AssetGenerationParams, GameProject } from '@/lib/types'
import { generateAssets } from '@/lib/aiMockGenerator'
import { AIAssetGenerator } from './AIAssetGenerator'
import { StylePackManager } from './StylePackManager'
import { BatchRequestCreator } from './BatchRequestCreator'
import { GeneratedAsset } from '../lib/assetStorage'

interface AssetStudioWorkspaceProps {
  projectId?: string
  project?: GameProject
  onEditAsset?: (asset: any) => void
  className?: string
}

export function AssetStudioWorkspace({ projectId, project, onEditAsset, className }: AssetStudioWorkspaceProps) {
  const [activeCategory, setActiveCategory] = useState<'art' | 'audio' | 'models' | 'ui'>('art')
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [activeWorkspace, setActiveWorkspace] = useState<'assets' | 'style-packs' | 'batch-requests' | 'ai-generator'>('assets')
  const [generationParams, setGenerationParams] = useState<AssetGenerationParams>({
    prompt: '',
    type: 'art',
    category: 'character',
    style: 'realistic',
    resolution: '1024x1024',
    format: 'png'
  })

  // Get assets from the project if available, otherwise use empty arrays
  const [assets, setAssets] = useState({
    art: project?.assets?.art || [],
    audio: project?.assets?.audio || [],
    models: project?.assets?.models || [],
    ui: project?.assets?.ui || []
  })

  // Update assets when project changes
  useEffect(() => {
    if (project?.assets) {
      console.log('🎨 AssetStudioWorkspace: Loading project assets:', {
        projectTitle: project.title,
        artCount: project.assets.art?.length || 0,
        audioCount: project.assets.audio?.length || 0,
        modelsCount: project.assets.models?.length || 0,
        uiCount: project.assets.ui?.length || 0
      })
      
      setAssets({
        art: project.assets.art || [],
        audio: project.assets.audio || [],
        models: project.assets.models || [],
        ui: project.assets.ui || []
      })
    }
  }, [project])

  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(true)

  // Mock style packs for testing
  const [stylePacks, setStylePacks] = useState([
    {
      id: 'sp-1',
      name: 'Pixel Art Heroes',
      description: '16-bit style character sprites',
      category: 'character' as const,
      status: 'ready' as const,
      progress: 100,
      referenceImages: ['/mock/pixel-hero-1.png'],
      trainingParameters: {
        learningRate: 0.0001,
        batchSize: 16,
        epochs: 100,
        resolution: 512,
        useAugmentation: true,
        preserveStyle: 80,
        creativeFreedom: 20
      },
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-02')
    }
  ])

  // Helper function to get thumbnail for different asset types
  const getAssetThumbnail = (asset: any) => {
    if ('thumbnail' in asset) {
      return asset.thumbnail
    }
    // Fallback for different asset types
    return '/api/placeholder/64/64'
  }

  const categories = {
    art: {
      icon: Palette,
      name: 'Art & Visuals',
      subcategories: ['all', 'character', 'environment', 'prop', 'concept', 'ui']
    },
    audio: {
      icon: MusicNote,
      name: 'Audio & Music', 
      subcategories: ['all', 'music', 'sound-fx', 'voice-lines', 'ambient']
    },
    models: {
      icon: Cube,
      name: '3D Models',
      subcategories: ['all', 'character', 'prop', 'environment', 'effect']
    },
    ui: {
      icon: MonitorPlay,
      name: 'UI & Effects',
      subcategories: ['all', 'interface', 'hud', 'menu', 'icon']
    }
  }

  const stylePresets = {
    art: ['Realistic', 'Anime', 'Pixel Art', 'Cyberpunk', 'Fantasy', 'Minimalist', 'Concept Art'],
    audio: ['Cinematic', '8-Bit', 'Orchestral', 'Electronic', 'Ambient', 'Rock', 'Jazz'],
    models: ['Low Poly', 'High Poly', 'Stylized', 'Realistic', 'Cartoon', 'Sci-Fi'],
    ui: ['Modern', 'Retro', 'Minimal', 'Gaming', 'Corporate', 'Artistic']
  }

  const resolutionOptions = {
    art: ['512x512', '1024x1024', '1024x768', '1920x1080'],
    models: ['Low', 'Medium', 'High', 'Ultra'],
    ui: ['256x256', '512x512', '1024x1024', '2048x2048']
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const params = {
        ...generationParams,
        prompt: generationPrompt
      }
      
      const newAssets = await generateAssets(params)
      
      // Add generated assets to the appropriate category
      setAssets(prev => ({
        ...prev,
        [params.type]: [...prev[params.type], ...newAssets]
      }))
      
      setGenerationPrompt('')
    } catch (error) {
      console.error('Asset generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset)
  }

  const handlePlayAudio = (assetId: string, src: string) => {
    if (playingAudio === assetId) {
      audioRef.current?.pause()
      setPlayingAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = src
        audioRef.current.play()
        setPlayingAudio(assetId)
      }
    }
  }

  // Handle AI asset generation
  const handleAssetGenerated = (generatedAsset: GeneratedAsset) => {
    // Convert GeneratedAsset to the format expected by AssetStudioWorkspace
    const newAsset = {
      id: generatedAsset.id,
      name: generatedAsset.filename.replace(/\.[^/.]+$/, ''), // Remove extension
      src: generatedAsset.url,
      thumbnail: generatedAsset.url,
      category: generatedAsset.metadata.category,
      type: generatedAsset.type,
      tags: generatedAsset.metadata.tags || [],
      prompt: generatedAsset.metadata.prompt,
      metadata: {
        ...generatedAsset.metadata,
        aiGenerated: true,
        createdAt: generatedAsset.createdAt
      }
    }

    // Add to the appropriate category
    const category = generatedAsset.type.includes('art') || 
                    generatedAsset.type.includes('character') || 
                    generatedAsset.type.includes('environment') ||
                    generatedAsset.type.includes('prop') ||
                    generatedAsset.type.includes('texture') ||
                    generatedAsset.type.includes('sprite') ||
                    generatedAsset.type.includes('background') ? 'art' : 
                    generatedAsset.type.includes('ui') || 
                    generatedAsset.type.includes('icon') ? 'ui' : 'art' // default to art
    
    setAssets(prev => ({
      ...prev,
      [category]: [...prev[category], newAsset]
    }))
  }

  const getFilteredAssets = () => {
    const categoryAssets = assets[activeCategory] || []
    if (activeSubcategory === 'all') return categoryAssets
    return categoryAssets.filter((asset: any) => asset.category === activeSubcategory)
  }

  const renderLeftSidebar = () => (
    <Card className="w-80 h-full flex flex-col asset-studio-sidebar">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5 text-accent" />
          Asset Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6">
          <div className="space-y-2">
            {Object.entries(categories).map(([key, category]) => (
              <div key={key} className="space-y-1">
                <Button
                  variant={activeCategory === key ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full justify-start gap-3",
                    activeCategory === key && "bg-accent/10 text-accent border-accent/30"
                  )}
                  onClick={() => {
                    setActiveCategory(key as any)
                    setActiveSubcategory('all')
                  }}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {assets[key as keyof typeof assets]?.length || 0}
                  </Badge>
                </Button>
                
                {activeCategory === key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-6 space-y-1"
                  >
                    {category.subcategories.map((subcat) => (
                      <Button
                        key={subcat}
                        variant={activeSubcategory === subcat ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => setActiveSubcategory(subcat)}
                      >
                        {subcat.charAt(0).toUpperCase() + subcat.slice(1)}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const renderAssetCard = (asset: any) => {
    const isAudio = activeCategory === 'audio'
    const isPlaying = playingAudio === asset.id
    
    return (
      <motion.div
        key={asset.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="asset-card"
      >
        <Card className="group cursor-pointer overflow-hidden border-2 border-transparent hover:border-accent/30 transition-all duration-300">
          <div className="relative">
            {/* Asset Preview */}
            <div className="aspect-square bg-gradient-to-br from-accent/5 to-accent/20 flex items-center justify-center">
              {isAudio ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <MusicNote className="w-12 h-12 text-accent/60" />
                  {/* Mock waveform visualization */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-end gap-0.5 h-8">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-accent/40 rounded-sm"
                          style={{ height: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={asset.thumbnail || asset.src || '/api/placeholder/256/256'}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="flex gap-2">
                  {isAudio ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayAudio(asset.id, asset.src)
                      }}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAssetClick(asset)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={(e) => {
                    e.stopPropagation()
                    if (onEditAsset) {
                      onEditAsset(asset)
                    }
                  }}>
                    <PencilSimple className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary">
                    <ArrowsClockwise className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quality indicator */}
              <div className="absolute top-2 right-2">
                <Badge
                  variant={asset.metadata?.quality === 'excellent' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {asset.metadata?.quality}
                </Badge>
              </div>
            </div>

            {/* Asset Info */}
            <CardContent className="p-3">
              <h4 className="font-semibold text-sm mb-1 line-clamp-1">{asset.name}</h4>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {asset.prompt || 'No prompt available'}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {asset.tags?.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="w-3 h-3" />
                  <span>{asset.metadata?.usageCount || 0}</span>
                </div>
              </div>

              {/* Linked elements */}
              {asset.linkedTo && asset.linkedTo.length > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <Link className="w-3 h-3 text-accent" />
                  <span className="text-xs text-accent">
                    Linked to {asset.linkedTo.length} element{asset.linkedTo.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>
    )
  }

  const renderCenterPanel = () => (
    <Card className="flex-1 h-full flex flex-col mx-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {React.createElement(categories[activeCategory].icon, { className: "w-6 h-6 text-accent" })}
            {categories[activeCategory].name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <GridFour className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline">
              <SortAscending className="w-4 h-4 mr-2" />
              Sort
            </Button>
            <Button size="sm" variant="outline">
              <MagnifyingGlass className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {/* AI Asset Generator */}
        <AnimatePresence>
          {showAIGenerator && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <AIAssetGenerator
                onAssetGenerated={handleAssetGenerated}
                onClose={() => setShowAIGenerator(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle AI Generator Button (when collapsed) */}
        {!showAIGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mb-6"
          >
            <Button
              onClick={() => setShowAIGenerator(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Sparkle className="w-4 h-4 mr-2" />
              Show AI Asset Generator
            </Button>
          </motion.div>
        )}

        <ScrollArea className="flex-1">
          <AnimatePresence>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getFilteredAssets().map(renderAssetCard)}
              </div>
            ) : (
              <div className="space-y-2">
                {getFilteredAssets().map((asset) => (
                  <Card key={asset.id} className="p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded overflow-hidden bg-accent/10 flex items-center justify-center">
                        {activeCategory === 'audio' ? (
                          <MusicNote className="w-6 h-6 text-accent" />
                        ) : (
                          <img
                            src={getAssetThumbnail(asset)}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{asset.name}</h4>
                        <p className="text-sm text-muted-foreground">{asset.prompt}</p>
                        <div className="flex gap-2 mt-2">
                          {asset.tags?.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation()
                          if (onEditAsset) {
                            onEditAsset(asset)
                          }
                        }}>
                          <PencilSimple className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </AnimatePresence>
          
          {/* Empty state */}
          {getFilteredAssets().length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              {React.createElement(categories[activeCategory].icon, { className: "w-16 h-16 text-muted-foreground mb-4" })}
              <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first {activeCategory} asset using AI
              </p>
              <Button onClick={() => setGenerationPrompt('A beautiful game asset')}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Asset
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const renderRightSidebar = () => (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkle className="w-5 h-5 text-accent" />
          AI Generation Studio
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Generation Prompt */}
        <div className="space-y-2">
          <Label>Describe your asset</Label>
          <Textarea
            placeholder={`e.g., ${activeCategory === 'art' ? 'A mystical forest with glowing crystals' : activeCategory === 'audio' ? 'Epic battle music with orchestral strings' : 'Low-poly medieval sword'}`}
            value={generationPrompt}
            onChange={(e) => setGenerationPrompt(e.target.value)}
            className="min-h-20"
          />
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={generationParams.category}
            onValueChange={(value) => setGenerationParams(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories[activeCategory].subcategories.filter(sub => sub !== 'all').map((subcat) => (
                <SelectItem key={subcat} value={subcat}>
                  {subcat.charAt(0).toUpperCase() + subcat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style Presets */}
        <div className="space-y-2">
          <Label>Style</Label>
          <div className="flex flex-wrap gap-1">
            {stylePresets[activeCategory]?.map((style) => (
              <Button
                key={style}
                size="sm"
                variant={generationParams.style === style.toLowerCase() ? 'default' : 'outline'}
                className="text-xs"
                onClick={() => setGenerationParams(prev => ({ ...prev, style: style.toLowerCase() }))}
              >
                {style}
              </Button>
            ))}
          </div>
        </div>

        {/* Resolution/Quality */}
        {(activeCategory === 'art' || activeCategory === 'ui') && (
          <div className="space-y-2">
            <Label>Resolution</Label>
            <Select
              value={generationParams.resolution}
              onValueChange={(value) => setGenerationParams(prev => ({ ...prev, resolution: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resolutionOptions[activeCategory]?.map((res) => (
                  <SelectItem key={res} value={res}>
                    {res}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator />

        {/* Generation Actions */}
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={!generationPrompt.trim() || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Shuffle className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkle className="w-4 h-4 mr-2" />
                Generate Asset
              </>
            )}
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" disabled={!selectedAsset}>
              <ArrowsClockwise className="w-4 h-4 mr-1" />
              Regenerate
            </Button>
            <Button size="sm" variant="outline" disabled={!selectedAsset}>
              <Sliders className="w-4 h-4 mr-1" />
              Variations
            </Button>
          </div>
        </div>

        <Separator />

        {/* Generation History */}
        <div className="flex-1">
          <Label className="text-sm font-medium">Recent Generations</Label>
          <ScrollArea className="h-32 mt-2">
            <div className="space-y-2">
              {assets[activeCategory]?.slice(0, 3).map((asset) => (
                <Card key={asset.id} className="p-2 cursor-pointer hover:bg-accent/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                      {React.createElement(categories[activeCategory].icon, { className: "w-4 h-4" })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {asset.prompt}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex flex-col h-full bg-background asset-studio-workspace", className)}
    >
      {/* Workspace Navigation Tabs */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant={activeWorkspace === 'assets' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveWorkspace('assets')}
          >
            <Image className="w-4 h-4 mr-2" />
            Asset Library
          </Button>
          <Button
            variant={activeWorkspace === 'style-packs' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveWorkspace('style-packs')}
          >
            <Palette className="w-4 h-4 mr-2" />
            Style Packs
          </Button>
          <Button
            variant={activeWorkspace === 'batch-requests' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveWorkspace('batch-requests')}
          >
            <Lightning className="w-4 h-4 mr-2" />
            Batch Requests
          </Button>
          <Button
            variant={activeWorkspace === 'ai-generator' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveWorkspace('ai-generator')}
          >
            <Sparkle className="w-4 h-4 mr-2" />
            AI Generator
          </Button>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 overflow-hidden">
        {activeWorkspace === 'assets' && (
          <div className="flex h-full gap-0">
            {renderLeftSidebar()}
            {renderCenterPanel()}
            {renderRightSidebar()}
          </div>
        )}
        
        {activeWorkspace === 'style-packs' && (
          <StylePackManager 
            onStylePackCreated={(pack) => {
              console.log('Style pack created:', pack)
              // Handle style pack creation
            }}
            onTrainingComplete={(pack) => {
              console.log('Training complete:', pack)
              // Handle training completion
            }}
            className="h-full p-4"
          />
        )}
        
        {activeWorkspace === 'batch-requests' && (
          <BatchRequestCreator
            onCreateBatch={(batch) => {
              console.log('Batch created:', batch)
              // Handle batch creation
            }}
            availableStylePacks={stylePacks}
            className="h-full p-4"
          />
        )}
        
        {activeWorkspace === 'ai-generator' && (
          <div className="h-full p-4">
            <AIAssetGenerator 
              onAssetGenerated={handleAssetGenerated}
              className="h-full"
            />
          </div>
        )}
      </div>
      
      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        onError={() => setPlayingAudio(null)}
      />
      
      {/* Asset Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                  <Button variant="ghost" onClick={() => setSelectedAsset(null)}>
                    ×
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <img
                      src={selectedAsset.src || selectedAsset.thumbnail || '/api/placeholder/512/512'}
                      alt={selectedAsset.name}
                      className="w-full rounded-lg"
                    />
                    
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <PencilSimple className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <ArrowsClockwise className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="font-semibold">Original Prompt</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedAsset.prompt || 'No prompt available'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="font-semibold">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedAsset.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="font-semibold">Metadata</Label>
                      <div className="space-y-1 mt-1 text-sm">
                        <p>Quality: {selectedAsset.metadata?.quality}</p>
                        <p>Usage: {selectedAsset.metadata?.usageCount} times</p>
                        <p>AI Generated: {selectedAsset.metadata?.aiGenerated ? 'Yes' : 'No'}</p>
                        {selectedAsset.linkedTo && (
                          <p>Linked to: {selectedAsset.linkedTo.length} story element{selectedAsset.linkedTo.length > 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
