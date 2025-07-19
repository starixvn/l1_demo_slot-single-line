import { Container, Graphics, Text, TextStyle, Sprite, Ticker, BlurFilter } from 'pixi.js';
import { SymbolType, ReelState } from '@/types/slot-types';
import { SymbolGenerator, SYMBOL_CONFIGS, SLOT_CONFIG } from '@/config/symbol-config';
import { getSymbolTexture, areSymbolTexturesLoaded } from '@/systems/asset-manager';

/**
 * Animation configuration for the reel
 */
interface ReelAnimationConfig {
  spinSpeed: number;
  maxSpinSpeed: number;
  acceleration: number;
  deceleration: number;
  finalSlowdown: number;
  symbolHeight: number;
  symbolsToShow: number;
  totalSymbols: number;
}

/**
 * Individual symbol display container
 */
class SymbolDisplay extends Container {
  private symbolSprite?: Sprite;
  private symbolEmoji?: Text;
  private symbolText!: Text;
  private useTextures: boolean;
  public readonly symbolType: SymbolType; // Store the symbol type

  constructor(symbol: SymbolType, useTextures: boolean = false) {
    super();
    this.symbolType = symbol;
    this.useTextures = useTextures;
    this.createSymbol(symbol);
  }

  private createSymbol(symbol: SymbolType): void {
    const config = SYMBOL_CONFIGS[symbol];
    console.log(`Creating symbol display for ${symbol} with config:`, config);
    
    if (this.useTextures) {
      // Create sprite for texture display
      this.symbolSprite = new Sprite();
      this.symbolSprite.anchor.set(0.5, 0.5);
      this.symbolSprite.x = SLOT_CONFIG.REEL_WIDTH / 2;
      this.symbolSprite.y = SLOT_CONFIG.REEL_HEIGHT / 2;
      this.addChild(this.symbolSprite);
      
      // Smaller text display
      const textStyle = new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: config.textColor,
        align: 'center',
      });
      
      this.symbolText = new Text(`${config.name}\n${config.value} HP`, textStyle);
      this.symbolText.anchor.set(0.5, 0);
      this.symbolText.x = SLOT_CONFIG.REEL_WIDTH / 2;
      this.symbolText.y = SLOT_CONFIG.REEL_HEIGHT - 25;
      this.addChild(this.symbolText);
      
      // Load texture
      const texture = getSymbolTexture(symbol);
      if (texture && this.symbolSprite) {
        this.symbolSprite.texture = texture;
        const maxSize = Math.min(SLOT_CONFIG.REEL_WIDTH - 40, SLOT_CONFIG.REEL_HEIGHT - 60);
        const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
        this.symbolSprite.scale.set(scale);
        console.log(`Symbol ${symbol}: Loaded texture, scale: ${scale}`);
      } else {
        console.warn(`Symbol ${symbol}: No texture found, falling back to emoji`);
        // Fallback to emoji if texture not available
        this.createEmojiDisplay(config);
      }
    } else {
      console.log(`Symbol ${symbol}: Using emoji display`);
      this.createEmojiDisplay(config);
    }
  }

  private createEmojiDisplay(config: any): void {
    // Emoji display
    const emojiStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      align: 'center',
    });
    
    this.symbolEmoji = new Text(config.emoji || '❓', emojiStyle);
    this.symbolEmoji.anchor.set(0.5, 0.5);
    this.symbolEmoji.x = SLOT_CONFIG.REEL_WIDTH / 2;
    this.symbolEmoji.y = SLOT_CONFIG.REEL_HEIGHT / 2 - 20;
    this.addChild(this.symbolEmoji);
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: config.textColor,
      align: 'center',
    });
    
    this.symbolText = new Text(config.name, textStyle);
    this.symbolText.anchor.set(0.5, 0);
    this.symbolText.x = SLOT_CONFIG.REEL_WIDTH / 2;
    this.symbolText.y = SLOT_CONFIG.REEL_HEIGHT / 2 + 30;
    this.addChild(this.symbolText);
    
    console.log(`Created emoji display for ${config.name}: ${config.emoji}`);
  }
}

/**
 * Individual reel class that displays and manages symbols with smooth animations
 */
export class Reel extends Container {
  private reelIndex: number;
  private state: ReelState;
  private background!: Graphics;
  private symbolContainer!: Container;
  private reelMask!: Graphics; // Renamed to avoid conflict
  private symbols: SymbolDisplay[] = [];
  private useTextures: boolean = false;
  
