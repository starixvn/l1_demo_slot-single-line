import { Container, Text, TextStyle } from 'pixi.js';
import { Reel } from './reel';
import { SymbolType, SpinResult, ReelResult, WinType, RespinInfo } from '@/types/slot-types';
import { SymbolGenerator, SYMBOL_CONFIGS, SLOT_CONFIG } from '@/config/symbol-config';
import { RespinManager } from '@/systems/respin-manager';

/**
 * Main slot machine class that manages reels and game logic
 */
export class SlotMachine extends Container {
  private reels: Reel[] = [];
  private isSpinning: boolean = false;
  private titleText!: Text;
  private resultText!: Text;
  private balanceText!: Text;
  private respinText!: Text;
  private balance: number = 1000; // Starting balance
  private respinManager: RespinManager;

  constructor() {
    super();
    
    this.respinManager = RespinManager.getInstance();
    
    this.setupSlotMachine();
    this.updateDisplay();
    
    // Initialize symbol generator
    SymbolGenerator.initialize();
    
    console.log('SlotMachine: Initialized with 3 reels');
    console.log('Symbol probabilities:', SymbolGenerator.getProbabilityStats());
  }

  /**
   * Set up the slot machine layout and components
   */
  private setupSlotMachine(): void {
    // Create title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    this.titleText = new Text('🎰 WEAPON SLOT MACHINE 🎰', titleStyle);
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = 0;
    this.titleText.y = -100;
    this.addChild(this.titleText);
    
    // Create reels
    this.createReels();
    
    // Create result display
    const resultStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    this.resultText = new Text('Click SPIN to start!', resultStyle);
    this.resultText.anchor.set(0.5, 0);
    this.resultText.x = 0;
    this.resultText.y = SLOT_CONFIG.REEL_HEIGHT + 50;
    this.addChild(this.resultText);
    
    // Create balance display
    const balanceStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fill: 0xFFD700,
      align: 'center',
    });
    
    this.balanceText = new Text(`Balance: ${this.balance} coins`, balanceStyle);
    this.balanceText.anchor.set(0.5, 0);
    this.balanceText.x = 0;
    this.balanceText.y = SLOT_CONFIG.REEL_HEIGHT + 100;
    this.addChild(this.balanceText);
    
    // Create respin display
    const respinStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fill: 0x00FFFF,
      align: 'center',
    });
    
    this.respinText = new Text('', respinStyle);
    this.respinText.anchor.set(0.5, 0);
    this.respinText.x = 0;
    this.respinText.y = SLOT_CONFIG.REEL_HEIGHT + 130;
    this.addChild(this.respinText);
  }
  
  /**
   * Create the three reels
   */
  private createReels(): void {
    const totalWidth = (SLOT_CONFIG.REEL_WIDTH * SLOT_CONFIG.REEL_COUNT) + 
                      (SLOT_CONFIG.REEL_SPACING * (SLOT_CONFIG.REEL_COUNT - 1));
    const startX = -totalWidth / 2;
    
    for (let i = 0; i < SLOT_CONFIG.REEL_COUNT; i++) {
      const x = startX + (i * (SLOT_CONFIG.REEL_WIDTH + SLOT_CONFIG.REEL_SPACING));
      const reel = new Reel(i, x, 0);
      
      this.reels.push(reel);
      this.addChild(reel);
    }
  }
  
  /**
   * Spin all reels (regular spin with bet deduction)
   */
  async spin(): Promise<SpinResult> {
    return this.performSpin(false);
  }

  /**
   * Perform a respin (no bet deduction)
   */
  async respin(): Promise<SpinResult> {
    return this.performSpin(true);
  }

  /**
   * Core spinning logic shared by spin() and respin()
   */
  private async performSpin(isRespin: boolean): Promise<SpinResult> {
    if (this.isSpinning) {
      console.warn('SlotMachine: Already spinning');
      return this.createNoSpinResult();
    }
    
    // Only check balance and deduct for regular spins
    if (!isRespin) {
      if (this.balance < SLOT_CONFIG.BET_AMOUNT) {
        console.warn('SlotMachine: Insufficient balance');
        this.resultText.text = 'Insufficient balance!';
        this.resultText.style.fill = 0xFF0000;
        return this.createNoSpinResult();
      }
      
      // Deduct bet amount for regular spins only
      this.balance -= SLOT_CONFIG.BET_AMOUNT;
    }
    
    this.updateDisplay();
    
    this.isSpinning = true;
    this.resultText.text = isRespin ? 'Respinning...' : 'Spinning...';
    this.resultText.style.fill = isRespin ? 0x00FFFF : 0xFFFFFF;
    
    console.log(`SlotMachine: Starting ${isRespin ? 'respin' : 'spin'}`);
    
    // Start spinning all reels
    this.reels.forEach(reel => reel.spin());
    
    // Wait for initial spin-up time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate final symbols for each reel
    const targetSymbols: SymbolType[] = this.reels.map(() => SymbolGenerator.generateSymbol());
    
    // Stop reels with staggered timing for realistic effect
    const reelResults: ReelResult[] = [];
    const stopDelay = 600; // Base delay between reel stops
    
    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      const targetSymbol = targetSymbols[i];
      
      // Stop this reel after a delay
      setTimeout(() => {
        const finalSymbol = reel.stop(targetSymbol);
        reelResults[i] = {
          symbol: finalSymbol,
          reelIndex: i,
        };
        
                 // Check if all reels have stopped
         if (reelResults.filter(r => r).length === this.reels.length) {
           // All reels stopped - we'll handle result in the main flow
         }
      }, i * stopDelay);
    }
    
    // Wait for all reels to stop before continuing
    await new Promise(resolve => {
      const checkStopped = () => {
        // Check if all reels have actually finished their animations
        const allStopped = this.reels.every(reel => !reel.isSpinning());
        if (allStopped && reelResults.filter(r => r).length === this.reels.length) {
          resolve(void 0);
        } else {
          setTimeout(checkStopped, 100);
        }
      };
      checkStopped();
    });
    
    this.isSpinning = false;
    
    // Calculate win result
    const spinResult = this.calculateWinResult(reelResults);
    
    // Update balance with payout (always add payouts regardless of spin type)
    this.balance += spinResult.payout;
    
    // Display result
    this.displayResult(spinResult);
    this.updateDisplay();
    
    console.log(`SlotMachine: ${isRespin ? 'Respin' : 'Spin'} complete`, spinResult);
    
    return spinResult;
  }
  
  /**
   * Calculate win result from reel symbols
   */
  private calculateWinResult(reelResults: ReelResult[]): SpinResult {
    const symbols = reelResults.map(result => result.symbol);
    const symbolCounts = this.countSymbols(symbols);
    
    let isWin = false;
    let winType = WinType.NO_WIN;
    let payout = 0;
    let winningSymbols: SymbolType[] = [];
    
    // Check for three of a kind
    for (const [symbol, count] of Object.entries(symbolCounts)) {
      if (count === 3) {
        isWin = true;
        winType = WinType.THREE_OF_A_KIND;
        winningSymbols = [symbol as SymbolType];
        
        const config = SYMBOL_CONFIGS[symbol as SymbolType];
        payout = config.value * 3; // Triple payout for three of a kind
        break;
      }
    }
    
    // All wins are now based on three of a kind only
    // No special symbol logic needed
    
    return {
      reels: reelResults,
      isWin,
      winType,
      payout,
      winningSymbols,
    };
  }
  
  /**
   * Count occurrences of each symbol
   */
  private countSymbols(symbols: SymbolType[]): Record<string, number> {
    return symbols.reduce((counts, symbol) => {
      counts[symbol] = (counts[symbol] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }
  
  /**
   * Display the spin result
   */
  private displayResult(result: SpinResult): void {
    if (result.isWin) {
      const symbolNames = result.winningSymbols?.map(s => SYMBOL_CONFIGS[s].name).join(', ') || '';
      
      let message = '';
      switch (result.winType) {
        case WinType.THREE_OF_A_KIND:
          message = `🎉 THREE ${symbolNames.toUpperCase()}! 🎉`;
          break;
        default:
          message = '🎊 YOU WIN! 🎊';
      }
      
      this.resultText.text = `${message}\nPayout: ${result.payout} coins`;
      this.resultText.style.fill = 0x00FF00;
      
      // Highlight winning reels
      this.reels.forEach(reel => {
        const isWinningReel = result.winningSymbols?.includes(reel.getCurrentSymbol()) || false;
        reel.highlight(isWinningReel);
      });
      
    } else {
      this.resultText.text = 'Try again!';
      this.resultText.style.fill = 0xFF6B6B;
      
      // Reset all reel highlights
      this.reels.forEach(reel => reel.highlight(false));
    }
  }
  
  /**
   * Update display elements
   */
  private updateDisplay(): void {
    this.balanceText.text = `Balance: ${this.balance} coins`;
  }

  /**
   * Update respin display information
   */
  public updateRespinDisplay(respinInfo: RespinInfo | null): void {
    if (!respinInfo || !respinInfo.isRespinActive) {
      this.respinText.text = '';
      return;
    }
    
    this.respinText.text = this.respinManager.formatRespinDisplay(respinInfo);
    this.respinText.style.fill = 0x00FFFF;
  }
  
  /**
   * Create a "no spin" result for error cases
   */
  private createNoSpinResult(): SpinResult {
    return {
      reels: [],
      isWin: false,
      winType: WinType.NO_WIN,
      payout: 0,
    };
  }
  
  /**
   * Get current balance
   */
  getBalance(): number {
    return this.balance;
  }
  
  /**
   * Add coins to balance (for testing or bonuses)
   */
  addCoins(amount: number): void {
    this.balance += amount;
    this.updateDisplay();
  }
  
  /**
   * Get current reel symbols
   */
  getCurrentSymbols(): SymbolType[] {
    return this.reels.map(reel => reel.getCurrentSymbol());
  }
  
  /**
   * Set specific symbols (for testing)
   */
  setSymbols(symbols: SymbolType[]): void {
    symbols.forEach((symbol, index) => {
      if (this.reels[index]) {
        this.reels[index].setSymbol(symbol);
      }
    });
  }
  
  /**
   * Check if currently spinning
   */
  getIsSpinning(): boolean {
    return this.isSpinning;
  }
  
  /**
   * Get reel at specific index
   */
  getReel(index: number): Reel | undefined {
    return this.reels[index];
  }
  
  /**
   * Get all reels
   */
  getReels(): Reel[] {
    return [...this.reels];
  }
} 