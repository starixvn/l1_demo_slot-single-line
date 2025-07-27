import { LevelData, SymbolType, PlayerProgression } from '@/types/slot-types';

/**
 * Comprehensive level system configuration for 10 levels
 * Each level unlocks 2 new symbols (except level 1 which has 10 default symbols)
 */
export const LEVEL_DATA: LevelData[] = [
  {
    level: 1,
    xpRequired: 0,           // Starting level
    xpForThisLevel: 0,       // No XP needed for level 1
    unlockedSymbols: [],     // No new unlocks at level 1
    defaultSymbols: [        // 10 default symbols for level 1
      SymbolType.SYMBOL_0,   // Broken
      SymbolType.SYMBOL_1,   // Iron Sword
      SymbolType.SYMBOL_2,   // Bronze Axe
      SymbolType.SYMBOL_3,   // Silver Sword
      SymbolType.SYMBOL_4,   // Iron Axe
      SymbolType.SYMBOL_5,   // Crusader Blade
      SymbolType.SYMBOL_6,   // War Hammer
      SymbolType.SYMBOL_7,   // Magic Staff
      SymbolType.SYMBOL_8,   // Steel Blade
      SymbolType.SYMBOL_9,   // Mystic Orb
    ],
    title: 'Novice Warrior',
    description: 'Begin your journey with basic weapons and tools.'
  },
  {
    level: 2,
    xpRequired: 100,         // Total XP: 100
    xpForThisLevel: 100,     // Level 1 to 2: 100 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_10,  // Digital Scythe
      SymbolType.SYMBOL_11,  // Light Dagger
    ],
    defaultSymbols: [],
    title: 'Tech Initiate',
    description: 'Unlock advanced digital weaponry and light-based tools.'
  },
  {
    level: 3,
    xpRequired: 300,         // Total XP: 300 (100 + 200)
    xpForThisLevel: 200,     // Level 2 to 3: 200 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_12,  // Shadow Bow
      SymbolType.SYMBOL_13,  // Thunder Mace
    ],
    defaultSymbols: [],
    title: 'Elemental Fighter',
    description: 'Master shadow and thunder elemental weapons.'
  },
  {
    level: 4,
    xpRequired: 650,         // Total XP: 650 (300 + 350)
    xpForThisLevel: 350,     // Level 3 to 4: 350 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_14,  // Crystal Spear
      SymbolType.SYMBOL_15,  // Flame Whip
    ],
    defaultSymbols: [],
    title: 'Crystal Forge Master',
    description: 'Wield crystal and flame weapons with expertise.'
  },
  {
    level: 5,
    xpRequired: 1200,        // Total XP: 1200 (650 + 550)
    xpForThisLevel: 550,     // Level 4 to 5: 550 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_16,  // Frost Blade
      SymbolType.SYMBOL_17,  // Void Hammer
    ],
    defaultSymbols: [],
    title: 'Frost & Void Walker',
    description: 'Command the powers of ice and void.'
  },
  {
    level: 6,
    xpRequired: 2000,        // Total XP: 2000 (1200 + 800)
    xpForThisLevel: 800,     // Level 5 to 6: 800 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_18,  // Plasma Rifle
      SymbolType.SYMBOL_19,  // Energy Sword
    ],
    defaultSymbols: [],
    title: 'Energy Weapons Expert',
    description: 'Harness plasma and pure energy in battle.'
  },
  {
    level: 7,
    xpRequired: 3100,        // Total XP: 3100 (2000 + 1100)
    xpForThisLevel: 1100,    // Level 6 to 7: 1100 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_20,  // Quantum Blade
      SymbolType.SYMBOL_21,  // Cosmic Staff
    ],
    defaultSymbols: [],
    title: 'Quantum Guardian',
    description: 'Manipulate quantum forces and cosmic energy.'
  },
  {
    level: 8,
    xpRequired: 4550,        // Total XP: 4550 (3100 + 1450)
    xpForThisLevel: 1450,    // Level 7 to 8: 1450 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_22,  // Dimensional Axe
      SymbolType.SYMBOL_23,  // Time Dagger
    ],
    defaultSymbols: [],
    title: 'Dimensional Warrior',
    description: 'Control dimensions and bend time to your will.'
  },
  {
    level: 9,
    xpRequired: 6400,        // Total XP: 6400 (4550 + 1850)
    xpForThisLevel: 1850,    // Level 8 to 9: 1850 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_24,  // Soul Reaper
      SymbolType.SYMBOL_25,  // Infinity Sword
    ],
    defaultSymbols: [],
    title: 'Soul Master',
    description: 'Command souls and wield infinite power.'
  },
  {
    level: 10,
    xpRequired: 8700,        // Total XP: 8700 (6400 + 2300)
    xpForThisLevel: 2300,    // Level 9 to 10: 2300 XP
    unlockedSymbols: [
      SymbolType.SYMBOL_26,  // Divine Hammer
      SymbolType.SYMBOL_27,  // Eternal Blade
    ],
    defaultSymbols: [],
    title: 'Divine Champion',
    description: 'Ascend to godhood with divine and eternal weapons.'
  }
];

