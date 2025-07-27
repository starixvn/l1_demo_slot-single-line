/**
 * Symbol types in the slot game
 * Extended to support level-based unlocking system with 28 total symbols
 */
export enum SymbolType {
  // Level 1 default symbols (10 symbols: 0-9)
  SYMBOL_0 = 'symbol_0',        // 0 HP damage - Broken
  SYMBOL_1 = 'symbol_1',        // 1 HP damage - Iron Sword
  SYMBOL_2 = 'symbol_2',        // 2 HP damage - Bronze Axe
  SYMBOL_3 = 'symbol_3',        // 3 HP damage - Silver Sword
  SYMBOL_4 = 'symbol_4',        // 4 HP damage - Iron Axe
  SYMBOL_5 = 'symbol_5',        // 5 HP damage - Crusader Blade
  SYMBOL_6 = 'symbol_6',        // 6 HP damage - War Hammer
  SYMBOL_7 = 'symbol_7',        // 7 HP damage - Magic Staff
  SYMBOL_8 = 'symbol_8',        // 8 HP damage - Steel Blade
  SYMBOL_9 = 'symbol_9',        // 9 HP damage - Mystic Orb
  
  // Level 2 unlocks (10-11)
  SYMBOL_10 = 'symbol_10',      // 10 HP damage - Digital Scythe
  SYMBOL_11 = 'symbol_11',      // 11 HP damage - Light Dagger
  
  // Level 3 unlocks (12-13)
  SYMBOL_12 = 'symbol_12',      // 12 HP damage - Shadow Bow
  SYMBOL_13 = 'symbol_13',      // 13 HP damage - Thunder Mace
  
  // Level 4 unlocks (14-15)
  SYMBOL_14 = 'symbol_14',      // 14 HP damage - Crystal Spear
  SYMBOL_15 = 'symbol_15',      // 15 HP damage - Flame Whip
  
  // Level 5 unlocks (16-17)
  SYMBOL_16 = 'symbol_16',      // 16 HP damage - Frost Blade
  SYMBOL_17 = 'symbol_17',      // 17 HP damage - Void Hammer
  
  // Level 6 unlocks (18-19)
  SYMBOL_18 = 'symbol_18',      // 18 HP damage - Plasma Rifle
  SYMBOL_19 = 'symbol_19',      // 19 HP damage - Energy Sword
  
  // Level 7 unlocks (20-21)
  SYMBOL_20 = 'symbol_20',      // 20 HP damage - Quantum Blade
  SYMBOL_21 = 'symbol_21',      // 21 HP damage - Cosmic Staff
  
  // Level 8 unlocks (22-23)
  SYMBOL_22 = 'symbol_22',      // 22 HP damage - Dimensional Axe
  SYMBOL_23 = 'symbol_23',      // 23 HP damage - Time Dagger
  
  // Level 9 unlocks (24-25)
  SYMBOL_24 = 'symbol_24',      // 24 HP damage - Soul Reaper
  SYMBOL_25 = 'symbol_25',      // 25 HP damage - Infinity Sword
  
  // Level 10 unlocks (26-27) - Ultimate weapons
  SYMBOL_26 = 'symbol_26',      // 26 HP damage - Divine Hammer
  SYMBOL_27 = 'symbol_27',      // 27 HP damage - Eternal Blade
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
 * Player level progression data structure
 */
export interface LevelData {
  level: number;                    // Level number (1-10)
  xpRequired: number;              // Total XP needed to reach this level from start
  xpForThisLevel: number;          // XP needed to go from previous level to this level
  unlockedSymbols: SymbolType[];   // New symbols unlocked at this level
  defaultSymbols: SymbolType[];    // Default symbols (only populated for level 1)
  title: string;                   // Level title/name
  description: string;             // Level description
}

/**
 * Player progression state
 */
export interface PlayerProgression {
  currentLevel: number;
  currentXp: number;
  totalXp: number;
  unlockedSymbols: SymbolType[];   // All symbols unlocked by the player
  newSymbolsToShow: SymbolType[];  // Newly unlocked symbols to display
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
  respinInfo?: RespinInfo; // Added for respin logic
}

/**
 * Types of wins possible
 */
export enum WinType {
  NO_WIN = 'no_win',
  THREE_OF_A_KIND = 'three_of_a_kind',
}

/**
 * Game state enumeration
 */
export enum GameState {
  IDLE = 'idle',
  SPINNING = 'spinning',
  ATTACKING = 'attacking',
  RESPINNING = 'respinning',
  RESPIN_EVALUATING = 'respin_evaluating',
  GAME_OVER = 'game_over',
}

/**
 * Respin information and logic
 */
export interface RespinInfo {
  isRespinActive: boolean;
  respinsRemaining: number;
  totalRespinsGranted: number;
  activatorSymbols: SymbolType[]; // Symbols that triggered the respin
  chainCount: number; // Number of times respins have chained
}

/**
 * Game loop state management
 */
export interface GameLoopState {
  currentState: GameState;
  previousState: GameState;
  stateStartTime: number;
  spinCount: number;
  totalRespins: number;
  consecutiveWins: number;
  balance: number;
}

/**
 * State transition configuration
 */
export interface StateTransition {
  from: GameState;
  to: GameState;
  condition: (state: GameLoopState) => boolean;
  action?: (state: GameLoopState) => Promise<void> | void;
}

/**
 * Respin activation conditions
 */
export interface RespinActivation {
  activeSymbolCount: number;
  respinsGranted: number;
  symbols: SymbolType[];
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