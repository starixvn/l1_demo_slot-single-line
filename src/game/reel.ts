import { Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';
import { SymbolType, ReelState } from '@/types/slot-types';
import { SymbolGenerator, SYMBOL_CONFIGS, SLOT_CONFIG } from '@/config/symbol-config';
import { getSymbolTexture, areSymbolTexturesLoaded } from '@/systems/asset-manager';

/**
 * Individual reel class that displays and manages symbols
 */
export class Reel extends Container {
  private reelIndex: number;
  private state: ReelState;
  private background!: Graphics;
  private symbolText!: Text;
  private symbolEmoji!: Text;
  private symbolSprite!: Sprite;
  private textStyle: TextStyle;
  private emojiStyle: TextStyle;
  private useTextures: boolean = false;

  constructor(reelIndex: number, x: number, y: number) {
    super();
    
    this.reelIndex = reelIndex;
    this.x = x;
    this.y = y;
    
    // Initialize reel state
    this.state = {
      currentSymbol: SymbolGenerator.generateSymbol(),
      isSpinning: false,
      position: x,
      index: reelIndex,
    };
    
    // Check if we should use textures
    this.useTextures = areSymbolTexturesLoaded();
    
    // Create text styles
    this.textStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: SLOT_CONFIG.REEL_WIDTH - 20,
    });
    
    this.emojiStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      align: 'center',
    });
    
    this.setupReel();
    this.updateDisplay();
  }

  /**
   * Set up the reel visual components
   */
  private setupReel(): void {
    // Create background
    this.background = new Graphics();
    this.addChild(this.background);
    
    if (this.useTextures) {
      // Create symbol sprite for texture display
      this.symbolSprite = new Sprite();
      this.symbolSprite.anchor.set(0.5, 0.5);
      this.symbolSprite.x = SLOT_CONFIG.REEL_WIDTH / 2;
      this.symbolSprite.y = SLOT_CONFIG.REEL_HEIGHT / 2;
      this.addChild(this.symbolSprite);
      
      // Create smaller text display for weapon name
      this.symbolText = new Text('', this.textStyle);
      this.symbolText.anchor.set(0.5, 0);
      this.symbolText.x = SLOT_CONFIG.REEL_WIDTH / 2;
      this.symbolText.y = SLOT_CONFIG.REEL_HEIGHT - 25;
      this.addChild(this.symbolText);
    } else {
      // Fallback to emoji + text display
      this.symbolEmoji = new Text('', this.emojiStyle);
      this.symbolEmoji.anchor.set(0.5, 0.5);
      this.symbolEmoji.x = SLOT_CONFIG.REEL_WIDTH / 2;
      this.symbolEmoji.y = SLOT_CONFIG.REEL_HEIGHT / 2 - 20;
      this.addChild(this.symbolEmoji);
      
      this.symbolText = new Text('', this.textStyle);
      this.symbolText.anchor.set(0.5, 0);
      this.symbolText.x = SLOT_CONFIG.REEL_WIDTH / 2;
      this.symbolText.y = SLOT_CONFIG.REEL_HEIGHT / 2 + 30;
      this.addChild(this.symbolText);
    }
    
    // Add border
    this.drawBorder();
  }
  
  /**
   * Draw the reel border and background
   */
  private drawBorder(): void {
    this.background.clear();
    
    const config = SYMBOL_CONFIGS[this.state.currentSymbol];
    
    // Draw background with symbol color
    this.background.beginFill(config.color, 0.8);
    this.background.drawRoundedRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT, 10);
    this.background.endFill();
    
    // Draw border
    this.background.lineStyle(3, 0xFFFFFF, 1);
    this.background.drawRoundedRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT, 10);
    
    // Add spinning indicator if spinning
    if (this.state.isSpinning) {
      this.background.lineStyle(5, 0xFFD700, 1); // Gold border when spinning
      this.background.drawRoundedRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT, 10);
    }
  }
  
  /**
   * Update the visual display based on current symbol
   */
  private updateDisplay(): void {
    const config = SYMBOL_CONFIGS[this.state.currentSymbol];
    
    if (this.useTextures && this.symbolSprite) {
      // Use texture if available
      const texture = getSymbolTexture(this.state.currentSymbol);
      if (texture) {
        this.symbolSprite.texture = texture;
        
        // Scale sprite to fit within reel bounds with some padding
        const maxSize = Math.min(SLOT_CONFIG.REEL_WIDTH - 40, SLOT_CONFIG.REEL_HEIGHT - 60);
        const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
        this.symbolSprite.scale.set(scale);
        
        // Update text with damage info
        this.symbolText.text = `${config.name}\n${config.value} HP`;
        this.symbolText.style.fill = config.textColor;
      } else {
        // Fallback to emoji if texture not found
        console.warn(`Texture not found for ${this.state.currentSymbol}, using emoji fallback`);
        this.symbolSprite.texture = null as any;
        this.symbolText.text = `${config.emoji || '❓'}\n${config.name}`;
        this.symbolText.style.fill = config.textColor;
      }
    } else {
      // Use emoji + text fallback
      if (this.symbolEmoji) {
        this.symbolEmoji.text = config.emoji || '❓';
      }
      
      this.symbolText.text = config.name;
      this.symbolText.style.fill = config.textColor;
    }
    
    // Update background
    this.drawBorder();
    
    console.log(`Reel ${this.reelIndex}: Displaying ${config.name} (${config.value} HP)`);
  }
  
  /**
   * Spin the reel - instantly change to a new random symbol
   */
  spin(): void {
    if (this.state.isSpinning) {
      console.warn(`Reel ${this.reelIndex}: Already spinning`);
      return;
    }
    
    this.state.isSpinning = true;
    this.updateDisplay();
    
    console.log(`Reel ${this.reelIndex}: Starting spin`);
  }
  
  /**
   * Stop the reel with a specific symbol or random if not specified
   */
  stop(symbol?: SymbolType): SymbolType {
    const finalSymbol = symbol || SymbolGenerator.generateSymbol();
    
    this.state.currentSymbol = finalSymbol;
    this.state.isSpinning = false;
    
    this.updateDisplay();
    
    const config = SYMBOL_CONFIGS[finalSymbol];
    console.log(`Reel ${this.reelIndex}: Stopped on ${config.name} (${config.emoji})`);
    
    return finalSymbol;
  }
  
  /**
   * Force set a specific symbol (for testing)
   */
  setSymbol(symbol: SymbolType): void {
    this.state.currentSymbol = symbol;
    this.state.isSpinning = false;
    this.updateDisplay();
  }
  
  /**
   * Get the current symbol
   */
  getCurrentSymbol(): SymbolType {
    return this.state.currentSymbol;
  }
  
  /**
   * Check if reel is currently spinning
   */
  isSpinning(): boolean {
    return this.state.isSpinning;
  }
  
  /**
   * Get reel index
   */
  getIndex(): number {
    return this.reelIndex;
  }
  
  /**
   * Get reel state
   */
  getState(): ReelState {
    return { ...this.state };
  }
  
  /**
   * Animate spinning effect (for POC, just rapid symbol changes)
   */
  simulateSpinning(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = 50; // Change symbol every 50ms
      
      const spinInterval = setInterval(() => {
        if (this.state.isSpinning) {
          // Rapidly change symbols during spin
          this.state.currentSymbol = SymbolGenerator.generateSymbol();
          this.updateDisplay();
        }
        
        if (Date.now() - startTime >= duration) {
          clearInterval(spinInterval);
          resolve();
        }
      }, interval);
    });
  }
  
  /**
   * Highlight reel (for winning combinations)
   */
  highlight(isWinning: boolean = true): void {
    if (isWinning) {
      this.background.lineStyle(6, 0x00FF00, 1); // Green border for wins
      this.background.drawRoundedRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT, 10);
    } else {
      this.drawBorder(); // Reset to normal border
    }
  }
  
  /**
   * Get symbol value for payout calculations
   */
  getSymbolValue(): number {
    return SYMBOL_CONFIGS[this.state.currentSymbol].value;
  }
} 