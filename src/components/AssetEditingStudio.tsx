import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArtAsset, AudioAsset, ModelAsset } from '../lib/types'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'

// Icons
import { X } from '@phosphor-icons/react/dist/csr/X'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk'
import { Export } from '@phosphor-icons/react/dist/csr/Export'
import { Download } from '@phosphor-icons/react/dist/csr/Download'
import { Upload } from '@phosphor-icons/react/dist/csr/Upload'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { ArrowsOut } from '@phosphor-icons/react/dist/csr/ArrowsOut'
import { ArrowsIn } from '@phosphor-icons/react/dist/csr/ArrowsIn'
import { Image } from '@phosphor-icons/react/dist/csr/Image'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { MusicNote } from '@phosphor-icons/react/dist/csr/MusicNote'
import { Cube } from '@phosphor-icons/react/dist/csr/Cube'
import { Code } from '@phosphor-icons/react/dist/csr/Code'
import { Robot } from '@phosphor-icons/react/dist/csr/Robot'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'
import { File } from '@phosphor-icons/react/dist/csr/File'
import { FolderOpen } from '@phosphor-icons/react/dist/csr/FolderOpen'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'

interface AssetEditingStudioProps {
  asset: ArtAsset | AudioAsset | ModelAsset | null
  onClose: () => void
  onSave?: (asset: any) => void
}

interface AIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AssetFile {
  name: string
  type: 'texture' | 'material' | 'script' | 'config' | 'metadata'
  path: string
  size: string
  lastModified: Date
  content?: string
}

