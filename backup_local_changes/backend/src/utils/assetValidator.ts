// Asset Quality Validation System
// Analyzes generated assets for game-readiness and quality

export interface AssetValidationResult {
  isValid: boolean;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'composition' | 'quality' | 'style' | 'technical';
  severity: 'low' | 'medium' | 'high';
  description: string;
  fix?: string;
}

export class AssetValidator {
  static async validateAsset(
    imageUrl: string, 
    assetType: string,
    expectedStyle: string
  ): Promise<AssetValidationResult> {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    
    try {
      // Basic image analysis
      const imageMetadata = await this.analyzeImageMetadata(imageUrl);
      
      // Resolution validation
      if (imageMetadata.width < 512 || imageMetadata.height < 512) {
        issues.push({
          type: 'technical',
          severity: 'high',
          description: 'Image resolution too low for game assets',
          fix: 'Regenerate with higher resolution (512x512 minimum)'
        });
      }
      
      // Aspect ratio validation for specific asset types
      if (assetType === 'character-design') {
        const aspectRatio = imageMetadata.width / imageMetadata.height;
        if (aspectRatio < 0.5 || aspectRatio > 1.5) {
          issues.push({
            type: 'composition',
            severity: 'medium',
            description: 'Unusual aspect ratio for character design',
            fix: 'Use portrait orientation for character assets'
          });
        }
      }
      
      // Quality assessment based on file size and compression
      const expectedFileSize = imageMetadata.width * imageMetadata.height * 3; // Rough estimate
      if (imageMetadata.fileSize < expectedFileSize * 0.1) {
        issues.push({
          type: 'quality',
          severity: 'high',
          description: 'Image appears heavily compressed or low quality',
          fix: 'Regenerate with higher quality settings'
        });
      }
      
      // Style consistency check (simplified - in production use AI vision models)
      if (expectedStyle.includes('pixel') && imageMetadata.width > 64) {
        suggestions.push('Consider using smaller resolution for pixel art style');
      }
      
      // Overall quality assessment
      let quality: AssetValidationResult['quality'] = 'good';
      const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
      const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;
      
      if (highSeverityIssues > 1) quality = 'poor';
      else if (highSeverityIssues > 0 || mediumSeverityIssues > 2) quality = 'fair';
      else if (issues.length === 0) quality = 'excellent';
      
      return {
        isValid: quality !== 'poor',
        quality,
        issues,
        suggestions
      };
      
    } catch (error) {
      return {
        isValid: false,
        quality: 'poor',
        issues: [{
          type: 'technical',
          severity: 'high',
          description: 'Failed to validate asset',
          fix: 'Try regenerating the asset'
        }],
        suggestions: []
      };
    }
  }
  
  private static async analyzeImageMetadata(imageUrl: string) {
    // Simplified metadata analysis
    // In production, use proper image analysis libraries
    return {
      width: 512, // Would get from actual image
      height: 512,
      fileSize: 1024 * 100, // 100KB estimate
      format: 'png'
    };
  }
  
  static getRecommendedSettings(assetType: string) {
    const settings: Record<string, any> = {
      'character-design': {
        resolution: '512x768',
        steps: 35,
        guidance: 8.0,
        aspectRatio: 'portrait'
      },
      'environment-art': {
        resolution: '768x512',
        steps: 30,
        guidance: 7.5,
        aspectRatio: 'landscape'
      },
      'prop-design': {
        resolution: '512x512',
        steps: 30,
        guidance: 8.5,
        aspectRatio: 'square'
      },
      'ui-element': {
        resolution: '256x256',
        steps: 25,
        guidance: 9.0,
        aspectRatio: 'square'
      }
    };
    
    return settings[assetType] || settings['character-design'];
  }
}
