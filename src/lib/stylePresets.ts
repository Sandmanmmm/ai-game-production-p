// Style Preset System for AI Asset Generation
// Optimized prompts and settings for consistent, high-quality AI art generation

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  promptModifiers: string[];
  thumbnailUrl: string;
  category: StyleCategory;
  aiOptimized: boolean;
  qualitySettings: QualitySettings;
  tags: string[];
  popularityScore: number;
}

export interface QualitySettings {
  steps: number;
  guidance: number;
  strength?: number;
  cfgScale?: number;
  samplingMethod?: string;
}

export type StyleCategory = 
  | 'fantasy' 
  | 'sci-fi' 
  | 'pixel' 
  | 'realistic' 
  | 'cartoon' 
  | 'minimalist'
  | 'concept-art'
  | 'character'
  | 'environment'
  | 'ui-design';

export interface CustomStylePreset extends Omit<StylePreset, 'id' | 'popularityScore'> {
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  usageCount: number;
}

// Curated Style Presets - Optimized for AI Generation
export const STYLE_PRESETS: StylePreset[] = [
  // Fantasy Category
  {
    id: 'fantasy-digital-art',
    name: 'Fantasy Digital Art',
    description: 'Rich, detailed fantasy artwork with magical elements and ethereal lighting',
    promptModifiers: [
      'fantasy digital art',
      'highly detailed',
      'magical atmosphere',
      'ethereal lighting',
      'rich colors',
      'mystical',
      'masterpiece quality'
    ],
    thumbnailUrl: '/style-previews/fantasy-digital-art.jpg',
    category: 'fantasy',
    aiOptimized: true,
    qualitySettings: {
      steps: 30,
      guidance: 8.0,
      cfgScale: 7.5
    },
    tags: ['fantasy', 'detailed', 'magical', 'digital-art'],
    popularityScore: 95
  },
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    description: 'Moody, atmospheric fantasy with darker themes and gothic elements',
    promptModifiers: [
      'dark fantasy',
      'gothic atmosphere',
      'moody lighting',
      'dramatic shadows',
      'dark palette',
      'atmospheric',
      'cinematic'
    ],
    thumbnailUrl: '/style-previews/dark-fantasy.jpg',
    category: 'fantasy',
    aiOptimized: true,
    qualitySettings: {
      steps: 35,
      guidance: 8.5,
      cfgScale: 8.0
    },
    tags: ['dark', 'gothic', 'moody', 'atmospheric'],
    popularityScore: 88
  },

  // Sci-Fi Category
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Futuristic cyberpunk aesthetic with neon lights and high-tech elements',
    promptModifiers: [
      'cyberpunk',
      'neon lights',
      'futuristic',
      'high tech',
      'neon colors',
      'sci-fi',
      'digital art',
      'blade runner style'
    ],
    thumbnailUrl: '/style-previews/cyberpunk-neon.jpg',
    category: 'sci-fi',
    aiOptimized: true,
    qualitySettings: {
      steps: 32,
      guidance: 7.8,
      cfgScale: 7.2
    },
    tags: ['cyberpunk', 'neon', 'futuristic', 'sci-fi'],
    popularityScore: 92
  },
  {
    id: 'space-opera',
    name: 'Space Opera',
    description: 'Epic space scenes with starships, alien worlds, and cosmic grandeur',
    promptModifiers: [
      'space opera',
      'epic scale',
      'starships',
      'alien worlds',
      'cosmic',
      'sci-fi concept art',
      'dramatic lighting',
      'vast scale'
    ],
    thumbnailUrl: '/style-previews/space-opera.jpg',
    category: 'sci-fi',
    aiOptimized: true,
    qualitySettings: {
      steps: 28,
      guidance: 7.5,
      cfgScale: 7.0
    },
    tags: ['space', 'epic', 'cosmic', 'starships'],
    popularityScore: 85
  },

  // Pixel Art Category
  {
    id: 'retro-pixel-art',
    name: 'Retro Pixel Art',
    description: 'Classic 16-bit style pixel art with vibrant colors and sharp pixels',
    promptModifiers: [
      'pixel art',
      '16-bit style',
      'retro gaming',
      'sharp pixels',
      'vibrant colors',
      'classic arcade',
      'nostalgic',
      '8-bit aesthetic'
    ],
    thumbnailUrl: '/style-previews/retro-pixel-art.jpg',
    category: 'pixel',
    aiOptimized: true,
    qualitySettings: {
      steps: 25,
      guidance: 9.0,
      cfgScale: 8.5
    },
    tags: ['pixel', 'retro', '16-bit', 'arcade'],
    popularityScore: 90
  },
  {
    id: 'modern-pixel-art',
    name: 'Modern Pixel Art',
    description: 'Contemporary pixel art with refined techniques and smooth animations',
    promptModifiers: [
      'modern pixel art',
      'refined pixels',
      'smooth gradients',
      'contemporary style',
      'high resolution pixel art',
      'detailed sprites',
      'indie game style'
    ],
    thumbnailUrl: '/style-previews/modern-pixel-art.jpg',
    category: 'pixel',
    aiOptimized: true,
    qualitySettings: {
      steps: 30,
      guidance: 8.2,
      cfgScale: 7.8
    },
    tags: ['pixel', 'modern', 'refined', 'indie'],
    popularityScore: 87
  },

  // Realistic Category
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'Highly detailed photorealistic rendering with accurate lighting and textures',
    promptModifiers: [
      'photorealistic',
      'highly detailed',
      'realistic lighting',
      'accurate textures',
      'professional photography',
      'high resolution',
      'sharp focus',
      'ultra realistic'
    ],
    thumbnailUrl: '/style-previews/photorealistic.jpg',
    category: 'realistic',
    aiOptimized: true,
    qualitySettings: {
      steps: 40,
      guidance: 6.5,
      cfgScale: 6.0
    },
    tags: ['realistic', 'photorealistic', 'detailed', 'professional'],
    popularityScore: 83
  },

  // Cartoon Category
  {
    id: 'disney-style',
    name: 'Disney Style',
    description: 'Classic Disney animation style with expressive characters and warm colors',
    promptModifiers: [
      'Disney style',
      'animated character',
      'expressive features',
      'warm colors',
      'family friendly',
      'classic animation',
      'wholesome',
      'professional animation'
    ],
    thumbnailUrl: '/style-previews/disney-style.jpg',
    category: 'cartoon',
    aiOptimized: true,
    qualitySettings: {
      steps: 28,
      guidance: 7.2,
      cfgScale: 7.0
    },
    tags: ['disney', 'cartoon', 'animated', 'family-friendly'],
    popularityScore: 91
  },
  {
    id: 'anime-style',
    name: 'Anime Style',
    description: 'Japanese anime/manga style with characteristic features and vibrant colors',
    promptModifiers: [
      'anime style',
      'manga art',
      'japanese animation',
      'vibrant colors',
      'expressive eyes',
      'clean lines',
      'cel shading',
      'high quality anime'
    ],
    thumbnailUrl: '/style-previews/anime-style.jpg',
    category: 'cartoon',
    aiOptimized: true,
    qualitySettings: {
      steps: 32,
      guidance: 8.0,
      cfgScale: 7.5
    },
    tags: ['anime', 'manga', 'japanese', 'vibrant'],
    popularityScore: 94
  },

  // Minimalist Category
  {
    id: 'clean-minimalist',
    name: 'Clean Minimalist',
    description: 'Simple, clean designs with minimal elements and plenty of white space',
    promptModifiers: [
      'minimalist design',
      'clean lines',
      'simple shapes',
      'white space',
      'geometric',
      'modern design',
      'uncluttered',
      'elegant simplicity'
    ],
    thumbnailUrl: '/style-previews/clean-minimalist.jpg',
    category: 'minimalist',
    aiOptimized: true,
    qualitySettings: {
      steps: 25,
      guidance: 6.8,
      cfgScale: 6.5
    },
    tags: ['minimalist', 'clean', 'simple', 'modern'],
    popularityScore: 78
  },

  // Concept Art Category
  {
    id: 'game-concept-art',
    name: 'Game Concept Art',
    description: 'Professional game concept art with detailed environments and characters',
    promptModifiers: [
      'game concept art',
      'professional illustration',
      'detailed environment',
      'character design',
      'production art',
      'high quality concept',
      'game development',
      'digital painting'
    ],
    thumbnailUrl: '/style-previews/game-concept-art.jpg',
    category: 'concept-art',
    aiOptimized: true,
    qualitySettings: {
      steps: 35,
      guidance: 7.8,
      cfgScale: 7.3
    },
    tags: ['concept-art', 'professional', 'game-dev', 'illustration'],
    popularityScore: 89
  },

  // UI Design Category
  {
    id: 'modern-ui-design',
    name: 'Modern UI Design',
    description: 'Clean, modern user interface elements with contemporary design principles',
    promptModifiers: [
      'modern UI design',
      'user interface',
      'clean design',
      'contemporary style',
      'professional UI',
      'sleek interface',
      'modern graphics',
      'polished design'
    ],
    thumbnailUrl: '/style-previews/modern-ui-design.jpg',
    category: 'ui-design',
    aiOptimized: true,
    qualitySettings: {
      steps: 25,
      guidance: 7.0,
      cfgScale: 6.8
    },
    tags: ['ui', 'interface', 'modern', 'clean'],
    popularityScore: 82
  }
];

