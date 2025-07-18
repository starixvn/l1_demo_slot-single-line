/**
 * Symbol types in the slot game
 */
export enum SymbolType {
  // Weapon symbols (ordered by rarity - common to rare)
  IRON_SWORD = 'iron_sword',
  STEEL_SWORD = 'steel_sword',
  SILVER_SWORD = 'silver_sword',
  GOLD_SWORD = 'gold_sword',
  CRUSADER_BLADE = 'crusader_blade',
  
  // Special symbols
  BONUS = 'bonus',
  WILD = 'wild',
  SCATTER = 'scatter',
}

/**
 * Symbol configuration with display properties and probabilities
 */
export interface SymbolConfig {
  type: SymbolType;
  name: string;
  value: number;
  probability: number; // Weight for random selection (higher = more common)
  color: number; // PIXI color for the symbol background
  textColor: number; // Text color for the symbol
  emoji?: string; // Emoji representation for POC
}

/**
 * Reel state and configuration
 */
export interface ReelState {
  currentSymbol: SymbolType;
  isSpinning: boolean;
  position: number; // X position on the screen
  index: number; // Reel index (0, 1, 2)
}

/**
 * Spin result for a single reel
 */
export interface ReelResult {
  symbol: SymbolType;
  reelIndex: number;
}

/**
 * Complete spin result for all reels
 */
export interface SpinResult {
  reels: ReelResult[];
  isWin: boolean;
  winType?: WinType;
  payout: number;
  winningSymbols?: SymbolType[];
}

/**
 * Types of wins possible
 */
export enum WinType {
  NO_WIN = 'no_win',
  THREE_OF_A_KIND = 'three_of_a_kind',
  BONUS_TRIGGER = 'bonus_trigger',
  WILD_WIN = 'wild_win',
}

/**
 * Game configuration for the slot machine
 */
export interface SlotGameConfig {
  reelCount: number;
  symbolsPerReel: number;
  reelWidth: number;
  reelHeight: number;
  reelSpacing: number;
  betAmount: number;
}

/**
 * Reel animation configuration
 */
export interface ReelAnimConfig {
  spinDuration: number;
  easeType: string;
  staggerDelay: number; // Delay between reel stops
} 