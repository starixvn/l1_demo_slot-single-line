import { Container, Graphics, Text, TextStyle, Sprite, Ticker, BlurFilter } from 'pixi.js';
import { SymbolType, ReelState } from '@/types/slot-types';
import { SymbolGenerator, SYMBOL_CONFIGS, SLOT_CONFIG } from '@/config/symbol-config';
import { getSymbolTexture, areSymbolTexturesLoaded } from '@/systems/asset-manager';

/**
 * Tween interface for animation
 */
interface Tween {
  object: any;
  property: string;
  propertyBeginValue: number;
  target: number;
  easing: (t: number) => number;
  time: number;
  change?: (tween: Tween) => void;
  complete?: (tween: Tween) => void;
  start: number;
}

/**
 * Global tweening system
 */
class TweenManager {
  private static tweening: Tween[] = [];
  private static tickerAdded = false;

  static tweenTo(
    object: any,
    property: string,
    target: number,
    time: number,
    easing: (t: number) => number,
    onchange?: (tween: Tween) => void,
    oncomplete?: (tween: Tween) => void
  ): Tween {
    const tween: Tween = {
      object,
      property,
      propertyBeginValue: object[property],
      target,
      easing,
      time,
      change: onchange,
      complete: oncomplete,
      start: Date.now(),
    };

    this.tweening.push(tween);
    
    console.log(`TweenManager: Creating tween for ${property} from ${tween.propertyBeginValue} to ${target} over ${time}ms. Active tweens: ${this.tweening.length}`);

    // Add ticker if not already added
    if (!this.tickerAdded) {
      console.log('TweenManager: Adding ticker for first time');
      Ticker.shared.add(this.updateTweens.bind(this));
      this.tickerAdded = true;
    }

    return tween;
  }

  private static updateTweens(): void {
    const now = Date.now();
    const remove: Tween[] = [];

    for (let i = 0; i < this.tweening.length; i++) {
      const t = this.tweening[i];
      const phase = Math.min(1, (now - t.start) / t.time);

      t.object[t.property] = this.lerp(t.propertyBeginValue, t.target, t.easing(phase));
      if (t.change) t.change(t);
      if (phase === 1) {
        t.object[t.property] = t.target;
        if (t.complete) {
          console.log(`TweenManager: Tween completed for property ${t.property}`);
          t.complete(t);
        }
        remove.push(t);
      }
    }
    for (let i = 0; i < remove.length; i++) {
      this.tweening.splice(this.tweening.indexOf(remove[i]), 1);
    }
    
    // Log active tweens count every 60 frames (about once per second at 60fps)
    if (this.tweening.length > 0 && Math.random() < 0.016) {
      console.log(`TweenManager: ${this.tweening.length} active tweens`);
    }
  }

  private static lerp(a1: number, a2: number, t: number): number {
    return a1 * (1 - t) + a2 * t;
  }

  // Backout easing function for natural slot machine feel
  static backout(amount: number = 0.5): (t: number) => number {
    return (t: number) => --t * t * ((amount + 1) * t + amount) + 1;
  }

  // Ease out cubic for smooth deceleration
  static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}

/**
 * Individual symbol display container
 */
class SymbolDisplay extends Container {
  private symbolSprite?: Sprite;
  private symbolEmoji?: Text;
  private symbolText!: Text;
  private useTextures: boolean;
  public readonly symbolType: SymbolType;

  constructor(symbol: SymbolType, useTextures: boolean = false) {
    super();
    this.symbolType = symbol;
    this.useTextures = useTextures;
    this.createSymbol(symbol);
  }

  private createSymbol(symbol: SymbolType): void {
    const config = SYMBOL_CONFIGS[symbol];
    
    if (this.useTextures) {
      this.symbolSprite = new Sprite();
      this.symbolSprite.anchor.set(0.5, 0.5);
      this.symbolSprite.x = SLOT_CONFIG.REEL_WIDTH / 2;
      this.symbolSprite.y = SLOT_CONFIG.REEL_HEIGHT / 2;
      this.addChild(this.symbolSprite);
      
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
      
      const texture = getSymbolTexture(symbol);
      if (texture && this.symbolSprite) {
        this.symbolSprite.texture = texture;
        const maxSize = Math.min(SLOT_CONFIG.REEL_WIDTH - 40, SLOT_CONFIG.REEL_HEIGHT - 60);
        const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
        this.symbolSprite.scale.set(scale);
      } else {
        this.createEmojiDisplay(config);
      }
    } else {
      this.createEmojiDisplay(config);
    }
  }

