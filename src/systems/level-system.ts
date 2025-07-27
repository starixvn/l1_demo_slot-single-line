import levelData from '@/data/level-data.json';

/**
 * Pure business logic interfaces for level system
 */
export interface LevelConfiguration {
  xpRequired: number;
  unlockedSymbols: string[];
  title: string;
  description: string;
}

export interface XpConfiguration {
  baseXpPerSpin: number;
  regularMonsterBonus: number;
  bossMonsterBonus: number;
  baseBet: number;
}

export interface PlayerState {
  level: number;
  totalXp: number;
  unlockedSymbols: string[];
}

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel?: number;
  newSymbols?: string[];
  levelTitle?: string;
  previousLevel?: number;
}

export interface XpGainResult {
  xpGained: number;
  totalXp: number;
  levelUpResults: LevelUpResult[];
}

export interface MonsterDefeat {
  type: string;
  wasBoss?: boolean;
}

/**
 * Pure business logic level system - no UI dependencies
 * This class is fully testable and UI-agnostic
 */
export class LevelSystem {
  private levels: LevelConfiguration[];
  private xpConfig: XpConfiguration;
  private bossMonsters: string[];

  constructor(configData?: any) {
    const config = configData || levelData;
    this.levels = config.levels;
    this.xpConfig = config.xpConfig;
    this.bossMonsters = config.bossMonsters;
    
    this.validateConfiguration();
  }

  /**
   * Validate configuration data
   */
  private validateConfiguration(): void {
    if (!this.levels || this.levels.length === 0) {
      throw new Error('Level configuration is empty or invalid');
    }
    // Array index serves as level number - no sorting needed!
  }

  /**
   * Initialize a new player state
   */
  createInitialPlayerState(): PlayerState {
    const firstLevel = this.levels[0];
    return {
      level: 1,
      totalXp: 0,
      unlockedSymbols: [...firstLevel.unlockedSymbols]
    };
  }

  /**
   * Calculate XP gain from a spin
   */
  calculateSpinXp(currentBet: number, defeatedMonsters: MonsterDefeat[]): number {
    let baseXp = this.xpConfig.baseXpPerSpin;
    let bonusXp = 0;

    // Calculate monster bonuses
    for (const monster of defeatedMonsters) {
      const isBoss = this.isBossMonster(monster.type);
      bonusXp += isBoss ? this.xpConfig.bossMonsterBonus : this.xpConfig.regularMonsterBonus;
    }

    // Apply bet multiplier
    const betMultiplier = currentBet / this.xpConfig.baseBet;
    const totalXp = Math.round((baseXp + bonusXp) * betMultiplier);

    return totalXp;
  }

  /**
   * Add XP to player state and check for level ups
   */
  addXpToPlayer(playerState: PlayerState, xpAmount: number): XpGainResult {
    playerState.totalXp += xpAmount;

    const levelUpResults: LevelUpResult[] = [];

    // Check for multiple level ups
    while (this.canLevelUp(playerState)) {
      const levelUpResult = this.processLevelUp(playerState);
      if (levelUpResult.leveledUp) {
        levelUpResults.push(levelUpResult);
      } else {
        break;
      }
    }

    return {
      xpGained: xpAmount,
      totalXp: playerState.totalXp,
      levelUpResults
    };
  }

  /**
   * Check if player can level up
   */
  private canLevelUp(playerState: PlayerState): boolean {
    if (playerState.level >= this.levels.length) {
      return false; // Max level reached
    }

    const nextLevel = this.levels[playerState.level]; // 0-indexed for next level
    return playerState.totalXp >= nextLevel.xpRequired;
  }

  /**
   * Process a single level up
   */
  private processLevelUp(playerState: PlayerState): LevelUpResult {
    if (!this.canLevelUp(playerState)) {
      return { leveledUp: false };
    }

    const previousLevel = playerState.level;
    const nextLevelIndex = playerState.level; // Current level is next array index
    const nextLevelData = this.levels[nextLevelIndex];
    const newLevel = nextLevelIndex + 1; // Array index + 1 = level number
    
    // Update player state
    playerState.level = newLevel;
    playerState.unlockedSymbols.push(...nextLevelData.unlockedSymbols);

    return {
      leveledUp: true,
      newLevel: newLevel,
      newSymbols: [...nextLevelData.unlockedSymbols],
      levelTitle: nextLevelData.title,
      previousLevel
    };
  }

