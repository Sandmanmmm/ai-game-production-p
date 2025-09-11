// Game Asset Prompt Templates for Accurate Generation

export interface AssetPromptTemplate {
  assetType: string;
  basePrompt: string;
  negativePrompt: string;
  qualityModifiers: string[];
  technicalSpecs: string[];
}

export const ASSET_PROMPT_TEMPLATES: Record<string, AssetPromptTemplate> = {
  'character-design': {
    assetType: 'character-design',
    basePrompt: 'professional game character concept art, full body character design, clean background',
    negativePrompt: 'blurry, low quality, cropped, multiple characters, nsfw, watermark',
    qualityModifiers: [
      'highly detailed',
      'professional game art',
      'concept art style',
      'clear details',
      'game ready design',
      'front view',
      'character sheet style'
    ],
    technicalSpecs: [
      'clean white/transparent background',
      'centered composition',
      'high contrast',
      'sharp details'
    ]
  },
  
  'environment-art': {
    assetType: 'environment-art',
    basePrompt: 'game environment concept art, detailed landscape, atmospheric perspective',
    negativePrompt: 'blurry, low quality, characters, UI elements, text, watermark',
    qualityModifiers: [
      'matte painting style',
      'professional game environment',
      'cinematic composition',
      'detailed background',
      'atmospheric lighting',
      'high resolution'
    ],
    technicalSpecs: [
      'wide aspect ratio',
      'depth of field',
      'environmental storytelling',
      'game engine ready'
    ]
  },

  'prop-design': {
    assetType: 'prop-design',
    basePrompt: 'game prop concept art, detailed object design, isometric or 3/4 view',
    negativePrompt: 'blurry, low quality, multiple objects, characters, cluttered background',
    qualityModifiers: [
      'prop sheet style',
      'clean object design',
      'game asset',
      'detailed textures',
      'professional quality',
      'reference sheet'
    ],
    technicalSpecs: [
      'neutral background',
      'clear silhouette',
      'multiple angles',
      'texture details visible'
    ]
  },

  'ui-element': {
    assetType: 'ui-element',
    basePrompt: 'game UI element design, clean interface component, modern game interface',
    negativePrompt: 'blurry, low quality, complex backgrounds, cluttered design, realistic photos',
    qualityModifiers: [
      'clean UI design',
      'game interface',
      'modern styling',
      'clear iconography',
      'professional UI',
      'vector style'
    ],
    technicalSpecs: [
      'transparent background',
      'scalable design',
      'high contrast',
      'pixel perfect'
    ]
  },

  'concept-art': {
    assetType: 'concept-art',
    basePrompt: 'professional game concept art, detailed illustration, game development artwork',
    negativePrompt: 'blurry, low quality, amateur art, photo realistic, watermark, signature',
    qualityModifiers: [
      'concept art style',
      'professional game art',
      'detailed illustration',
      'artistic composition',
      'painterly style',
      'masterpiece quality'
    ],
    technicalSpecs: [
      'artistic composition',
      'strong focal point',
      'visual storytelling',
      'professional presentation'
    ]
  }
};

export function buildEnhancedPrompt(
  userPrompt: string, 
  assetType: string, 
  stylePreset?: string,
  additionalModifiers?: string[]
): { positivePrompt: string; negativePrompt: string } {
  const template = ASSET_PROMPT_TEMPLATES[assetType] || ASSET_PROMPT_TEMPLATES['concept-art'];
  
  // Build positive prompt
  const components = [
    template.basePrompt,
    userPrompt,
    ...template.qualityModifiers,
    ...template.technicalSpecs,
    ...(additionalModifiers || [])
  ];
  
  if (stylePreset) {
    components.push(stylePreset);
  }
  
  const positivePrompt = components.join(', ');
  
  return {
    positivePrompt,
    negativePrompt: template.negativePrompt
  };
}
