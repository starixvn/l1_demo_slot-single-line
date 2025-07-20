import { Container, Text, TextStyle } from 'pixi.js';
import { Reel } from './reel';
import { SymbolType, SpinResult, ReelResult, WinType, RespinInfo } from '@/types/slot-types';
import { SymbolGenerator, SYMBOL_CONFIGS, SLOT_CONFIG } from '@/config/symbol-config';
import { RespinManager } from '@/systems/respin-manager';

/**
 * Area layout configuration for responsive positioning
 */
interface AreaLayoutConfig {
  areaHeight: number;
  areaWidth: number;
  centerX: number;
  topY: number;
}

/**
 * Main slot machine class that manages reels and game logic with responsive layout
 */
export class SlotMachine extends Container {
  private reels: Reel[] = [];
  private isSpinning: boolean = false;
  private resultText!: Text;
  private respinText!: Text;
  private balance: number = 1000; // Starting balance
  private respinManager: RespinManager;

  // Layout configuration
  private areaConfig: AreaLayoutConfig = {
    areaHeight: 432, // Default 40% of 1080
    areaWidth: 1536, // Default 80% of 1920
    centerX: 0,
    topY: 0
  };

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
   * Update the area layout for responsive design
   */
  public updateAreaLayout(config: AreaLayoutConfig): void {
    this.areaConfig = config;
    this.repositionElements();
    console.log('SlotMachine: Area layout updated', config);
  }

  /**
   * Reposition all elements according to the current area configuration
   */
  private repositionElements(): void {
    const { areaHeight, centerX, topY } = this.areaConfig;
    
    // Calculate reel area (use more space since title is removed)
    const reelAreaHeight = Math.min(areaHeight * 0.6, SLOT_CONFIG.REEL_HEIGHT);
    const reelAreaY = topY + areaHeight * 0.15; // Move reels higher since no title
    
    // Position reels horizontally centered
    const totalReelWidth = (SLOT_CONFIG.REEL_WIDTH * 3) + (SLOT_CONFIG.REEL_SPACING * 2);
    const startX = centerX - totalReelWidth / 2;
    
    this.reels.forEach((reel, index) => {
      // Ensure perfect centering: start position + spacing for each reel + half reel width for anchor
      reel.x = startX + (index * (SLOT_CONFIG.REEL_WIDTH + SLOT_CONFIG.REEL_SPACING)) + SLOT_CONFIG.REEL_WIDTH / 2;
      reel.y = reelAreaY;
    });
    
    // Position text elements below reels - all centered horizontally
    const textAreaY = reelAreaY + reelAreaHeight + 20;
    
    // All text elements centered on centerX for perfect horizontal alignment
    this.resultText.x = centerX;
    this.resultText.y = textAreaY;
    
    this.respinText.x = centerX;
    this.respinText.y = textAreaY + 30; // Moved up since balance text is removed
  }

  /**
   * Set up the slot machine layout and components
   */
  private setupSlotMachine(): void {
    // Title removed to save space for monster trails
    
    // Create reels
    this.createReels();
    
    // Create result display
    const resultStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 20, // Adjusted size for responsive layout
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    this.resultText = new Text('Click SPIN to start!', resultStyle);
    this.resultText.anchor.set(0.5, 0);
    this.addChild(this.resultText);
    
    // Create respin display (balance removed - shown in player info panel)
    const respinStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 14, // Adjusted size
      fill: 0x00FFFF,
      align: 'center',
    });
    
    this.respinText = new Text('', respinStyle);
    this.respinText.anchor.set(0.5, 0);
    this.addChild(this.respinText);
    
    // Initial positioning
    this.repositionElements();
  }
  
  /**
   * Create the three reels
   */
  private createReels(): void {
    // Create reels with temporary positions - repositionElements() will set final positions
    for (let i = 0; i < SLOT_CONFIG.REEL_COUNT; i++) {
      const reel = new Reel(i, 0, 0); // Temporary position
      
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
    
    // 🎯 GENERATE FINAL SYMBOLS IMMEDIATELY (like real slot machines)
    const finalSymbols: SymbolType[] = this.reels.map(() => SymbolGenerator.generateSymbol());
    console.log(`SlotMachine: 🎯 PREDETERMINED RESULTS: ${finalSymbols.join(', ')}`);
    
    let reelResults: ReelResult[] = [];
    
    try {
      // Start spinning all reels
      this.reels.forEach(reel => reel.spin());
      
      // Wait for initial spin-up time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Calculate stagger delays for visual effect
      const staggerDelays = this.calculateStaggerDelays();
      
      console.log(`SlotMachine: Stopping reels with delays: ${staggerDelays.map(d => d + 'ms').join(', ')}`);
      console.log(`SlotMachine: Each reel will naturally land on its predetermined symbol`);
      
      // Create promises for each reel stop with predetermined symbols
      const reelStopPromises = this.reels.map((reel, i) => {
        return new Promise<ReelResult>((resolve) => {
          setTimeout(async () => {
            try {
              console.log(`SlotMachine: Starting reel ${i} stop - predetermined symbol: ${finalSymbols[i]}`);
              const resultSymbol = await reel.stopAtSymbol(finalSymbols[i]);
              console.log(`SlotMachine: Reel ${i} naturally landed on: ${resultSymbol}`);
              resolve({
                symbol: resultSymbol,
                reelIndex: i,
              });
            } catch (error) {
              console.error(`Reel ${i} stop error:`, error);
              // Fallback to predetermined symbol if there's an error
              resolve({
                symbol: finalSymbols[i],
                reelIndex: i,
              });
            }
          }, staggerDelays[i]);
        });
      });
      
      // Wait for all reels to complete their animations
      console.log('SlotMachine: Waiting for all reels to naturally stop...');
      reelResults = await Promise.all(reelStopPromises);
      
      console.log(`SlotMachine: All reels completed naturally. Results:`, reelResults.map(r => `${r.reelIndex}:${r.symbol}`).join(', '));
      
    } catch (error) {
      console.error(`SlotMachine: Error during ${isRespin ? 'respin' : 'spin'}:`, error);
      // Reset state on error
      this.isSpinning = false;
      this.reels.forEach(reel => {
        if (reel.isSpinning()) {
          reel.setSymbol(reel.getCurrentSymbol()); // Force stop
        }
      });
      return this.createNoSpinResult();
    }
    
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
    // Balance text removed - now displayed in player info panel
    // Only respin text and result text are handled by slot machine
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
    // Stop any current spinning
    if (this.isSpinning) {
      this.isSpinning = false;
    }
    
    symbols.forEach((symbol, index) => {
      if (this.reels[index]) {
        this.reels[index].setSymbol(symbol);
      }
    });
    
    // Update display to reflect changes
    this.updateDisplay();
    
    console.log(`SlotMachine: Symbols set to [${symbols.join(', ')}]`);
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

  /**
   * Calculate stagger delays for reel stops to align with animation durations
   */
  private calculateStaggerDelays(): number[] {
    // Calculate optimal stagger delays based on reel animation times
    // We want reels to start stopping at times that create a nice cascade effect
    // while ensuring the last reel has enough time to complete its animation
    
    const baseStaggerDelay = 500; // Base delay between reel stops
    const delays: number[] = [];
    
    for (let i = 0; i < this.reels.length; i++) {
      // Progressive delays: 0ms, 500ms, 1000ms
      delays.push(i * baseStaggerDelay);
    }
    
    console.log(`SlotMachine: Calculated stagger delays: ${delays.join('ms, ')}ms`);
    return delays;
  }
} 