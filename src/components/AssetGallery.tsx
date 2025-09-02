import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIAssetGenerator } from './AIAssetGenerator'
import { GeneratedAsset } from '../lib/assetStorage'
import { 
  Play 
} from '@phosphor-icons/react/dist/csr/Play'
import { 
  Pause 
} from '@phosphor-icons/react/dist/csr/Pause'
import { 
  Image as FileImage 
} from '@phosphor-icons/react/dist/csr/Image'
import { 
  PencilSimple 
} from '@phosphor-icons/react/dist/csr/PencilSimple'
import { 
  Trash 
} from '@phosphor-icons/react/dist/csr/Trash'
import { 
  Download 
} from '@phosphor-icons/react/dist/csr/Download'
import { 
  Upload 
} from '@phosphor-icons/react/dist/csr/Upload'
import { 
  Eye 
} from '@phosphor-icons/react/dist/csr/Eye'
import { 
  Palette 
} from '@phosphor-icons/react/dist/csr/Palette'
import { 
  MusicNote 
} from '@phosphor-icons/react/dist/csr/MusicNote'
import { 
  MagnifyingGlass 
} from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { 
  GridFour 
} from '@phosphor-icons/react/dist/csr/GridFour'
import { 
  List 
} from '@phosphor-icons/react/dist/csr/List'
import { 
  Heart 
} from '@phosphor-icons/react/dist/csr/Heart'
import { 
  Clock 
} from '@phosphor-icons/react/dist/csr/Clock'
import { 
  Calendar 
} from '@phosphor-icons/react/dist/csr/Calendar'
import { 
  Sparkle 
} from '@phosphor-icons/react/dist/csr/Sparkle'
import { 
  CheckCircle 
} from '@phosphor-icons/react/dist/csr/CheckCircle'
import { 
  WarningCircle 
} from '@phosphor-icons/react/dist/csr/WarningCircle'
import { 
  Circle 
} from '@phosphor-icons/react/dist/csr/Circle'
import { 
  Cube 
} from '@phosphor-icons/react/dist/csr/Cube'
import { 
  ArtAsset, 
  AudioAsset, 
  ModelAsset, 
  UIAsset 
} from '../lib/types'

// Union type for all asset types
export type GameAsset = ArtAsset | AudioAsset | ModelAsset | UIAsset

interface AssetGalleryProps {
  artAssets?: ArtAsset[]
  audioAssets?: AudioAsset[]
  modelAssets?: ModelAsset[]
  uiAssets?: UIAsset[]
  onEdit?: (asset: GameAsset) => void
  onDelete?: (assetId: string) => void
  onPreview?: (asset: GameAsset) => void
  onFavorite?: (assetId: string) => void
  className?: string
  showSearch?: boolean
  showFilters?: boolean
  defaultView?: 'grid' | 'list'
  enableSelection?: boolean
}

interface AssetCardProps {
  asset: GameAsset
  onEdit?: (asset: GameAsset) => void
  onDelete?: (assetId: string) => void
  onPreview?: (asset: GameAsset) => void
  onFavorite?: (assetId: string) => void
  viewMode: 'grid' | 'list'
  isSelected?: boolean
  onSelect?: (assetId: string) => void
}

// Asset type detection utilities
const getAssetType = (asset: GameAsset): 'art' | 'audio' | 'models' | 'ui' => {
  // Check for audio assets first (most specific)
  if ('duration' in asset) return 'audio'
  
  // Check for 3D model assets
  if ('polyCount' in asset) return 'models'
  
  // Check for art assets - look for art-specific types or thumbnail presence
  if ('thumbnail' in asset && asset.thumbnail) {
    const artTypes = ['character', 'environment', 'concept', 'sprite', 'texture', 'prop']
    if (artTypes.includes(asset.type) || artTypes.includes(asset.category)) {
      return 'art'
    }
  }
  
  // Check for UI assets - specific UI types
  if ('type' in asset && ['icon', 'button', 'panel', 'hud', 'effect'].includes(asset.type)) {
    return 'ui'
  }
  
  // Default fallback - if it has thumbnail, it's likely art, otherwise UI
  return 'thumbnail' in asset && asset.thumbnail ? 'art' : 'ui'
}

const getAssetTypeIcon = (type: string) => {
  switch (type) {
    case 'art': return <Palette className="w-4 h-4" />
    case 'audio': return <MusicNote className="w-4 h-4" />
    case 'models': return <Cube className="w-4 h-4" />
    case 'ui': return <Sparkle className="w-4 h-4" />
    default: return <FileImage className="w-4 h-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'text-green-400 bg-green-500/10 border-green-500/30'
    case 'review': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    case 'in-progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    case 'requested': return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="w-3 h-3" />
    case 'review': return <WarningCircle className="w-3 h-3" />
    case 'in-progress': return <Clock className="w-3 h-3" />
    case 'requested': return <Circle className="w-3 h-3" />
    default: return <Circle className="w-3 h-3" />
  }
}

