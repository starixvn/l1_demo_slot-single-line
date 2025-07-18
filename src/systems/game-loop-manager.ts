import { GameState, GameLoopState, StateTransition, SpinResult, RespinInfo } from '@/types/slot-types';
import { RespinManager } from './respin-manager';

/**
 * Simple event emitter for browser compatibility
 */
class SimpleEventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  off(event: string, callback: Function): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

/**
 * Event types for game loop notifications
 */
export interface GameLoopEvents {
  stateChanged: (newState: GameState, oldState: GameState) => void;
  respinActivated: (respinInfo: RespinInfo) => void;
  respinCompleted: (respinInfo: RespinInfo) => void;
  gameError: (error: Error) => void;
}

/**
 * Manages the main game loop and state transitions
 */
export class GameLoopManager extends SimpleEventEmitter {
  private static instance: GameLoopManager;
  private respinManager: RespinManager;
  
  private gameState: GameLoopState;
  private transitions: StateTransition[] = [];
  private isRunning: boolean = false;
  private currentRespinInfo: RespinInfo | null = null;

  private constructor() {
    super();
    this.respinManager = RespinManager.getInstance();
    
    this.gameState = {
      currentState: GameState.IDLE,
      previousState: GameState.IDLE,
      stateStartTime: Date.now(),
      spinCount: 0,
      totalRespins: 0,
      consecutiveWins: 0,
      balance: 1000, // Starting balance
    };
    
    this.setupStateTransitions();
    
    console.log('GameLoopManager: Initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GameLoopManager {
    if (!GameLoopManager.instance) {
      GameLoopManager.instance = new GameLoopManager();
    }
    return GameLoopManager.instance;
  }

  /**
   * Setup state transition rules
   */
  private setupStateTransitions(): void {
    this.transitions = [
      // From IDLE to SPINNING
      {
        from: GameState.IDLE,
        to: GameState.SPINNING,
        condition: () => true, // Always allowed
      },
      
      // From SPINNING to ATTACKING or RESPIN_EVALUATING
      {
        from: GameState.SPINNING,
        to: GameState.ATTACKING,
        condition: () => true, // Move to attacking after spin
      },
      
      // From ATTACKING to RESPIN_EVALUATING
      {
        from: GameState.ATTACKING,
        to: GameState.RESPIN_EVALUATING,
        condition: () => true, // Always evaluate respins after combat
      },
      
      // From RESPIN_EVALUATING to RESPINNING (if respins activated)
      {
        from: GameState.RESPIN_EVALUATING,
        to: GameState.RESPINNING,
        condition: () => this.currentRespinInfo?.isRespinActive === true,
      },
      
      // From RESPIN_EVALUATING to IDLE (if no respins)
      {
        from: GameState.RESPIN_EVALUATING,
        to: GameState.IDLE,
        condition: () => this.currentRespinInfo?.isRespinActive !== true,
      },
      
      // From RESPINNING to ATTACKING
      {
        from: GameState.RESPINNING,
        to: GameState.ATTACKING,
        condition: () => true, // Always attack after respin
      },
      
      // From any state to GAME_OVER (balance check)
      {
        from: GameState.IDLE,
        to: GameState.GAME_OVER,
        condition: (state) => state.balance <= 0,
      },
    ];
  }

  /**
   * Start the game loop
   */
  public startGameLoop(): void {
    if (this.isRunning) {
      console.warn('GameLoopManager: Game loop already running');
      return;
    }
    
    this.isRunning = true;
    this.setState(GameState.IDLE);
    
    console.log('GameLoopManager: Game loop started');
  }

  /**
   * Stop the game loop
   */
  public stopGameLoop(): void {
    this.isRunning = false;
    console.log('GameLoopManager: Game loop stopped');
  }

  /**
   * Change game state with validation and events
   */
  public setState(newState: GameState): boolean {
    if (!this.isRunning && newState !== GameState.IDLE) {
      console.warn('GameLoopManager: Cannot change state when game loop is stopped');
      return false;
    }
    
    // Check if transition is allowed
    const allowedTransition = this.transitions.find(
      t => t.from === this.gameState.currentState && t.to === newState
    );
    
    if (!allowedTransition && this.gameState.currentState !== GameState.IDLE) {
      console.warn(`GameLoopManager: Invalid state transition from ${this.gameState.currentState} to ${newState}`);
      return false;
    }
    
    // Check transition condition
    if (allowedTransition && !allowedTransition.condition(this.gameState)) {
      console.log(`GameLoopManager: Transition condition not met for ${this.gameState.currentState} -> ${newState}`);
      return false;
    }
    
    const oldState = this.gameState.currentState;
    this.gameState.previousState = oldState;
    this.gameState.currentState = newState;
    this.gameState.stateStartTime = Date.now();
    
    console.log(`GameLoopManager: State changed from ${oldState} -> ${newState}`);
    
    // Execute transition action if defined
    if (allowedTransition?.action) {
      try {
        allowedTransition.action(this.gameState);
      } catch (error) {
        console.error('GameLoopManager: Error executing transition action:', error);
        this.emit('gameError', error);
      }
    }
    
    // Emit state change event
    this.emit('stateChanged', newState, oldState);
    
    return true;
  }

  /**
   * Process a spin result and handle state transitions
   */
  public async processSpinResult(spinResult: SpinResult): Promise<void> {
    try {
      // Update game statistics
      this.gameState.spinCount++;
      this.gameState.balance += spinResult.payout;
      
      if (spinResult.isWin) {
        this.gameState.consecutiveWins++;
      } else {
        this.gameState.consecutiveWins = 0;
      }
      
      // Add respin info to spin result
      spinResult.respinInfo = this.currentRespinInfo || this.respinManager.createEmptyRespinInfo();
      
      // Move to attacking state
      this.setState(GameState.ATTACKING);
      
      // Simulate combat delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Move to respin evaluation
      this.setState(GameState.RESPIN_EVALUATING);
      
      // Evaluate respins
      await this.evaluateRespins(spinResult);
      
    } catch (error) {
      console.error('GameLoopManager: Error processing spin result:', error);
      this.emit('gameError', error);
      this.setState(GameState.IDLE);
    }
  }

  /**
   * Evaluate and handle respin logic
   */
  private async evaluateRespins(spinResult: SpinResult): Promise<void> {
    // Check if we're currently in a respin sequence
    if (this.currentRespinInfo?.isRespinActive) {
      // Update existing respin info
      this.currentRespinInfo = this.respinManager.updateRespinInfo(this.currentRespinInfo, spinResult);
      
      if (this.currentRespinInfo.isRespinActive) {
        // Still have respins remaining
        this.gameState.totalRespins++;
        this.setState(GameState.RESPINNING);
        return;
      } else {
        // Respins completed
        console.log('GameLoopManager: Respin sequence completed');
        this.emit('respinCompleted', this.currentRespinInfo);
        this.currentRespinInfo = null;
        this.setState(GameState.IDLE);
        return;
      }
    } else {
      // Check for new respin activation
      const respinActivation = this.respinManager.evaluateRespinActivation(spinResult);
      
      if (respinActivation) {
        // Activate new respins
        this.currentRespinInfo = this.respinManager.createRespinInfo(respinActivation);
        this.gameState.totalRespins++;
        
        console.log('GameLoopManager: New respin sequence activated');
        this.emit('respinActivated', this.currentRespinInfo);
        
        this.setState(GameState.RESPINNING);
        return;
      } else {
        // No respins, return to idle
        this.setState(GameState.IDLE);
        return;
      }
    }
  }

  /**
   * Process a respin (similar to regular spin but doesn't deduct balance)
   */
  public async processRespin(spinResult: SpinResult): Promise<void> {
    if (!this.currentRespinInfo?.isRespinActive) {
      console.warn('GameLoopManager: Attempted respin when no respins are active');
      return;
    }
    
    try {
      // Update balance with payout but don't deduct bet
      this.gameState.balance += spinResult.payout;
      
      if (spinResult.isWin) {
        this.gameState.consecutiveWins++;
      }
      
      // Move to attacking state
      this.setState(GameState.ATTACKING);
      
      // Simulate combat delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Move back to respin evaluation
      this.setState(GameState.RESPIN_EVALUATING);
      
      // Re-evaluate respins with new result
      await this.evaluateRespins(spinResult);
      
    } catch (error) {
      console.error('GameLoopManager: Error processing respin:', error);
      this.emit('gameError', error);
      this.setState(GameState.IDLE);
    }
  }

  /**
   * Get current game state
   */
  public getCurrentState(): GameState {
    return this.gameState.currentState;
  }

  /**
   * Get complete game state
   */
  public getGameState(): GameLoopState {
    return { ...this.gameState };
  }

  /**
   * Get current respin information
   */
  public getCurrentRespinInfo(): RespinInfo | null {
    return this.currentRespinInfo ? { ...this.currentRespinInfo } : null;
  }

  /**
   * Check if currently in a respin state
   */
  public isInRespinMode(): boolean {
    return this.gameState.currentState === GameState.RESPINNING || 
           this.currentRespinInfo?.isRespinActive === true;
  }

  /**
   * Check if the game can accept a new spin
   */
  public canSpin(): boolean {
    return this.isRunning && 
           (this.gameState.currentState === GameState.IDLE || 
            this.gameState.currentState === GameState.RESPINNING) &&
           this.gameState.balance > 0;
  }

  /**
   * Update balance (for external updates like combat rewards)
   */
  public updateBalance(amount: number): void {
    this.gameState.balance = Math.max(0, this.gameState.balance + amount);
    
    // Check for game over condition
    if (this.gameState.balance <= 0) {
      this.setState(GameState.GAME_OVER);
    }
  }

  /**
   * Reset game state
   */
  public resetGame(): void {
    this.currentRespinInfo = null;
    this.gameState = {
      currentState: GameState.IDLE,
      previousState: GameState.IDLE,
      stateStartTime: Date.now(),
      spinCount: 0,
      totalRespins: 0,
      consecutiveWins: 0,
      balance: 1000,
    };
    
    console.log('GameLoopManager: Game reset');
  }

  /**
   * Get game statistics for display
   */
  public getGameStats(): string {
    const stats = [];
    stats.push(`State: ${this.gameState.currentState}`);
    stats.push(`Spins: ${this.gameState.spinCount}`);
    stats.push(`Respins: ${this.gameState.totalRespins}`);
    stats.push(`Wins: ${this.gameState.consecutiveWins}`);
    stats.push(`Balance: ${this.gameState.balance}`);
    
    if (this.currentRespinInfo?.isRespinActive) {
      stats.push(this.respinManager.formatRespinDisplay(this.currentRespinInfo));
    }
    
    return stats.join('\n');
  }
} 