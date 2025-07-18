import { SymbolType, SymbolConfig } from '@/types/slot-types';

/**
 * Symbol configurations with probabilities and display properties
 * Probabilities are weights - higher numbers = more common
 */
export const SYMBOL_CONFIGS: Record<SymbolType, SymbolConfig> = {
  [SymbolType.IRON_SWORD]: {
    type: SymbolType.IRON_SWORD,
    name: 'Iron Sword',
    value: 10,
    probability: 35, // Most common weapon
    color: 0x8C7853, // Brown-ish
    textColor: 0xFFFFFF,
    emoji: '⚔️',
  },
  
  [SymbolType.STEEL_SWORD]: {
    type: SymbolType.STEEL_SWORD,
    name: 'Steel Sword',
    value: 25,
    probability: 25, // Common
    color: 0x71797E, // Steel gray
    textColor: 0xFFFFFF,
    emoji: '🗡️',
  },
  
  [SymbolType.SILVER_SWORD]: {
    type: SymbolType.SILVER_SWORD,
    name: 'Silver Sword',
    value: 50,
    probability: 20, // Uncommon
    color: 0xC0C0C0, // Silver
    textColor: 0x000000,
    emoji: '⚔️',
  },
  
  [SymbolType.GOLD_SWORD]: {
    type: SymbolType.GOLD_SWORD,
    name: 'Gold Sword',
    value: 100,
    probability: 12, // Rare
    color: 0xFFD700, // Gold
    textColor: 0x000000,
    emoji: '🗡️',
  },
  
  [SymbolType.CRUSADER_BLADE]: {
    type: SymbolType.CRUSADER_BLADE,
    name: 'Crusader Blade',
    value: 250,
    probability: 5, // Very rare
    color: 0x9B59B6, // Purple
    textColor: 0xFFFFFF,
    emoji: '⚔️',
  },
  
  [SymbolType.BONUS]: {
    type: SymbolType.BONUS,
    name: 'Bonus',
    value: 0, // Triggers bonus round
    probability: 8, // Special symbol
    color: 0xE74C3C, // Red
    textColor: 0xFFFFFF,
    emoji: '🎁',
  },
  
  [SymbolType.WILD]: {
    type: SymbolType.WILD,
    name: 'Wild',
    value: 0, // Substitutes for other symbols
    probability: 6, // Rare special
    color: 0x2ECC71, // Green
    textColor: 0xFFFFFF,
    emoji: '🌟',
  },
  
  [SymbolType.SCATTER]: {
    type: SymbolType.SCATTER,
    name: 'Scatter',
    value: 0, // Special payout rules
    probability: 4, // Very rare special
    color: 0x3498DB, // Blue
    textColor: 0xFFFFFF,
    emoji: '💎',
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