import { Container, Text, TextStyle, Graphics } from 'pixi.js';

/**
 * Player information display showing balance, bet, and win amounts
 */
export class PlayerInfoDisplay extends Container {
  private balanceText!: Text;
  private betText!: Text;
  private winText!: Text;
  private totalWinText!: Text;
  private background!: Graphics;

  private currentBalance: number = 1000;
  private currentBet: number = 10;
  private currentWin: number = 0;
  private totalWins: number = 0;
  private lastWinAmount: number = 0;

  // Display configuration
  private readonly PANEL_WIDTH = 600;
  private readonly PANEL_HEIGHT = 80;

  constructor() {
    super();
    
    this.setupInfoDisplay();
    this.updateAllDisplays();
    
    console.log('PlayerInfoDisplay: Initialized');
  }

  /**
   * Set up the player information display components
   */
  private setupInfoDisplay(): void {
    // Create background panel
    this.createBackground();
    
    // Create text styles
    const labelStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });

    const valueStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xFFD700,
      align: 'center',
    });

    const winStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x00FF00,
      align: 'center',
    });

    // Calculate positions for 4 sections
    const sectionWidth = this.PANEL_WIDTH / 4;
    
    // Balance section
    const balanceLabel = new Text('BALANCE', labelStyle);
    balanceLabel.anchor.set(0.5, 0);
    balanceLabel.x = sectionWidth * 0.5;
    balanceLabel.y = 10;
    this.addChild(balanceLabel);

    this.balanceText = new Text('1000', valueStyle);
    this.balanceText.anchor.set(0.5, 0);
    this.balanceText.x = sectionWidth * 0.5;
    this.balanceText.y = 35;
    this.addChild(this.balanceText);

    // Bet section
    const betLabel = new Text('BET', labelStyle);
    betLabel.anchor.set(0.5, 0);
    betLabel.x = sectionWidth * 1.5;
    betLabel.y = 10;
    this.addChild(betLabel);

    this.betText = new Text('10', valueStyle);
    this.betText.anchor.set(0.5, 0);
    this.betText.x = sectionWidth * 1.5;
    this.betText.y = 35;
    this.addChild(this.betText);

    // Last Win section
    const winLabel = new Text('LAST WIN', labelStyle);
    winLabel.anchor.set(0.5, 0);
    winLabel.x = sectionWidth * 2.5;
    winLabel.y = 10;
    this.addChild(winLabel);

    this.winText = new Text('0', winStyle);
    this.winText.anchor.set(0.5, 0);
    this.winText.x = sectionWidth * 2.5;
    this.winText.y = 35;
    this.addChild(this.winText);

    // Total Wins section
    const totalWinLabel = new Text('TOTAL WINS', labelStyle);
    totalWinLabel.anchor.set(0.5, 0);
    totalWinLabel.x = sectionWidth * 3.5;
    totalWinLabel.y = 10;
    this.addChild(totalWinLabel);

    this.totalWinText = new Text('0', winStyle);
    this.totalWinText.anchor.set(0.5, 0);
    this.totalWinText.x = sectionWidth * 3.5;
    this.totalWinText.y = 35;
    this.addChild(this.totalWinText);
  }

  /**
   * Create background panel for the info display
   */
  private createBackground(): void {
    this.background = new Graphics();
    
    // Main panel background
    this.background.beginFill(0x1A1A1A, 0.9);
    this.background.lineStyle(2, 0x333333, 1);
    this.background.drawRoundedRect(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, 10);
    
    // Add dividers between sections
    this.background.lineStyle(1, 0x444444, 0.7);
    const sectionWidth = this.PANEL_WIDTH / 4;
    for (let i = 1; i < 4; i++) {
      const x = sectionWidth * i;
      this.background.moveTo(x, 10);
      this.background.lineTo(x, this.PANEL_HEIGHT - 10);
    }
    
    this.background.endFill();
    this.addChild(this.background);
  }

  /**
   * Update balance display
   */
  public updateBalance(newBalance: number): void {
    this.currentBalance = Math.max(0, newBalance);
    this.balanceText.text = this.currentBalance.toString();
    
    // Change color based on balance level
    if (this.currentBalance <= 0) {
      this.balanceText.style.fill = 0xFF0000; // Red for zero balance
    } else if (this.currentBalance < 100) {
      this.balanceText.style.fill = 0xFFAA00; // Orange for low balance
    } else {
      this.balanceText.style.fill = 0xFFD700; // Gold for normal balance
    }
    
    console.log(`PlayerInfoDisplay: Balance updated to ${this.currentBalance}`);
  }

  /**
   * Update bet amount display
   */
  public updateBet(newBet: number): void {
    this.currentBet = Math.max(0, newBet);
    this.betText.text = this.currentBet.toString();
    
    console.log(`PlayerInfoDisplay: Bet updated to ${this.currentBet}`);
  }

  /**
   * Update win amount display
   */
  public updateWin(winAmount: number): void {
    this.lastWinAmount = Math.max(0, winAmount);
    this.currentWin = this.lastWinAmount;
    this.winText.text = this.currentWin.toString();
    
    // Add to total wins
    if (winAmount > 0) {
      this.totalWins += winAmount;
      this.totalWinText.text = this.totalWins.toString();
      
      // Animate win text for positive wins
      this.animateWinText();
    }
    
    console.log(`PlayerInfoDisplay: Win updated to ${this.currentWin}, Total: ${this.totalWins}`);
  }

  /**
   * Animate the win text for visual feedback
   */
  private animateWinText(): void {
    if (this.lastWinAmount <= 0) return;
    
    // Scale animation for win text
    const originalScale = this.winText.scale.x;
    this.winText.scale.set(1.5);
    
    // Tween back to original scale
    const duration = 500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const scale = 1.5 - (0.5 * easeOut);
      
      this.winText.scale.set(scale);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.winText.scale.set(originalScale);
      }
    };
    
    animate();
  }

  /**
   * Update all displays at once (useful for initialization)
   */
  public updateAllDisplays(): void {
    this.updateBalance(this.currentBalance);
    this.updateBet(this.currentBet);
    this.updateWin(this.currentWin);
  }

  /**
   * Reset win display (call at start of new spin)
   */
  public resetWin(): void {
    this.updateWin(0);
  }

  /**
   * Get current balance
   */
  public getBalance(): number {
    return this.currentBalance;
  }

  /**
   * Get current bet amount
   */
  public getBet(): number {
    return this.currentBet;
  }

  /**
   * Get last win amount
   */
  public getLastWin(): number {
    return this.lastWinAmount;
  }

  /**
   * Get total wins amount
   */
  public getTotalWins(): number {
    return this.totalWins;
  }

  /**
   * Set position for the entire info display
   */
  public setDisplayPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Get display dimensions
   */
  public getDisplaySize(): { width: number; height: number } {
    return {
      width: this.PANEL_WIDTH,
      height: this.PANEL_HEIGHT,
    };
  }

  /**
   * Reset all statistics (for game reset)
   */
  public resetStats(): void {
    this.currentBalance = 1000;
    this.currentBet = 10;
    this.currentWin = 0;
    this.totalWins = 0;
    this.lastWinAmount = 0;
    
    this.updateAllDisplays();
    
    console.log('PlayerInfoDisplay: Stats reset to defaults');
  }

  /**
   * Format currency display (can be extended for different currencies)
   */
  private formatCurrency(amount: number): string {
    return amount.toLocaleString();
  }

  /**
   * Update display with formatted numbers for large amounts
   */
  public enableFormattedDisplay(enabled: boolean = true): void {
    if (enabled) {
      this.balanceText.text = this.formatCurrency(this.currentBalance);
      this.betText.text = this.formatCurrency(this.currentBet);
      this.winText.text = this.formatCurrency(this.currentWin);
      this.totalWinText.text = this.formatCurrency(this.totalWins);
    } else {
      this.updateAllDisplays();
    }
  }
} 