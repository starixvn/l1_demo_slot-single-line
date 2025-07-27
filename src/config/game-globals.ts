import { updateSymbolPool } from '@/config/level-config';
import { SymbolGenerator } from '@/config/symbol-config';
import { MonsterType } from '@/types/monster-types';
import { getLevelSystem, PlayerState as LevelSystemPlayerState, MonsterDefeat } from '@/systems/level-system';

/**
 * Global player state variables (legacy interface)
 */
export let playerLevel: number = 1;
export let playerXP: number = 0;

/**
 * Internal player state for new level system
 */
let internalPlayerState: LevelSystemPlayerState | null = null;

/**
 * Level system instance
 */
const levelSystem = getLevelSystem();

/**
 * Global player state manager - refactored to use new level system
 */
export class GlobalPlayerState {

  /**
   * Initialize the global state system
   */
  static initialize(): void {
    // Initialize internal state from level system
    internalPlayerState = levelSystem.createInitialPlayerState();
    
    // Sync legacy variables
    playerLevel = internalPlayerState.level;
    playerXP = internalPlayerState.totalXp;
    
    // Update symbol pool
    updateSymbolPool(internalPlayerState.unlockedSymbols);
    
    console.log(`🌍 Global state initialized: Level ${playerLevel}, XP ${playerXP}`);
    console.log(`🔓 Initial symbols:`, internalPlayerState.unlockedSymbols);
  }

  /**
   * Enhanced handleLevelUp function using new level system
   */
  static handleLevelUp(): { leveledUp: boolean; newLevel?: number; newSymbols?: any[]; levelTitle?: string } {
    if (!internalPlayerState) {
      console.error('Internal player state not initialized');
      return { leveledUp: false };
    }

    const oldLevel = playerLevel;
    
    // Check for level ups using level system (no XP addition, just check current state)
    const result = levelSystem.addXpToPlayer(internalPlayerState, 0);
    
    // Update legacy variables
    playerLevel = internalPlayerState.level;
    playerXP = internalPlayerState.totalXp;

    if (result.levelUpResults.length > 0) {
      const lastLevelUp = result.levelUpResults[result.levelUpResults.length - 1];
      const allNewSymbols: string[] = [];
      
      // Collect all new symbols from all level ups
      for (const levelUpResult of result.levelUpResults) {
        if (levelUpResult.newSymbols) {
          allNewSymbols.push(...levelUpResult.newSymbols);
        }
      }

      // Update symbol pool
      updateSymbolPool(internalPlayerState.unlockedSymbols);
      
      // Refresh symbol generator with new symbols
      SymbolGenerator.refreshSymbolPool();
      
      // Emit level up event for UI updates
      this.emitLevelUpEvent(playerLevel, lastLevelUp.levelTitle || '', allNewSymbols);
      
      console.log(`🎉 LEVEL UP! ${oldLevel} → ${playerLevel} (${lastLevelUp.levelTitle})`);
      console.log(`🔓 Added ${allNewSymbols.length} symbols:`, allNewSymbols);

      return {
        leveledUp: true,
        newLevel: playerLevel,
        newSymbols: allNewSymbols,
        levelTitle: lastLevelUp.levelTitle
      };
    }

    return { leveledUp: false };
  }

  /**
   * Add XP after a spin using the new level system
   */
  static addSpinXP(currentBet: number, defeatedMonsters: Array<{ type: MonsterType; wasBoss?: boolean }>): number {
    if (!internalPlayerState) {
      console.error('Internal player state not initialized');
      return 0;
    }

    // Convert to level system format
    const monsters: MonsterDefeat[] = defeatedMonsters.map(monster => ({
      type: monster.type.toString(),
      wasBoss: monster.wasBoss
    }));

    // Calculate XP using level system
    const totalXP = levelSystem.calculateSpinXp(currentBet, monsters);

    console.log(`📊 XP Calculation:`, {
      currentBet,
      defeatedMonstersCount: monsters.length,
      monsters: monsters.map(m => ({ type: m.type, wasBoss: m.wasBoss })),
      totalXP
    });

    // Add XP to global state
    this.addXP(totalXP);

    return totalXP;
  }

