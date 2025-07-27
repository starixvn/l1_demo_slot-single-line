import { Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';
import { SymbolType } from '@/types/slot-types';
import { SYMBOL_CONFIGS } from '@/config/symbol-config';
import { getSymbolTexture } from '@/systems/asset-manager';
import { GAME_CONSTANTS } from '@/config/game-config';

/**
 * Prominent Level Up Notification Component with Symbol Unlocking Display
 */
export class LevelUpNotification extends Container {
  private background!: Graphics;
  private overlay!: Graphics;
  private levelUpText!: Text;
  private newLevelText!: Text;
  private symbolsContainer!: Container;
  private symbolUnlockedText!: Text;
  private isShowing: boolean = false;

  // Animation properties
  private animationStartTime: number = 0;
  private readonly ANIMATION_DURATION = 4000; // 4 seconds total
  private readonly FADE_IN_DURATION = 500;
  private readonly DISPLAY_DURATION = 3000;
  private readonly FADE_OUT_DURATION = 500;

  constructor() {
    super();
    this.setupNotification();
    this.visible = false;
  }

  /**
   * Set up the visual components
   */
  private setupNotification(): void {
    // Create semi-transparent overlay background
    this.overlay = new Graphics();
    this.overlay.beginFill(0x000000, 0.7);
    this.overlay.drawRect(-1000, -600, 2000, 1200); // Large overlay
    this.overlay.endFill();
    this.addChild(this.overlay);

    // Create main background panel
    this.background = new Graphics();
    this.addChild(this.background);

    // Create "LEVEL UP!" text
    const levelUpStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 72,
      fontWeight: 'bold',
      fill: 0xFFD700, // Gold
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 4,
      stroke: 0xFFFFFF,
      strokeThickness: 3,
    });

    this.levelUpText = new Text('🎉 LEVEL UP! 🎉', levelUpStyle);
    this.levelUpText.anchor.set(0.5, 0.5);
    this.levelUpText.y = -120;
    this.addChild(this.levelUpText);

    // Create new level text
    const newLevelStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowDistance: 2,
    });

    this.newLevelText = new Text('Level 2 - Tech Initiate', newLevelStyle);
    this.newLevelText.anchor.set(0.5, 0.5);
    this.newLevelText.y = -60;
    this.addChild(this.newLevelText);

    // Create "Symbols Unlocked" text
    const symbolsTextStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM,
      fontWeight: 'bold',
      fill: 0x00FFFF, // Cyan
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 2,
    });

    this.symbolUnlockedText = new Text('🔓 New Weapons Unlocked! 🔓', symbolsTextStyle);
    this.symbolUnlockedText.anchor.set(0.5, 0.5);
    this.symbolUnlockedText.y = 20;
    this.addChild(this.symbolUnlockedText);

    // Create symbols container
    this.symbolsContainer = new Container();
    this.symbolsContainer.y = 80;
    this.addChild(this.symbolsContainer);

    this.drawBackground();
  }

  /**
   * Draw the background panel
   */
  private drawBackground(): void {
    this.background.clear();
    
    // Main panel background with gradient effect
    this.background.beginFill(0x1a1a2e, 0.95);
    this.background.lineStyle(4, 0xFFD700, 1);
    this.background.drawRoundedRect(-400, -180, 800, 300, 20);
    this.background.endFill();

    // Inner glow effect
    this.background.lineStyle(2, 0xFFFFFF, 0.5);
    this.background.drawRoundedRect(-395, -175, 790, 290, 18);
  }

  /**
   * Show level up notification with animation
   */
  async showLevelUp(newLevel: number, levelTitle: string, unlockedSymbols: SymbolType[]): Promise<void> {
    if (this.isShowing) {
      console.warn('Level up notification already showing');
      return;
    }

    console.log(`🎉 Showing level up notification: Level ${newLevel}`);
    
    this.isShowing = true;
    this.visible = true;
    this.animationStartTime = Date.now();

    // Update text content
    this.newLevelText.text = `Level ${newLevel} - ${levelTitle}`;
    
    // Create symbol displays
    this.createSymbolDisplays(unlockedSymbols);
    
    // Start animation
    await this.animateNotification();
    
    this.isShowing = false;
    this.visible = false;
  }

  /**
   * Create visual displays for unlocked symbols
   */
  private createSymbolDisplays(symbols: SymbolType[]): void {
    // Clear existing symbols
    this.symbolsContainer.removeChildren();

    if (symbols.length === 0) {
      this.symbolUnlockedText.visible = false;
      return;
    }

    this.symbolUnlockedText.visible = true;

    const symbolSpacing = 160; // Increased spacing for larger symbols
    const startX = -((symbols.length - 1) * symbolSpacing) / 2;

    symbols.forEach((symbolType, index) => {
      const symbolDisplay = this.createSymbolDisplay(symbolType);
      symbolDisplay.x = startX + (index * symbolSpacing);
      this.symbolsContainer.addChild(symbolDisplay);
    });
  }

  /**
   * Create a single symbol display with glow effect
   */
  private createSymbolDisplay(symbolType: SymbolType): Container {
    const symbolContainer = new Container();
    const config = SYMBOL_CONFIGS[symbolType];

    // Create larger glow background
    const glow = new Graphics();
    glow.beginFill(0xFFD700, 0.3);
    glow.drawCircle(0, 0, 70); // Increased from 50 to 70
    glow.endFill();
    symbolContainer.addChild(glow);

    // Create larger symbol background
    const background = new Graphics();
    background.beginFill(config.color, 0.8);
    background.lineStyle(3, 0xFFFFFF, 1);
    background.drawRoundedRect(-55, -55, 110, 110, 12); // Increased from 80x80 to 110x110
    background.endFill();
    symbolContainer.addChild(background);

    // Try to use symbol texture, fallback to emoji
    const texture = getSymbolTexture(symbolType);
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      
      // Scale to fit in the larger background
      const scale = Math.min(85 / sprite.width, 85 / sprite.height); // Increased from 60 to 85
      sprite.scale.set(scale);
      symbolContainer.addChild(sprite);
    } else {
      // Fallback to larger emoji
      const emojiStyle = new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 48, // Increased from 32 to 48
        align: 'center',
      });
      
      const emojiText = new Text(config.emoji || '⚔️', emojiStyle);
      emojiText.anchor.set(0.5, 0.5);
      symbolContainer.addChild(emojiText);
    }

    // Create symbol name text with medium size
    const nameStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM, // Changed from SMALL to MEDIUM
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    });

    const nameText = new Text(config.name, nameStyle);
    nameText.anchor.set(0.5, 0);
    nameText.y = 65; // Adjusted position for larger symbol
    symbolContainer.addChild(nameText);

    // Add damage value with medium size
    const damageStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM, // Changed from SMALL to MEDIUM
      fontWeight: 'bold',
      fill: 0xFFD700,
      align: 'center',
    });

    const damageText = new Text(`${config.value} DMG`, damageStyle);
    damageText.anchor.set(0.5, 0);
    damageText.y = 90; // Adjusted position for larger text
    symbolContainer.addChild(damageText);

    return symbolContainer;
  }

  /**
   * Animate the notification with phases
   */
  private async animateNotification(): Promise<void> {
    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - this.animationStartTime;
        
        if (elapsed < this.FADE_IN_DURATION) {
          // Fade in phase
          const progress = elapsed / this.FADE_IN_DURATION;
          const easeProgress = this.easeOutBounce(progress);
          
          this.alpha = progress;
          this.scale.set(0.5 + easeProgress * 0.5);
          
        } else if (elapsed < this.FADE_IN_DURATION + this.DISPLAY_DURATION) {
          // Display phase with pulsing
          this.alpha = 1;
          this.scale.set(1);
          
          const pulseProgress = (elapsed - this.FADE_IN_DURATION) / this.DISPLAY_DURATION;
          const pulse = 1 + Math.sin(pulseProgress * Math.PI * 6) * 0.05;
          this.levelUpText.scale.set(pulse);
          
          // Animate symbol glow
          this.animateSymbolGlow(pulseProgress);
          
        } else if (elapsed < this.ANIMATION_DURATION) {
          // Fade out phase
          const fadeProgress = (elapsed - this.FADE_IN_DURATION - this.DISPLAY_DURATION) / this.FADE_OUT_DURATION;
          this.alpha = 1 - fadeProgress;
          
        } else {
          // Animation complete
          this.alpha = 0;
          this.scale.set(1);
          this.levelUpText.scale.set(1);
          resolve();
          return;
        }
        
        requestAnimationFrame(animate);
      };
      
      animate();
    });
  }

  /**
   * Animate symbol glow effects
   */
  private animateSymbolGlow(progress: number): void {
    this.symbolsContainer.children.forEach((symbolDisplay, index) => {
      const delay = index * 0.1; // Stagger the glow animation
      const adjustedProgress = Math.max(0, progress - delay);
      
      if (adjustedProgress > 0) {
        const glowIntensity = 1 + Math.sin(adjustedProgress * Math.PI * 8) * 0.3;
        symbolDisplay.scale.set(glowIntensity);
        
        // Rotate symbols slightly for visual appeal
        symbolDisplay.rotation = Math.sin(adjustedProgress * Math.PI * 4) * 0.1;
      }
    });
  }

  /**
   * Ease out bounce function for smooth animation
   */
  private easeOutBounce(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }

  /**
   * Check if notification is currently showing
   */
  isCurrentlyShowing(): boolean {
    return this.isShowing;
  }

  /**
   * Force hide the notification
   */
  forceHide(): void {
    this.isShowing = false;
    this.visible = false;
    this.alpha = 0;
    this.scale.set(1);
    this.levelUpText.scale.set(1);
  }
} 