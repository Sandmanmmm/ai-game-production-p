import { ProjectContext } from '../types/orchestrator';

// Simple in-memory vector store for development
// In production, this would use pgvector, Qdrant, or similar
export interface DocumentEmbedding {
  id: string;
  projectId: string;
  type: 'design_doc' | 'style_guide' | 'requirements' | 'code' | 'asset_notes';
  title: string;
  content: string;
  embedding: number[]; // In production, use proper embeddings
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    relevanceScore?: number;
  };
}

export class VectorMemoryService {
  private documents: Map<string, DocumentEmbedding> = new Map();
  private projectContexts: Map<string, ProjectContext> = new Map();

  // Store project context
  async storeProjectContext(context: ProjectContext): Promise<void> {
    this.projectContexts.set(context.id, context);
    
    // Index project context as searchable documents
    await this.indexProjectContext(context);
  }

  // Get project context
  async getProjectContext(projectId: string): Promise<ProjectContext | null> {
    return this.projectContexts.get(projectId) || null;
  }

  // Index project context as searchable documents
  private async indexProjectContext(context: ProjectContext): Promise<void> {
    // Index project overview
    await this.storeDocument({
      id: `${context.id}-overview`,
      projectId: context.id,
      type: 'design_doc',
      title: `${context.name} - Project Overview`,
      content: `
        Game: ${context.name}
        Description: ${context.description}
        Game Type: ${context.gameType}
        Art Style: ${context.artStyle}
        Target Platforms: ${context.targetPlatform.join(', ')}
        Technical Stack: ${context.technicalStack.join(', ')}
        Requirements: ${context.requirements.join('; ')}
      `,
      embedding: this.generateSimpleEmbedding(`${context.name} ${context.description} ${context.gameType} ${context.artStyle}`),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['overview', 'project', context.gameType, context.artStyle]
      }
    });

    // Index style guides
    for (const styleGuide of context.styleGuides) {
      await this.storeDocument({
        id: `${context.id}-style-${Date.now()}`,
        projectId: context.id,
        type: 'style_guide',
        title: 'Style Guide',
        content: styleGuide,
        embedding: this.generateSimpleEmbedding(styleGuide),
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['style', 'guide', context.artStyle]
        }
      });
    }

    // Index asset categories
    const assetContent = `
      Characters: ${context.assets.characters.join(', ')}
      Environments: ${context.assets.environments.join(', ')}
      Props: ${context.assets.props.join(', ')}
      UI Elements: ${context.assets.ui.join(', ')}
    `;
    
    await this.storeDocument({
      id: `${context.id}-assets`,
      projectId: context.id,
      type: 'asset_notes',
      title: 'Asset Inventory',
      content: assetContent,
      embedding: this.generateSimpleEmbedding(assetContent),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['assets', 'inventory', 'characters', 'environments', 'props', 'ui']
      }
    });
  }

  // Store document with embedding
  async storeDocument(document: DocumentEmbedding): Promise<void> {
    this.documents.set(document.id, document);
  }

  // Search documents by semantic similarity
  async searchDocuments(
    query: string, 
    projectId: string, 
    limit: number = 5,
    types?: DocumentEmbedding['type'][]
  ): Promise<DocumentEmbedding[]> {
    const queryEmbedding = this.generateSimpleEmbedding(query);
    const projectDocs = Array.from(this.documents.values())
      .filter(doc => doc.projectId === projectId)
      .filter(doc => !types || types.includes(doc.type));

    // Calculate similarity scores
    const scoredDocs = projectDocs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        relevanceScore: this.cosineSimilarity(queryEmbedding, doc.embedding)
      }
    }));

    // Sort by relevance and return top results
    return scoredDocs
      .sort((a, b) => (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0))
      .slice(0, limit);
  }

  // Get relevant context for asset generation
  async getAssetGenerationContext(
    projectId: string,
    assetType: string,
    subject: string
  ): Promise<{
    projectOverview: string;
    styleGuidelines: string;
    existingAssets: string;
    technicalConstraints: string;
  }> {
    const context = await this.getProjectContext(projectId);
    if (!context) {
      return {
        projectOverview: '',
        styleGuidelines: '',
        existingAssets: '',
        technicalConstraints: ''
      };
    }

    // Search for relevant documents
    const query = `${assetType} ${subject} style guide requirements`;
    const relevantDocs = await this.searchDocuments(query, projectId, 3);

    return {
      projectOverview: `Game: ${context.name} (${context.gameType}), Art Style: ${context.artStyle}`,
      styleGuidelines: relevantDocs
        .filter(doc => doc.type === 'style_guide')
        .map(doc => doc.content)
        .join('\n\n'),
      existingAssets: this.formatExistingAssets(context.assets, assetType),
      technicalConstraints: `Platform: ${context.targetPlatform.join(', ')}, Stack: ${context.technicalStack.join(', ')}`
    };
  }

  // Get code scaffolding context
  async getCodeScaffoldingContext(
    projectId: string,
    codeType: string,
    description: string
  ): Promise<{
    projectArchitecture: string;
    existingCode: string;
    patterns: string;
    dependencies: string;
  }> {
    const context = await this.getProjectContext(projectId);
    if (!context) {
      return {
        projectArchitecture: '',
        existingCode: '',
        patterns: '',
        dependencies: ''
      };
    }

    const query = `${codeType} ${description} architecture patterns`;
    const relevantDocs = await this.searchDocuments(query, projectId, 3, ['code', 'requirements']);

    return {
      projectArchitecture: context.codebase.architecture,
      existingCode: relevantDocs
        .filter(doc => doc.type === 'code')
        .map(doc => doc.content)
        .join('\n\n'),
      patterns: `Languages: ${context.codebase.languages.join(', ')}, Frameworks: ${context.codebase.frameworks.join(', ')}`,
      dependencies: context.technicalStack.join(', ')
    };
  }

  // Helper: Format existing assets by type
  private formatExistingAssets(assets: ProjectContext['assets'], targetType: string): string {
    const typeMap = {
      'character': assets.characters,
      'sprite': assets.characters,
      'portrait': assets.characters,
      'environment': assets.environments,
      'tileset': assets.environments,
      'prop': assets.props,
      'icon': assets.ui,
      'ui-element': assets.ui,
      'concept': [...assets.characters, ...assets.environments, ...assets.props]
    };

    const relevantAssets = typeMap[targetType as keyof typeof typeMap] || [];
    return relevantAssets.length > 0 
      ? `Existing ${targetType} assets: ${relevantAssets.join(', ')}`
      : `No existing ${targetType} assets found.`;
  }

  // Simple embedding generation (in production, use OpenAI/Cohere embeddings)
  private generateSimpleEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(128).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % 128] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  // Simple hash function
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Cosine similarity
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Clean up old documents
  async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const now = new Date();
    let deletedCount = 0;

    for (const [id, doc] of this.documents.entries()) {
      if (now.getTime() - doc.metadata.createdAt.getTime() > maxAge) {
        this.documents.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

// Singleton instance
export const vectorMemoryService = new VectorMemoryService();