  /**
   * Add XP and update global variables using new level system
   */
  static addXP(amount: number): void {
    if (!internalPlayerState) {
      console.error('Internal player state not initialized');
      return;
    }

    // Use level system to add XP
    const result = levelSystem.addXpToPlayer(internalPlayerState, amount);
    
    // Update legacy variables
    playerLevel = internalPlayerState.level;
    playerXP = internalPlayerState.totalXp;
    
    console.log(`💫 Added ${amount} XP. Total: ${playerXP} XP, Level: ${playerLevel}`);

    // Handle level ups if they occurred
    if (result.levelUpResults.length > 0) {
      const lastLevelUp = result.levelUpResults[result.levelUpResults.length - 1];
      const allNewSymbols: string[] = [];
      
      // Collect all new symbols from all level ups
      for (const levelUpResult of result.levelUpResults) {
        if (levelUpResult.newSymbols) {
          allNewSymbols.push(...levelUpResult.newSymbols);
        }
      }

      // Update symbol pool
      updateSymbolPool(internalPlayerState.unlockedSymbols);
      
      // Refresh symbol generator with new symbols
      SymbolGenerator.refreshSymbolPool();
      
      // Emit level up event for UI updates
      this.emitLevelUpEvent(playerLevel, lastLevelUp.levelTitle || '', allNewSymbols);
      
      console.log(`🎉 LEVEL UP! Level ${playerLevel} (${lastLevelUp.levelTitle})`);
      console.log(`🔓 Added ${allNewSymbols.length} symbols:`, allNewSymbols);
    }
    
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
   * Check if a monster type is considered a boss using level system
   */
  static isBossMonster(monsterType: MonsterType): boolean {
    return levelSystem.isBossMonster(monsterType.toString());
  }

  /**
   * Get current XP progress to next level using new level system
   */
  static getXPProgress(): { current: number; required: number; percentage: number } {
    if (!internalPlayerState) {
      return { current: 0, required: 0, percentage: 0 };
    }

    return levelSystem.getXpProgress(internalPlayerState);
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
   * Set player XP (for testing purposes) using new level system
   */
  static setPlayerState(xp: number): void {
    if (!internalPlayerState) {
      console.error('Internal player state not initialized');
      return;
    }

    // Reset to initial state
    const initialState = levelSystem.createInitialPlayerState();
    internalPlayerState.level = initialState.level;
    internalPlayerState.totalXp = initialState.totalXp;
    internalPlayerState.unlockedSymbols = [...initialState.unlockedSymbols];

    // Add XP to reach desired state
    if (xp > 0) {
      levelSystem.addXpToPlayer(internalPlayerState, xp);
    }

    // Update legacy variables
    playerLevel = internalPlayerState.level;
    playerXP = internalPlayerState.totalXp;

    // Update symbol pool
    updateSymbolPool(internalPlayerState.unlockedSymbols);
    
    // Refresh symbol generator
    SymbolGenerator.refreshSymbolPool();
    
    console.log(`🔧 Player state set to Level ${playerLevel}, XP ${playerXP}`);
  }

  /**
   * Reset player state to initial values using new level system
   */
  static reset(): void {
    if (!internalPlayerState) {
      this.initialize();
      return;
    }

    // Reset internal state
    const initialState = levelSystem.createInitialPlayerState();
    internalPlayerState.level = initialState.level;
    internalPlayerState.totalXp = initialState.totalXp;
    internalPlayerState.unlockedSymbols = [...initialState.unlockedSymbols];

    // Update legacy variables
    playerLevel = internalPlayerState.level;
    playerXP = internalPlayerState.totalXp;

    // Update symbol pool
    updateSymbolPool(internalPlayerState.unlockedSymbols);
    
    // Refresh symbol generator
    SymbolGenerator.refreshSymbolPool();
    
    console.log(`🔄 Player state reset to Level ${playerLevel}, XP ${playerXP}`);
  }
} 