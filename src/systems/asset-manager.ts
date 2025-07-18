import { Assets, Texture, Spritesheet } from 'pixi.js';
import type { 
  AssetConfig, 
  LoadingProgress, 
  LoadingError, 
  AssetManagerState,
  AssetEvent,
  AssetEventType 
} from '@/types/game-types';
import { GAME_CONSTANTS } from '@/config/game-config';

/**
 * High-performance asset manager for PIXI.js with error handling and caching
 */
export class AssetManager extends EventTarget {
  private state: AssetManagerState;
  private retryAttempts: Map<string, number>;
  
  constructor() {
    super();
    
    this.state = {
      isLoading: false,
      hasLoaded: false,
      progress: {
        progress: 0,
        currentAsset: '',
        totalAssets: 0,
        loadedAssets: 0,
      },
      errors: [],
      loadedAssets: new Map(),
    };
    
    this.retryAttempts = new Map();
  }

  /**
   * Load assets from URL array with comprehensive error handling
   */
  async loadAssets(assetConfigs: AssetConfig[]): Promise<void> {
    if (this.state.isLoading) {
      console.warn('AssetManager: Assets are already loading');
      return;
    }

    this.state.isLoading = true;
    this.state.hasLoaded = false;
    this.state.errors = [];
    this.state.progress = {
      progress: 0,
      currentAsset: '',
      totalAssets: assetConfigs.length,
      loadedAssets: 0,
    };

    this.emitEvent('loading-start', this.state.progress);

    try {
      // Sort assets by priority (higher priority loads first)
      const sortedAssets = [...assetConfigs].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      // Add assets to PIXI Assets manager
      for (const asset of sortedAssets) {
        Assets.add({ alias: asset.name, src: asset.url });
      }

      // Load assets with progress tracking
      const loadPromises = sortedAssets.map(asset => this.loadSingleAsset(asset));
      
      await Promise.allSettled(loadPromises);
      
      this.state.isLoading = false;
      this.state.hasLoaded = true;
      this.state.progress.progress = 100;
      
      this.emitEvent('loading-complete', this.state.progress);
      
      if (this.state.errors.length > 0) {
        console.warn(`AssetManager: ${this.state.errors.length} assets failed to load`);
      }
      
    } catch (error) {
      this.state.isLoading = false;
      const loadingError: LoadingError = {
        asset: { name: 'general', url: '', type: 'texture' },
        error: error as Error,
        timestamp: Date.now(),
      };
      
      this.handleLoadingError(loadingError);
      throw error;
    }
  }

  /**
   * Load a single asset with retry logic
   */
  private async loadSingleAsset(asset: AssetConfig): Promise<void> {
    const retryCount = this.retryAttempts.get(asset.name) || 0;
    
    try {
      this.state.progress.currentAsset = asset.name;
      this.emitEvent('loading-progress', this.state.progress);

      const loadedAsset = await this.loadAssetByType(asset);
      
      this.state.loadedAssets.set(asset.name, loadedAsset);
      this.state.progress.loadedAssets++;
      this.state.progress.progress = (this.state.progress.loadedAssets / this.state.progress.totalAssets) * 100;
      
      this.emitEvent('asset-loaded', asset);
      this.emitEvent('loading-progress', this.state.progress);
      
    } catch (error) {
      const loadingError: LoadingError = {
        asset,
        error: error as Error,
        timestamp: Date.now(),
        retry: retryCount < GAME_CONSTANTS.MAX_RETRY_ATTEMPTS,
      };

      if (retryCount < GAME_CONSTANTS.MAX_RETRY_ATTEMPTS) {
        console.warn(`AssetManager: Retrying ${asset.name} (attempt ${retryCount + 1})`);
        this.retryAttempts.set(asset.name, retryCount + 1);
        
        await new Promise(resolve => setTimeout(resolve, GAME_CONSTANTS.RETRY_DELAY));
        return this.loadSingleAsset(asset);
      } else {
        this.handleLoadingError(loadingError);
      }
    }
  }

  /**
   * Load asset based on its type
   */
  private async loadAssetByType(asset: AssetConfig): Promise<Texture | Spritesheet | any> {
    switch (asset.type) {
      case 'texture':
        return await Assets.load<Texture>(asset.name);
      
      case 'spritesheet':
        return await Assets.load<Spritesheet>(asset.name);
      
      case 'sound':
        // For sound assets, you might want to use a different library
        // This is a placeholder for sound loading implementation
        return await this.loadSoundAsset(asset);
      
      case 'json':
        return await Assets.load(asset.name);
      
      default:
        throw new Error(`Unsupported asset type: ${asset.type}`);
    }
  }

  /**
   * Load sound asset (placeholder for sound library integration)
   */
  private async loadSoundAsset(asset: AssetConfig): Promise<any> {
    // Implement sound loading here with your preferred audio library
    // For example: Howler.js, Web Audio API, or PIXI Sound
    console.warn(`Sound loading not implemented for: ${asset.name}`);
    return Promise.resolve(null);
  }

  /**
   * Handle loading errors with proper logging and event emission
   */
  private handleLoadingError(error: LoadingError): void {
    this.state.errors.push(error);
    
    console.error(`AssetManager: Failed to load ${error.asset.name}:`, error.error);
    
    this.emitEvent('asset-error', error);
    this.emitEvent('loading-error', error);
  }

  /**
   * Get loaded asset by name
   */
  getAsset<T = Texture>(name: string): T | undefined {
    return this.state.loadedAssets.get(name) as T;
  }

  /**
   * Check if asset is loaded
   */
  isAssetLoaded(name: string): boolean {
    return this.state.loadedAssets.has(name);
  }

  /**
   * Get current loading state
   */
  getState(): AssetManagerState {
    return { ...this.state };
  }

  /**
   * Get loading progress
   */
  getProgress(): LoadingProgress {
    return { ...this.state.progress };
  }

  /**
   * Get loading errors
   */
  getErrors(): LoadingError[] {
    return [...this.state.errors];
  }

  /**
   * Clear all loaded assets and reset state
   */
  clear(): void {
    this.state.loadedAssets.clear();
    this.state.errors = [];
    this.state.isLoading = false;
    this.state.hasLoaded = false;
    this.retryAttempts.clear();
    
    // Clear PIXI Assets cache
    Assets.cache.reset();
  }

  /**
   * Emit custom events for asset loading
   */
  private emitEvent(type: AssetEventType, data: any): void {
    const event: AssetEvent = { type, data };
    this.dispatchEvent(new CustomEvent(type, { detail: event }));
  }

  /**
   * Static method to create asset configurations from URL arrays
   */
  static createAssetConfigs(urls: string[], type: AssetConfig['type'] = 'texture'): AssetConfig[] {
    return urls.map((url, index) => ({
      name: `asset_${index}_${type}`,
      url,
      type,
      priority: 1,
    }));
  }

  /**
   * Static method to create named asset configurations
   */
  static createNamedAssets(assets: Record<string, string>, type: AssetConfig['type'] = 'texture'): AssetConfig[] {
    return Object.entries(assets).map(([name, url]) => ({
      name,
      url,
      type,
      priority: 1,
    }));
  }
} 