import { PlayerProgressionManager, LEVEL_DATA } from '@/config/level-config';
import { SymbolGenerator, currentUnlockedSymbolPool } from '@/config/symbol-config';
import { MonsterType } from '@/types/monster-types';

/**
 * Global player state variables
 */
export let playerLevel: number = 1;
export let playerXP: number = 0;

/**
 * XP gain configuration
 */
export const XP_CONFIG = {
  BASE_XP_PER_SPIN: 10,           // Base XP awarded per spin
  REGULAR_MONSTER_BONUS: 20,      // Additional XP for defeating regular monsters
  BOSS_MONSTER_BONUS: 50,         // Additional XP for defeating boss monsters
  BASE_BET: 10,                   // Base bet amount for XP scaling calculation
} as const;

/**
 * Boss monster types (higher tier monsters that give bonus XP)
 */
const BOSS_MONSTERS: MonsterType[] = [
  MonsterType.VENOM,         // High-tier boss
  MonsterType.FIERCE_HELLHOUND, // High-tier boss
];

/**
 * Global player state manager
 */
export class GlobalPlayerState {
  private static progressionManager: PlayerProgressionManager;

  /**
   * Initialize the global state system
   */
  static initialize(): void {
    this.progressionManager = PlayerProgressionManager.getInstance();
    
    // Sync with existing progression manager
    const progression = this.progressionManager.getProgression();
    playerLevel = progression.currentLevel;
    playerXP = progression.totalXp;
    
    console.log(`🌍 Global state initialized: Level ${playerLevel}, XP ${playerXP}`);
  }

  /**
   * Enhanced handleLevelUp function with proper state management
   */
  static handleLevelUp(): { leveledUp: boolean; newLevel?: number; newSymbols?: any[]; levelTitle?: string } {
    const oldLevel = playerLevel;
    let leveledUp = false;
    let allNewSymbols: any[] = [];
    let finalLevelTitle = '';

    // Continuously check for level ups (handle multiple level ups in one XP gain)
    while (playerLevel < LEVEL_DATA.length) {
      const nextLevelData = LEVEL_DATA[playerLevel]; // Next level (0-indexed)
      
      if (!nextLevelData || playerXP < nextLevelData.xpRequired) {
        break; // No more level ups possible
      }

      console.log(`🎯 Level up conditions met! ${playerXP} XP >= ${nextLevelData.xpRequired} required`);

      // Increment playerLevel
      playerLevel = nextLevelData.level;
      leveledUp = true;
      finalLevelTitle = nextLevelData.title;

      // Add unlockedSymbols to currentUnlockedSymbolPool
      const unlockedSymbols = nextLevelData.unlockedSymbols;
      if (unlockedSymbols.length > 0) {
        // Add to global symbol pool
        currentUnlockedSymbolPool.push(...unlockedSymbols);
        allNewSymbols.push(...unlockedSymbols);
        
        console.log(`🔓 Added ${unlockedSymbols.length} symbols to pool:`, unlockedSymbols);
        console.log(`📦 Current pool size: ${currentUnlockedSymbolPool.length} symbols`);
      }

      console.log(`🎉 LEVEL UP! ${oldLevel} → ${playerLevel} (${finalLevelTitle})`);
    }

    if (leveledUp) {
      // Adjust playerXP - carry over excess XP for the new level
      const currentLevelData = LEVEL_DATA[playerLevel - 1]; // Current level (0-indexed)
      const excessXP = playerXP - currentLevelData.xpRequired;
      
      console.log(`🔄 XP Adjustment: Total ${playerXP} - Base ${currentLevelData.xpRequired} = ${excessXP} excess XP carried over`);
      
      // Note: We keep total XP as is, the UI will calculate the progress bar correctly
      
      // Refresh symbol generator with new symbols
      SymbolGenerator.refreshSymbolPool();
      
      // Emit level up event for UI updates
      this.emitLevelUpEvent(playerLevel, finalLevelTitle, allNewSymbols);
      
      // Update progression manager to stay in sync
      const progression = this.progressionManager.getProgression();
      progression.currentLevel = playerLevel;
      progression.unlockedSymbols.push(...allNewSymbols);
    }

    return {
      leveledUp,
      newLevel: leveledUp ? playerLevel : undefined,
      newSymbols: leveledUp ? allNewSymbols : undefined,
      levelTitle: leveledUp ? finalLevelTitle : undefined
    };
  }

  /**
   * Add XP after a spin with the specified logic
   */
  static addSpinXP(currentBet: number, defeatedMonsters: Array<{ type: MonsterType; wasBoss?: boolean }>): number {
    let baseXP = XP_CONFIG.BASE_XP_PER_SPIN;
    let bonusXP = 0;

    // Calculate bonus XP from defeated monsters
    for (const monster of defeatedMonsters) {
      const isBoss = this.isBossMonster(monster.type);
      bonusXP += isBoss ? XP_CONFIG.BOSS_MONSTER_BONUS : XP_CONFIG.REGULAR_MONSTER_BONUS;
      
      console.log(`💀 Defeated ${monster.type} (${isBoss ? 'BOSS' : 'Regular'}): +${isBoss ? XP_CONFIG.BOSS_MONSTER_BONUS : XP_CONFIG.REGULAR_MONSTER_BONUS} XP`);
    }

    // Scale XP by current bet
    const betMultiplier = currentBet / XP_CONFIG.BASE_BET;
    const totalXP = Math.round((baseXP + bonusXP) * betMultiplier);

    console.log(`📊 XP Calculation: (${baseXP} base + ${bonusXP} bonus) × ${betMultiplier.toFixed(2)} bet multiplier = ${totalXP} XP`);

    // Add XP to global state
    this.addXP(totalXP);

    return totalXP;
  }

