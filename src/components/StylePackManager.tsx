import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Icons
import { Upload } from '@phosphor-icons/react/dist/csr/Upload'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { Brain } from '@phosphor-icons/react/dist/csr/Brain'
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Trash } from '@phosphor-icons/react/dist/csr/Trash'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { XCircle } from '@phosphor-icons/react/dist/csr/XCircle'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Image } from '@phosphor-icons/react/dist/csr/Image'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'

// Types
export interface StylePack {
  id: string
  name: string
  description: string
  category: 'character' | 'environment' | 'props' | 'effects' | 'ui'
  status: 'uploading' | 'processing' | 'training' | 'ready' | 'failed'
  progress: number
  referenceImages: string[]
  trainingParameters: TrainingParameters
  createdAt: Date
  updatedAt: Date
  modelPath?: string
  sampleOutputs?: string[]
  metrics?: TrainingMetrics
}

export interface TrainingParameters {
  learningRate: number
  batchSize: number
  epochs: number
  resolution: number
  useAugmentation: boolean
  preserveStyle: number
  creativeFreedom: number
}

export interface TrainingMetrics {
  loss: number
  accuracy: number
  fid: number // Fréchet Inception Distance
  estimatedQuality: number
}

interface StylePackManagerProps {
  onStylePackCreated?: (pack: StylePack) => void
  onTrainingComplete?: (pack: StylePack) => void
  className?: string
}

