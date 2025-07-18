import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SlotMachine } from './slot-machine';
import { SymbolType } from '@/types/slot-types';

/**
 * Game controller that manages user interactions and game flow
 */
export class GameController extends Container {
  private slotMachine!: SlotMachine;
  private spinButton!: Container;
  private testButton!: Container;
  private resetButton!: Container;
  private buttonContainer!: Container;

  constructor() {
    super();
    
    this.setupGameController();
  }

  /**
   * Set up the game controller components
   */
  private setupGameController(): void {
    // Create slot machine
    this.slotMachine = new SlotMachine();
    this.slotMachine.x = 0;
    this.slotMachine.y = 0;
    this.addChild(this.slotMachine);
    
    // Create button container
    this.buttonContainer = new Container();
    this.buttonContainer.y = 400;
    this.addChild(this.buttonContainer);
    
    // Create buttons
    this.createButtons();
    
    console.log('GameController: Initialized');
  }
  
  /**
   * Create interactive buttons
   */
  private createButtons(): void {
    // Spin button
    this.spinButton = this.createButton('🎰 SPIN 🎰', 0x2ECC71, -150, 0);
    this.spinButton.eventMode = 'static';
    this.spinButton.cursor = 'pointer';
    this.spinButton.on('pointerdown', () => this.handleSpin());
    this.buttonContainer.addChild(this.spinButton);
    
    // Test win button (for demonstration)
    this.testButton = this.createButton('Test Win', 0xF39C12, 0, 0);
    this.testButton.eventMode = 'static';
    this.testButton.cursor = 'pointer';
    this.testButton.on('pointerdown', () => this.handleTestWin());
    this.buttonContainer.addChild(this.testButton);
    
    // Reset button
    this.resetButton = this.createButton('Reset', 0xE74C3C, 150, 0);
    this.resetButton.eventMode = 'static';
    this.resetButton.cursor = 'pointer';
    this.resetButton.on('pointerdown', () => this.handleReset());
    this.buttonContainer.addChild(this.resetButton);
  }
  
  /**
   * Create a button with background and text
   */
  private createButton(text: string, color: number, x: number, y: number): Container {
    const button = new Container();
    button.x = x;
    button.y = y;
    
    // Button background
    const bg = new Graphics();
    bg.beginFill(color, 0.8);
    bg.drawRoundedRect(-75, -25, 150, 50, 10);
    bg.endFill();
    
    // Button border
    bg.lineStyle(2, 0xFFFFFF, 1);
    bg.drawRoundedRect(-75, -25, 150, 50, 10);
    
    // Button text
    const textStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    const buttonText = new Text(text, textStyle);
    buttonText.anchor.set(0.5, 0.5);
    
    button.addChild(bg);
    button.addChild(buttonText);
    
    // Add hover effects
    button.on('pointerover', () => {
      bg.clear();
      bg.beginFill(color, 1.0);
      bg.drawRoundedRect(-75, -25, 150, 50, 10);
      bg.endFill();
      bg.lineStyle(3, 0xFFD700, 1);
      bg.drawRoundedRect(-75, -25, 150, 50, 10);
    });
    
    button.on('pointerout', () => {
      bg.clear();
      bg.beginFill(color, 0.8);
      bg.drawRoundedRect(-75, -25, 150, 50, 10);
      bg.endFill();
      bg.lineStyle(2, 0xFFFFFF, 1);
      bg.drawRoundedRect(-75, -25, 150, 50, 10);
    });
    
    return button;
  }
  
  /**
   * Handle spin button click
   */
  private async handleSpin(): Promise<void> {
    if (this.slotMachine.getIsSpinning()) {
      console.log('GameController: Already spinning');
      return;
    }
    
    console.log('GameController: Spin button clicked');
    
    try {
      const result = await this.slotMachine.spin();
      console.log('GameController: Spin result:', result);
    } catch (error) {
      console.error('GameController: Spin error:', error);
    }
  }
  
  /**
   * Handle test win button click (for demonstration)
   */
  private handleTestWin(): void {
    console.log('GameController: Test win button clicked');
    
    // Set all reels to the same high-value symbol for testing
    const testSymbols: SymbolType[] = [
      SymbolType.CRUSADER_BLADE,
      SymbolType.CRUSADER_BLADE,
      SymbolType.CRUSADER_BLADE,
    ];
    
    this.slotMachine.setSymbols(testSymbols);
    
    // Simulate a win calculation
    setTimeout(async () => {
      await this.slotMachine.spin();
    }, 100);
  }
  
  /**
   * Handle reset button click
   */
  private handleReset(): void {
    console.log('GameController: Reset button clicked');
    
    // Add coins to balance
    this.slotMachine.addCoins(500);
    
    // Reset reel highlights
    this.slotMachine.getReels().forEach(reel => reel.highlight(false));
  }
  
  /**
   * Get the slot machine instance
   */
  getSlotMachine(): SlotMachine {
    return this.slotMachine;
  }
  
  /**
   * Handle keyboard input
   */
  handleKeyPress(key: string): void {
    switch (key.toLowerCase()) {
      case ' ':
      case 'enter':
        this.handleSpin();
        break;
      case 't':
        this.handleTestWin();
        break;
      case 'r':
        this.handleReset();
        break;
      default:
        break;
    }
  }
  
  /**
   * Destroy and clean up
   */
  destroy(): void {
    // Remove event listeners
    this.spinButton?.off('pointerdown');
    this.testButton?.off('pointerdown');
    this.resetButton?.off('pointerdown');
    
    super.destroy();
  }
} 