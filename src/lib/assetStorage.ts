// Asset Storage and Management System
// Handles storage, organization, and metadata for AI-generated assets

export interface GeneratedAsset {
  id: string;
  filename: string;
  originalFilename?: string;
  path: string;
  url: string;
  type: AssetType;
  format: string;
  size: number; // bytes
  dimensions?: {
    width: number;
    height: number;
  };
  metadata: AssetMetadata;
  createdAt: Date;
  updatedAt: Date;
  status: AssetStatus;
  versions: AssetVersion[];
}

export interface AssetMetadata {
  // Generation details
  prompt: string;
  stylePreset?: string;
  provider: 'huggingface' | 'replicate' | 'local';
  generationSettings: {
    steps: number;
    guidance: number;
    seed?: number;
    quality: 'draft' | 'standard' | 'high' | 'ultra';
  };
  
  // Content information
  tags: string[];
  description?: string;
  category: AssetCategory;
  gameProject?: string;
  
  // Usage tracking
  downloads: number;
  favorites: number;
  views: number;
  usage: AssetUsage[];
  
  // AI analysis (future enhancement)
  aiAnalysis?: {
    detectedObjects: string[];
    colorPalette: string[];
    style: string;
    quality: number;
  };
}

export interface AssetVersion {
  id: string;
  versionNumber: number;
  filename: string;
  path: string;
  url: string;
  changes: string;
  createdAt: Date;
  size: number;
}

export interface AssetUsage {
  projectId: string;
  projectName: string;
  usageType: 'texture' | 'sprite' | 'concept' | 'reference' | 'ui-element';
  addedAt: Date;
}

export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  assets: string[]; // asset IDs
  tags: string[];
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  thumbnail?: string;
}

export type AssetType = 
  | 'concept-art'
  | 'character-design' 
  | 'environment-art'
  | 'prop-design'
  | 'ui-element'
  | 'icon'
  | 'texture'
  | 'sprite'
  | 'background'
  | 'logo';

export type AssetCategory = 
  | 'fantasy'
  | 'sci-fi'
  | 'modern'
  | 'historical'
  | 'abstract'
  | 'nature'
  | 'architecture'
  | 'character'
  | 'vehicle'
  | 'weapon'
  | 'ui';

export type AssetStatus = 
  | 'generating'
  | 'ready'
  | 'processing'
  | 'error'
  | 'archived';

export interface AssetSearchCriteria {
  query?: string;
  type?: AssetType;
  category?: AssetCategory;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  provider?: string;
  quality?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'downloads' | 'favorites' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AssetOrganizationCriteria {
  groupBy: 'type' | 'category' | 'date' | 'project' | 'style';
  filterBy?: AssetSearchCriteria;
}

// Local Storage Implementation
class LocalAssetStorage {
  private assets: Map<string, GeneratedAsset> = new Map();
  private collections: Map<string, AssetCollection> = new Map();
  private readonly STORAGE_KEY = 'gameforge_assets';
  private readonly COLLECTIONS_KEY = 'gameforge_collections';

  constructor() {
    this.loadFromLocalStorage();
  }

  // Asset Management
  async saveAsset(asset: GeneratedAsset): Promise<void> {
    asset.updatedAt = new Date();
    this.assets.set(asset.id, asset);
    await this.saveToLocalStorage();
  }

  async getAsset(id: string): Promise<GeneratedAsset | null> {
    return this.assets.get(id) || null;
  }

  async getAllAssets(): Promise<GeneratedAsset[]> {
    return Array.from(this.assets.values());
  }

  async deleteAsset(id: string): Promise<void> {
    this.assets.delete(id);
    await this.saveToLocalStorage();
  }

  // Search and Filter
  async searchAssets(criteria: AssetSearchCriteria): Promise<GeneratedAsset[]> {
    let results = Array.from(this.assets.values());

    // Apply filters
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(asset =>
        asset.metadata.prompt.toLowerCase().includes(query) ||
        asset.metadata.description?.toLowerCase().includes(query) ||
        asset.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
        asset.filename.toLowerCase().includes(query)
      );
    }