  private createEmojiDisplay(config: any): void {
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
  }

  /**
   * Update symbol texture (for dynamic symbol changes during spinning)
   */
  updateTexture(newSymbol: SymbolType): void {
    const config = SYMBOL_CONFIGS[newSymbol];
    (this as any).symbolType = newSymbol; // Update symbol type
    
    if (this.useTextures && this.symbolSprite) {
      const texture = getSymbolTexture(newSymbol);
      if (texture) {
        this.symbolSprite.texture = texture;
        const maxSize = Math.min(SLOT_CONFIG.REEL_WIDTH - 40, SLOT_CONFIG.REEL_HEIGHT - 60);
        const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
        this.symbolSprite.scale.set(scale);
      }
      this.symbolText.text = `${config.name}\n${config.value} HP`;
    } else if (this.symbolEmoji) {
      this.symbolEmoji.text = config.emoji || '❓';
      this.symbolText.text = config.name;
    }
  }
}

/**
 * Individual reel class with tween-based animation
 */
export class Reel extends Container {
  private reelIndex: number;
  private state: ReelState;
  private background!: Graphics;
  private symbolContainer!: Container;
  private reelMask!: Graphics;
  private symbols: SymbolDisplay[] = [];
  private useTextures: boolean = false;
  
  // Tween-based animation properties
  public reelPosition: number = 0; // Current animated position (renamed to avoid conflict)
  public previousReelPosition: number = 0; // For calculating speed
  private blurFilter: BlurFilter = new BlurFilter();
  private currentTween?: Tween; // Store reference for potential cancellation
  
  // Animation configuration
  private readonly SYMBOL_SIZE = SLOT_CONFIG.REEL_HEIGHT;
  private readonly SYMBOLS_COUNT = 4; // Visible symbols in the reel

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
    
    this.useTextures = areSymbolTexturesLoaded();
    
    this.setupReel();
    this.createSymbols();
    this.setupAnimation();
    this.updateDisplay();
    
