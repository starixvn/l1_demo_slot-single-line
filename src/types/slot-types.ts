/**
 * Symbol types in the slot game
 */
export enum SymbolType {
  // Symbols ordered by damage (0-7)
  SYMBOL_0 = 'symbol_0',        // 0 HP damage (was BROKEN)
  SYMBOL_1 = 'symbol_1',        // 1 HP damage (was IRON_SWORD)
  SYMBOL_2 = 'symbol_2',        // 2 HP damage (was BRONZE_AXE)
  SYMBOL_3 = 'symbol_3',        // 3 HP damage (was SILVER_SWORD)
  SYMBOL_4 = 'symbol_4',        // 4 HP damage (was IRON_AXE)
  SYMBOL_5 = 'symbol_5',        // 5 HP damage (was CRUSADER_BLADE)
  SYMBOL_6 = 'symbol_6',        // 6 HP damage (was WAR_HAMMER)
  SYMBOL_7 = 'symbol_7',        // 6-9 HP damage (was MAGIC_STAFF)
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