  // Animation properties
  private animConfig: ReelAnimationConfig = {
    spinSpeed: 0,
    maxSpinSpeed: 40, // Pixels per frame at max speed
    acceleration: 2,
    deceleration: 0.95,
    finalSlowdown: 0.5,
    symbolHeight: SLOT_CONFIG.REEL_HEIGHT,
    symbolsToShow: 1, // Single line display
    totalSymbols: 20, // Total symbols in the loop
  };
  
  private isAnimating: boolean = false;
  private targetSymbol?: SymbolType;
  private targetPosition: number = 0;
  private currentPosition: number = 0;
  private animationPhase: 'accelerating' | 'spinning' | 'stopping' = 'accelerating';
  private stopRequested: boolean = false;
  private tickerFn: (deltaTime: number) => void; // Fixed signature
  private blurFilter: BlurFilter = new BlurFilter(); // For motion blur effect

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
    
    // Bind ticker function to maintain context
    this.tickerFn = this.updateAnimation.bind(this);
    
    this.setupReel();
    this.createSymbols();
    this.updateDisplay();
    
    // Debug: Verify container setup
    console.log(`Reel ${this.reelIndex}: Container setup complete. SymbolContainer children: ${this.symbolContainer.children.length}, useTextures: ${this.useTextures}`);
  }

  /**
   * Set up the reel visual components
   */
  private setupReel(): void {
    // Create background
    this.background = new Graphics();
    this.addChild(this.background);
    
    // Create symbol container for smooth scrolling
    this.symbolContainer = new Container();
    this.addChild(this.symbolContainer);
    
    // Create mask to show only visible area
    this.reelMask = new Graphics();
    this.reelMask.beginFill(0x000000);
    this.reelMask.drawRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT);
    this.reelMask.endFill();
    this.addChild(this.reelMask);
    this.symbolContainer.mask = this.reelMask;
    
    console.log(`Reel ${this.reelIndex}: Created mask with dimensions ${SLOT_CONFIG.REEL_WIDTH}x${SLOT_CONFIG.REEL_HEIGHT}`);
    
    // Draw initial border
    this.drawBorder();
  }

  /**
   * Create the symbol displays for animation
   */
  private createSymbols(): void {
    this.symbols = [];
    
    // Create enough symbols for smooth looping
    for (let i = 0; i < this.animConfig.totalSymbols; i++) {
      const symbol = SymbolGenerator.generateSymbol();
      const symbolDisplay = new SymbolDisplay(symbol, this.useTextures);
      
      // Position symbols vertically - reversed for top-to-bottom movement
      // Symbol 0 at y=0, Symbol 1 at y=-200 (above), Symbol 2 at y=-400 (above), etc.
      symbolDisplay.y = -i * this.animConfig.symbolHeight;
      
      this.symbolContainer.addChild(symbolDisplay);
      this.symbols.push(symbolDisplay);
    }
    
    // Initialize position to show the first symbol in the visible area
    this.currentPosition = 0;
    this.symbolContainer.y = 0; // Show first symbol (at y=0)
    
    // Set current symbol to the first one and ensure it's visible
    this.updateCurrentSymbol();
    this.state.currentSymbol = this.symbols[0].symbolType;
    
    console.log(`Reel ${this.reelIndex}: Created ${this.animConfig.totalSymbols} symbols, initial position: ${this.currentPosition}`);
  }

  /**
   * Update the current symbol based on container position
   */
  private updateCurrentSymbol(): void {
    // Calculate which symbol is currently visible
    // Since symbols are at negative Y positions, we use the position directly
    const visiblePosition = this.currentPosition % (this.animConfig.totalSymbols * this.animConfig.symbolHeight);
    const symbolIndex = Math.floor(visiblePosition / this.animConfig.symbolHeight) % this.animConfig.totalSymbols;
    const symbolDisplay = this.symbols[symbolIndex];
    
    if (symbolDisplay) {
      // Get the actual symbol type from the display
      this.state.currentSymbol = symbolDisplay.symbolType;
    }
  }

  /**
   * Animation update function called by PIXI Ticker
   */
  private updateAnimation(deltaTime: number): void { // Fixed signature
    if (!this.isAnimating) return;
    
    switch (this.animationPhase) {
      case 'accelerating':
        // Accelerate to max speed
        this.animConfig.spinSpeed = Math.min(
          this.animConfig.spinSpeed + this.animConfig.acceleration * deltaTime,
          this.animConfig.maxSpinSpeed
        );
        
        if (this.animConfig.spinSpeed >= this.animConfig.maxSpinSpeed) {
          this.animationPhase = 'spinning';
        }
        break;
        
      case 'spinning':
        // Check if stop was requested
        if (this.stopRequested) {
          this.animationPhase = 'stopping';
          this.calculateStopPosition();
        }
        break;
        
      case 'stopping':
        // Decelerate to target position
        const distanceToTarget = Math.abs(this.targetPosition - this.currentPosition);
        
        if (distanceToTarget > this.animConfig.symbolHeight * 2) {
          // Far from target - normal deceleration
          this.animConfig.spinSpeed *= this.animConfig.deceleration;
        } else {
          // Close to target - slow down more
          this.animConfig.spinSpeed *= this.animConfig.finalSlowdown;
          
          // Stop if very close and very slow
          if (distanceToTarget < 5 && this.animConfig.spinSpeed < 1) {
            this.stopAnimation();
            return;
          }
        }
        break;
    }
    
    // Update position - for top to bottom movement
    this.currentPosition += this.animConfig.spinSpeed * deltaTime;
    // Since symbols are at negative Y positions, container needs positive Y to show them
    this.symbolContainer.y = this.currentPosition;
    
    // Apply visual effects based on speed
    this.updateVisualEffects();
    
    // Handle infinite scrolling
    if (this.currentPosition >= this.animConfig.totalSymbols * this.animConfig.symbolHeight) {
      this.currentPosition -= this.animConfig.totalSymbols * this.animConfig.symbolHeight;
      if (this.targetPosition >= this.animConfig.totalSymbols * this.animConfig.symbolHeight) {
        this.targetPosition -= this.animConfig.totalSymbols * this.animConfig.symbolHeight;
      }
    }
  }

  /**
   * Calculate the exact stop position for the target symbol
   */
  private calculateStopPosition(): void {
    if (!this.targetSymbol) return;
    
    // Ensure the target symbol exists in our array at a known position
    let targetSymbolIndex = this.symbols.findIndex(s => s.symbolType === this.targetSymbol);
    
    // If target symbol not found, replace the first symbol with it
    if (targetSymbolIndex === -1) {
      this.symbols[0].destroy();
      this.symbols[0] = new SymbolDisplay(this.targetSymbol, this.useTextures);
      this.symbols[0].y = 0;
      this.symbolContainer.addChild(this.symbols[0]);
      targetSymbolIndex = 0;
    }
    
    // Simple approach: spin a bit more then stop at a position where target symbol is visible
    const minSpinDistance = this.animConfig.symbolHeight * 3; // Spin at least 3 more symbols
    const totalHeight = this.animConfig.totalSymbols * this.animConfig.symbolHeight;
    
    // Calculate next "round number" position (multiple of totalHeight) to show symbol 0
    const nextRoundPosition = Math.ceil((this.currentPosition + minSpinDistance) / totalHeight) * totalHeight;
    this.targetPosition = nextRoundPosition;
    
    console.log(`Reel ${this.reelIndex}: Current: ${this.currentPosition}, Min distance: ${minSpinDistance}, Target: ${this.targetPosition}`);
    
    console.log(`Reel ${this.reelIndex}: Target position calculated: ${this.targetPosition} for symbol ${this.targetSymbol} (symbol at index ${targetSymbolIndex})`);
  }

  /**
   * Update visual effects based on current spin speed
   */
  private updateVisualEffects(): void {
    const speedRatio = this.animConfig.spinSpeed / this.animConfig.maxSpinSpeed;
    
    if (speedRatio > 0.7) {
      // Fast spinning - add vertical motion blur
      this.blurFilter.blur = speedRatio * 8; // Max blur of 8
      this.blurFilter.quality = 1;
      this.symbolContainer.filters = [this.blurFilter];
    } else if (speedRatio > 0.3) {
      // Medium speed - light blur
      this.blurFilter.blur = speedRatio * 4;
      this.symbolContainer.filters = [this.blurFilter];
    } else {
      // Slow or stopped - no blur
      this.symbolContainer.filters = null;
    }
  }

  /**
   * Stop the animation completely
   */
  private stopAnimation(): void {
    this.isAnimating = false;
    this.stopRequested = false;
    this.animConfig.spinSpeed = 0;
    
    // Remove from ticker
    Ticker.shared.remove(this.tickerFn);
    
    // Ensure we stop at a position where the target symbol is visible
    if (this.targetSymbol) {
      this.ensureSymbolVisible(this.targetSymbol);
      this.state.currentSymbol = this.targetSymbol;
    } else {
      // Snap to exact position and make sure a symbol is visible
      this.currentPosition = this.targetPosition % (this.animConfig.totalSymbols * this.animConfig.symbolHeight);
      this.symbolContainer.y = this.currentPosition; // Consistent with animation positioning
      this.updateCurrentSymbol();
    }
    
    // Clear visual effects
    this.symbolContainer.filters = null;
    
    // Update final display
    this.updateDisplay();
    
    // Mark as not spinning (important for slot machine state)
    this.state.isSpinning = false;
    
    console.log(`Reel ${this.reelIndex}: Animation stopped on symbol ${this.state.currentSymbol} at position ${this.currentPosition}`);
  }

  /**
   * Draw the reel border
   */
  private drawBorder(): void {
    const config = SYMBOL_CONFIGS[this.state.currentSymbol];
    
    this.background.clear();
    
    // Draw background
    this.background.beginFill(config.color, 0.3);
    this.background.drawRoundedRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT, 10);
    this.background.endFill();
    
    // Draw border
    this.background.lineStyle(3, config.color, 1);
    this.background.drawRoundedRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT, 10);
  }

  /**
   * Update the visual display
   */
  private updateDisplay(): void {
    // Draw border with current symbol color
    this.drawBorder();
    
    console.log(`Reel ${this.reelIndex}: Displaying current position ${this.currentPosition}, symbolContainer.y: ${this.symbolContainer.y}, current symbol: ${this.state.currentSymbol}`);
    
    // Debug: log visible symbol information
    const visibleSymbolIndex = Math.floor(this.currentPosition / this.animConfig.symbolHeight) % this.animConfig.totalSymbols;
    const visibleSymbol = this.symbols[visibleSymbolIndex];
    if (visibleSymbol) {
      console.log(`Reel ${this.reelIndex}: Visible symbol should be index ${visibleSymbolIndex}, type: ${visibleSymbol.symbolType}, at y: ${visibleSymbol.y}`);
    }
  }

  /**
   * Start spinning animation
   */
  spin(): void {
    if (this.state.isSpinning || this.isAnimating) {
      console.warn(`Reel ${this.reelIndex}: Already spinning`);
      return;
    }
    
    this.state.isSpinning = true;
    this.isAnimating = true;
    this.animationPhase = 'accelerating';
    this.stopRequested = false;
    this.animConfig.spinSpeed = 0;
    
    // Add to ticker for animation
    Ticker.shared.add(this.tickerFn);
    
    console.log(`Reel ${this.reelIndex}: Starting spin animation`);
  }

  /**
   * Stop the reel with a specific symbol or random if not specified
   */
  stop(symbol?: SymbolType): SymbolType {
    if (!this.isAnimating) {
      // If not spinning, just set the symbol immediately
      const finalSymbol = symbol || SymbolGenerator.generateSymbol();
      this.setSymbol(finalSymbol);
      return finalSymbol;
    }
    
    const finalSymbol = symbol || SymbolGenerator.generateSymbol();
    
    this.targetSymbol = finalSymbol;
    this.stopRequested = true;
    
    console.log(`Reel ${this.reelIndex}: Stop requested for ${finalSymbol}`);
    
    return finalSymbol;
  }

  /**
   * Force set a specific symbol (for testing)
   */
  setSymbol(symbol: SymbolType): void {
    this.state.currentSymbol = symbol;
    this.state.isSpinning = false;
    
    // Stop any current animation
    if (this.isAnimating) {
      this.stopAnimation();
    }
    
    // Ensure a symbol is visible by positioning container correctly
    this.ensureSymbolVisible(symbol);
    
    this.updateDisplay();
  }

  /**
   * Ensure a specific symbol is visible in the reel window
   */
  private ensureSymbolVisible(targetSymbol: SymbolType): void {
    // Find the symbol in our array
    let symbolIndex = this.symbols.findIndex(s => s.symbolType === targetSymbol);
    
    // If not found, replace the first symbol
    if (symbolIndex === -1) {
      this.symbols[0].destroy();
      this.symbols[0] = new SymbolDisplay(targetSymbol, this.useTextures);
      this.symbols[0].y = 0; // First symbol at y=0
      this.symbolContainer.addChild(this.symbols[0]);
      symbolIndex = 0;
    }
    
    // Position container to show this symbol
    // Since symbols are at negative Y positions (-index * height), 
    // we need positive container Y to show them
    this.currentPosition = symbolIndex * this.animConfig.symbolHeight;
    this.symbolContainer.y = this.currentPosition;
    
    console.log(`Reel ${this.reelIndex}: Positioned symbol ${targetSymbol} at index ${symbolIndex}, position ${this.currentPosition}`);
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
   * Highlight the reel (for wins)
   */
  highlight(isHighlighted: boolean): void {
    if (isHighlighted) {
      this.alpha = 1.0;
      // Could add glow effect here
    } else {
      this.alpha = 1.0;
    }
  }

  /**
   * Clean up resources when reel is destroyed
   */
  destroy(): void {
    // Remove from ticker if still animating
    if (this.isAnimating) {
      Ticker.shared.remove(this.tickerFn);
    }
    
    super.destroy();
  }
} 