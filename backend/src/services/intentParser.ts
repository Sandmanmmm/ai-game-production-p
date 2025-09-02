import { UserIntent } from '../types/orchestrator';

export interface ParsedEntity {
  type: 'asset_type' | 'quantity' | 'style' | 'size' | 'format' | 'subject' | 'code_type' | 'language';
  value: string;
  confidence: number;
}

export class IntentParser {
  // Asset type keywords
  private assetTypeKeywords = {
    'sprite': ['sprite', 'character', 'player', 'enemy', 'npc', 'actor'],
    'icon': ['icon', 'button', 'ui', 'interface', 'menu', 'hud'],
    'tileset': ['tileset', 'tiles', 'terrain', 'map', 'level', 'ground', 'floor', 'wall'],
    'portrait': ['portrait', 'headshot', 'avatar', 'profile', 'face', 'character portrait'],
    'concept': ['concept', 'sketch', 'idea', 'design', 'artwork', 'illustration'],
    'ui-element': ['ui', 'interface', 'element', 'widget', 'control', 'component'],
    'prop': ['prop', 'object', 'item', 'tool', 'weapon', 'furniture', 'decoration']
  };

  // Action keywords
  private actionKeywords = {
    'generate_assets': [
      'generate', 'create', 'make', 'design', 'draw', 'produce', 
      'build', 'craft', 'develop', 'assets', 'art', 'graphics'
    ],
    'create_style_pack': [
      'style pack', 'style', 'train', 'custom style', 'art style', 
      'visual style', 'theme', 'aesthetic', 'look and feel'
    ],
    'scaffold_code': [
      'code', 'script', 'program', 'develop', 'implement', 'write code',
      'component', 'system', 'function', 'class', 'module'
    ],
    'summarize_docs': [
      'summarize', 'summary', 'overview', 'explain', 'describe',
      'document', 'docs', 'documentation', 'notes'
    ]
  };

  // Style keywords
  private styleKeywords = {
    'pixel-art': ['pixel', 'pixelart', '8-bit', '16-bit', 'retro', 'arcade'],
    'hand-drawn': ['hand-drawn', 'sketched', 'drawn', 'artistic', 'painted'],
    'realistic': ['realistic', 'photorealistic', 'lifelike', 'detailed', 'high-fidelity'],
    'cartoon': ['cartoon', 'cartoonish', 'animated', 'stylized', 'cel-shaded'],
    'minimalist': ['minimalist', 'simple', 'clean', 'basic', 'geometric']
  };

  // Size keywords  
  private sizeKeywords = {
    '64x64': ['64', '64x64', 'small', 'tiny', 'icon size'],
    '128x128': ['128', '128x128', 'medium', 'standard'],
    '256x256': ['256', '256x256', 'large', 'big'],
    '512x512': ['512', '512x512', 'huge', 'xl', 'extra large'],
    '1024x1024': ['1024', '1024x1024', 'massive', 'xxl', 'ultra large']
  };

  // Quantity extractors
  private quantityRegex = /(\d+)\s*(assets?|items?|pieces?|sprites?|icons?|characters?)/i;
  private rangeRegex = /(\d+)\s*-\s*(\d+)/;

  async parseUserIntent(request: string, projectId?: string): Promise<UserIntent> {
    const lowercaseRequest = request.toLowerCase();
    
    // Extract entities
    const entities = this.extractEntities(lowercaseRequest);
    
    // Determine primary action
    const action = this.determineAction(lowercaseRequest, entities);
    
    // Calculate confidence based on keyword matches and entity quality
    const confidence = this.calculateConfidence(lowercaseRequest, action, entities);

    return {
      originalRequest: request,
      parsedIntent: {
        action,
        confidence,
        entities: {
          assetTypes: entities.filter(e => e.type === 'asset_type').map(e => e.value),
          quantities: entities.filter(e => e.type === 'quantity').map(e => parseInt(e.value)),
          styles: entities.filter(e => e.type === 'style').map(e => e.value),
          technical: entities.filter(e => e.type === 'code_type' || e.type === 'language').map(e => e.value)
        }
      },
      contextRelevance: {
        projectAlignment: 0.8, // Would be calculated based on project context
        styleConsistency: 0.7,  // Would check against existing style packs
        technicalFeasibility: 0.9 // Would validate against technical constraints
      }
    };
  }

  private extractEntities(text: string): ParsedEntity[] {
    const entities: ParsedEntity[] = [];

    // Extract asset types
    for (const [assetType, keywords] of Object.entries(this.assetTypeKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          entities.push({
            type: 'asset_type',
            value: assetType,
            confidence: this.calculateKeywordConfidence(keyword, text)
          });
          break; // Only add once per asset type
        }
      }
    }

