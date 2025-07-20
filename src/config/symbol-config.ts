import { SymbolType, SymbolConfig } from '@/types/slot-types';

/**
 * Symbol configurations with probabilities and display properties
 * Probabilities are weights - higher numbers = more common
 * Higher damage weapons have lower probability (rarer)
 */
export const SYMBOL_CONFIGS: Record<SymbolType, SymbolConfig> = {
  [SymbolType.BROKEN]: {
    type: SymbolType.BROKEN,
    name: 'Broken',
    value: 0, // 0 HP damage - no effect
    probability: 190, // >50% chance (~60% of total weight)
    color: 0x696969, // Dark gray for broken items
    textColor: 0xFFFFFF,
    emoji: '💔',
  },
  
  [SymbolType.IRON_SWORD]: {
    type: SymbolType.IRON_SWORD,
    name: 'Iron Sword',
    value: 1, // 1 HP damage
    probability: 40, // Most common weapon (40% of remaining weight)
    color: 0x8C7853, // Brown-ish iron
    textColor: 0xFFFFFF,
    emoji: '⚔️',
  },
  
  [SymbolType.BRONZE_AXE]: {
    type: SymbolType.BRONZE_AXE,
    name: 'Bronze Axe',
    value: 2, // 2 HP damage
    probability: 30, // Common (30% of remaining weight)
    color: 0xCD7F32, // Bronze color
    textColor: 0xFFFFFF,
    emoji: '🪓',
  },
  
  [SymbolType.SILVER_SWORD]: {
    type: SymbolType.SILVER_SWORD,
    name: 'Silver Sword',
    value: 3, // 3 HP damage
    probability: 20, // Uncommon (20% of remaining weight)
    color: 0xC0C0C0, // Silver
    textColor: 0x000000,
    emoji: '⚔️',
  },
  
  [SymbolType.IRON_AXE]: {
    type: SymbolType.IRON_AXE,
    name: 'Iron Axe',
    value: 4, // 4 HP damage
    probability: 15, // Rare (15% of remaining weight)
    color: 0x5A5A5A, // Dark iron/steel
    textColor: 0xFFFFFF,
    emoji: '🪓',
  },
  
  [SymbolType.CRUSADER_BLADE]: {
    type: SymbolType.CRUSADER_BLADE,
    name: 'Crusader Blade',
    value: 5, // 5 HP damage
    probability: 10, // Very rare (10% of remaining weight)
    color: 0x9B59B6, // Purple/holy
    textColor: 0xFFFFFF,
    emoji: '⚔️',
  },
  
  [SymbolType.WAR_HAMMER]: {
    type: SymbolType.WAR_HAMMER,
    name: 'War Hammer',
    value: 6, // 6 HP damage
    probability: 7, // Extremely rare (7% of remaining weight)
    color: 0x8B4513, // Dark brown/handle
    textColor: 0xFFFFFF,
    emoji: '🔨',
  },
  
  [SymbolType.MAGIC_STAFF]: {
    type: SymbolType.MAGIC_STAFF,
    name: 'Magic Staff',
    value: 7.5, // 6-9 HP damage (average for calculations)
    probability: 3, // Legendary (3% of remaining weight)
    color: 0x4B0082, // Indigo/magical
    textColor: 0xFFFFFF,
    emoji: '🔮',
  },
};

/**
 * Get all symbol types as an array
 */
export const ALL_SYMBOLS = Object.values(SymbolType);

/**
 * Get total probability weight for normalization
 */
export const TOTAL_PROBABILITY = Object.values(SYMBOL_CONFIGS)
  .reduce((sum, config) => sum + config.probability, 0);

/**
 * Weighted random symbol generator
 */
export class SymbolGenerator {
  private static symbolPool: SymbolType[] = [];
  
  /**
   * Initialize the symbol pool based on probabilities
   */
  static initialize(): void {
    this.symbolPool = [];
    
    Object.values(SYMBOL_CONFIGS).forEach(config => {
      // Add symbols to pool based on their probability weight
      for (let i = 0; i < config.probability; i++) {
        this.symbolPool.push(config.type);
      }
    });
    
    console.log(`SymbolGenerator: Initialized with ${this.symbolPool.length} weighted symbols`);
  }
  
  /**
   * Generate a random symbol based on probability weights
   */
  static generateSymbol(): SymbolType {
    if (this.symbolPool.length === 0) {
      this.initialize();
    }
    
    const randomIndex = Math.floor(Math.random() * this.symbolPool.length);
    return this.symbolPool[randomIndex];
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
   * Get probability statistics
   */
  static getProbabilityStats(): Record<SymbolType, number> {
    const total = TOTAL_PROBABILITY;
    const stats: Record<SymbolType, number> = {} as any;
    
    Object.entries(SYMBOL_CONFIGS).forEach(([symbol, config]) => {
      stats[symbol as SymbolType] = (config.probability / total) * 100;
    });
    
    return stats;
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