// Mock data for development
const mockStylePacks: StylePack[] = [
  {
    id: 'sp-1',
    name: 'Pixel Art Heroes',
    description: '16-bit style character sprites',
    category: 'character',
    status: 'ready',
    progress: 100,
    referenceImages: ['/mock/pixel-hero-1.png', '/mock/pixel-hero-2.png'],
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
    updatedAt: new Date('2025-09-02'),
    modelPath: '/models/pixel-heroes.ckpt',
    sampleOutputs: ['/samples/pixel-1.png', '/samples/pixel-2.png'],
    metrics: {
      loss: 0.045,
      accuracy: 94.2,
      fid: 12.3,
      estimatedQuality: 8.7
    }
  },
  {
    id: 'sp-2',
    name: 'Cyberpunk Environments',
    description: 'Neon-lit futuristic cityscape assets',
    category: 'environment',
    status: 'training',
    progress: 67,
    referenceImages: ['/mock/cyber-env-1.png', '/mock/cyber-env-2.png'],
    trainingParameters: {
      learningRate: 0.00015,
      batchSize: 12,
      epochs: 150,
      resolution: 1024,
      useAugmentation: true,
      preserveStyle: 90,
      creativeFreedom: 10
    },
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date()
  },
  {
    id: 'sp-3',
    name: 'Fantasy Props',
    description: 'Medieval weapons and magical items',
    category: 'props',
    status: 'processing',
    progress: 25,
    referenceImages: ['/mock/fantasy-prop-1.png'],
    trainingParameters: {
      learningRate: 0.0002,
      batchSize: 8,
      epochs: 80,
      resolution: 512,
      useAugmentation: false,
      preserveStyle: 70,
      creativeFreedom: 30
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const StylePackManager: React.FC<StylePackManagerProps> = ({
  onStylePackCreated,
  onTrainingComplete,
  className
}) => {
  const [stylePacks, setStylePacks] = useState<StylePack[]>(mockStylePacks)
  const [selectedPack, setSelectedPack] = useState<StylePack | null>(null)
  const [activeTab, setActiveTab] = useState('library')
  const [isCreatingPack, setIsCreatingPack] = useState(false)

  // New Style Pack form state
  const [newPackName, setNewPackName] = useState('')
  const [newPackDescription, setNewPackDescription] = useState('')
  const [newPackCategory, setNewPackCategory] = useState<StylePack['category']>('character')
  const [trainingParams, setTrainingParams] = useState<TrainingParameters>({
    learningRate: 0.0001,
    batchSize: 16,
    epochs: 100,
    resolution: 512,
    useAugmentation: true,
    preserveStyle: 80,
    creativeFreedom: 20
  })

  const getStatusIcon = (status: StylePack['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'training':
        return <Brain className="w-4 h-4 text-blue-500" />
      case 'processing':
        return <Gear className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'uploading':
        return <Upload className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: StylePack['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'training':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'uploading':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const handleCreateStylePack = async () => {
    if (!newPackName.trim()) {
      toast.error('Please enter a name for your style pack')
      return
    }

    const newPack: StylePack = {
      id: `sp-${Date.now()}`,
      name: newPackName,
      description: newPackDescription,
      category: newPackCategory,
      status: 'uploading',
      progress: 0,
      referenceImages: [],
      trainingParameters: trainingParams,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setStylePacks(prev => [newPack, ...prev])
    setIsCreatingPack(false)
    setNewPackName('')
    setNewPackDescription('')
    setActiveTab('library')
    
    toast.success('Style pack created! Upload reference images to begin training.')
    onStylePackCreated?.(newPack)

    // Simulate upload and training process
    setTimeout(() => {
      setStylePacks(prev => prev.map(pack => 
        pack.id === newPack.id 
          ? { ...pack, status: 'processing', progress: 25 }
          : pack
      ))
    }, 2000)
  }

  const handleDeleteStylePack = (packId: string) => {
    setStylePacks(prev => prev.filter(pack => pack.id !== packId))
    setSelectedPack(null)
    toast.success('Style pack deleted')
  }

  const handleStartTraining = (pack: StylePack) => {
    setStylePacks(prev => prev.map(p => 
      p.id === pack.id 
        ? { ...p, status: 'training', progress: 0 }
        : p
    ))
    toast.success('Training started!')
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Style Library
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Lightning className="w-4 h-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setActiveTab('create')}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Lightning className="w-4 h-4 mr-2" />
            New Style Pack
          </Button>
        </div>

        <TabsContent value="library" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stylePacks.map((pack) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedPack(pack)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{pack.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {pack.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(pack.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {pack.category}
                      </Badge>
                      <Badge className={getStatusColor(pack.status)}>
                        {pack.status}
                      </Badge>
                    </div>

                    {pack.status !== 'ready' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{pack.progress}%</span>
                        </div>
                        <Progress value={pack.progress} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Image className="w-3 h-3" />
                      <span>{pack.referenceImages.length} references</span>
                      {pack.sampleOutputs && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{pack.sampleOutputs.length} samples</span>
                        </>
                      )}
                    </div>
                  </CardContent>

                  {pack.progress < 100 && pack.progress > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-500/5 pointer-events-none" />
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {stylePacks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Palette className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Style Packs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first style pack to start generating custom assets
              </p>
              <Button onClick={() => setActiveTab('create')}>
                Create Style Pack
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <div className="grid gap-4">
            {stylePacks.filter(pack => ['training', 'processing', 'uploading'].includes(pack.status)).map((pack) => (
              <Card key={pack.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(pack.status)}
                        {pack.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pack.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View Logs
                      </Button>
                      {pack.status === 'training' && (
                        <Button size="sm" variant="outline">
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Training Progress</span>
                      <span className="text-sm text-muted-foreground">{pack.progress}%</span>
                    </div>
                    <Progress value={pack.progress} className="h-2" />
                  </div>

                  {pack.status === 'training' && pack.metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{pack.metrics.loss.toFixed(4)}</div>
                        <div className="text-xs text-muted-foreground">Loss</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{pack.metrics.accuracy.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{pack.metrics.fid.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">FID Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{pack.metrics.estimatedQuality.toFixed(1)}/10</div>
                        <div className="text-xs text-muted-foreground">Quality</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      Started {pack.updatedAt.toLocaleString()}
                    </div>
                    <div className="text-sm">
                      {pack.status === 'training' ? 'ETA: 2h 15m' : 'Processing...'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {stylePacks.filter(pack => ['training', 'processing'].includes(pack.status)).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Training</h3>
                <p className="text-muted-foreground">
                  Training progress will appear here when style packs are being processed
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightning className="w-5 h-5" />
                Create New Style Pack
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pack-name">Style Pack Name</Label>
                    <Input
                      id="pack-name"
                      value={newPackName}
                      onChange={(e) => setNewPackName(e.target.value)}
                      placeholder="e.g., Pixel Art Heroes"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pack-description">Description</Label>
                    <Textarea
                      id="pack-description"
                      value={newPackDescription}
                      onChange={(e) => setNewPackDescription(e.target.value)}
                      placeholder="Describe the visual style and intended use..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pack-category">Category</Label>
                    <Select value={newPackCategory} onValueChange={(value) => setNewPackCategory(value as StylePack['category'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="character">Characters</SelectItem>
                        <SelectItem value="environment">Environments</SelectItem>
                        <SelectItem value="props">Props & Items</SelectItem>
                        <SelectItem value="effects">Effects & Particles</SelectItem>
                        <SelectItem value="ui">UI Elements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Gear className="w-4 h-4" />
                    Training Parameters
                  </h4>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Learning Rate</Label>
                        <span className="text-sm text-muted-foreground">{trainingParams.learningRate}</span>
                      </div>
                      <Slider
                        value={[trainingParams.learningRate * 10000]}
                        onValueChange={([value]) => setTrainingParams(prev => ({ ...prev, learningRate: value / 10000 }))}
                        min={0.1}
                        max={10}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Resolution</Label>
                        <span className="text-sm text-muted-foreground">{trainingParams.resolution}px</span>
                      </div>
                      <Select 
                        value={trainingParams.resolution.toString()}
                        onValueChange={(value) => setTrainingParams(prev => ({ ...prev, resolution: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="256">256x256</SelectItem>
                          <SelectItem value="512">512x512</SelectItem>
                          <SelectItem value="1024">1024x1024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Style Preservation</Label>
                        <span className="text-sm text-muted-foreground">{trainingParams.preserveStyle}%</span>
                      </div>
                      <Slider
                        value={[trainingParams.preserveStyle]}
                        onValueChange={([value]) => setTrainingParams(prev => ({ 
                          ...prev, 
                          preserveStyle: value,
                          creativeFreedom: 100 - value
                        }))}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="augmentation">Use Data Augmentation</Label>
                      <Switch
                        id="augmentation"
                        checked={trainingParams.useAugmentation}
                        onCheckedChange={(checked) => setTrainingParams(prev => ({ ...prev, useAugmentation: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ready to create your style pack?</p>
                  <p className="text-xs text-muted-foreground">
                    You'll be able to upload reference images after creation
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab('library')}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateStylePack} disabled={!newPackName.trim()}>
                    Create Style Pack
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Style Pack Detail Modal */}
      <AnimatePresence>
        {selectedPack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPack(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      {getStatusIcon(selectedPack.status)}
                      {selectedPack.name}
                    </h2>
                    <p className="text-muted-foreground">{selectedPack.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPack(null)}>
                    ×
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <p className="capitalize">{selectedPack.category}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge className={getStatusColor(selectedPack.status)}>
                        {selectedPack.status}
                      </Badge>
                    </div>
                  </div>

                  {selectedPack.status === 'ready' && selectedPack.sampleOutputs && (
                    <div>
                      <Label>Sample Outputs</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {selectedPack.sampleOutputs.map((output, index) => (
                          <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Image className="w-8 h-8 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {selectedPack.status === 'ready' && (
                      <Button className="flex-1">
                        <Lightning className="w-4 h-4 mr-2" />
                        Use Style Pack
                      </Button>
                    )}
                    {selectedPack.status === 'processing' && (
                      <Button 
                        className="flex-1"
                        onClick={() => handleStartTraining(selectedPack)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Training
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => handleDeleteStylePack(selectedPack.id)}>
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
