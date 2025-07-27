import { SymbolType, SymbolConfig } from '@/types/slot-types';
import { currentUnlockedSymbolPool } from '@/config/level-config';

/**
 * Symbol configurations with probabilities and display properties
 * Extended to support all 28 symbols across 10 levels
 * Probabilities are weights - higher numbers = more common
 * Higher damage weapons have lower probability (rarer)
 */
export const SYMBOL_CONFIGS: Record<SymbolType, SymbolConfig> = {
  // Level 1 default symbols (0-9)
  [SymbolType.SYMBOL_0]: {
    type: SymbolType.SYMBOL_0,
    name: 'Broken',
    value: 0, // 0 HP damage - no effect
    probability: 190, // >50% chance (~60% of total weight)
    color: 0x696969, // Dark gray for broken items
    textColor: 0xFFFFFF,
    emoji: '💔',
  },
  
  [SymbolType.SYMBOL_1]: {
    type: SymbolType.SYMBOL_1,
    name: 'Iron Sword',
    value: 1, // 1 HP damage
    probability: 40, // Most common weapon (40% of remaining weight)
    color: 0x8C7853, // Brown-ish iron
    textColor: 0xFFFFFF,
    emoji: '⚔️',
  },
  
  [SymbolType.SYMBOL_2]: {
    type: SymbolType.SYMBOL_2,
    name: 'Bronze Axe',
    value: 2, // 2 HP damage
    probability: 30, // Common (30% of remaining weight)
    color: 0xCD7F32, // Bronze color
    textColor: 0xFFFFFF,
    emoji: '🪓',
  },
  
  [SymbolType.SYMBOL_3]: {
    type: SymbolType.SYMBOL_3,
    name: 'Silver Sword',
    value: 3, // 3 HP damage
    probability: 20, // Uncommon (20% of remaining weight)
    color: 0xC0C0C0, // Silver
    textColor: 0x000000,
    emoji: '⚔️',
  },
  
  [SymbolType.SYMBOL_4]: {
    type: SymbolType.SYMBOL_4,
    name: 'Iron Axe',
    value: 4, // 4 HP damage
    probability: 15, // Rare (15% of remaining weight)
    color: 0x5A5A5A, // Dark iron/steel
    textColor: 0xFFFFFF,
    emoji: '🪓',
  },
  
  [SymbolType.SYMBOL_5]: {
    type: SymbolType.SYMBOL_5,
    name: 'Crusader Blade',
    value: 5, // 5 HP damage
    probability: 10, // Very rare (10% of remaining weight)
    color: 0x9B59B6, // Purple/holy
    textColor: 0xFFFFFF,
    emoji: '⚔️',
  },
  
  [SymbolType.SYMBOL_6]: {
    type: SymbolType.SYMBOL_6,
    name: 'War Hammer',
    value: 6, // 6 HP damage
    probability: 7, // Extremely rare (7% of remaining weight)
    color: 0x8B4513, // Dark brown/handle
    textColor: 0xFFFFFF,
    emoji: '🔨',
  },
  
  [SymbolType.SYMBOL_7]: {
    type: SymbolType.SYMBOL_7,
    name: 'Magic Staff',
    value: 7, // 7 HP damage
    probability: 5, // Legendary (5% of remaining weight)
    color: 0x4B0082, // Indigo/magical
    textColor: 0xFFFFFF,
    emoji: '🔮',
  },

  [SymbolType.SYMBOL_8]: {
    type: SymbolType.SYMBOL_8,
    name: 'Steel Blade',
    value: 8, // 8 HP damage
    probability: 4, // Rare
    color: 0x708090, // Steel gray
    textColor: 0xFFFFFF,
    emoji: '⚔️',
  },

  [SymbolType.SYMBOL_9]: {
    type: SymbolType.SYMBOL_9,
    name: 'Mystic Orb',
    value: 9, // 9 HP damage
    probability: 3, // Very rare
    color: 0x9932CC, // Dark orchid
    textColor: 0xFFFFFF,
    emoji: '🔮',
  },

  // Level 2 unlocks (10-11)
  [SymbolType.SYMBOL_10]: {
    type: SymbolType.SYMBOL_10,
    name: 'Digital Scythe',
    value: 10, // 10 HP damage
    probability: 2, // Extremely rare
    color: 0x00FFFF, // Cyan/digital
    textColor: 0x000000,
    emoji: '🔪',
  },

  [SymbolType.SYMBOL_11]: {
    type: SymbolType.SYMBOL_11,
    name: 'Light Dagger',
    value: 11, // 11 HP damage
    probability: 2, // Extremely rare
    color: 0xFFFFE0, // Light yellow
    textColor: 0x000000,
    emoji: '🗡️',
  },

  // Level 3 unlocks (12-13)
  [SymbolType.SYMBOL_12]: {
    type: SymbolType.SYMBOL_12,
    name: 'Shadow Bow',
    value: 12, // 12 HP damage
    probability: 2, // Extremely rare
    color: 0x2F2F2F, // Dark gray
    textColor: 0xFFFFFF,
    emoji: '🏹',
  },

  [SymbolType.SYMBOL_13]: {
    type: SymbolType.SYMBOL_13,
    name: 'Thunder Mace',
    value: 13, // 13 HP damage
    probability: 2, // Extremely rare
    color: 0xFFD700, // Gold/thunder
    textColor: 0x000000,
    emoji: '🔨',
  },

  // Level 4 unlocks (14-15)
  [SymbolType.SYMBOL_14]: {
    type: SymbolType.SYMBOL_14,
    name: 'Crystal Spear',
    value: 14, // 14 HP damage
    probability: 1, // Legendary
    color: 0xE6E6FA, // Lavender/crystal
    textColor: 0x000000,
    emoji: '🪃',
  },

  [SymbolType.SYMBOL_15]: {
    type: SymbolType.SYMBOL_15,
    name: 'Flame Whip',
    value: 15, // 15 HP damage
    probability: 1, // Legendary
    color: 0xFF4500, // Orange red/flame
    textColor: 0xFFFFFF,
    emoji: '🔥',
  },

  // Level 5 unlocks (16-17)
  [SymbolType.SYMBOL_16]: {
    type: SymbolType.SYMBOL_16,
    name: 'Frost Blade',
    value: 16, // 16 HP damage
    probability: 1, // Legendary
    color: 0xB0E0E6, // Powder blue/frost
    textColor: 0x000000,
    emoji: '❄️',
  },

  [SymbolType.SYMBOL_17]: {
    type: SymbolType.SYMBOL_17,
    name: 'Void Hammer',
    value: 17, // 17 HP damage
    probability: 1, // Legendary
    color: 0x191970, // Midnight blue/void
    textColor: 0xFFFFFF,
    emoji: '🌑',
  },

  // Level 6 unlocks (18-19)
  [SymbolType.SYMBOL_18]: {
    type: SymbolType.SYMBOL_18,
    name: 'Plasma Rifle',
    value: 18, // 18 HP damage
    probability: 1, // Legendary
    color: 0x00FF7F, // Spring green/plasma
    textColor: 0x000000,
    emoji: '🔫',
  },

  [SymbolType.SYMBOL_19]: {
    type: SymbolType.SYMBOL_19,
    name: 'Energy Sword',
    value: 19, // 19 HP damage
    probability: 1, // Legendary
    color: 0x7FFF00, // Chartreuse/energy
    textColor: 0x000000,
    emoji: '⚡',
  },

  // Level 7 unlocks (20-21)
  [SymbolType.SYMBOL_20]: {
    type: SymbolType.SYMBOL_20,
    name: 'Quantum Blade',
    value: 20, // 20 HP damage
    probability: 1, // Legendary
    color: 0xDA70D6, // Orchid/quantum
    textColor: 0x000000,
    emoji: '🌌',
  },

  [SymbolType.SYMBOL_21]: {
    type: SymbolType.SYMBOL_21,
    name: 'Cosmic Staff',
    value: 21, // 21 HP damage
    probability: 1, // Legendary
    color: 0x8A2BE2, // Blue violet/cosmic
    textColor: 0xFFFFFF,
    emoji: '⭐',
  },

  // Level 8 unlocks (22-23)
  [SymbolType.SYMBOL_22]: {
    type: SymbolType.SYMBOL_22,
    name: 'Dimensional Axe',
    value: 22, // 22 HP damage
    probability: 1, // Legendary
    color: 0xFF69B4, // Hot pink/dimensional
    textColor: 0x000000,
    emoji: '🌀',
  },

  [SymbolType.SYMBOL_23]: {
    type: SymbolType.SYMBOL_23,
    name: 'Time Dagger',
    value: 23, // 23 HP damage
    probability: 1, // Legendary
    color: 0x20B2AA, // Light sea green/time
    textColor: 0x000000,
    emoji: '⏰',
  },

  // Level 9 unlocks (24-25)
  [SymbolType.SYMBOL_24]: {
    type: SymbolType.SYMBOL_24,
    name: 'Soul Reaper',
    value: 24, // 24 HP damage
    probability: 1, // Legendary
    color: 0x800080, // Purple/soul
    textColor: 0xFFFFFF,
    emoji: '💀',
  },

  [SymbolType.SYMBOL_25]: {
    type: SymbolType.SYMBOL_25,
    name: 'Infinity Sword',
    value: 25, // 25 HP damage
    probability: 1, // Legendary
    color: 0xFFD700, // Gold/infinity
    textColor: 0x000000,
    emoji: '♾️',
  },

  // Level 10 unlocks (26-27) - Ultimate weapons
  [SymbolType.SYMBOL_26]: {
    type: SymbolType.SYMBOL_26,
    name: 'Divine Hammer',
    value: 26, // 26 HP damage
    probability: 1, // Legendary
    color: 0xFFF8DC, // Cornsilk/divine
    textColor: 0x000000,
    emoji: '⚡',
  },

  [SymbolType.SYMBOL_27]: {
    type: SymbolType.SYMBOL_27,
    name: 'Eternal Blade',
    value: 27, // 27 HP damage
    probability: 1, // Legendary
    color: 0xF0F8FF, // Alice blue/eternal
    textColor: 0x000000,
    emoji: '🔱',
  },
};

