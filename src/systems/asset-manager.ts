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
import { SymbolType } from '@/types/slot-types';
import { MonsterType } from '@/types/monster-types';
import { MONSTER_ASSETS, MONSTER_SPRITESHEETS } from '@/config/monster-config';

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

/**
 * Symbol asset definitions using numbered PNG files for all 28 symbols
 */
const SYMBOL_ASSETS = {
  // Level 1 default symbols (0-9)
  [SymbolType.SYMBOL_0]: 'src/assets/images/symbols/0.png',   // 0 damage - Broken
  [SymbolType.SYMBOL_1]: 'src/assets/images/symbols/1.png',   // 1 damage - Iron Sword
  [SymbolType.SYMBOL_2]: 'src/assets/images/symbols/2.png',   // 2 damage - Bronze Axe
  [SymbolType.SYMBOL_3]: 'src/assets/images/symbols/3.png',   // 3 damage - Silver Sword
  [SymbolType.SYMBOL_4]: 'src/assets/images/symbols/4.png',   // 4 damage - Iron Axe
  [SymbolType.SYMBOL_5]: 'src/assets/images/symbols/5.png',   // 5 damage - Crusader Blade
  [SymbolType.SYMBOL_6]: 'src/assets/images/symbols/6.png',   // 6 damage - War Hammer
  [SymbolType.SYMBOL_7]: 'src/assets/images/symbols/7.png',   // 7 damage - Magic Staff
  [SymbolType.SYMBOL_8]: 'src/assets/images/symbols/8.png',   // 8 damage - Steel Blade
  [SymbolType.SYMBOL_9]: 'src/assets/images/symbols/9.png',   // 9 damage - Mystic Orb
  
  // Level 2 unlocks (10-11)
  [SymbolType.SYMBOL_10]: 'src/assets/images/symbols/10.png', // 10 damage - Digital Scythe
  [SymbolType.SYMBOL_11]: 'src/assets/images/symbols/11.png', // 11 damage - Light Dagger
  
  // Level 3 unlocks (12-13)
  [SymbolType.SYMBOL_12]: 'src/assets/images/symbols/12.png', // 12 damage - Shadow Bow
  [SymbolType.SYMBOL_13]: 'src/assets/images/symbols/13.png', // 13 damage - Thunder Mace
  
  // Level 4 unlocks (14-15)
  [SymbolType.SYMBOL_14]: 'src/assets/images/symbols/14.png', // 14 damage - Crystal Spear
  [SymbolType.SYMBOL_15]: 'src/assets/images/symbols/15.png', // 15 damage - Flame Whip
  
  // Level 5 unlocks (16-17)
  [SymbolType.SYMBOL_16]: 'src/assets/images/symbols/16.png', // 16 damage - Frost Blade
  [SymbolType.SYMBOL_17]: 'src/assets/images/symbols/17.png', // 17 damage - Void Hammer
  
  // Level 6 unlocks (18-19)
  [SymbolType.SYMBOL_18]: 'src/assets/images/symbols/18.png', // 18 damage - Plasma Rifle
  [SymbolType.SYMBOL_19]: 'src/assets/images/symbols/19.png', // 19 damage - Energy Sword
  
  // Level 7 unlocks (20-21)
  [SymbolType.SYMBOL_20]: 'src/assets/images/symbols/20.png', // 20 damage - Quantum Blade
  [SymbolType.SYMBOL_21]: 'src/assets/images/symbols/21.png', // 21 damage - Cosmic Staff
  
  // Level 8 unlocks (22-23)
  [SymbolType.SYMBOL_22]: 'src/assets/images/symbols/22.png', // 22 damage - Dimensional Axe
  [SymbolType.SYMBOL_23]: 'src/assets/images/symbols/23.png', // 23 damage - Time Dagger
  
  // Level 9 unlocks (24-25)
  [SymbolType.SYMBOL_24]: 'src/assets/images/symbols/24.png', // 24 damage - Soul Reaper
  [SymbolType.SYMBOL_25]: 'src/assets/images/symbols/25.png', // 25 damage - Infinity Sword
  
  // Level 10 unlocks (26-27) - Ultimate weapons
  [SymbolType.SYMBOL_26]: 'src/assets/images/symbols/26.png', // 26 damage - Divine Hammer
  [SymbolType.SYMBOL_27]: 'src/assets/images/symbols/27.png', // 27 damage - Eternal Blade
} as const;

/**
 * Loaded symbol textures
 */
const symbolTextures: Map<SymbolType, Texture> = new Map();

/**
 * Load all symbol assets
 */