  /**
   * Get level configuration by level number
   */
  getLevelConfig(level: number): LevelConfiguration | null {
    const index = level - 1; // Convert 1-based level to 0-based array index
    return this.levels[index] || null;
  }

  /**
   * Get current level data for player
   */
  getCurrentLevelData(playerState: PlayerState): LevelConfiguration {
    const levelData = this.getLevelConfig(playerState.level);
    if (!levelData) {
      throw new Error(`Invalid player level: ${playerState.level}`);
    }
    return levelData;
  }

  /**
   * Get next level data for player
   */
  getNextLevelData(playerState: PlayerState): LevelConfiguration | null {
    if (playerState.level >= this.levels.length) {
      return null; // Max level
    }
    return this.levels[playerState.level]; // 0-indexed for next level
  }

  /**
   * Calculate XP progress to next level
   */
  getXpProgress(playerState: PlayerState): { current: number; required: number; percentage: number } {
    const nextLevel = this.getNextLevelData(playerState);
    if (!nextLevel) {
      return { current: 0, required: 0, percentage: 100 }; // Max level
    }

    const currentLevel = this.getCurrentLevelData(playerState);
    const currentLevelXp = playerState.totalXp - currentLevel.xpRequired;
    const requiredForNext = nextLevel.xpRequired - currentLevel.xpRequired;

    return {
      current: currentLevelXp,
      required: requiredForNext,
      percentage: Math.min((currentLevelXp / requiredForNext) * 100, 100)
    };
  }

  /**
   * Get all symbols unlocked up to a specific level
   */
  getSymbolsUpToLevel(level: number): string[] {
    const symbols: string[] = [];
    
    for (let i = 0; i < Math.min(level, this.levels.length); i++) {
      const levelData = this.levels[i];
      symbols.push(...levelData.unlockedSymbols);
    }

    return symbols;
  }

  /**
   * Check if a monster is a boss
   */
  isBossMonster(monsterType: string): boolean {
    return this.bossMonsters.includes(monsterType);
  }

  /**
   * Get maximum level
   */
  getMaxLevel(): number {
    return this.levels.length;
  }

  /**
   * Get total XP required for max level
   */
  getMaxXp(): number {
    return this.levels[this.levels.length - 1].xpRequired;
  }

  /**
   * Validate player state
   */
  validatePlayerState(playerState: PlayerState): boolean {
    if (playerState.level < 1 || playerState.level > this.levels.length) {
      return false;
    }
    if (playerState.totalXp < 0) {
      return false;
    }
    if (!Array.isArray(playerState.unlockedSymbols)) {
      return false;
    }
    return true;
  }

  /**
   * Reset player to initial state
   */
  resetPlayer(playerState: PlayerState): void {
    const initialState = this.createInitialPlayerState();
    playerState.level = initialState.level;
    playerState.totalXp = initialState.totalXp;
    playerState.unlockedSymbols = initialState.unlockedSymbols;
  }

  /**
   * Get configuration for testing
   */
  getConfiguration() {
    return {
      levels: [...this.levels],
      xpConfig: { ...this.xpConfig },
      bossMonsters: [...this.bossMonsters]
    };
  }
}

/**
 * Singleton instance for the application
 */
let levelSystemInstance: LevelSystem | null = null;

export function getLevelSystem(): LevelSystem {
  if (!levelSystemInstance) {
    levelSystemInstance = new LevelSystem();
  }
  return levelSystemInstance;
}

/**
 * Create a new level system instance (useful for testing with custom config)
 */
export function createLevelSystem(configData?: any): LevelSystem {
  return new LevelSystem(configData);
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetLevelSystem(): void {
  levelSystemInstance = null;
} 