    // Extract styles
    for (const [style, keywords] of Object.entries(this.styleKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          entities.push({
            type: 'style',
            value: style,
            confidence: this.calculateKeywordConfidence(keyword, text)
          });
          break;
        }
      }
    }

    // Extract sizes
    for (const [size, keywords] of Object.entries(this.sizeKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          entities.push({
            type: 'size',
            value: size,
            confidence: this.calculateKeywordConfidence(keyword, text)
          });
          break;
        }
      }
    }

    // Extract quantities
    const quantityMatch = text.match(this.quantityRegex);
    if (quantityMatch) {
      entities.push({
        type: 'quantity',
        value: quantityMatch[1],
        confidence: 0.9
      });
    }

    // Extract ranges (e.g., "5-10 sprites")
    const rangeMatch = text.match(this.rangeRegex);
    if (rangeMatch) {
      const avg = Math.floor((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
      entities.push({
        type: 'quantity',
        value: avg.toString(),
        confidence: 0.8
      });
    }

    // Extract subjects (nouns that might be asset subjects)
    const subjects = this.extractSubjects(text);
    for (const subject of subjects) {
      entities.push({
        type: 'subject',
        value: subject,
        confidence: 0.6
      });
    }

    return entities;
  }

  private determineAction(
    text: string, 
    entities: ParsedEntity[]
  ): UserIntent['parsedIntent']['action'] {
    const actionScores = {
      generate_assets: 0,
      create_style_pack: 0,
      scaffold_code: 0,
      summarize_docs: 0,
      mixed: 0
    };

    // Score based on action keywords
    for (const [action, keywords] of Object.entries(this.actionKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          actionScores[action as keyof typeof actionScores] += 1;
        }
      }
    }

    // Boost scores based on entity types
    const hasAssetEntities = entities.some(e => e.type === 'asset_type' || e.type === 'quantity');
    const hasCodeEntities = entities.some(e => e.type === 'code_type' || e.type === 'language');
    const hasStyleEntities = entities.some(e => e.type === 'style');

    if (hasAssetEntities) actionScores.generate_assets += 2;
    if (hasCodeEntities) actionScores.scaffold_code += 2;
    if (hasStyleEntities && text.includes('train')) actionScores.create_style_pack += 2;

    // Special patterns
    if (text.includes('multiple') || text.includes('different')) {
      actionScores.mixed += 1;
    }

    // Return action with highest score
    const maxScore = Math.max(...Object.values(actionScores));
    const topAction = Object.entries(actionScores).find(([_, score]) => score === maxScore);
    
    return (topAction?.[0] as UserIntent['parsedIntent']['action']) || 'generate_assets';
  }

  private calculateConfidence(
    text: string,
    action: UserIntent['parsedIntent']['action'],
    entities: ParsedEntity[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost for specific keywords
    if (action !== 'mixed') {
      const actionKeywords = this.actionKeywords[action] || [];
      const keywordMatches = actionKeywords.filter((keyword: string) => text.includes(keyword)).length;
      confidence += (keywordMatches / actionKeywords.length) * 0.3;
    }

    // Boost for high-confidence entities
    const highConfidenceEntities = entities.filter(e => e.confidence > 0.7).length;
    confidence += (highConfidenceEntities / Math.max(entities.length, 1)) * 0.2;

    // Penalty for ambiguous requests
    if (text.length < 10) confidence -= 0.2;
    if (entities.length === 0) confidence -= 0.3;

    return Math.max(0, Math.min(1, confidence));
  }

  private calculateKeywordConfidence(keyword: string, text: string): number {
    const exactMatch = text === keyword;
    const wordBoundaryMatch = new RegExp(`\\b${keyword}\\b`).test(text);
    const partialMatch = text.includes(keyword);

    if (exactMatch) return 0.95;
    if (wordBoundaryMatch) return 0.85;
    if (partialMatch) return 0.7;
    return 0.5;
  }

  private extractSubjects(text: string): string[] {
    // Simple subject extraction - in production, use NLP library
    const words = text.split(/\s+/);
    const subjects: string[] = [];
    
    // Common game asset subjects
    const commonSubjects = [
      'warrior', 'mage', 'knight', 'archer', 'rogue', 'wizard',
      'dragon', 'goblin', 'orc', 'skeleton', 'zombie', 'demon',
      'sword', 'shield', 'bow', 'staff', 'potion', 'gem',
      'castle', 'forest', 'dungeon', 'cave', 'temple', 'tower',
      'fire', 'water', 'earth', 'air', 'ice', 'lightning',
      'coin', 'key', 'chest', 'door', 'wall', 'floor'
    ];

    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (commonSubjects.includes(cleanWord) && !subjects.includes(cleanWord)) {
        subjects.push(cleanWord);
      }
    }

    return subjects.slice(0, 3); // Limit to 3 subjects
  }

  // Advanced: Extract context from previous conversations
  async parseWithConversationContext(
    request: string,
    conversationHistory: string[],
    projectId?: string
  ): Promise<UserIntent> {
    // Analyze conversation history for context
    const recentContext = conversationHistory.slice(-3).join(' ');
    const enhancedRequest = `${recentContext} ${request}`;
    
    return this.parseUserIntent(enhancedRequest, projectId);
  }

  // Validate parsed intent against project constraints
  validateIntentAgainstProject(
    intent: UserIntent,
    projectContext: any
  ): { valid: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check asset type compatibility
    if (intent.parsedIntent.action === 'generate_assets') {
      const assetTypes = intent.parsedIntent.entities.assetTypes;
      if (assetTypes?.length === 0) {
        issues.push('No asset type specified');
        suggestions.push('Specify what type of asset you want (sprite, icon, tileset, etc.)');
      }

      // Check quantities
      const quantities = intent.parsedIntent.entities.quantities;
      if (quantities && quantities.some(q => q > 32)) {
        issues.push('Quantity too high for single request');
        suggestions.push('Consider breaking large requests into smaller batches');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// Singleton instance
export const intentParser = new IntentParser();
