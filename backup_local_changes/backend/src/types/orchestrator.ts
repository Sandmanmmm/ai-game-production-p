import { z } from 'zod';

// Tool Contract Schemas (Zod)
export const GenerateAssetsSchema = z.object({
  stylePackId: z.string().uuid().optional(),
  subject: z.string().min(1).max(500),
  type: z.enum(['sprite', 'icon', 'tileset', 'portrait', 'concept', 'ui-element', 'prop']),
  count: z.number().int().min(1).max(64),
  size: z.enum(['64x64', '128x128', '256x256', '512x512', '1024x1024']),
  transparent: z.boolean().default(true),
  palette: z.enum(['warm', 'cool', 'neutral', 'vibrant', 'muted']).optional(),
  style: z.enum(['pixel-art', 'hand-drawn', 'realistic', 'cartoon', 'minimalist']).optional(),
  format: z.enum(['png', 'webp', 'svg']).default('png')
});

export const CreateStylePackSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  referenceImages: z.array(z.string().url()).min(5).max(50),
  baseModel: z.enum(['SDXL', 'SD1.5', 'custom']).default('SDXL'),
  trainingConfig: z.object({
    steps: z.number().int().min(100).max(2000).default(1000),
    learningRate: z.number().min(0.0001).max(0.01).default(0.001),
    batchSize: z.number().int().min(1).max(8).default(2),
    resolution: z.number().int().min(512).max(1024).default(512)
  })
});

export const ScaffoldCodeSchema = z.object({
  type: z.enum(['component', 'system', 'script', 'shader', 'config']),
  language: z.enum(['typescript', 'javascript', 'glsl', 'json', 'yaml']),
  framework: z.enum(['react', 'vue', 'unity', 'godot', 'phaser', 'vanilla']).optional(),
  description: z.string().min(10).max(1000),
  requirements: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional()
});

export const SummarizeDocsSchema = z.object({
  documentIds: z.array(z.string().uuid()),
  summaryType: z.enum(['overview', 'technical', 'requirements', 'changes']),
  maxLength: z.number().int().min(100).max(2000).default(500)
});

// Request/Response Types
export type GenerateAssetsRequest = z.infer<typeof GenerateAssetsSchema>;
export type CreateStylePackRequest = z.infer<typeof CreateStylePackSchema>;
export type ScaffoldCodeRequest = z.infer<typeof ScaffoldCodeSchema>;
export type SummarizeDocsRequest = z.infer<typeof SummarizeDocsSchema>;

// Tool Response Types
export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime: number;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface AssetGenerationResponse {
  assetRequestId: string;
  jobId: string;
  estimatedCompletion: Date;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  assets?: Array<{
    id: string;
    url: string;
    metadata: any;
  }>;
}

export interface StylePackResponse {
  stylePackId: string;
  trainingJobId: string;
  estimatedCompletion: Date;
  status: 'queued' | 'training' | 'completed' | 'failed';
}

export interface CodeScaffoldResponse {
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  instructions: string[];
  nextSteps: string[];
}

export interface DocumentSummaryResponse {
  summary: string;
  keyPoints: string[];
  actionItems?: string[];
  relatedDocuments?: string[];
}

// Orchestrator Context Types
export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  gameType: string;
  targetPlatform: string[];
  artStyle: string;
  technicalStack: string[];
  requirements: string[];
  assets: {
    characters: string[];
    environments: string[];
    props: string[];
    ui: string[];
  };
  styleGuides: string[];
  codebase: {
    languages: string[];
    frameworks: string[];
    architecture: string;
  };
  timeline: {
    milestones: Array<{
      name: string;
      deadline: Date;
      deliverables: string[];
    }>;
  };
}

export interface UserIntent {
  originalRequest: string;
  parsedIntent: {
    action: 'generate_assets' | 'create_style_pack' | 'scaffold_code' | 'summarize_docs' | 'mixed';
    confidence: number;
    entities: {
      assetTypes?: string[];
      quantities?: number[];
      styles?: string[];
      technical?: string[];
    };
  };
  contextRelevance: {
    projectAlignment: number;
    styleConsistency: number;
    technicalFeasibility: number;
  };
}