    console.log(`Reel ${this.reelIndex}: Initialized with tween-based animation`);
  }

  /**
   * Set up the reel visual components
   */
  private setupReel(): void {
    this.background = new Graphics();
    this.addChild(this.background);
    
    this.symbolContainer = new Container();
    this.addChild(this.symbolContainer);
    
    // Create mask for visible area
    this.reelMask = new Graphics();
    this.reelMask.beginFill(0x000000);
    this.reelMask.drawRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT);
    this.reelMask.endFill();
    this.addChild(this.reelMask);
    this.symbolContainer.mask = this.reelMask;
    
    this.drawBorder();
  }

  /**
   * Create symbols for the reel
   */
  private createSymbols(): void {
    this.symbols = [];
    
    // Create symbols (one more than visible for smooth scrolling)
    for (let i = 0; i < this.SYMBOLS_COUNT; i++) {
      const symbol = SymbolGenerator.generateSymbol();
      const symbolDisplay = new SymbolDisplay(symbol, this.useTextures);
      
      // Position symbol
      symbolDisplay.y = i * this.SYMBOL_SIZE;
      
      this.symbolContainer.addChild(symbolDisplay);
      this.symbols.push(symbolDisplay);
    }
    
    this.state.currentSymbol = this.symbols[0].symbolType;
    
    console.log(`Reel ${this.reelIndex}: Created ${this.SYMBOLS_COUNT} symbols`);
  }

  /**
   * Set up animation system
   */
  private setupAnimation(): void {
    // Initialize blur filter
    this.blurFilter.blurX = 0;
    this.blurFilter.blurY = 0;
    this.symbolContainer.filters = [this.blurFilter];
    
    // Add to ticker for position-based updates
    Ticker.shared.add(this.updateSymbolPositions.bind(this));
  }

  /**
   * Update symbol positions based on current position (called every frame)
   */
     private updateSymbolPositions(): void {
     // Update blur based on speed (like the PixiJS example)
     this.blurFilter.blurY = Math.abs(this.reelPosition - this.previousReelPosition) * 8;
     this.previousReelPosition = this.reelPosition;
     
     // Update symbol positions based on reel position
     for (let j = 0; j < this.symbols.length; j++) {
       const symbol = this.symbols[j];
       const prevY = symbol.y;
       
       // Calculate new Y position (this is the key formula from PixiJS example)
       symbol.y = ((this.reelPosition + j) % this.symbols.length) * this.SYMBOL_SIZE - this.SYMBOL_SIZE;
      
      // Detect symbol going over the top and change its texture for variety
      if (symbol.y < 0 && prevY > this.SYMBOL_SIZE) {
        const newSymbolType = SymbolGenerator.generateSymbol();
        symbol.updateTexture(newSymbolType);
      }
    }
    
    // Update current visible symbol
    this.updateCurrentSymbol();
  }

  /**
   * Update current symbol based on position
   */
  private updateCurrentSymbol(): void {
    // Find which symbol is currently in the center
    const centerPosition = this.SYMBOL_SIZE / 2;
    for (const symbol of this.symbols) {
      if (symbol.y >= 0 && symbol.y <= centerPosition) {
        this.state.currentSymbol = symbol.symbolType;
        break;
      }
    }
  }

  /**
   * Start spinning animation
   */
  spin(): void {
    if (this.state.isSpinning) {
      console.warn(`Reel ${this.reelIndex}: Already spinning`);
      return;
    }
    
    this.state.isSpinning = true;
    console.log(`Reel ${this.reelIndex}: Starting tween-based spin - state set to spinning`);
  }

  /**
   * Stop the reel naturally at a specific symbol (like real slot machines)
   */
  stopAtSymbol(targetSymbol: SymbolType): Promise<SymbolType> {
    console.log(`Reel ${this.reelIndex}: stopAtSymbol() called for ${targetSymbol}, current spinning state: ${this.state.isSpinning}`);
    
    if (!this.state.isSpinning) {
      console.log(`Reel ${this.reelIndex}: Not spinning, returning current symbol ${this.state.currentSymbol}`);
      return Promise.resolve(this.state.currentSymbol);
    }
    
    // Find or place the target symbol in our symbols array
    let targetSymbolIndex = this.findOrAddTargetSymbol(targetSymbol);
    
    // Calculate the exact position where this symbol will be naturally visible
    const targetPosition = this.calculateStopPosition(targetSymbolIndex);
    
    // Animation timing (staggered based on reel index)
    const extra = Math.floor(Math.random() * 3); // Random extra spins for variety
    const time = this.calculateAnimationTime(extra);
    
    console.log(`Reel ${this.reelIndex}: Will naturally stop at position ${targetPosition} to show ${targetSymbol} (${time}ms)`);
    
    // Update state immediately
    this.state.currentSymbol = targetSymbol;
    
    // Return Promise that resolves when animation completes
    return new Promise<SymbolType>((resolve) => {
      console.log(`Reel ${this.reelIndex}: Creating Promise for natural animation completion`);
      
      // Start the tween animation to the calculated position
      this.currentTween = TweenManager.tweenTo(
        this,
        'reelPosition',
        targetPosition,
        time,
        TweenManager.backout(0.5),
        undefined, // onChange
        () => {
          // onComplete
          console.log(`Reel ${this.reelIndex}: Natural animation completed`);
          this.state.isSpinning = false;
          
          // Verify the correct symbol is visible (should be natural now)
          const visibleSymbol = this.getVisibleSymbol();
          console.log(`Reel ${this.reelIndex}: Naturally landed on ${visibleSymbol} (expected: ${targetSymbol})`);
          
          resolve(visibleSymbol);
        }
      );
      
      console.log(`Reel ${this.reelIndex}: Natural animation started`);
    });
  }

  /**
   * Legacy stop method for backward compatibility
   */
  stop(targetSymbol?: SymbolType): Promise<SymbolType> {
    const finalSymbol = targetSymbol || SymbolGenerator.generateSymbol();
    return this.stopAtSymbol(finalSymbol);
  }

  /**
   * Force set a specific symbol
   */
  setSymbol(symbol: SymbolType): void {
    // Cancel any current tween
    if (this.currentTween) {
      // The tween will be automatically removed by TweenManager
      this.currentTween = undefined;
    }
    
    // Update state immediately
    this.state.currentSymbol = symbol;
    this.state.isSpinning = false;
    
    // Reset position to avoid visual glitches
    this.reelPosition = 0;
    this.previousReelPosition = 0;
    
    // Place the symbol naturally in the reel
    this.findOrAddTargetSymbol(symbol);
    
    // Update display
    this.updateDisplay();
    
    console.log(`Reel ${this.reelIndex}: Symbol force-set to ${symbol}`);
  }

  /**
   * Calculate animation time for this reel
   */
  private calculateAnimationTime(extraSpins: number = 0): number {
    return 2000 + this.reelIndex * 400 + extraSpins * 300;
  }

  /**
   * Get the total animation time this reel will take
   */
  getAnimationTime(): number {
    const averageExtra = 1.5; // Average of 0, 1, 2
    return this.calculateAnimationTime(averageExtra);
  }

  /**
   * Find target symbol in symbols array, or replace one with it
   */
  private findOrAddTargetSymbol(targetSymbol: SymbolType): number {
    // First, try to find the symbol in existing symbols
    let targetIndex = -1;
    for (let i = 0; i < this.symbols.length; i++) {
      if (this.symbols[i].symbolType === targetSymbol) {
        targetIndex = i;
        break;
      }
    }
    
    // If not found, replace the first symbol with our target
    if (targetIndex === -1) {
      console.log(`Reel ${this.reelIndex}: Target symbol ${targetSymbol} not found, adding it at index 0`);
      this.symbols[0].updateTexture(targetSymbol);
      targetIndex = 0;
    } else {
      console.log(`Reel ${this.reelIndex}: Target symbol ${targetSymbol} found at index ${targetIndex}`);
    }
    
    return targetIndex;
  }

  /**
   * Calculate the reel position that will make the target symbol visible in center
   */
  private calculateStopPosition(symbolIndex: number): number {
    // For symbol to be visible in center, we need:
    // symbol.y = ((reelPosition + symbolIndex) % symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE = 0
    // This means: (reelPosition + symbolIndex) % symbols.length = 1
    // So: reelPosition = (1 - symbolIndex + symbols.length) % symbols.length
    
    const basePosition = (1 - symbolIndex + this.symbols.length) % this.symbols.length;
    
    // Add extra rotations for visual effect (minimum 2 full rotations)
    const minRotations = 2;
    const extraRotations = Math.floor(Math.random() * 3) + minRotations; // 2-4 extra rotations
    const fullRotationsPosition = extraRotations * this.symbols.length;
    
    const finalPosition = this.reelPosition + fullRotationsPosition + basePosition;
    
    console.log(`Reel ${this.reelIndex}: Symbol ${symbolIndex} - base: ${basePosition}, extra rotations: ${extraRotations}, final position: ${finalPosition}`);
    
    return finalPosition;
  }

  /**
   * Get the symbol that's currently visible in the center
   */
  private getVisibleSymbol(): SymbolType {
    // Find the symbol closest to center (y around SYMBOL_SIZE/2)
    let closestSymbol = this.symbols[0];
    let closestDistance = Infinity;
    
    for (const symbol of this.symbols) {
      const centerY = this.SYMBOL_SIZE / 2;
      const distance = Math.abs(symbol.y - centerY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSymbol = symbol;
      }
    }
    
    return closestSymbol.symbolType;
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
    this.alpha = isHighlighted ? 1.0 : 1.0;
    // Could add glow effect here
  }

  /**
   * Draw the reel border
   */
  private drawBorder(): void {
    const config = SYMBOL_CONFIGS[this.state.currentSymbol];
    
    this.background.clear();
    this.background.beginFill(config.color, 0.3);
    this.background.drawRoundedRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT, 10);
    this.background.endFill();
    this.background.lineStyle(3, config.color, 1);
    this.background.drawRoundedRect(0, 0, SLOT_CONFIG.REEL_WIDTH, SLOT_CONFIG.REEL_HEIGHT, 10);
  }

  /**
   * Update the visual display
   */
  private updateDisplay(): void {
    this.drawBorder();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Remove from ticker
    Ticker.shared.remove(this.updateSymbolPositions.bind(this));
    super.destroy();
  }
} 