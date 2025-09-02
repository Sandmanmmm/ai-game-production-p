// AI API Client for GameForge Frontend

const API_BASE_URL = 'http://localhost:3001/api';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string;
  };
}

// AI Generation Request Types
export interface StoryGenerationRequest {
  prompt: string;
  gameType?: string;
  genre?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  context?: string;
  provider?: 'huggingface' | 'replicate' | 'local';
}

export interface AssetGenerationRequest {
  prompt: string;
  assetType?: string;
  style?: string;
  size?: string;
  count?: number;
  provider?: 'huggingface' | 'replicate' | 'local';
}

export interface CodeGenerationRequest {
  prompt: string;
  language?: string;
  framework?: string;
  gameType?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  provider?: 'huggingface' | 'replicate' | 'local';
}

// Response Types
export interface StoryGenerationResponse {
  id: string;
  story: string;
  metadata: {
    prompt: string;
    gameType?: string;
    genre?: string;
    tone?: string;
    length?: string;
    provider: string;
    generatedAt: string;
  };
}

export interface AssetGenerationResponse {
  assets: Array<{
    id: string;
    filename?: string;
    path?: string;
    url: string;
    type?: string;
    style?: string;
    size?: string;
  }>;
  metadata: {
    prompt: string;
    assetType?: string;
    style?: string;
    size?: string;
    count?: number;
    provider: string;
    generatedAt: string;
  };
}

export interface CodeGenerationResponse {
  id: string;
  code: string;
  metadata: {
    prompt: string;
    language?: string;
    framework?: string;
    gameType?: string;
    complexity?: string;
    provider: string;
    generatedAt: string;
  };
}

// Utility function to get auth token
function getAuthToken(): string | null {
  const token = localStorage.getItem('gameforge_token');
  return token;
}

// Base API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

// AI API Functions

export async function generateStory(
  request: StoryGenerationRequest
): Promise<APIResponse<StoryGenerationResponse>> {
  return apiCall<StoryGenerationResponse>('/ai/story', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function generateAssets(
  request: AssetGenerationRequest
): Promise<APIResponse<AssetGenerationResponse>> {
  return apiCall<AssetGenerationResponse>('/ai/assets', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function generateCode(
  request: CodeGenerationRequest
): Promise<APIResponse<CodeGenerationResponse>> {
  return apiCall<CodeGenerationResponse>('/ai/code', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Utility functions for AI providers
export const AI_PROVIDERS = {
  HUGGINGFACE: 'huggingface',
  REPLICATE: 'replicate',
  LOCAL: 'local',
} as const;

export const STORY_GENRES = [
  'fantasy',
  'sci-fi',
  'horror',
  'adventure',
  'mystery',
  'romance',
  'comedy',
  'drama',
  'action',
  'thriller',
] as const;

export const STORY_TONES = [
  'heroic',
  'dark',
  'comedic',
  'mysterious',
  'epic',
  'intimate',
  'adventurous',
  'melancholic',
  'whimsical',
  'serious',
] as const;

export const ASSET_TYPES = [
  'concept art',
  'character design',
  'environment art',
  'prop design',
  'ui element',
  'icon',
  'texture',
  'sprite',
  'background',
  'logo',
] as const;

export const ART_STYLES = [
  'fantasy digital art',
  'pixel art',
  'cartoon style',
  'realistic 3D',
  'anime style',
  'minimalist',
  'gothic',
  'cyberpunk',
  'steampunk',
  'watercolor',
] as const;

export const PROGRAMMING_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'csharp',
  'cpp',
  'java',
  'rust',
  'go',
  'lua',
  'gdscript',
] as const;

export const GAME_FRAMEWORKS = [
  'unity',
  'unreal',
  'godot',
  'phaser',
  'three.js',
  'react',
  'vue',
  'pygame',
  'love2d',
  'defold',
] as const;
