import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Icons
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { Robot } from '@phosphor-icons/react/dist/csr/Robot'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { Image } from '@phosphor-icons/react/dist/csr/Image'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { XCircle } from '@phosphor-icons/react/dist/csr/XCircle'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Download } from '@phosphor-icons/react/dist/csr/Download'
import { Trash } from '@phosphor-icons/react/dist/csr/Trash'
import { CurrencyCircleDollar } from '@phosphor-icons/react/dist/csr/CurrencyCircleDollar'
import { ListChecks } from '@phosphor-icons/react/dist/csr/ListChecks'

// Import StylePack type from StylePackManager
import { StylePack } from './StylePackManager'

// Types
export interface BatchRequest {
  id: string
  name: string
  prompt: string
  parsedPrompt: ParsedBatchPrompt
  stylePackId?: string
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled'
  progress: number
  totalAssets: number
  completedAssets: number
  failedAssets: number
  assets: GeneratedBatchAsset[]
  estimatedCost: number
  actualCost?: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  estimatedDuration: number // in minutes
}

export interface ParsedBatchPrompt {
  quantity: number
  assetType: string
  theme: string
  style?: string
  quality: 'draft' | 'standard' | 'high'
  resolution: number
  variations: number
  keywords: string[]
}

export interface GeneratedBatchAsset {
  id: string
  batchId: string
  prompt: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  imageUrl?: string
  thumbnailUrl?: string
  metadata: {
    seed: number
    model: string
    parameters: any
    generationTime: number
  }
  createdAt: Date
}

interface BatchRequestCreatorProps {
  onCreateBatch?: (request: BatchRequest) => void
  availableStylePacks: StylePack[]
  className?: string
}

// Mock data
const mockBatches: BatchRequest[] = [
  {
    id: 'batch-1',
    name: 'Desert Props Collection',
    prompt: '32 desert props including cacti, rocks, and ancient ruins',
    parsedPrompt: {
      quantity: 32,
      assetType: 'props',
      theme: 'desert',
      quality: 'standard',
      resolution: 512,
      variations: 2,
      keywords: ['cacti', 'rocks', 'ancient ruins', 'sand', 'weathered']
    },
    status: 'generating',
    progress: 65,
    totalAssets: 32,
    completedAssets: 21,
    failedAssets: 0,
    assets: [],
    estimatedCost: 16.00,
    actualCost: 10.50,
    createdAt: new Date('2025-09-01'),
    startedAt: new Date('2025-09-01'),
    estimatedDuration: 45
  },
  {
    id: 'batch-2',
    name: 'Cyberpunk Characters',
    prompt: '16 cyberpunk character portraits with neon lighting',
    parsedPrompt: {
      quantity: 16,
      assetType: 'characters',
      theme: 'cyberpunk',
      style: 'neon lighting',
      quality: 'high',
      resolution: 1024,
      variations: 3,
      keywords: ['cyberpunk', 'neon', 'portrait', 'futuristic', 'augmented']
    },
    status: 'completed',
    progress: 100,
    totalAssets: 16,
    completedAssets: 16,
    failedAssets: 0,
    assets: [],
    estimatedCost: 32.00,
    actualCost: 30.25,
    createdAt: new Date('2025-08-31'),
    startedAt: new Date('2025-08-31'),
    completedAt: new Date('2025-09-01'),
    estimatedDuration: 60
  }
]

// Quick templates for common batch requests
const quickTemplates = [
  {
    name: 'Environment Pack',
    prompt: '24 environment assets including trees, rocks, and buildings',
    icon: '🏞️'
  },
  {
    name: 'Character Set',
    prompt: '12 character sprites with idle and walking animations',
    icon: '🚶'
  },
  {
    name: 'UI Elements',
    prompt: '16 UI elements including buttons, icons, and panels',
    icon: '🎨'
  },
  {
    name: 'Weapon Collection',
    prompt: '20 medieval weapons including swords, shields, and bows',
    icon: '⚔️'
  }
]

