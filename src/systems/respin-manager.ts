import { SymbolType, RespinInfo, RespinActivation, SpinResult } from '@/types/slot-types';
import { SYMBOL_CONFIGS } from '@/config/symbol-config';

/**
 * Manages respin logic and activation conditions
 */
export class RespinManager {
  private static instance: RespinManager;
  
  // Configuration for respin activation
  private readonly RESPIN_RULES: Map<number, number> = new Map([
    [1, 1], // 1 active symbol = 1 respin
    [3, 5], // 3 active symbols = 5 respins
  ]);
  
  // Maximum respin chains to prevent infinite loops
  private readonly MAX_RESPIN_CHAINS = 10;
  
  // Active symbols that can trigger respins (weapon symbols)
  private readonly ACTIVE_SYMBOLS: Set<SymbolType> = new Set([
    SymbolType.IRON_SWORD,
    SymbolType.STEEL_SWORD,
    SymbolType.SILVER_SWORD,
    SymbolType.GOLD_SWORD,
    SymbolType.CRUSADER_BLADE,
  ]);

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): RespinManager {
    if (!RespinManager.instance) {
      RespinManager.instance = new RespinManager();
    }
    return RespinManager.instance;
  }

  /**
   * Evaluate if a spin result should trigger respins
   */
  public evaluateRespinActivation(spinResult: SpinResult): RespinActivation | null {
    const symbols = spinResult.reels.map(reel => reel.symbol);
    const activeSymbols = this.getActiveSymbols(symbols);
    
    console.log('RespinManager: Evaluating respin activation', {
      symbols,
      activeSymbols,
      activeCount: activeSymbols.length
    });
    
    // Check if we have a respin rule for this number of active symbols
    const respinsGranted = this.RESPIN_RULES.get(activeSymbols.length);
    
    if (respinsGranted && respinsGranted > 0) {
      const activation: RespinActivation = {
        activeSymbolCount: activeSymbols.length,
        respinsGranted,
        symbols: activeSymbols,
      };
      
      console.log('RespinManager: Respin activated!', activation);
      return activation;
    }
    
    console.log('RespinManager: No respin activation');
    return null;
  }

  /**
   * Create initial respin info from activation
   */
  public createRespinInfo(activation: RespinActivation, chainCount: number = 0): RespinInfo {
    return {
      isRespinActive: true,
      respinsRemaining: activation.respinsGranted,
      totalRespinsGranted: activation.respinsGranted,
      activatorSymbols: [...activation.symbols],
      chainCount,
    };
  }

  /**
   * Update respin info after a respin
   */
  public updateRespinInfo(respinInfo: RespinInfo, newSpinResult: SpinResult): RespinInfo {
    const updatedInfo = { ...respinInfo };
    
    // Decrease remaining respins
    updatedInfo.respinsRemaining = Math.max(0, updatedInfo.respinsRemaining - 1);
    
    // Check if this respin triggers new respins (chaining)
    const newActivation = this.evaluateRespinActivation(newSpinResult);
    
    if (newActivation && updatedInfo.chainCount < this.MAX_RESPIN_CHAINS) {
      console.log('RespinManager: Respin chain triggered!', {
        chainCount: updatedInfo.chainCount + 1,
        newRespins: newActivation.respinsGranted
      });
      
      // Add new respins to the remaining count
      updatedInfo.respinsRemaining += newActivation.respinsGranted;
      updatedInfo.totalRespinsGranted += newActivation.respinsGranted;
      updatedInfo.chainCount++;
      
      // Update activator symbols (combine old and new)
      const combinedSymbols = [...updatedInfo.activatorSymbols, ...newActivation.symbols];
      updatedInfo.activatorSymbols = [...new Set(combinedSymbols)]; // Remove duplicates
    }
    
    // Check if respins are completed
    if (updatedInfo.respinsRemaining <= 0) {
      updatedInfo.isRespinActive = false;
      console.log('RespinManager: Respins completed', {
        totalRespinsUsed: updatedInfo.totalRespinsGranted,
        chains: updatedInfo.chainCount
      });
    }
    
    return updatedInfo;
  }

  /**
   * Get active symbols from a symbol array
   */
  private getActiveSymbols(symbols: SymbolType[]): SymbolType[] {
    return symbols.filter(symbol => this.ACTIVE_SYMBOLS.has(symbol));
  }

  /**
   * Check if a symbol is considered active for respins
   */
  public isActiveSymbol(symbol: SymbolType): boolean {
    return this.ACTIVE_SYMBOLS.has(symbol);
  }

  /**
   * Get respin rules for debugging/info
   */
  public getRespinRules(): Map<number, number> {
    return new Map(this.RESPIN_RULES);
  }

  /**
   * Get active symbol types
   */
  public getActiveSymbolTypes(): SymbolType[] {
    return Array.from(this.ACTIVE_SYMBOLS);
  }

  /**
   * Format respin info for display
   */
  public formatRespinDisplay(respinInfo: RespinInfo): string {
    if (!respinInfo.isRespinActive) {
      return 'No active respins';
    }
    
    const symbolNames = respinInfo.activatorSymbols
      .map(symbol => SYMBOL_CONFIGS[symbol].name)
      .join(', ');
    
    let message = `🔄 RESPINS ACTIVE! 🔄\n`;
    message += `Remaining: ${respinInfo.respinsRemaining}\n`;
    message += `Triggered by: ${symbolNames}`;
    
    if (respinInfo.chainCount > 0) {
      message += `\n⛓️ Chain: ${respinInfo.chainCount}`;
    }
    
    return message;
  }

  /**
   * Calculate total potential respins for a given symbol combination
   */
  public calculatePotentialRespins(symbols: SymbolType[]): number {
    const activeSymbols = this.getActiveSymbols(symbols);
    return this.RESPIN_RULES.get(activeSymbols.length) || 0;
  }

  /**
   * Reset respin state (for game reset)
   */
  public createEmptyRespinInfo(): RespinInfo {
    return {
      isRespinActive: false,
      respinsRemaining: 0,
      totalRespinsGranted: 0,
      activatorSymbols: [],
      chainCount: 0,
    };
  }
} 