/**
 * Get all symbol types as an array
 */
export const ALL_SYMBOLS = Object.values(SymbolType);

/**
 * Calculate total probability weight for current unlocked symbols
 */
export function getCurrentTotalProbability(): number {
  return currentUnlockedSymbolPool.reduce((sum, symbolType) => {
    return sum + SYMBOL_CONFIGS[symbolType].probability;
  }, 0);
}

/**
 * Weighted random symbol generator with level-based unlocking
 */
export class SymbolGenerator {
  private static symbolPool: SymbolType[] = [];
  
  /**
   * Initialize the symbol pool based on currently unlocked symbols and their probabilities
   */
  static initialize(): void {
    this.symbolPool = [];
    
    // Only use symbols from the current unlocked pool
    currentUnlockedSymbolPool.forEach(symbolType => {
      const config = SYMBOL_CONFIGS[symbolType];
      // Add symbols to pool based on their probability weight
      for (let i = 0; i < config.probability; i++) {
        this.symbolPool.push(symbolType);
      }
    });
    
    console.log(`SymbolGenerator: Initialized with ${this.symbolPool.length} weighted symbols from ${currentUnlockedSymbolPool.length} unlocked types`);
    console.log(`Unlocked symbols:`, currentUnlockedSymbolPool.map(s => SYMBOL_CONFIGS[s].name));
  }
  