// Helper to get thumbnail from asset (type-safe)
const getAssetThumbnail = (asset: GameAsset): string | undefined => {
  if ('thumbnail' in asset) {
    return asset.thumbnail
  }
  return undefined
}

// CORRECTED: Placeholder detection logic
const isPlaceholderAsset = (asset: GameAsset): boolean => {
  // Check both src and thumbnail properties
  const thumbnail = getAssetThumbnail(asset)
  const imageUrl = asset.src || thumbnail
  
  console.log('🔍 PLACEHOLDER CHECK for:', asset.name, {
    assetId: asset.id,
    src: asset.src,
    thumbnail: thumbnail,
    imageUrl: imageUrl,
    hasImageUrl: !!imageUrl
  })
  
  if (!imageUrl) {
    console.log('❌ No image URL found - marking as placeholder for:', asset.name)
    return true
  }
  
  // Check if it's a placeholder URL
  if (typeof imageUrl === 'string') {
    const isPlaceholder = imageUrl.includes('placeholder') || imageUrl.includes('example.com')
    console.log('🔍 URL check for', asset.name, ':', {
      url: imageUrl,
      includesPlaceholder: imageUrl.includes('placeholder'),
      includesExample: imageUrl.includes('example.com'),
      finalResult: isPlaceholder
    })
    return isPlaceholder
  }
  
  console.log('❌ Image URL is not a string - marking as placeholder for:', asset.name)
  return false
}

