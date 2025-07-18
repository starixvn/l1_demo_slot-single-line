import { Container, Text, TextStyle } from 'pixi.js';
import { Reel } from './reel';
import { SymbolType, SpinResult, ReelResult, WinType } from '@/types/slot-types';
import { SymbolGenerator, SYMBOL_CONFIGS, SLOT_CONFIG } from '@/config/symbol-config';

/**
 * Main slot machine class that manages reels and game logic
 */
export class SlotMachine extends Container {
  private reels: Reel[] = [];
  private isSpinning: boolean = false;
  private titleText!: Text;
  private resultText!: Text;
  private balanceText!: Text;
  private balance: number = 1000; // Starting balance

  constructor() {
    super();
    
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
   * Spin all reels
   */
  async spin(): Promise<SpinResult> {
    if (this.isSpinning) {
      console.warn('SlotMachine: Already spinning');
      return this.createNoSpinResult();
    }
    
    if (this.balance < SLOT_CONFIG.BET_AMOUNT) {
      console.warn('SlotMachine: Insufficient balance');
      this.resultText.text = 'Insufficient balance!';
      this.resultText.style.fill = 0xFF0000;
      return this.createNoSpinResult();
    }
    
    // Deduct bet amount
    this.balance -= SLOT_CONFIG.BET_AMOUNT;
    this.updateDisplay();
    
    this.isSpinning = true;
    this.resultText.text = 'Spinning...';
    this.resultText.style.fill = 0xFFFFFF;
    
    console.log('SlotMachine: Starting spin');
    
    // Start spinning all reels
    this.reels.forEach(reel => reel.spin());
    
    // For POC: Instant stop after a brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stop reels and get results
    const reelResults: ReelResult[] = this.reels.map((reel, index) => ({
      symbol: reel.stop(),
      reelIndex: index,
    }));
    
    this.isSpinning = false;
    
    // Calculate win result
    const spinResult = this.calculateWinResult(reelResults);
    
    // Update balance with payout
    this.balance += spinResult.payout;
    
    // Display result
    this.displayResult(spinResult);
    this.updateDisplay();
    
    console.log('SlotMachine: Spin complete', spinResult);
    
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
    
    // Check for bonus symbols
    if (symbolCounts[SymbolType.BONUS] >= 2) {
      isWin = true;
      winType = WinType.BONUS_TRIGGER;
      winningSymbols.push(SymbolType.BONUS);
      payout += 100; // Bonus payout
    }
    
    // Check for wild symbols (substitute for highest value symbol)
    if (symbolCounts[SymbolType.WILD] >= 1 && !isWin) {
      const otherSymbols = symbols.filter(s => s !== SymbolType.WILD);
      if (otherSymbols.length >= 2 && otherSymbols[0] === otherSymbols[1]) {
        isWin = true;
        winType = WinType.WILD_WIN;
        winningSymbols = [otherSymbols[0], SymbolType.WILD];
        
        const config = SYMBOL_CONFIGS[otherSymbols[0]];
        payout = config.value * 2; // Double payout with wild
      }
    }
    
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
        case WinType.BONUS_TRIGGER:
          message = '🎁 BONUS TRIGGERED! 🎁';
          break;
        case WinType.WILD_WIN:
          message = `🌟 WILD WIN: ${symbolNames}! 🌟`;
          break;
        default:
          message = '🎊 YOU WIN! 🎊';
      }
      
      this.resultText.text = `${message}\nPayout: ${result.payout} coins`;
      this.resultText.style.fill = 0x00FF00;
      
      // Highlight winning reels
      this.reels.forEach(reel => {
        const isWinningReel = result.winningSymbols?.includes(reel.getCurrentSymbol());
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