  /**
   * Generate a random symbol based on probability weights from unlocked symbols only
   */
  static generateSymbol(): SymbolType {
    if (this.symbolPool.length === 0) {
      this.initialize();
    }
    
    const randomIndex = Math.floor(Math.random() * this.symbolPool.length);
    const selectedSymbol = this.symbolPool[randomIndex];
    
    // Verify the selected symbol is actually unlocked (safety check)
    if (!currentUnlockedSymbolPool.includes(selectedSymbol)) {
      console.warn(`Generated symbol ${selectedSymbol} not in unlocked pool, reinitializing...`);
      this.initialize();
      return this.generateSymbol(); // Retry after reinitializing
    }
    
    return selectedSymbol;
  }
  
  /**
   * Refresh symbol pool when new symbols are unlocked
   */
  static refreshSymbolPool(): void {
    console.log(`🔄 Refreshing symbol pool with newly unlocked symbols...`);
    this.initialize();
  }
  
  /**
   * Generate multiple symbols for testing
   */
  static generateSymbols(count: number): SymbolType[] {
    return Array.from({ length: count }, () => this.generateSymbol());
  }
  
  /**
   * Get symbol configuration
   */
  static getSymbolConfig(symbol: SymbolType): SymbolConfig {
    return SYMBOL_CONFIGS[symbol];
  }
  
  /**
   * Get probability statistics for currently unlocked symbols
   */
  static getProbabilityStats(): Record<string, number> {
    const total = getCurrentTotalProbability();
    const stats: Record<string, number> = {};
    
    currentUnlockedSymbolPool.forEach(symbolType => {
      const config = SYMBOL_CONFIGS[symbolType];
      stats[config.name] = (config.probability / total) * 100;
    });
    
    return stats;
  }

  /**
   * Get unlocked symbols with their configurations
   */
  static getUnlockedSymbolConfigs(): SymbolConfig[] {
    return currentUnlockedSymbolPool.map(symbolType => SYMBOL_CONFIGS[symbolType]);
  }
}

/**
 * Slot game configuration
 */
export const SLOT_CONFIG = {
  REEL_COUNT: 3,
  SYMBOLS_PER_REEL: 1, // For POC, just one symbol per reel
  REEL_WIDTH: 200,
  REEL_HEIGHT: 200,
  REEL_SPACING: 50,
  BET_AMOUNT: 10,
  
  // Animation settings (for future use)
  SPIN_DURATION: 1000, // ms
  STAGGER_DELAY: 200, // ms between reel stops
} as const; 