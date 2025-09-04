// AI Asset Generator Component for Asset Gallery
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateAssets, AssetGenerationRequest } from '../lib/aiAPI'
import { stylePresetManager, StylePreset } from '../lib/stylePresets'
import { assetStorageManager, GeneratedAsset, AssetMetadata } from '../lib/assetStorage'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'
import { Progress } from './ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

// Icons
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'
import { Robot } from '@phosphor-icons/react/dist/csr/Robot'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { Image } from '@phosphor-icons/react/dist/csr/Image'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { Cube } from '@phosphor-icons/react/dist/csr/Cube'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Download } from '@phosphor-icons/react/dist/csr/Download'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { X } from '@phosphor-icons/react/dist/csr/X'

interface AIAssetGeneratorProps {
  onAssetGenerated?: (asset: GeneratedAsset) => void
  onClose?: () => void
  className?: string
}

interface GenerationProgress {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'error'
  progress: number
  message: string
  startTime: Date
  estimatedTimeRemaining?: number
}

interface QuickTemplate {
  id: string
  name: string
  prompt: string
  assetType: string
  stylePreset: string
  icon: React.ReactNode
}

export function AIAssetGenerator({ onAssetGenerated, onClose, className }: AIAssetGeneratorProps) {
  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([])
  const [selectedProvider, setSelectedProvider] = useState<'huggingface' | 'replicate' | 'local'>('huggingface')
  const [prompt, setPrompt] = useState('')
  const [selectedAssetType, setSelectedAssetType] = useState('concept art')
  const [selectedStylePreset, setSelectedStylePreset] = useState<StylePreset | null>(null)
  const [imageSize, setImageSize] = useState('512x512')
  const [generateCount, setGenerateCount] = useState(1)
  const [qualityLevel, setQualityLevel] = useState<'draft' | 'standard' | 'high' | 'ultra'>('standard')
  const [showAdvancedControls, setShowAdvancedControls] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null)

  // Style preset management
  const [stylePresets] = useState(() => stylePresetManager.getAllPresets())
  const [selectedStyleCategory, setSelectedStyleCategory] = useState<string>('all')
  const [popularPresets] = useState(() => stylePresetManager.getPopularPresets(6))

  // Quick templates for common generations
  const quickTemplates: QuickTemplate[] = [
    {
      id: 'character-portrait',
      name: 'Character',
      prompt: 'detailed character portrait, heroic expression',
      assetType: 'character design',
      stylePreset: 'fantasy-digital-art',
      icon: <Image size={16} />
    },
    {
      id: 'environment-concept',
      name: 'Environment',
      prompt: 'fantasy landscape environment concept art',
      assetType: 'environment art', 
      stylePreset: 'game-concept-art',
      icon: <Palette size={16} />
    },
    {
      id: 'weapon-design',
      name: 'Weapon',
      prompt: 'magical weapon design concept art',
      assetType: 'prop design',
      stylePreset: 'fantasy-digital-art',
      icon: <Cube size={16} />
    },
    {
      id: 'ui-element',
      name: 'UI Element',
      prompt: 'game user interface element design',
      assetType: 'ui element',
      stylePreset: 'modern-ui-design', 
      icon: <Eye size={16} />
    }
  ]

  // Helper functions
  const applyQuickTemplate = (template: QuickTemplate) => {
    setPrompt(template.prompt)
    setSelectedAssetType(template.assetType)
    const preset = stylePresetManager.getPresetById(template.stylePreset)
    if (preset) {
      setSelectedStylePreset(preset)
    }
  }

  const applyStylePreset = (preset: StylePreset) => {
    setSelectedStylePreset(preset)
  }

  const getFilteredStylePresets = () => {
    if (selectedStyleCategory === 'all') {
      return stylePresets
    }
    return stylePresetManager.getPresetsByCategory(selectedStyleCategory as any)
  }

  const createGeneratedAsset = (apiAsset: any): GeneratedAsset => {
    const currentDate = new Date()
    return {
      id: apiAsset.id || Date.now().toString(),
      filename: apiAsset.filename || `generated_${Date.now()}.png`,
      path: apiAsset.path || '',
      url: apiAsset.url,
      type: (apiAsset.type || selectedAssetType) as any,
      format: 'png',
      size: 0,
      dimensions: {
        width: parseInt(imageSize.split('x')[0]),
        height: parseInt(imageSize.split('x')[1])
      },
      metadata: {
        prompt: prompt,
        stylePreset: selectedStylePreset?.id,
        provider: selectedProvider,
        generationSettings: {
          steps: selectedStylePreset?.qualitySettings.steps || 30,
          guidance: selectedStylePreset?.qualitySettings.guidance || 7.5,
          quality: qualityLevel
        },
        tags: [],
        category: 'fantasy', // Default category
        downloads: 0,
        favorites: 0,
        views: 0,
        usage: []
      },
      createdAt: currentDate,
      updatedAt: currentDate,
      status: 'ready',
      versions: []
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    
    // Set up generation progress
    const progressId = Date.now().toString()
    setGenerationProgress({
      id: progressId,
      status: 'generating',
      progress: 0,
      message: 'Starting SDXL asset generation...',
      startTime: new Date()
    })

    try {
      // Apply style preset if selected
      let enhancedPrompt = prompt
      if (selectedStylePreset) {
        enhancedPrompt = stylePresetManager.applyPresetToPrompt(selectedStylePreset, prompt)
      }

      const response = await generateAssets({
        prompt: enhancedPrompt,
        assetType: selectedAssetType,
        style: selectedStylePreset?.name || 'digital art',
        size: imageSize,
        count: generateCount,
        provider: 'local', // Force SDXL service
      })

      if (response.success && response.data) {
        // Check if we got a job ID (SDXL service)
        if (response.data.jobId) {
          // Poll for SDXL results
          await pollForSDXLResults(response.data.jobId, progressId)
        } else if (response.data.assets) {
          // Direct assets (fallback providers)
          const newAssets = response.data.assets.map(createGeneratedAsset)
          setGeneratedAssets(prev => [...prev, ...newAssets])
          
          // Save to storage and notify parent
          for (const asset of newAssets) {
            await assetStorageManager.saveAsset(asset)
            if (onAssetGenerated) {
              onAssetGenerated(asset)
            }
          }
          
          setGenerationProgress({
            id: progressId,
            status: 'completed',
            progress: 100,
            message: `Successfully generated ${newAssets.length} asset(s)`,
            startTime: new Date()
          })
        }
      } else {
        throw new Error(response.error?.message || 'Generation failed')
      }
    } catch (error) {
      console.error('Asset generation failed:', error)
      
      setGenerationProgress({
        id: progressId,
        status: 'error',
        progress: 0,
        message: `SDXL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        startTime: new Date()
      })
    } finally {
      setIsGenerating(false)
      
      // Clear progress after a delay
      setTimeout(() => {
        setGenerationProgress(null)
      }, 5000) // Longer delay for error messages
    }
  }

  // Poll SDXL service for results
  const pollForSDXLResults = async (jobId: string, progressId: string) => {
    const maxPolls = 60 // 5 minutes max (60 * 5 seconds)
    const pollInterval = 5000 // 5 seconds
    
    for (let i = 0; i < maxPolls; i++) {
      try {
        const response = await fetch(`/api/ai/jobs/${jobId}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          if (result.data.status === 'completed') {
            // Success! Process real SDXL assets
            const sdxlAssets = result.data.assets?.map((asset: any) => ({
              ...createGeneratedAsset(asset),
              url: asset.url, // Use real SDXL URLs
              metadata: {
                ...createGeneratedAsset(asset).metadata,
                generationMethod: 'sdxl',
                realAI: true,
                provider: 'asset_gen',
                sdxlModel: asset.metadata?.sdxlModel || 'stable-diffusion-xl',
                processingTime: asset.metadata?.processingTime,
                qualityScore: asset.metadata?.qualityScore
              }
            })) || []
            
            setGeneratedAssets(prev => [...prev, ...sdxlAssets])
            
            // Save to storage and notify parent
            for (const asset of sdxlAssets) {
              await assetStorageManager.saveAsset(asset)
              if (onAssetGenerated) {
                onAssetGenerated(asset)
              }
            }
            
            setGenerationProgress({
              id: progressId,
              status: 'completed',
              progress: 100,
              message: `✅ SDXL generation complete! Generated ${sdxlAssets.length} real AI asset(s)`,
              startTime: new Date()
            })
            return
          } else if (result.data.status === 'failed') {
            throw new Error(result.data.message || 'SDXL generation failed')
          } else {
            // Still processing - update progress
            const progress = Math.min(result.data.progress || (i * 100) / maxPolls, 99)
            setGenerationProgress({
              id: progressId,
              status: 'generating',
              progress,
              message: result.data.message || `🎨 SDXL generating... ${Math.round(progress)}%`,
              startTime: new Date(),
              estimatedTimeRemaining: result.data.estimatedTimeRemaining
            })
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      } catch (error) {
        console.error('Polling error:', error)
        throw new Error(`Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Timeout
    throw new Error('SDXL generation timed out after 5 minutes')
  }

  return (
    <Card className={`p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Robot size={24} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Asset Generator</h2>
            <p className="text-sm text-gray-400">Create game assets with AI</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Templates */}
          <div>
            <label className="text-sm font-medium mb-3 block text-white">Quick Templates</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  className="h-16 flex flex-col items-center gap-2 hover:bg-purple-500/10 hover:border-purple-500/50"
                  onClick={() => applyQuickTemplate(template)}
                  disabled={isGenerating}
                >
                  {template.icon}
                  <span className="text-xs">{template.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Generation Prompt */}
          <div>
            <label className="text-sm font-medium mb-2 block text-white">What do you want to create?</label>
            <Textarea
              placeholder="Describe the asset you want to generate... (e.g., 'heroic knight character with golden armor')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-20 resize-none bg-gray-800/50 border-gray-700/50 text-white"
              disabled={isGenerating}
            />
          </div>

          {/* Style Presets */}
          <div>
            <label className="text-sm font-medium mb-3 block text-white">Art Style</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {popularPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedStylePreset?.id === preset.id ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start text-xs h-10"
                  onClick={() => applyStylePreset(preset)}
                  disabled={isGenerating}
                >
                  <Sparkle size={12} className="mr-2" />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Generation Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Provider</label>
              <Select value={selectedProvider} onValueChange={(value: any) => setSelectedProvider(value)} disabled={isGenerating}>
                <SelectTrigger className="h-9 bg-gray-800/50 border-gray-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="huggingface">HuggingFace</SelectItem>
                  <SelectItem value="replicate">Replicate</SelectItem>
                  <SelectItem value="local">Local AI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Quality</label>
              <Select value={qualityLevel} onValueChange={(value: any) => setQualityLevel(value)} disabled={isGenerating}>
                <SelectTrigger className="h-9 bg-gray-800/50 border-gray-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Size</label>
              <Select value={imageSize} onValueChange={setImageSize} disabled={isGenerating}>
                <SelectTrigger className="h-9 bg-gray-800/50 border-gray-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512x512">512×512</SelectItem>
                  <SelectItem value="1024x1024">1024×1024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Count</label>
              <Select value={generateCount.toString()} onValueChange={(v) => setGenerateCount(Number(v))} disabled={isGenerating}>
                <SelectTrigger className="h-9 bg-gray-800/50 border-gray-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Gear className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Lightning className="w-5 h-5 mr-2" />
                Generate Asset{generateCount > 1 ? 's' : ''}
              </>
            )}
          </Button>

          {/* Generation Progress */}
          {generationProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{generationProgress.message}</span>
                <span className="text-xs text-gray-400">{generationProgress.progress}%</span>
              </div>
              <Progress value={generationProgress.progress} className="h-2" />
            </div>
          )}
        </div>

        {/* Generated Assets Preview */}
        <div>
          <label className="text-sm font-medium mb-3 block text-white">
            Recent Generations ({generatedAssets.length})
          </label>
          
          {generatedAssets.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 gap-3">
                {generatedAssets.slice(-6).map((asset) => (
                  <div
                    key={asset.id}
                    className="relative group border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/30"
                  >
                    <img
                      src={asset.url}
                      alt={`Generated ${asset.type}`}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          console.log('Edit asset:', asset.id)
                        }}
                      >
                        <PencilSimple size={12} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = asset.url
                          link.download = asset.filename
                          link.click()
                        }}
                      >
                        <Download size={12} className="mr-1" />
                        Save
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2">
                      <div className="text-xs truncate">{asset.type}</div>
                      <div className="text-xs text-white/70">{asset.metadata.provider}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-96 border-2 border-dashed border-gray-700/50 rounded-lg flex items-center justify-center text-center">
              <div>
                <Robot size={48} className="mx-auto mb-3 text-gray-500" />
                <p className="text-sm text-gray-400 mb-1">No assets generated yet</p>
                <p className="text-xs text-gray-500">Create your first AI asset!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