export const BatchRequestCreator: React.FC<BatchRequestCreatorProps> = ({
  onCreateBatch,
  availableStylePacks,
  className
}) => {
  const [batches, setBatches] = useState<BatchRequest[]>(mockBatches)
  const [activeTab, setActiveTab] = useState<'create' | 'batches'>('create')
  const [selectedBatch, setSelectedBatch] = useState<BatchRequest | null>(null)

  // Form state
  const [prompt, setPrompt] = useState('')
  const [selectedStylePack, setSelectedStylePack] = useState<string>('')
  const [quality, setQuality] = useState<'draft' | 'standard' | 'high'>('standard')
  const [resolution, setResolution] = useState(512)
  const [variations, setVariations] = useState(2)

  // Parsed prompt state
  const [parsedPrompt, setParsedPrompt] = useState<ParsedBatchPrompt | null>(null)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [estimatedDuration, setEstimatedDuration] = useState(0)

  // Parse natural language prompt
  const parsePrompt = (promptText: string): ParsedBatchPrompt | null => {
    if (!promptText.trim()) return null

    // Extract quantity (number at start or specific patterns)
    const quantityMatch = promptText.match(/^(\d+)/) || 
                         promptText.match(/(\d+)\s*(assets|items|props|characters|sprites|elements|pieces)/)
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 12

    // Extract asset type
    let assetType = 'props'
    if (promptText.toLowerCase().includes('character') || promptText.toLowerCase().includes('sprite')) assetType = 'characters'
    if (promptText.toLowerCase().includes('environment') || promptText.toLowerCase().includes('landscape')) assetType = 'environments'
    if (promptText.toLowerCase().includes('ui') || promptText.toLowerCase().includes('interface')) assetType = 'ui'
    if (promptText.toLowerCase().includes('effect') || promptText.toLowerCase().includes('particle')) assetType = 'effects'

    // Extract theme/style keywords
    const keywords = promptText.toLowerCase()
      .split(/[,\s]+/)
      .filter(word => word.length > 3 && !['including', 'with', 'and', 'the'].includes(word))
      .slice(0, 6)

    const theme = keywords[0] || 'generic'

    return {
      quantity,
      assetType,
      theme,
      quality,
      resolution,
      variations,
      keywords
    }
  }

  // Calculate cost and duration estimates
  const calculateEstimates = (parsed: ParsedBatchPrompt | null) => {
    if (!parsed) {
      setEstimatedCost(0)
      setEstimatedDuration(0)
      return
    }

    // Base cost per asset (in credits/dollars)
    let basePrice = 0.25 // draft
    if (quality === 'standard') basePrice = 0.50
    if (quality === 'high') basePrice = 1.00

    // Resolution multiplier
    const resMultiplier = resolution >= 1024 ? 2 : 1

    // Variation multiplier
    const varMultiplier = parsed.variations

    const totalCost = parsed.quantity * basePrice * resMultiplier * varMultiplier
    const totalDuration = Math.ceil(parsed.quantity * varMultiplier * 0.75) // ~45s per asset

    setEstimatedCost(totalCost)
    setEstimatedDuration(totalDuration)
  }

  // Update parsed prompt when form changes
  useEffect(() => {
    const parsed = parsePrompt(prompt)
    setParsedPrompt(parsed)
    calculateEstimates(parsed)
  }, [prompt, quality, resolution, variations])

  const handleCreateBatch = async () => {
    if (!prompt.trim() || !parsedPrompt) {
      toast.error('Please enter a valid batch request')
      return
    }

    const newBatch: BatchRequest = {
      id: `batch-${Date.now()}`,
      name: `${parsedPrompt.quantity} ${parsedPrompt.theme} ${parsedPrompt.assetType}`,
      prompt,
      parsedPrompt: {
        ...parsedPrompt,
        quality,
        resolution,
        variations
      },
      stylePackId: selectedStylePack || undefined,
      status: 'pending',
      progress: 0,
      totalAssets: parsedPrompt.quantity * variations,
      completedAssets: 0,
      failedAssets: 0,
      assets: [],
      estimatedCost,
      createdAt: new Date(),
      estimatedDuration
    }

    setBatches(prev => [newBatch, ...prev])
    setPrompt('')
    setSelectedStylePack('')
    setActiveTab('batches')
    
    toast.success(`Batch request created: ${newBatch.totalAssets} assets queued for generation`)
    onCreateBatch?.(newBatch)

    // Simulate batch processing
    setTimeout(() => {
      setBatches(prev => prev.map(batch => 
        batch.id === newBatch.id 
          ? { ...batch, status: 'generating', startedAt: new Date() }
          : batch
      ))
    }, 1000)
  }

  const handleUseTemplate = (template: typeof quickTemplates[0]) => {
    setPrompt(template.prompt)
  }

  const getStatusIcon = (status: BatchRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'generating':
        return <Lightning className="w-4 h-4 text-blue-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: BatchRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'generating':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <Button 
            variant={activeTab === 'create' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2"
          >
            <Robot className="w-4 h-4" />
            Create Batch
          </Button>
          <Button 
            variant={activeTab === 'batches' ? 'default' : 'outline'}
            onClick={() => setActiveTab('batches')}
            className="flex items-center gap-2"
          >
            <ListChecks className="w-4 h-4" />
            Batch Requests ({batches.length})
          </Button>
        </div>

        <Badge variant="outline" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <CurrencyCircleDollar className="w-3 h-3 mr-1" />
          Credits: 250
        </Badge>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Robot className="w-5 h-5" />
                  Batch Asset Request
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Describe your batch request</Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., 32 desert props including cacti, rocks, and ancient ruins"
                      rows={3}
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use natural language. Examples: "24 fantasy weapons", "16 cyberpunk characters with neon lighting"
                    </p>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-2">
                    <Label>Quick Templates</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {quickTemplates.map((template, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="justify-start h-auto p-3"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <span className="mr-2 text-lg">{template.icon}</span>
                          <div className="text-left">
                            <div className="font-medium text-xs">{template.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {template.prompt.split(' ').slice(0, 6).join(' ')}...
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Generation Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quality</Label>
                      <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft ($0.25)</SelectItem>
                          <SelectItem value="standard">Standard ($0.50)</SelectItem>
                          <SelectItem value="high">High Quality ($1.00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Resolution</Label>
                      <Select value={resolution.toString()} onValueChange={(value) => setResolution(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="256">256×256</SelectItem>
                          <SelectItem value="512">512×512</SelectItem>
                          <SelectItem value="1024">1024×1024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Variations</Label>
                        <span className="text-sm text-muted-foreground">{variations}</span>
                      </div>
                      <Slider
                        value={[variations]}
                        onValueChange={([value]) => setVariations(value)}
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Style Pack Selection */}
                  {availableStylePacks.length > 0 && (
                    <div className="space-y-2">
                      <Label>Style Pack (Optional)</Label>
                      <Select value={selectedStylePack} onValueChange={setSelectedStylePack}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a style pack..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No style pack</SelectItem>
                          {availableStylePacks
                            .filter(pack => pack.status === 'ready')
                            .map(pack => (
                              <SelectItem key={pack.id} value={pack.id}>
                                {pack.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Estimates */}
          <div className="space-y-4">
            {parsedPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Assets</span>
                      <Badge variant="secondary">{parsedPrompt.quantity * variations}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Type</span>
                      <span className="text-sm capitalize">{parsedPrompt.assetType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Theme</span>
                      <span className="text-sm capitalize">{parsedPrompt.theme}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resolution</span>
                      <span className="text-sm">{resolution}×{resolution}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estimated Cost</span>
                      <span className="text-sm font-medium">${estimatedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estimated Time</span>
                      <span className="text-sm">{estimatedDuration} min</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm">Detected Keywords</Label>
                    <div className="flex flex-wrap gap-1">
                      {parsedPrompt.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateBatch}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    disabled={!prompt.trim()}
                  >
                    <Lightning className="w-4 h-4 mr-2" />
                    Start Batch Generation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="space-y-4">
          {batches.map((batch) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedBatch(batch)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon(batch.status)}
                        {batch.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {batch.prompt}
                      </p>
                    </div>
                    <Badge className={getStatusColor(batch.status)}>
                      {batch.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {batch.status !== 'pending' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{batch.completedAssets}/{batch.totalAssets} assets</span>
                      </div>
                      <Progress value={batch.progress} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{batch.totalAssets}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-500">{batch.completedAssets}</div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">${batch.actualCost?.toFixed(2) || batch.estimatedCost.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Cost</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                    <span>Created {batch.createdAt.toLocaleDateString()}</span>
                    {batch.status === 'generating' && (
                      <span>ETA: {Math.ceil((batch.totalAssets - batch.completedAssets) * 0.75)} min</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {batches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Robot className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Batch Requests</h3>
              <p className="text-muted-foreground mb-4">
                Create your first batch request to generate multiple assets at once
              </p>
              <Button onClick={() => setActiveTab('create')}>
                Create Batch Request
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Batch Detail Modal */}
      <AnimatePresence>
        {selectedBatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedBatch(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      {getStatusIcon(selectedBatch.status)}
                      {selectedBatch.name}
                    </h2>
                    <p className="text-muted-foreground">{selectedBatch.prompt}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedBatch(null)}>
                    ×
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedBatch.totalAssets}</div>
                    <div className="text-sm text-muted-foreground">Total Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{selectedBatch.completedAssets}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{selectedBatch.failedAssets}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedBatch.progress}%</div>
                    <div className="text-sm text-muted-foreground">Progress</div>
                  </div>
                </div>

                {selectedBatch.progress > 0 && (
                  <div className="mb-6">
                    <Progress value={selectedBatch.progress} className="h-3" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View Assets
                  </Button>
                  {selectedBatch.status === 'completed' && (
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  )}
                  <Button variant="outline">
                    <Trash className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