  /**
   * Add XP and update global variables
   */
  static addXP(amount: number): void {
    // Update global variable
    playerXP += amount;
    
    console.log(`💫 Added ${amount} XP. Total: ${playerXP} XP, Level: ${playerLevel}`);

    // Check for level up using enhanced function
    const levelUpResult = this.handleLevelUp();
    
    // Always emit XP change event for UI updates
    this.emitXPChangeEvent();
  }

  /**
   * Check if player should level up (called after XP gain) - legacy method
   */
  static checkLevelUp(): boolean {
    const levelUpResult = this.handleLevelUp();
    return levelUpResult.leveledUp;
  }

  /**
   * Emit level up event for UI systems
   */
  private static emitLevelUpEvent(newLevel: number, levelTitle: string, newSymbols: any[]): void {
    console.log(`🚀 GlobalPlayerState: Emitting level up event - Level ${newLevel}, Title: ${levelTitle}`);
    console.log(`🚀 GlobalPlayerState: New symbols:`, newSymbols);
    
    // Create custom event for level up
    const levelUpEvent = new CustomEvent('playerLevelUp', {
      detail: {
        newLevel,
        levelTitle,
        newSymbols,
        totalXP: playerXP
      }
    });

    // Dispatch globally
    window.dispatchEvent(levelUpEvent);
    console.log(`🚀 GlobalPlayerState: Level up event dispatched successfully`);
  }

  /**
   * Emit XP change event for UI updates
   */
  private static emitXPChangeEvent(): void {
    const xpChangeEvent = new CustomEvent('playerXPChange', {
      detail: {
        level: playerLevel,
        xp: playerXP,
        xpProgress: this.getXPProgress()
      }
    });

    window.dispatchEvent(xpChangeEvent);
  }

  /**
   * Check if a monster type is considered a boss
   */
  static isBossMonster(monsterType: MonsterType): boolean {
    return BOSS_MONSTERS.includes(monsterType);
  }

  /**
   * Get current XP progress to next level
   */
  static getXPProgress(): { current: number; required: number; percentage: number } {
    const nextLevelData = LEVEL_DATA[playerLevel]; // Next level (0-indexed)
    
    if (!nextLevelData) {
      return { current: 0, required: 0, percentage: 100 }; // Max level
    }

    const currentLevelData = LEVEL_DATA[playerLevel - 1]; // Current level (0-indexed)
    const currentLevelXP = playerXP - currentLevelData.xpRequired;
    const requiredForNext = nextLevelData.xpForThisLevel;
    
    return {
      current: Math.max(0, currentLevelXP),
      required: requiredForNext,
      percentage: Math.min((Math.max(0, currentLevelXP) / requiredForNext) * 100, 100)
    };
  }

  /**
   * Get current global state
   */
  static getState(): { level: number; xp: number; xpProgress: ReturnType<typeof GlobalPlayerState.getXPProgress> } {
    return {
      level: playerLevel,
      xp: playerXP,
      xpProgress: this.getXPProgress()
    };
  }

  /**
   * Set player level and XP (for testing purposes)
   */
  static setPlayerState(level: number, xp: number): void {
    playerLevel = level;
    playerXP = xp;
    
    // Sync with progression manager
    this.progressionManager.reset();
    if (xp > 0) {
      this.progressionManager.addXp(xp);
    }
    
    // Update symbol pool to match level
    this.updateSymbolPoolForLevel(level);
    
    console.log(`🔧 Player state set to Level ${level}, XP ${xp}`);
  }

  /**
   * Update symbol pool to match a specific level
   */
  private static updateSymbolPoolForLevel(level: number): void {
    // Clear current pool
    currentUnlockedSymbolPool.length = 0;
    
    // Add default symbols
    currentUnlockedSymbolPool.push(...LEVEL_DATA[0].defaultSymbols);
    
    // Add symbols from all completed levels
    for (let i = 1; i < level; i++) {
      if (LEVEL_DATA[i]) {
        currentUnlockedSymbolPool.push(...LEVEL_DATA[i].unlockedSymbols);
      }
    }
    
    // Refresh symbol generator
    SymbolGenerator.refreshSymbolPool();
  }

  /**
   * Reset player state to initial values
   */
  static reset(): void {
    playerLevel = 1;
    playerXP = 0;
    
    this.progressionManager.reset();
    this.updateSymbolPoolForLevel(1);
    
    console.log(`🔄 Player state reset to Level 1, XP 0`);
  }
} 