export function AssetEditingStudio({ asset, onClose, onSave }: AssetEditingStudioProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<AssetFile | null>(null)
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [previewMode, setPreviewMode] = useState<'2d' | '3d' | 'wireframe'>('2d')
  
  // Asset editing state
  const [editingAsset, setEditingAsset] = useState(asset)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Mock asset files based on asset type
  const [assetFiles, setAssetFiles] = useState<AssetFile[]>([])

  useEffect(() => {
    if (!asset) return

    // Generate mock files based on asset type
    const mockFiles: AssetFile[] = []
    
    if (asset.type === 'texture' || asset.type === 'sprite') {
      mockFiles.push(
        { name: `${asset.name}.png`, type: 'texture', path: `/textures/${asset.name}.png`, size: '2.4 MB', lastModified: new Date() },
        { name: `${asset.name}_normal.png`, type: 'texture', path: `/textures/${asset.name}_normal.png`, size: '2.1 MB', lastModified: new Date() },
        { name: `${asset.name}.mat`, type: 'material', path: `/materials/${asset.name}.mat`, size: '1.2 KB', lastModified: new Date() },
        { name: 'shader.glsl', type: 'script', path: `/shaders/${asset.name}_shader.glsl`, size: '892 B', lastModified: new Date() },
        { name: 'config.json', type: 'config', path: `/config/${asset.name}_config.json`, size: '156 B', lastModified: new Date() }
      )
    } else if (asset.type === 'sfx' || asset.type === 'music') {
      mockFiles.push(
        { name: `${asset.name}.wav`, type: 'texture', path: `/audio/${asset.name}.wav`, size: '4.7 MB', lastModified: new Date() },
        { name: `${asset.name}.ogg`, type: 'texture', path: `/audio/${asset.name}.ogg`, size: '1.8 MB', lastModified: new Date() },
        { name: 'audio_config.json', type: 'config', path: `/config/${asset.name}_audio.json`, size: '234 B', lastModified: new Date() },
        { name: 'waveform.js', type: 'script', path: `/scripts/${asset.name}_waveform.js`, size: '2.1 KB', lastModified: new Date() }
      )
    } else if (asset.type === '3d' || asset.type === '2d' || asset.type === 'animation') {
      mockFiles.push(
        { name: `${asset.name}.fbx`, type: 'texture', path: `/models/${asset.name}.fbx`, size: '8.3 MB', lastModified: new Date() },
        { name: `${asset.name}.obj`, type: 'texture', path: `/models/${asset.name}.obj`, size: '3.2 MB', lastModified: new Date() },
        { name: 'rigging.json', type: 'config', path: `/config/${asset.name}_rigging.json`, size: '891 B', lastModified: new Date() },
        { name: 'animations.anim', type: 'script', path: `/animations/${asset.name}.anim`, size: '5.4 KB', lastModified: new Date() }
      )
    }
    
    mockFiles.push({ name: 'metadata.json', type: 'metadata', path: `/metadata/${asset.name}.json`, size: '445 B', lastModified: new Date() })
    setAssetFiles(mockFiles)
  }, [asset])

  const handleFileSelect = (file: AssetFile) => {
    setSelectedFile(file)
    // Mock file content based on type
    const mockContent = generateMockContent(file)
    setSelectedFile({ ...file, content: mockContent })
  }

  const generateMockContent = (file: AssetFile) => {
    switch (file.type) {
      case 'config':
        return `{
  "version": "1.0",
  "name": "${asset?.name}",
  "type": "${asset?.type}",
  "properties": {
    "compression": "high",
    "format": "optimized",
    "quality": 95
  },
  "metadata": {
    "created": "${new Date().toISOString()}",
    "author": "GameForge AI",
    "tags": ${JSON.stringify(asset?.tags || [], null, 2)}
  }
}`
      case 'script':
        return `// ${file.name} - Auto-generated by GameForge AI
// Asset: ${asset?.name}

class AssetController {
  constructor(assetData) {
    this.asset = assetData
    this.isLoaded = false
    this.initialize()
  }

  initialize() {
    console.log('Initializing asset:', this.asset.name)
    this.loadAsset()
  }

  loadAsset() {
    // Asset loading logic here
    this.isLoaded = true
    this.onAssetReady()
  }

  onAssetReady() {
    // Asset ready callback
    console.log('Asset ready:', this.asset.name)
  }
}

export default AssetController`
      case 'metadata':
        return `{
  "assetId": "${asset?.id}",
  "name": "${asset?.name}",
  "type": "${asset?.type}",
  "status": "${asset?.status}",
  "version": "1.0.0",
  "fileSize": "${file.size}",
  "dimensions": "1024x1024",
  "format": "PNG",
  "colorSpace": "sRGB",
  "compression": "none",
  "tags": ${JSON.stringify(asset?.tags || [], null, 2)},
  "created": "${new Date().toISOString()}",
  "lastModified": "${file.lastModified.toISOString()}",
  "dependencies": [],
  "usage": {
    "inProjects": 1,
    "references": 3
  }
}`
      default:
        return `// File: ${file.name}
// Path: ${file.path}
// Size: ${file.size}
// Type: ${file.type}
// Last Modified: ${file.lastModified.toDateString()}

This file contains the binary/media data for the asset.
In a production environment, this would show:
- Image preview for textures
- Audio waveform for sounds
- 3D preview for models
- Syntax-highlighted code for scripts
`
    }
  }

  const handleSendPrompt = () => {
    if (!currentPrompt.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentPrompt,
      timestamp: new Date()
    }

    const aiResponse: AIMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `I'll help you ${currentPrompt.toLowerCase()}. For the asset "${asset?.name}", I can:

• Optimize the texture compression settings
• Adjust color balance and contrast
• Generate variations with different styles
• Create normal maps or other texture channels
• Suggest performance improvements

What specific aspect would you like me to focus on?`,
      timestamp: new Date()
    }

    setAIMessages(prev => [...prev, userMessage, aiResponse])
    setCurrentPrompt('')
  }

  const renderAssetPreview = () => {
    if (!asset) return null

    const assetType = asset.type
    
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden">
        {/* Preview Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
          </Button>
          
          {assetType === 'texture' || assetType === 'sprite' ? (
            <Select value={previewMode} onValueChange={setPreviewMode as any}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2d">2D View</SelectItem>
                <SelectItem value="3d">3D Preview</SelectItem>
                <SelectItem value="wireframe">Wireframe</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <span className="text-xs text-white">Zoom:</span>
          <Slider
            value={[zoom]}
            onValueChange={([value]) => setZoom(value)}
            max={400}
            min={25}
            step={25}
            className="w-24"
          />
          <span className="text-xs text-white w-12">{zoom}%</span>
        </div>

        {/* Main Preview Content */}
        <div className="flex items-center justify-center h-full p-8">
          {assetType === 'texture' || assetType === 'sprite' ? (
            <div className="relative">
              {asset.thumbnail ? (
                <img
                  src={asset.thumbnail}
                  alt={asset.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  style={{ transform: `scale(${zoom / 100})` }}
                />
              ) : (
                <div className="w-64 h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <Image size={64} className="text-muted-foreground" />
                </div>
              )}
              
              {/* 3D Preview Overlay */}
              {previewMode === '3d' && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <Cube size={32} className="mx-auto mb-2" />
                    <p className="text-sm">3D Preview Mode</p>
                  </div>
                </div>
              )}
            </div>
          ) : assetType === 'sfx' || assetType === 'music' ? (
            <div className="text-center">
              <div className="w-96 h-32 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <div className="flex items-center space-x-2">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-gradient-to-t from-green-400 to-blue-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 40 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-full w-16 h-16"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">{asset.name}</p>
                <p className="text-sm text-muted-foreground">Duration: 2:34</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <Cube size={64} className="text-muted-foreground animate-spin" />
              </div>
              <p className="text-lg font-semibold">{asset.name}</p>
              <p className="text-sm text-muted-foreground">3D Model Preview</p>
            </div>
          )}
        </div>

        {/* Asset Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="flex items-center gap-2 mb-2">
            {assetType === 'texture' || assetType === 'sprite' ? <Image size={20} /> :
             assetType === 'sfx' || assetType === 'music' ? <MusicNote size={20} /> :
             <Cube size={20} />}
            <span className="font-semibold">{asset.name}</span>
          </div>
          <div className="text-xs space-y-1">
            <div>Type: {asset.type}</div>
            <div>Status: {asset.status}</div>
            <div>Files: {assetFiles.length}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!asset) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border/30 bg-muted/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to Assets
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-3">
            {asset.type === 'texture' || asset.type === 'sprite' ? <Palette size={20} /> :
             asset.type === 'sfx' || asset.type === 'music' ? <MusicNote size={20} /> :
             <Cube size={20} />}
            <div>
              <h1 className="font-semibold text-lg">{asset.name}</h1>
              <p className="text-sm text-muted-foreground">Asset Editor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
              Unsaved Changes
            </Badge>
          )}
          
          <Button size="sm" variant="outline" className="gap-2">
            <Upload size={16} />
            Import
          </Button>
          
          <Button size="sm" variant="outline" className="gap-2">
            <Export size={16} />
            Export
          </Button>
          
          <Button size="sm" className="gap-2" onClick={() => onSave?.(editingAsset)}>
            <FloppyDisk size={16} />
            Save
          </Button>
        </div>
      </div>

      {/* Main Layout - Three Panels */}
      <div className="flex h-[calc(100vh-4rem)]">
        
        {/* Left Panel - Asset Files & Codebase */}
        <div className="w-80 border-r border-border/30 bg-muted/10 flex flex-col">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Code size={18} />
              <h3 className="font-semibold">Asset Files</h3>
            </div>
            
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-9 h-8"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {assetFiles.map((file) => (
                <Button
                  key={file.path}
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start gap-2 h-auto p-3 ${
                    selectedFile?.path === file.path ? 'bg-accent/20 text-accent' : ''
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <File size={16} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-sm truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{file.size}</div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* File Content Preview */}
          {selectedFile && (
            <div className="border-t border-border/30 bg-muted/20 max-h-64 flex flex-col">
              <div className="p-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <File size={16} />
                  <span className="font-medium text-sm truncate">{selectedFile.name}</span>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <pre className="p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {selectedFile.content}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Center Panel - Main Asset Preview */}
        <div className="flex-1 flex flex-col">
          {renderAssetPreview()}
        </div>

        {/* Right Panel - AI Assistant & Properties */}
        <div className="w-96 border-l border-border/30 bg-muted/10 flex flex-col">
          <Tabs defaultValue="assistant" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 m-4 mb-0">
              <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="flex-1 flex flex-col m-4 mt-4">
              {/* AI Chat */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Robot size={18} />
                  <h3 className="font-semibold">Asset Assistant</h3>
                </div>

                <ScrollArea className="flex-1 border rounded-lg bg-muted/20">
                  <div className="p-4 space-y-4">
                    {aiMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        <ChatCircle size={32} className="mx-auto mb-2" />
                        <p className="text-sm">Ask me anything about this asset!</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {[
                            'Optimize quality',
                            'Generate variations',
                            'Fix issues',
                            'Enhance colors'
                          ].map((suggestion) => (
                            <Button
                              key={suggestion}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => setCurrentPrompt(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      aiMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Ask the AI about this asset..."
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendPrompt}
                    disabled={!currentPrompt.trim()}
                    className="w-full gap-2"
                  >
                    <Lightning size={16} />
                    Send Message
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="flex-1 m-4 mt-4">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gear size={18} />
                  <h3 className="font-semibold">Asset Properties</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input
                      value={editingAsset?.name || ''}
                      onChange={(e) => {
                        setEditingAsset(prev => prev ? { ...prev, name: e.target.value } : null)
                        setHasUnsavedChanges(true)
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                      value={editingAsset?.type}
                      onValueChange={(value) => {
                        setEditingAsset(prev => prev ? { ...prev, type: value as any } : null)
                        setHasUnsavedChanges(true)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="texture">Texture</SelectItem>
                        <SelectItem value="sprite">Sprite</SelectItem>
                        <SelectItem value="model">3D Model</SelectItem>
                        <SelectItem value="sfx">Sound Effect</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select
                      value={editingAsset?.status}
                      onValueChange={(value) => {
                        setEditingAsset(prev => prev ? { ...prev, status: value as any } : null)
                        setHasUnsavedChanges(true)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concept">Concept</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(asset.type === 'texture' || asset.type === 'sprite') && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium mb-2 block">Quality</label>
                        <Slider
                          defaultValue={[85]}
                          max={100}
                          min={1}
                          step={1}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Enable Compression</label>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Generate Mipmaps</label>
                        <Switch defaultChecked />
                      </div>
                    </>
                  )}

                  {(asset.type === 'sfx' || asset.type === 'music') && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium mb-2 block">Volume</label>
                        <Slider
                          defaultValue={[80]}
                          max={100}
                          min={0}
                          step={5}
                          className="mb-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Loop Audio</label>
                        <Switch />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Format</label>
                        <Select defaultValue="ogg">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wav">WAV</SelectItem>
                            <SelectItem value="ogg">OGG</SelectItem>
                            <SelectItem value="mp3">MP3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
