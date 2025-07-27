import { LevelData, SymbolType, PlayerProgression } from '@/types/slot-types';
import { getLevelSystem, LevelConfiguration } from '@/systems/level-system';

/**
 * Convert string symbols to SymbolType enum
 */
function convertSymbolsToEnum(symbols: string[]): SymbolType[] {
  return symbols.map(symbol => {
    // Check if the symbol is a valid enum value
    if (!Object.values(SymbolType).includes(symbol as SymbolType)) {
      throw new Error(`Invalid symbol type: ${symbol}`);
    }
    return symbol as SymbolType;
  });
}

/**
 * Convert level configuration to legacy format
 */
function convertToLegacyFormat(config: LevelConfiguration, levelNumber: number, previousLevelXp: number): LevelData {
  const xpForThisLevel = config.xpRequired - previousLevelXp;
  
  return {
    level: levelNumber,
    xpRequired: config.xpRequired,
    xpForThisLevel: xpForThisLevel,
    unlockedSymbols: convertSymbolsToEnum(config.unlockedSymbols),
    defaultSymbols: levelNumber === 1 ? convertSymbolsToEnum(config.unlockedSymbols) : [], // Level 1 symbols are both default and unlocked
    title: config.title,
    description: config.description
  };
}

/**
 * Get level data using the new level system
 */
function initializeLevelData(): LevelData[] {
  const levelSystem = getLevelSystem();
  const levels: LevelData[] = [];
  
  for (let i = 1; i <= levelSystem.getMaxLevel(); i++) {
    const config = levelSystem.getLevelConfig(i);
    if (config) {
      const previousLevelXp = i === 1 ? 0 : levelSystem.getLevelConfig(i - 1)?.xpRequired || 0;
      levels.push(convertToLegacyFormat(config, i, previousLevelXp));
    }
  }
  
  return levels;
}

/**
 * Legacy level data - now powered by the new level system
 */
export const LEVEL_DATA: LevelData[] = initializeLevelData();

/**
 * Global current unlocked symbol pool - starts with Level 1 default symbols
 * This array is dynamically updated as player levels up
 */
export let currentUnlockedSymbolPool: SymbolType[] = [...LEVEL_DATA[0].defaultSymbols];

/**
 * Update the global symbol pool from string array
 */
export function updateSymbolPool(symbols: string[]): void {
  currentUnlockedSymbolPool.length = 0;
  currentUnlockedSymbolPool.push(...convertSymbolsToEnum(symbols));
}

/**
 * Player progression manager - now using the new level system
 */
export class PlayerProgressionManager {
  private static instance: PlayerProgressionManager;
  private progression: PlayerProgression;
  private levelSystem = getLevelSystem();