    if (criteria.type) {
      results = results.filter(asset => asset.type === criteria.type);
    }

    if (criteria.category) {
      results = results.filter(asset => asset.metadata.category === criteria.category);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(asset =>
        criteria.tags!.some(tag =>
          asset.metadata.tags.some(assetTag =>
            assetTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (criteria.provider) {
      results = results.filter(asset => asset.metadata.provider === criteria.provider);
    }

    if (criteria.dateRange) {
      results = results.filter(asset =>
        asset.createdAt >= criteria.dateRange!.start &&
        asset.createdAt <= criteria.dateRange!.end
      );
    }

    // Apply sorting
    if (criteria.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (criteria.sortBy) {
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'updatedAt':
            aValue = a.updatedAt;
            bValue = b.updatedAt;
            break;
          case 'downloads':
            aValue = a.metadata.downloads;
            bValue = b.metadata.downloads;
            break;
          case 'favorites':
            aValue = a.metadata.favorites;
            bValue = b.metadata.favorites;
            break;
          case 'name':
            aValue = a.filename;
            bValue = b.filename;
            break;
          default:
            return 0;
        }

        if (criteria.sortOrder === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    // Apply pagination
    if (criteria.offset || criteria.limit) {
      const start = criteria.offset || 0;
      const end = criteria.limit ? start + criteria.limit : undefined;
      results = results.slice(start, end);
    }

    return results;
  }

  // Collection Management
  async createCollection(collection: AssetCollection): Promise<void> {
    this.collections.set(collection.id, collection);
    await this.saveToLocalStorage();
  }

  async getCollection(id: string): Promise<AssetCollection | null> {
    return this.collections.get(id) || null;
  }

  async getAllCollections(): Promise<AssetCollection[]> {
    return Array.from(this.collections.values());
  }

  async addAssetToCollection(collectionId: string, assetId: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (collection && !collection.assets.includes(assetId)) {
      collection.assets.push(assetId);
      await this.saveToLocalStorage();
    }
  }

  async removeAssetFromCollection(collectionId: string, assetId: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (collection) {
      collection.assets = collection.assets.filter(id => id !== assetId);
      await this.saveToLocalStorage();
    }
  }

  // Organization
  async organizeAssets(criteria: AssetOrganizationCriteria): Promise<Map<string, GeneratedAsset[]>> {
    const assets = await this.searchAssets(criteria.filterBy || {});
    const organized = new Map<string, GeneratedAsset[]>();

    assets.forEach(asset => {
      let key: string;

      switch (criteria.groupBy) {
        case 'type':
          key = asset.type;
          break;
        case 'category':
          key = asset.metadata.category;
          break;
        case 'date':
          key = asset.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'project':
          key = asset.metadata.gameProject || 'No Project';
          break;
        case 'style':
          key = asset.metadata.stylePreset || 'No Style';
          break;
        default:
          key = 'Other';
      }

      if (!organized.has(key)) {
        organized.set(key, []);
      }
      organized.get(key)!.push(asset);
    });

    return organized;
  }

  // Analytics
  async getAssetStats(): Promise<{
    totalAssets: number;
    totalSize: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byProvider: Record<string, number>;
    recentActivity: GeneratedAsset[];
  }> {
    const assets = Array.from(this.assets.values());
    
    const stats = {
      totalAssets: assets.length,
      totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
      recentActivity: assets
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 10)
    };

    assets.forEach(asset => {
      // Count by type
      stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1;
      
      // Count by category
      stats.byCategory[asset.metadata.category] = 
        (stats.byCategory[asset.metadata.category] || 0) + 1;
      
      // Count by provider
      stats.byProvider[asset.metadata.provider] = 
        (stats.byProvider[asset.metadata.provider] || 0) + 1;
    });

    return stats;
  }

  // Persistence
  private async saveToLocalStorage(): Promise<void> {
    try {
      const assetsData = JSON.stringify(Array.from(this.assets.entries()));
      const collectionsData = JSON.stringify(Array.from(this.collections.entries()));
      
      localStorage.setItem(this.STORAGE_KEY, assetsData);
      localStorage.setItem(this.COLLECTIONS_KEY, collectionsData);
    } catch (error) {
      console.error('Failed to save assets to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const assetsData = localStorage.getItem(this.STORAGE_KEY);
      const collectionsData = localStorage.getItem(this.COLLECTIONS_KEY);
      
      if (assetsData) {
        const assetsArray = JSON.parse(assetsData);
        this.assets = new Map(assetsArray.map(([id, asset]: [string, any]) => [
          id,
          {
            ...asset,
            createdAt: new Date(asset.createdAt),
            updatedAt: new Date(asset.updatedAt),
          }
        ]));
      }
      
      if (collectionsData) {
        const collectionsArray = JSON.parse(collectionsData);
        this.collections = new Map(collectionsArray.map(([id, collection]: [string, any]) => [
          id,
          {
            ...collection,
            createdAt: new Date(collection.createdAt),
          }
        ]));
      }
    } catch (error) {
      console.error('Failed to load assets from localStorage:', error);
    }
  }
}

// Cloud Storage Interface (for future implementation)
interface CloudAssetStorage {
  uploadAsset(file: File, metadata: AssetMetadata): Promise<string>;
  downloadAsset(id: string): Promise<Blob>;
  deleteAsset(id: string): Promise<void>;
  getAssetUrl(id: string): Promise<string>;
  syncWithLocal(): Promise<void>;
}

// Main Asset Storage Manager
export class AssetStorageManager {
  private localStorage: LocalAssetStorage;
  private cloudStorage?: CloudAssetStorage;

  constructor(enableCloudStorage: boolean = false) {
    this.localStorage = new LocalAssetStorage();
    
    // Initialize cloud storage if enabled
    if (enableCloudStorage) {
      // this.cloudStorage = new S3AssetStorage(); // Future implementation
    }
  }

  // Asset Management
  async saveAsset(asset: GeneratedAsset): Promise<void> {
    await this.localStorage.saveAsset(asset);
    
    if (this.cloudStorage) {
      // Sync to cloud storage
      // await this.cloudStorage.uploadAsset(asset);
    }
  }

  async getAsset(id: string): Promise<GeneratedAsset | null> {
    return await this.localStorage.getAsset(id);
  }

  async getAllAssets(): Promise<GeneratedAsset[]> {
    return await this.localStorage.getAllAssets();
  }

  async deleteAsset(id: string): Promise<void> {
    await this.localStorage.deleteAsset(id);
    
    if (this.cloudStorage) {
      await this.cloudStorage.deleteAsset(id);
    }
  }

  async searchAssets(criteria: AssetSearchCriteria): Promise<GeneratedAsset[]> {
    return await this.localStorage.searchAssets(criteria);
  }

  async organizeAssets(criteria: AssetOrganizationCriteria): Promise<Map<string, GeneratedAsset[]>> {
    return await this.localStorage.organizeAssets(criteria);
  }

  // Collection Management
  async createCollection(collection: AssetCollection): Promise<void> {
    await this.localStorage.createCollection(collection);
  }

  async getCollection(id: string): Promise<AssetCollection | null> {
    return await this.localStorage.getCollection(id);
  }

  async getAllCollections(): Promise<AssetCollection[]> {
    return await this.localStorage.getAllCollections();
  }

  async addAssetToCollection(collectionId: string, assetId: string): Promise<void> {
    await this.localStorage.addAssetToCollection(collectionId, assetId);
  }

  // Analytics
  async getAssetStats() {
    return await this.localStorage.getAssetStats();
  }

  // Utility Methods
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  generateThumbnail(asset: GeneratedAsset): Promise<string> {
    // Generate thumbnail from asset
    // This would use canvas or similar to create a smaller version
    return Promise.resolve(asset.url); // Placeholder
  }
}

// Export singleton instance
export const assetStorageManager = new AssetStorageManager();
