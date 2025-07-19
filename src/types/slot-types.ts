/**
 * Symbol types in the slot game
 */
export enum SymbolType {
  // Weapon symbols (ordered by damage - low to high)
  IRON_SWORD = 'iron_sword',        // 1 HP damage
  BRONZE_AXE = 'bronze_axe',        // 2 HP damage
  SILVER_SWORD = 'silver_sword',    // 3 HP damage
  IRON_AXE = 'iron_axe',           // 4 HP damage
  CRUSADER_BLADE = 'crusader_blade', // 5 HP damage
  WAR_HAMMER = 'war_hammer',        // 6 HP damage
  MAGIC_STAFF = 'magic_staff',      // 6-9 HP damage (random)
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