  private constructor() {
    // Initialize using level system
    const initialState = this.levelSystem.createInitialPlayerState();
    this.progression = {
      currentLevel: initialState.level,
      currentXp: 0,
      totalXp: initialState.totalXp,
      unlockedSymbols: convertSymbolsToEnum(initialState.unlockedSymbols),
      newSymbolsToShow: []
    };
    
    // Initialize global symbol pool
    this.updateGlobalSymbolPool();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PlayerProgressionManager {
    if (!PlayerProgressionManager.instance) {
      PlayerProgressionManager.instance = new PlayerProgressionManager();
    }
    return PlayerProgressionManager.instance;
  }

  /**
   * Add XP and check for level ups - now using level system
   */
  addXp(amount: number): { leveledUp: boolean; newLevel?: number; newSymbols?: SymbolType[] } {
    // Convert to internal state format
    const playerState = {
      level: this.progression.currentLevel,
      totalXp: this.progression.totalXp,
      unlockedSymbols: this.progression.unlockedSymbols.map(s => s.toLowerCase())
    };

    // Use level system for XP processing
    const result = this.levelSystem.addXpToPlayer(playerState, amount);
    
    // Update progression from result
    this.progression.currentLevel = playerState.level;
    this.progression.totalXp = playerState.totalXp;
    this.progression.currentXp = playerState.totalXp;
    this.progression.unlockedSymbols = convertSymbolsToEnum(playerState.unlockedSymbols);

    // Process level up results
    let leveledUp = false;
    let newLevel: number | undefined;
    let newSymbols: SymbolType[] = [];

    if (result.levelUpResults.length > 0) {
      leveledUp = true;
      const lastLevelUp = result.levelUpResults[result.levelUpResults.length - 1];
      newLevel = lastLevelUp.newLevel;
      
      // Collect all new symbols from all level ups
      for (const levelUpResult of result.levelUpResults) {
        if (levelUpResult.newSymbols) {
          newSymbols.push(...convertSymbolsToEnum(levelUpResult.newSymbols));
        }
      }

      this.progression.newSymbolsToShow = newSymbols;
      this.updateGlobalSymbolPool();
      
      console.log(`🎉 LEVEL UP! Reached Level ${newLevel}`);
      console.log(`📦 Unlocked symbols:`, newSymbols.map(s => s));
    }

    return {
      leveledUp,
      newLevel,
      newSymbols: leveledUp ? newSymbols : undefined
    };
  }

  /**
   * Update the global symbol pool used by SymbolGenerator
   */
  private updateGlobalSymbolPool(): void {
    currentUnlockedSymbolPool.length = 0; // Clear array
    currentUnlockedSymbolPool.push(...this.progression.unlockedSymbols);
    
    console.log(`🔄 Updated symbol pool with ${currentUnlockedSymbolPool.length} symbols:`, 
      currentUnlockedSymbolPool.map(s => s));
  }

  /**
   * Get current progression state
   */
  getProgression(): PlayerProgression {
    return { ...this.progression };
  }

  /**
   * Get current level data
   */
  getCurrentLevelData(): LevelData {
    return LEVEL_DATA[this.progression.currentLevel - 1]; // Convert to 0-indexed
  }

  /**
   * Get next level data (if exists)
   */
  getNextLevelData(): LevelData | null {
    if (this.progression.currentLevel >= LEVEL_DATA.length) {
      return null; // Max level reached
    }
    return LEVEL_DATA[this.progression.currentLevel]; // Next level (0-indexed)
  }

  /**
   * Get XP progress to next level
   */
  getXpProgress(): { current: number; required: number; percentage: number } {
    const playerState = {
      level: this.progression.currentLevel,
      totalXp: this.progression.totalXp,
      unlockedSymbols: this.progression.unlockedSymbols.map(s => s.toLowerCase())
    };

    return this.levelSystem.getXpProgress(playerState);
  }

  /**
   * Clear new symbols notification
   */
  clearNewSymbolsNotification(): void {
    this.progression.newSymbolsToShow = [];
  }

  /**
   * Reset progression (for testing)
   */
  reset(): void {
    const initialState = this.levelSystem.createInitialPlayerState();
    this.progression = {
      currentLevel: initialState.level,
      currentXp: 0,
      totalXp: initialState.totalXp,
      unlockedSymbols: convertSymbolsToEnum(initialState.unlockedSymbols),
      newSymbolsToShow: []
    };
    this.updateGlobalSymbolPool();
  }

  /**
   * Get unlocked symbols for external access
   */
  getUnlockedSymbols(): SymbolType[] {
    return [...this.progression.unlockedSymbols];
  }
}

/**
 * Helper functions for level system
 */
export const LevelSystemHelpers = {
  /**
   * Get level data by level number
   */
  getLevelData(level: number): LevelData | null {
    return LEVEL_DATA.find(data => data.level === level) || null;
  },

  /**
   * Get all unlocked symbols up to a specific level
   */
  getSymbolsUpToLevel(level: number): SymbolType[] {
    let symbols: SymbolType[] = [...LEVEL_DATA[0].defaultSymbols]; // Start with defaults
    
    for (let i = 1; i < Math.min(level, LEVEL_DATA.length); i++) {
      symbols.push(...LEVEL_DATA[i].unlockedSymbols);
    }
    
    return symbols;
  },

  /**
   * Calculate total XP needed for a specific level
   */
  getTotalXpForLevel(level: number): number {
    const levelData = LEVEL_DATA.find(data => data.level === level);
    return levelData ? levelData.xpRequired : 0;
  }
}; 