// Production-ready Asset Card Component
const AssetCard: React.FC<AssetCardProps> = ({ 
  asset, 
  onEdit, 
  onDelete, 
  onPreview, 
  onFavorite,
  viewMode,
  isSelected,
  onSelect 
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const assetType = getAssetType(asset)
  const isPlaceholder = isPlaceholderAsset(asset)
  
  console.log('🎨 Asset Card Debug:', { 
    name: asset.name, 
    assetType: assetType,
    src: asset.src, 
    thumbnail: getAssetThumbnail(asset),
    isPlaceholder,
    hasOnEdit: !!onEdit,
    asset: asset
  })
  
  const handlePlay = useCallback(async () => {
    if (assetType === 'audio') {
      setIsPlaying(!isPlaying)
      // Audio playback logic would go here
    } else if (onPreview) {
      setIsLoading(true)
      try {
        await onPreview(asset)
      } finally {
        setIsLoading(false)
      }
    }
  }, [assetType, isPlaying, onPreview, asset])

  const handleEdit = useCallback(() => {
    console.log('🔧 Edit button clicked:', { 
      assetName: asset.name, 
      assetId: asset.id,
      isPlaceholder, 
      hasOnEdit: !!onEdit,
      asset: asset,
      thumbnailUrl: getAssetThumbnail(asset),
      srcUrl: asset.src
    })
    
    if (onEdit && !isPlaceholder) {
      console.log('✅ Calling onEdit with asset:', asset)
      onEdit(asset)
    } else {
      console.log('❌ Edit blocked:', { 
        hasOnEdit: !!onEdit, 
        isPlaceholder,
        reason: !onEdit ? 'No onEdit handler' : 'Asset is placeholder'
      })
    }
  }, [onEdit, asset, isPlaceholder])

  const handleFavorite = useCallback(() => {
    if (onFavorite) {
      onFavorite(asset.id)
    }
  }, [onFavorite, asset.id])

  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(asset.id)
    }
  }, [onSelect, asset.id])

  // Get the best available image URL
  const imageUrl = getAssetThumbnail(asset) || asset.src

  // Grid view rendering
  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`cursor-pointer ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
        onClick={handleSelect}
      >
        <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/30 hover:shadow-lg transition-all duration-300 rounded-lg">
          {/* Status indicator */}
          <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(asset.status)}`}>
            {getStatusIcon(asset.status)}
            <span className="capitalize">{asset.status}</span>
          </div>
          
          {/* Asset preview */}
          <div className="relative h-40 bg-gradient-to-br from-gray-700/20 to-gray-800/5 border-b border-gray-700/30 overflow-hidden">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={asset.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700/30 to-gray-800/10">
                <div className="text-gray-500 flex flex-col items-center gap-2">
                  {getAssetTypeIcon(assetType)}
                  <span className="text-xs text-gray-400">{asset.name}</span>
                </div>
              </div>
            )}
            
            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
              <button
                className="px-3 py-2 bg-white/90 hover:bg-white text-black shadow-lg rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlay()
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : assetType === 'audio' ? (
                  <>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview
                  </>
                )}
              </button>
              
              <button
                className="px-3 py-2 bg-white/90 hover:bg-white text-black shadow-lg rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFavorite()
                }}
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>

            {/* AI Generated badge */}
            {asset.metadata?.aiGenerated && (
              <div className="absolute bottom-2 left-2">
                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <Sparkle className="w-3 h-3" />
                  AI Generated
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold truncate leading-tight text-white">
                {asset.name}
              </h3>
              <span className="text-xs shrink-0 bg-gray-700/50 text-gray-300 px-2 py-1 rounded border border-gray-600/50">
                {asset.category}
              </span>
            </div>

            {/* Asset metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
              {assetType === 'art' && 'resolution' in asset && asset.resolution && (
                <div className="flex items-center gap-1">
                  <FileImage className="w-3 h-3" />
                  <span>{asset.resolution}</span>
                </div>
              )}
              {assetType === 'audio' && 'duration' in asset && asset.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
              {assetType === 'models' && 'polyCount' in asset && asset.polyCount && (
                <div className="flex items-center gap-1">
                  <Cube className="w-3 h-3" />
                  <span>{asset.polyCount.toLocaleString()}</span>
                </div>
              )}
              {asset.metadata?.createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(asset.metadata.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {asset.tags && asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {asset.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded border border-gray-600/30">
                    {tag}
                  </span>
                ))}
                {asset.tags.length > 2 && (
                  <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded border border-gray-600/30">
                    +{asset.tags.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <button
                  className={`h-8 px-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                    isPlaceholder 
                      ? 'opacity-50 cursor-not-allowed bg-gray-600/30 text-gray-400' 
                      : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300 border border-purple-500/30'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit()
                  }}
                  disabled={isPlaceholder}
                  title={isPlaceholder ? 'Placeholder asset - cannot edit' : 'Edit Asset'}
                >
                  <PencilSimple className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                
                <button
                  className="h-8 px-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 border border-blue-500/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlay()
                  }}
                  title="Preview Asset"
                >
                  <Eye className="w-3 h-3" />
                </button>
                
                <button
                  className="h-8 px-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 border border-green-500/30"
                  title="Download Asset"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>

              {onDelete && (
                <button
                  className="h-8 px-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(asset.id)
                  }}
                  title="Delete Asset"
                >
                  <Trash className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // List view rendering
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`cursor-pointer ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
      onClick={handleSelect}
    >
      <div className="group flex items-center p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/30 hover:shadow-md transition-all duration-200 rounded-lg">
        {/* Thumbnail */}
        <div className="w-16 h-16 bg-gray-700/20 rounded-lg overflow-hidden shrink-0 mr-4">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getAssetTypeIcon(assetType)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-sm truncate text-white">{asset.name}</h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(asset.status)}`}>
              {getStatusIcon(asset.status)}
              <span className="capitalize">{asset.status}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
            <span className="bg-gray-700/50 px-2 py-1 rounded border border-gray-600/30">
              {asset.category}
            </span>
            {asset.metadata?.createdAt && (
              <span>{new Date(asset.metadata.createdAt).toLocaleDateString()}</span>
            )}
          </div>

          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {asset.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            className={`h-8 px-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
              isPlaceholder 
                ? 'opacity-50 cursor-not-allowed bg-gray-600/30 text-gray-400' 
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              handleEdit()
            }}
            disabled={isPlaceholder}
            title={isPlaceholder ? 'Placeholder - cannot edit' : 'Edit'}
          >
            <PencilSimple className="w-4 h-4" />
            <span>Edit</span>
          </button>
          
          <button
            className="h-8 px-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
            onClick={(e) => {
              e.stopPropagation()
              handlePlay()
            }}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Production-ready Asset Gallery Component
export const AssetGallery: React.FC<AssetGalleryProps> = ({
  artAssets = [],
  audioAssets = [],
  modelAssets = [],
  uiAssets = [],
  onEdit,
  onDelete,
  onPreview,
  onFavorite,
  className = '',
  showSearch = true,
  showFilters = true,
  defaultView = 'grid',
  enableSelection = false
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'status' | 'category'>('created')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView)
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('all')
  const [showAIGenerator, setShowAIGenerator] = useState(true)
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([])

  // Handle AI asset generation
  const handleAssetGenerated = useCallback((asset: GeneratedAsset) => {
    setGeneratedAssets(prev => [...prev, asset])
    // Convert GeneratedAsset to GameAsset format for display
    // This would typically be handled by your asset management system
  }, [])

  // Debug logging
  console.log('🎨 AssetGallery Debug:', { 
    artAssets: artAssets.length,
    audioAssets: audioAssets.length, 
    modelAssets: modelAssets.length,
    uiAssets: uiAssets.length,
    hasOnEdit: !!onEdit
  })

  // Combine all assets
  const allAssets: GameAsset[] = useMemo(() => [
    ...artAssets,
    ...audioAssets, 
    ...modelAssets,
    ...uiAssets
  ], [artAssets, audioAssets, modelAssets, uiAssets])

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = allAssets

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(asset => getAssetType(asset) === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(query) ||
        asset.category.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === filterStatus)
    }

    // Sort assets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.metadata?.createdAt || 0).getTime() - new Date(a.metadata?.createdAt || 0).getTime()
        case 'status':
          return a.status.localeCompare(b.status)
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    return filtered
  }, [allAssets, activeTab, searchQuery, filterStatus, sortBy])

  // Asset counts by type
  const assetCounts = useMemo(() => ({
    all: allAssets.length,
    art: artAssets.length,
    audio: audioAssets.length,
    models: modelAssets.length,
    ui: uiAssets.length
  }), [allAssets.length, artAssets.length, audioAssets.length, modelAssets.length, uiAssets.length])

  const handleAssetSelect = useCallback((assetId: string) => {
    if (!enableSelection) return
    
    setSelectedAssets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assetId)) {
        newSet.delete(assetId)
      } else {
        newSet.add(assetId)
      }
      return newSet
    })
  }, [enableSelection])

  if (allAssets.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gray-700/20 rounded-2xl flex items-center justify-center mb-6">
            <Upload className="w-10 h-10 text-gray-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">No Assets Yet</h3>
            <p className="text-gray-400 text-center max-w-md">
              Your game assets will appear here. AI will generate concept art, music, sound effects, and 3D models as your project develops.
            </p>
          </div>
          <button className="mt-6 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md font-medium transition-colors flex items-center gap-2 mx-auto">
            <Sparkle className="w-4 h-4" />
            Generate Assets
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Asset Generator */}
      <AnimatePresence>
        {showAIGenerator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
          className="flex justify-center"
        >
          <button
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg text-white font-medium transition-colors"
          >
            <Sparkle className="w-4 h-4" />
            Show AI Asset Generator
          </button>
        </motion.div>
      )}

      {/* Header with search and controls */}
      {(showSearch || showFilters) && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div className="flex items-center gap-4 flex-1">
            {showSearch && (
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors"
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex items-center gap-2">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="created">Latest</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                  <option value="category">Category</option>
                </select>

                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="review">Review</option>
                  <option value="in-progress">In Progress</option>
                  <option value="requested">Requested</option>
                </select>
              </div>
            )}
          </div>

          {/* View controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-700/20 rounded-lg p-1 border border-gray-600/30">
              <button
                className={`h-8 w-8 p-0 rounded flex items-center justify-center transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setViewMode('grid')}
              >
                <GridFour className="w-4 h-4" />
              </button>
              <button
                className={`h-8 w-8 p-0 rounded flex items-center justify-center transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {enableSelection && selectedAssets.size > 0 && (
              <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded">
                {selectedAssets.size} selected
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Asset tabs and content */}
      <div className="w-full">
        <div className="flex border-b border-gray-700/50 mb-6">
          {[
            { key: 'all', label: 'All', icon: null, count: assetCounts.all },
            { key: 'art', label: 'Art', icon: <Palette className="w-4 h-4" />, count: assetCounts.art },
            { key: 'audio', label: 'Audio', icon: <MusicNote className="w-4 h-4" />, count: assetCounts.audio },
            { key: 'models', label: 'Models', icon: <Cube className="w-4 h-4" />, count: assetCounts.models },
            { key: 'ui', label: 'UI', icon: <Sparkle className="w-4 h-4" />, count: assetCounts.ui }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label} ({tab.count})</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {filteredAssets.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="text-gray-500 mb-4">
                <MagnifyingGlass className="w-12 h-12 mx-auto mb-2" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">No matching assets</h3>
              <p className="text-gray-400">
                Try adjusting your search or filters
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6' 
                  : 'space-y-3'
              }
            >
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPreview={onPreview}
                  onFavorite={onFavorite}
                  viewMode={viewMode}
                  isSelected={selectedAssets.has(asset.id)}
                  onSelect={enableSelection ? handleAssetSelect : undefined}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AssetGallery