// Style Preset Utilities
export class StylePresetManager {
  private presets: StylePreset[];
  private customPresets: CustomStylePreset[];

  constructor() {
    this.presets = [...STYLE_PRESETS];
    this.customPresets = [];
  }

  // Get all presets
  getAllPresets(): StylePreset[] {
    return this.presets;
  }

  // Get presets by category
  getPresetsByCategory(category: StyleCategory): StylePreset[] {
    return this.presets.filter(preset => preset.category === category);
  }

  // Get popular presets
  getPopularPresets(limit: number = 6): StylePreset[] {
    return this.presets
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
  }

  // Search presets
  searchPresets(query: string): StylePreset[] {
    const lowerQuery = query.toLowerCase();
    return this.presets.filter(preset =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Get preset by ID
  getPresetById(id: string): StylePreset | undefined {
    return this.presets.find(preset => preset.id === id);
  }

  // Apply preset to prompt
  applyPresetToPrompt(preset: StylePreset, basePrompt: string): string {
    const modifiers = preset.promptModifiers.join(', ');
    return `${basePrompt}, ${modifiers}`;
  }

  // Get recommended presets based on context
  getRecommendedPresets(context: {
    gameType?: string;
    assetType?: string;
    currentStyle?: string;
  }): StylePreset[] {
    // Simple recommendation logic - can be enhanced with ML
    let recommendations: StylePreset[] = [];

    // Game type based recommendations
    if (context.gameType?.toLowerCase().includes('rpg')) {
      recommendations.push(...this.getPresetsByCategory('fantasy'));
    }
    if (context.gameType?.toLowerCase().includes('space') || 
        context.gameType?.toLowerCase().includes('sci')) {
      recommendations.push(...this.getPresetsByCategory('sci-fi'));
    }
    if (context.gameType?.toLowerCase().includes('retro') ||
        context.gameType?.toLowerCase().includes('arcade')) {
      recommendations.push(...this.getPresetsByCategory('pixel'));
    }

    // Asset type based recommendations
    if (context.assetType?.toLowerCase().includes('character')) {
      recommendations.push(
        ...this.presets.filter(p => p.tags.includes('character') || 
                                   p.category === 'cartoon')
      );
    }
    if (context.assetType?.toLowerCase().includes('ui')) {
      recommendations.push(...this.getPresetsByCategory('ui-design'));
    }

    // Remove duplicates and limit
    const uniqueRecommendations = recommendations.filter(
      (preset, index, self) => 
        index === self.findIndex(p => p.id === preset.id)
    );

    return uniqueRecommendations.slice(0, 6);
  }

  // Add custom preset
  addCustomPreset(preset: CustomStylePreset): void {
    this.customPresets.push(preset);
  }

  // Get user's custom presets
  getUserCustomPresets(userId: string): CustomStylePreset[] {
    return this.customPresets.filter(preset => preset.userId === userId);
  }
}

// Export singleton instance
export const stylePresetManager = new StylePresetManager();
