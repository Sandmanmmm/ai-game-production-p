import { v4 as uuidv4 } from 'uuid';
import { jobQueueService } from './jobQueue';
import { vectorMemoryService } from './vectorMemory';
import { intentParser } from './intentParser';
import {
  GenerateAssetsRequest,
  CreateStylePackRequest,
  ScaffoldCodeRequest,
  SummarizeDocsRequest,
  ToolResponse,
  AssetGenerationResponse,
  StylePackResponse,
  CodeScaffoldResponse,
  DocumentSummaryResponse,
  ProjectContext,
  UserIntent,
  GenerateAssetsSchema,
  CreateStylePackSchema,
  ScaffoldCodeSchema,
  SummarizeDocsSchema
} from '../types/orchestrator';
import {
  AssetGenerationJobData,
  StylePackTrainingJobData,
  QUEUE_NAMES
} from '../types/jobQueue';

export class LLMOrchestrator {
  constructor() {
    this.initializeOrchestrator();
  }

  private async initializeOrchestrator() {
    console.log('🧠 Initializing LLM Orchestrator...');
    // Initialize with sample project context
    await this.seedSampleProject();
    console.log('✅ LLM Orchestrator initialized');
  }

  // Main entry point: Process user request
  async processUserRequest(
    request: string,
    userId: string,
    projectId: string,
    conversationHistory: string[] = []
  ): Promise<ToolResponse> {
    try {
      console.log(`🎯 Processing request: "${request}" for user ${userId}, project ${projectId}`);

      // Parse user intent
      const intent = await intentParser.parseUserIntent(request, projectId);
      console.log(`📋 Parsed intent: ${intent.parsedIntent.action} (confidence: ${intent.parsedIntent.confidence})`);

      // Validate intent against project context
      const projectContext = await vectorMemoryService.getProjectContext(projectId);
      if (!projectContext) {
        return {
          success: false,
          error: 'Project context not found. Please ensure project is properly initialized.'
        };
      }

      // Route to appropriate tool based on intent
      switch (intent.parsedIntent.action) {
        case 'generate_assets':
          return await this.handleAssetGeneration(intent, userId, projectId);
        
        case 'create_style_pack':
          return await this.handleStylePackCreation(intent, userId, projectId);
        
        case 'scaffold_code':
          return await this.handleCodeScaffolding(intent, userId, projectId);
        
        case 'summarize_docs':
          return await this.handleDocumentSummary(intent, userId, projectId);
        
        case 'mixed':
          return await this.handleMixedRequest(intent, userId, projectId);
        
        default:
          return {
            success: false,
            error: `Unknown action: ${intent.parsedIntent.action}`
          };
      }

    } catch (error) {
      console.error('Error processing user request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Tool 1: Generate Assets
  private async handleAssetGeneration(
    intent: UserIntent,
    userId: string,
    projectId: string
  ): Promise<ToolResponse<AssetGenerationResponse>> {
    try {
      // Extract entities from intent
      const entities = intent.parsedIntent.entities;
      const assetType = entities.assetTypes?.[0] || 'sprite';
      const quantity = entities.quantities?.[0] || 1;
      const style = entities.styles?.[0];

      // Get project context for enhanced prompting
      const context = await vectorMemoryService.getAssetGenerationContext(
        projectId,
        assetType,
        intent.originalRequest
      );

      // Build enhanced request
      const enhancedRequest: GenerateAssetsRequest = {
        subject: this.extractSubjectFromRequest(intent.originalRequest),
        type: this.mapAssetType(assetType),
        count: Math.min(quantity, 16), // Limit batch size
        size: this.inferSizeFromType(assetType),
        transparent: true,
        style: style as any,
        format: 'png'
      };

      // Validate request
      const validation = GenerateAssetsSchema.safeParse(enhancedRequest);
      if (!validation.success) {
        return {
          success: false,
          error: `Invalid asset generation request: ${validation.error.message}`
        };
      }

      // Create job data with enhanced prompt
      const enhancedPrompt = this.buildEnhancedAssetPrompt(
        enhancedRequest,
        context,
        intent.originalRequest
      );

      const jobData: AssetGenerationJobData = {
        id: uuidv4(),
        projectId,
        userId,
        prompt: enhancedPrompt,
        assetType: this.mapToJobAssetType(enhancedRequest.type),
        options: {
          batchSize: enhancedRequest.count,
          dimensions: this.parseDimensions(enhancedRequest.size),
          quality: 'standard',
          format: enhancedRequest.format,
          variations: 1
        },
        metadata: {
          tags: [assetType, enhancedRequest.subject],
          category: assetType,
          description: intent.originalRequest
        },
        createdAt: new Date()
      };

      // Queue the job
      const job = await jobQueueService.addAssetGenerationJob(jobData);

      const response: AssetGenerationResponse = {
        assetRequestId: jobData.id,
        jobId: job.id!,
        estimatedCompletion: new Date(Date.now() + enhancedRequest.count * 30000), // 30s per asset
        status: 'queued'
      };

      return {
        success: true,
        data: response,
        metadata: {
          processingTime: 0,
          tokensUsed: enhancedPrompt.length / 4 // Rough estimate
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Asset generation failed'
      };
    }
  }

  // Tool 2: Create Style Pack
  private async handleStylePackCreation(
    intent: UserIntent,
    userId: string,
    projectId: string
  ): Promise<ToolResponse<StylePackResponse>> {
    try {
      // This would typically require reference images upload
      // For now, return a placeholder response
      const stylePackId = uuidv4();
      
      const mockRequest: CreateStylePackRequest = {
        name: `${projectId}-custom-style`,
        description: intent.originalRequest,
        referenceImages: [], // Would be populated from upload
        baseModel: 'SDXL',
        trainingConfig: {
          steps: 1000,
          learningRate: 0.001,
          batchSize: 2,
          resolution: 512
        }
      };

      const response: StylePackResponse = {
        stylePackId,
        trainingJobId: uuidv4(),
        estimatedCompletion: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        status: 'queued'
      };

      return {
        success: true,
        data: response,
        metadata: {
          processingTime: 0
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Style pack creation failed'
      };
    }
  }

  // Tool 3: Scaffold Code
  private async handleCodeScaffolding(
    intent: UserIntent,
    userId: string,
    projectId: string
  ): Promise<ToolResponse<CodeScaffoldResponse>> {
    try {
      // Get code context
      const context = await vectorMemoryService.getCodeScaffoldingContext(
        projectId,
        'component',
        intent.originalRequest
      );

      // Generate basic code scaffold
      const response: CodeScaffoldResponse = {
        files: [
          {
            path: 'src/components/NewComponent.tsx',
            content: this.generateReactComponentScaffold(intent.originalRequest, context),
            language: 'typescript'
          }
        ],
        instructions: [
          'Review the generated component structure',
          'Add specific game logic as needed',
          'Test the component integration'
        ],
        nextSteps: [
          'Implement component logic',
          'Add styling and animations',
          'Write unit tests'
        ]
      };

      return {
        success: true,
        data: response,
        metadata: {
          processingTime: 100
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Code scaffolding failed'
      };
    }
  }

  // Tool 4: Summarize Documents
  private async handleDocumentSummary(
    intent: UserIntent,
    userId: string,
    projectId: string
  ): Promise<ToolResponse<DocumentSummaryResponse>> {
    try {
      // Search for relevant documents
      const docs = await vectorMemoryService.searchDocuments(
        intent.originalRequest,
        projectId,
        5
      );

      const response: DocumentSummaryResponse = {
        summary: this.generateDocumentSummary(docs),
        keyPoints: docs.map(doc => doc.title),
        relatedDocuments: docs.map(doc => doc.id)
      };

      return {
        success: true,
        data: response,
        metadata: {
          processingTime: 50
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document summarization failed'
      };
    }
  }

  // Handle complex requests with multiple actions
  private async handleMixedRequest(
    intent: UserIntent,
    userId: string,
    projectId: string
  ): Promise<ToolResponse> {
    // For mixed requests, break down into components
    // This is a simplified implementation
    return {
      success: true,
      data: {
        message: 'Mixed request detected. Please break down into specific actions.',
        suggestions: [
          'Specify if you want to generate assets',
          'Indicate if you need code scaffolding',
          'Clarify if you want document summaries'
        ]
      }
    };
  }

  // Helper methods
  private mapAssetType(inputType: string): 'sprite' | 'icon' | 'tileset' | 'portrait' | 'concept' | 'ui-element' | 'prop' {
    const typeMap: Record<string, any> = {
      'character': 'sprite',
      'character-design': 'portrait',
      'environment-art': 'tileset',
      'prop-design': 'prop',
      'concept-art': 'concept',
      'ui': 'ui-element'
    };
    
    return typeMap[inputType] || inputType as any;
  }

  private mapToJobAssetType(type: string): 'character-design' | 'environment-art' | 'prop-design' | 'ui-element' | 'concept-art' {
    const jobTypeMap: Record<string, any> = {
      'sprite': 'character-design',
      'portrait': 'character-design',
      'tileset': 'environment-art',
      'icon': 'ui-element',
      'ui-element': 'ui-element',
      'prop': 'prop-design',
      'concept': 'concept-art'
    };
    
    return jobTypeMap[type] || 'concept-art';
  }

  private extractSubjectFromRequest(request: string): string {
    // Simple subject extraction
    const words = request.toLowerCase().split(/\s+/);
    const subjects = ['warrior', 'mage', 'dragon', 'sword', 'castle', 'forest'];
    
    for (const subject of subjects) {
      if (words.includes(subject)) {
        return subject;
      }
    }
    
    return 'game asset';
  }

  private inferSizeFromType(assetType: string): '64x64' | '128x128' | '256x256' | '512x512' | '1024x1024' {
    const sizeMap = {
      'icon': '64x64',
      'sprite': '128x128',
      'portrait': '256x256',
      'tileset': '256x256',
      'concept': '512x512',
      'ui-element': '128x128',
      'prop': '256x256'
    };
    
    return (sizeMap[assetType as keyof typeof sizeMap] as any) || '256x256';
  }

  private parseDimensions(size: string): { width: number; height: number } {
    const [width, height] = size.split('x').map(Number);
    return { width, height };
  }

  private buildEnhancedAssetPrompt(
    request: GenerateAssetsRequest,
    context: any,
    originalRequest: string
  ): string {
    return `Create a ${request.type} of ${request.subject} for a ${context.projectOverview}. 
Style: ${request.style || 'game appropriate'}. 
${context.styleGuidelines}
Technical requirements: ${request.size}, ${request.format}, transparent: ${request.transparent}.
Original request: ${originalRequest}`;
  }

  private generateReactComponentScaffold(request: string, context: any): string {
    return `import React from 'react';

interface NewComponentProps {
  // Add props based on requirements
}

export const NewComponent: React.FC<NewComponentProps> = (props) => {
  // Component logic based on: ${request}
  // Architecture: ${context.projectArchitecture}
  
  return (
    <div className="new-component">
      {/* Implementation needed */}
    </div>
  );
};

export default NewComponent;`;
  }

  private generateDocumentSummary(docs: any[]): string {
    if (docs.length === 0) {
      return 'No relevant documents found.';
    }
    
    return `Found ${docs.length} relevant documents. Key themes include: ${docs.map(doc => doc.title).join(', ')}.`;
  }

  // Seed sample project for development
  private async seedSampleProject() {
    const sampleProject: ProjectContext = {
      id: 'sample-rpg-project',
      name: 'Epic Fantasy RPG',
      description: 'A classic fantasy role-playing game with pixel art style',
      gameType: 'RPG',
      targetPlatform: ['PC', 'Steam'],
      artStyle: 'pixel-art',
      technicalStack: ['React', 'TypeScript', 'Phaser'],
      requirements: [
        'Retro 16-bit aesthetic',
        'Turn-based combat',
        'Character progression',
        'Rich storytelling'
      ],
      assets: {
        characters: ['warrior', 'mage', 'archer'],
        environments: ['forest', 'dungeon', 'castle'],
        props: ['sword', 'shield', 'potion'],
        ui: ['health bar', 'inventory', 'menu']
      },
      styleGuides: [
        'Use 16-bit pixel art style with limited color palette',
        'Characters should be 32x32 pixels',
        'Environments use earthy tones'
      ],
      codebase: {
        languages: ['TypeScript', 'JavaScript'],
        frameworks: ['React', 'Phaser'],
        architecture: 'Component-based with Redux state management'
      },
      timeline: {
        milestones: [
          {
            name: 'Alpha Release',
            deadline: new Date('2025-12-01'),
            deliverables: ['Core gameplay', 'Basic assets']
          }
        ]
      }
    };

    await vectorMemoryService.storeProjectContext(sampleProject);
  }

  // Get project context (for external use)
  async getProjectContext(projectId: string): Promise<ProjectContext | null> {
    return vectorMemoryService.getProjectContext(projectId);
  }

  // Store/update project context
  async updateProjectContext(context: ProjectContext): Promise<void> {
    await vectorMemoryService.storeProjectContext(context);
  }
}

// Singleton instance
export const llmOrchestrator = new LLMOrchestrator();