export const loadSymbolAssets = async (): Promise<void> => {
  try {
    console.log('Loading symbol assets...');
    
    // Load all symbol textures
    const symbolPromises = Object.entries(SYMBOL_ASSETS).map(async ([symbolType, path]) => {
      const texture = await Assets.load(path);
      symbolTextures.set(symbolType as SymbolType, texture);
      console.log(`Loaded symbol: ${symbolType}`);
    });
    
    await Promise.all(symbolPromises);
    console.log('All symbol assets loaded successfully');
    
  } catch (error) {
    console.error('Error loading symbol assets:', error);
    throw error;
  }
};

/**
 * Get texture for a symbol
 */
export const getSymbolTexture = (symbolType: SymbolType): Texture | null => {
  return symbolTextures.get(symbolType) || null;
};

/**
 * Check if symbol textures are loaded
 */
export const areSymbolTexturesLoaded = (): boolean => {
  return symbolTextures.size === Object.keys(SYMBOL_ASSETS).length;
};

/**
 * Monster asset loading
 */

/**
 * Loaded monster textures
 */
const monsterTextures: Map<MonsterType, Texture> = new Map();

/**
 * Load all monster assets
 */
export const loadMonsterAssets = async (): Promise<void> => {
  try {
    console.log('Loading monster assets...');
    
    // Load all monster textures
    const monsterPromises = Object.entries(MONSTER_ASSETS).map(async ([monsterType, path]) => {
      const texture = await Assets.load(path);
      monsterTextures.set(monsterType as MonsterType, texture);
      console.log(`Loaded monster: ${monsterType}`);
    });
    
    await Promise.all(monsterPromises);
    console.log('All monster assets loaded successfully');
    
  } catch (error) {
    console.error('Error loading monster assets:', error);
    throw error;
  }
};

/**
 * Get texture for a monster
 */
export const getMonsterTexture = (monsterType: MonsterType): Texture | null => {
  return monsterTextures.get(monsterType) || null;
};

/**
 * Check if monster textures are loaded
 */
export const areMonsterTexturesLoaded = (): boolean => {
  return monsterTextures.size === Object.keys(MONSTER_ASSETS).length;
}; 

/**
 * Loaded monster spritesheets
 */
const monsterSpritesheets: Map<MonsterType, Spritesheet> = new Map();

/**
 * Load monster spritesheet assets
 */
export const loadMonsterSpritesheets = async (): Promise<void> => {
  try {
    console.log('Loading monster spritesheets...');
    
    // Load spritesheets that are defined
    const spritesheetPromises = Object.entries(MONSTER_SPRITESHEETS).map(async ([monsterType, config]) => {
      try {
        const spritesheet = await Assets.load<Spritesheet>(config.url);
        monsterSpritesheets.set(monsterType as MonsterType, spritesheet);
        console.log(`✅ Loaded spritesheet for: ${monsterType} with ${Object.keys(spritesheet.textures).length} frames`);
      } catch (error) {
        console.error(`❌ Failed to load spritesheet for ${monsterType}:`, error);
      }
    });
    
    await Promise.all(spritesheetPromises);
    console.log('✅ Monster spritesheets loading completed');
    
  } catch (error) {
    console.error('❌ Error loading monster spritesheets:', error);
    throw error;
  }
};

/**
 * Get spritesheet for a monster (if available)
 */
export const getMonsterSpritesheet = (monsterType: MonsterType): Spritesheet | null => {
  return monsterSpritesheets.get(monsterType) || null;
};

/**
 * Get default texture from spritesheet or fallback to individual texture
 */
export const getMonsterTextureEnhanced = (monsterType: MonsterType): Texture | null => {
  // First try to get from spritesheet
  const spritesheet = getMonsterSpritesheet(monsterType);
  const spritesheetConfig = MONSTER_SPRITESHEETS[monsterType as keyof typeof MONSTER_SPRITESHEETS];
  
  if (spritesheet && spritesheetConfig) {
    const defaultFrame = spritesheetConfig.defaultFrame;
    const texture = spritesheet.textures[defaultFrame];
    
    if (texture) {
      return texture;
    }
  }
  
  // Fallback to individual texture
  return monsterTextures.get(monsterType) || null;
};

/**
 * Get animation frames from spritesheet
 */
export const getMonsterAnimationFrames = (monsterType: MonsterType): Texture[] => {
  const spritesheet = getMonsterSpritesheet(monsterType);
  const spritesheetConfig = MONSTER_SPRITESHEETS[monsterType as keyof typeof MONSTER_SPRITESHEETS];
  
  if (!spritesheet || !spritesheetConfig) {
    return [];
  }
  
  const frameNames = spritesheetConfig.animationFrames;
  return frameNames.map((frameName: string) => spritesheet.textures[frameName]).filter(Boolean);
};

/**
 * Check if monster has spritesheet available
 */
export const hasMonsterSpritesheet = (monsterType: MonsterType): boolean => {
  return monsterSpritesheets.has(monsterType);
}; 