/**
 * Global current unlocked symbol pool - starts with Level 1 default symbols
 * This array is dynamically updated as player levels up
 */
export let currentUnlockedSymbolPool: SymbolType[] = [...LEVEL_DATA[0].defaultSymbols];

/**
 * Player progression manager
 */
export class PlayerProgressionManager {
  private static instance: PlayerProgressionManager;
  private progression: PlayerProgression;

  private constructor() {
    // Initialize with Level 1 defaults
    this.progression = {
      currentLevel: 1,
      currentXp: 0,
      totalXp: 0,
      unlockedSymbols: [...LEVEL_DATA[0].defaultSymbols],
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
   * Add XP and check for level ups
   */
  addXp(amount: number): { leveledUp: boolean; newLevel?: number; newSymbols?: SymbolType[] } {
    const oldLevel = this.progression.currentLevel;
    this.progression.currentXp += amount;
    this.progression.totalXp += amount;

    // Check for level up
    let leveledUp = false;
    let newSymbols: SymbolType[] = [];

    // Check if we've reached the next level
    while (this.progression.currentLevel < LEVEL_DATA.length) {
      const nextLevelData = LEVEL_DATA[this.progression.currentLevel]; // currentLevel is 0-indexed for array
      
      if (this.progression.totalXp >= nextLevelData.xpRequired) {
        this.progression.currentLevel++;
        leveledUp = true;
        
        // Add newly unlocked symbols
        const unlockedSymbols = nextLevelData.unlockedSymbols;
        this.progression.unlockedSymbols.push(...unlockedSymbols);
        newSymbols.push(...unlockedSymbols);
        
        console.log(`🎉 LEVEL UP! Reached Level ${this.progression.currentLevel}`);
        console.log(`📦 Unlocked symbols:`, unlockedSymbols.map(s => s));
      } else {
        break;
      }
    }

    if (leveledUp) {
      this.progression.newSymbolsToShow = newSymbols;
      this.updateGlobalSymbolPool();
    }

    return {
      leveledUp,
      newLevel: leveledUp ? this.progression.currentLevel : undefined,
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
    const nextLevel = this.getNextLevelData();
    if (!nextLevel) {
      return { current: 0, required: 0, percentage: 100 }; // Max level
    }

    const currentLevelData = this.getCurrentLevelData();
    const currentLevelXp = this.progression.totalXp - currentLevelData.xpRequired;
    const requiredForNext = nextLevel.xpForThisLevel;
    
    return {
      current: currentLevelXp,
      required: requiredForNext,
      percentage: Math.min((currentLevelXp / requiredForNext) * 100, 100)
    };
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
    this.progression = {
      currentLevel: 1,
      currentXp: 0,
      totalXp: 0,
      unlockedSymbols: [...LEVEL_DATA[0].defaultSymbols],
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