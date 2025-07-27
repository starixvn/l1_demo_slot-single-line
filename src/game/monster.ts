import { Container, Graphics, Text, TextStyle, Sprite, AnimatedSprite } from 'pixi.js';
import { MonsterType, MonsterState, CombatResult } from '@/types/monster-types';
import { SymbolType } from '@/types/slot-types';
import { MONSTER_CONFIGS, HP_BAR_CONFIG, CombatCalculator, generateMonsterHp } from '@/config/monster-config';
import { getMonsterTextureEnhanced, hasMonsterSpritesheet, getMonsterAnimationFrames } from '@/systems/asset-manager';
import { GAME_CONSTANTS } from '@/config/game-config';

/**
 * Individual monster class with HP management and visual display
 */
export class Monster extends Container {
  private state: MonsterState;
  private config: any;
  private background!: Graphics;
  private monsterSprite!: Sprite | AnimatedSprite;
  private monsterEmoji!: Text; // Fallback if image fails to load
  private monsterInfo!: Container; // Container for name + HP bar
  private nameText!: Text;
  private hpBar!: Graphics;
  private hpBarBackground!: Graphics;
  private isAnimating: boolean = false;
  private baseScale: number = 1.0; // Store the intended scale from external sources
  private isAnimatedSprite: boolean = false; // Track if using animated sprite

  constructor(monsterType: MonsterType, x: number = 0, y: number = 0) {
    super();
    
    this.config = MONSTER_CONFIGS[monsterType];
    
    // Generate random HP within the monster's range
    const randomHp = generateMonsterHp(monsterType);
    
    // Initialize monster state
    this.state = {
      type: monsterType,
      currentHp: randomHp,
      maxHp: randomHp,
      isAlive: true,
      position: { x, y },
      isActive: false,
      isFading: false,
    };
    
    this.x = x;
    this.y = y;
    
    this.setupMonster();
    this.updateDisplay();
  }

  /**
   * Set up the monster visual components
   */
  private setupMonster(): void {
    // Create background circle
    this.background = new Graphics();
    this.addChild(this.background);
    
    // Try to create monster sprite from image
    this.createMonsterVisual();
    
    // Create monster info container (name + HP bar)
    this.monsterInfo = new Container();
    this.addChild(this.monsterInfo);
    
    // Create name text
    const nameStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL, // Small text for monster names
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    });
    
    this.nameText = new Text(this.config.name, nameStyle);
    this.nameText.anchor.set(0.5, 0);
    this.nameText.x = 0;
    this.nameText.y = 0; // Position at top of info container
    this.monsterInfo.addChild(this.nameText);
    
    // Create HP bar background
    this.hpBarBackground = new Graphics();
    this.monsterInfo.addChild(this.hpBarBackground);
    
    // Create HP bar
    this.hpBar = new Graphics();
    this.monsterInfo.addChild(this.hpBar);
    
    // HP text removed - cleaner UI without text numbers
    
    this.drawBackground();
    this.drawHpBar();
  }

  /**
   * Create monster visual (animated sprite from spritesheet if available, static sprite, or emoji fallback)
   */
  private createMonsterVisual(): void {
    // Check if we have animation frames available
    const animationFrames = getMonsterAnimationFrames(this.state.type);
    const isFromSpritesheet = hasMonsterSpritesheet(this.state.type);
    
    if (animationFrames.length > 0) {
      // Create animated sprite from spritesheet frames
      this.monsterSprite = new AnimatedSprite(animationFrames);
      this.isAnimatedSprite = true;
      
      // Configure animation
      (this.monsterSprite as AnimatedSprite).animationSpeed = 0.1; // Slower animation (10 FPS)
      (this.monsterSprite as AnimatedSprite).loop = true;
      (this.monsterSprite as AnimatedSprite).play();
      
      console.log(`Monster: Created animated sprite for ${this.config.name} with ${animationFrames.length} frames`);
    } else {
      // Fallback to static sprite
      const texture = getMonsterTextureEnhanced(this.state.type);
      
      if (texture) {
        this.monsterSprite = new Sprite(texture);
        this.isAnimatedSprite = false;
        
        // Enable better texture filtering for crisp rendering
        texture.baseTexture.scaleMode = 0; // LINEAR filtering for better quality
        
        console.log(`Monster: Created static sprite for ${this.config.name}`);
      } else {
        this.createEmojiFallback();
        return;
      }
    }
    
    // Common sprite setup
    this.monsterSprite.anchor.set(0.5, 0.5);
    this.monsterSprite.x = 0;
    this.monsterSprite.y = 0; // Center the monster at origin
    
    // Enhanced scaling for better image quality - increased size for spritesheets
    const maxSize = 200; // Increased significantly for better visibility and prominence
    const scale = Math.min(maxSize / this.monsterSprite.width, maxSize / this.monsterSprite.height);
    this.monsterSprite.scale.set(scale);
    
    // Debug logging for monster dimensions
    const finalWidth = this.monsterSprite.width * scale;
    const finalHeight = this.monsterSprite.height * scale;
    console.log(`Monster: ${this.config.name} dimensions:`, {
      originalWidth: this.monsterSprite.width,
      originalHeight: this.monsterSprite.height,
      internalScale: scale,
      finalSpriteSize: `${finalWidth.toFixed(0)}x${finalHeight.toFixed(0)}px`,
      maxSizeLimit: maxSize
    });
    
    // Add visual enhancements
    this.addMonsterEffects();
    
    this.addChild(this.monsterSprite);
    
    // Log spritesheet usage
    const source = isFromSpritesheet ? (this.isAnimatedSprite ? 'animated spritesheet' : 'spritesheet') : 'individual image';
    console.log(`Monster: Using enhanced ${source} for ${this.config.name}`);
    
    // Position monster info container below the sprite
    this.positionMonsterInfo();
  }

  /**
   * Create emoji fallback when no sprite is available
   */
  private createEmojiFallback(): void {
    // Enhanced fallback emoji with effects
    const emojiStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowDistance: 2,
    });
    
    this.monsterEmoji = new Text(this.config.emoji || '👹', emojiStyle);
    this.monsterEmoji.anchor.set(0.5, 0.5);
    this.monsterEmoji.x = 0;
    this.monsterEmoji.y = 0; // Match monster sprite positioning
    this.addChild(this.monsterEmoji);
    console.log(`Monster: Using enhanced emoji fallback for ${this.config.name}`);
    
    // Position monster info container below the emoji
    this.positionMonsterInfo();
  }

  /**
   * Add visual effects to enhance monster appearance
   */
  private addMonsterEffects(): void {
    if (!this.monsterSprite) return;

    // Create a subtle drop shadow effect
    let shadowSprite: Sprite;
    
    if (this.isAnimatedSprite) {
      // For animated sprites, use the current texture for shadow
      const animatedSprite = this.monsterSprite as AnimatedSprite;
      shadowSprite = new Sprite(animatedSprite.texture);
    } else {
      // For regular sprites, duplicate the texture
      shadowSprite = new Sprite((this.monsterSprite as Sprite).texture);
    }
    
    shadowSprite.anchor.set(0.5, 0.5);
    shadowSprite.x = 2;
    shadowSprite.y = 2; // Slightly offset from centered monster
    shadowSprite.alpha = 0.3;
    shadowSprite.tint = 0x000000; // Black shadow
    shadowSprite.scale.copyFrom(this.monsterSprite.scale);
    
    // Add shadow first (behind sprite)
    this.addChild(shadowSprite);
  }
  
  /**
   * Draw minimal background (no circle - spritesheets look better without it)
   */
  private drawBackground(): void {
    this.background.clear();
    
    // No circle background needed - spritesheets look better standalone
    // Just add pulsing effect if active
    if (this.state.isActive && !this.isAnimating) {
      this.startPulseAnimation();
    }
  }


  
  /**
   * Draw the HP bar
   */
  private drawHpBar(): void {
    const config = HP_BAR_CONFIG;
    const hpPercentage = this.state.currentHp / this.state.maxHp;
    const barWidth = config.width * hpPercentage;
    
    // Clear previous bars
    this.hpBarBackground.clear();
    this.hpBar.clear();
    
    // Position HP bar relative to name text within the monster info container
    const hpBarY = 22; // Small gap below the name text (name height ~16px + 6px gap)
    
    // Draw HP bar background
    this.hpBarBackground.beginFill(config.backgroundColor);
    this.hpBarBackground.drawRoundedRect(
      -config.width / 2, 
      hpBarY,
      config.width, 
      config.height, 
      2
    );
    this.hpBarBackground.endFill();
    
    // Draw HP bar border
    this.hpBarBackground.lineStyle(1, config.borderColor, 1);
    this.hpBarBackground.drawRoundedRect(
      -config.width / 2, 
      hpBarY,
      config.width, 
      config.height, 
      2
    );
    
    // Draw current HP bar
    if (hpPercentage > 0) {
      const healthColor = hpPercentage <= config.criticalThreshold 
        ? config.criticalColor 
        : config.healthColor;
      
      this.hpBar.beginFill(healthColor);
      this.hpBar.drawRoundedRect(
        -config.width / 2, 
        hpBarY,
        barWidth, 
        config.height, 
        2
      );
      this.hpBar.endFill();
    }
    
    // HP text removed for cleaner UI
  }
  
  /**
   * Update the visual display
   */
  private updateDisplay(): void {
    this.drawBackground();
    this.drawHpBar();
    this.positionMonsterInfo(); // Position info container below monster sprite
    
    // Update opacity based on state
    if (this.state.isFading) {
      this.alpha = 0.5;
    } else if (!this.state.isAlive) {
      this.alpha = 0.3;
    } else {
      this.alpha = 1.0;
    }
  }

  /**
   * Position the monster info container below the monster sprite
   */
  private positionMonsterInfo(): void {
    if (!this.monsterInfo) return;
    
    // Simple approach: monster sprite is centered at y=0, so just position info at a fixed offset
    // This accounts for the typical monster size and provides consistent spacing
    const infoOffset = 110; // Fixed offset below monster center (works for 200px monsters)
    
    this.monsterInfo.x = 0; // Center horizontally
    this.monsterInfo.y = infoOffset; // Simple fixed position below monster
    
    console.log(`Monster: ${this.config.name} info positioned at fixed offset y=${infoOffset}`);
  }
  
  /**
   * Take damage and update HP
   */
  takeDamage(weapon: SymbolType): CombatResult {
    if (!this.state.isAlive) {
      return {
        damage: 0,
        isCritical: false,
        isWeakness: false,
        isResisted: false,
        monsterDefeated: false,
        remainingHp: this.state.currentHp,
      };
    }
    
    // Calculate critical hit
    const isCritical = CombatCalculator.calculateCriticalHit(weapon);
    
    // Calculate damage
    const damageCalc = CombatCalculator.calculateDamage(weapon, this.state.type, isCritical);
    
    // Apply damage
    const actualDamage = Math.min(damageCalc.damage, this.state.currentHp);
    this.state.currentHp -= actualDamage;
    
    // Check if monster is defeated
    const wasDefeated = this.state.currentHp <= 0;
    if (wasDefeated) {
      this.state.isAlive = false;
      this.state.currentHp = 0;
    }
    
    // Update display
    this.updateDisplay();
    
    // Play damage animation
    this.playDamageAnimation(isCritical, damageCalc.isWeakness, damageCalc.isResisted);
    
    console.log(`${this.config.name} took ${actualDamage} damage (Critical: ${isCritical}, Weakness: ${damageCalc.isWeakness})`);
    
    const result: CombatResult = {
      damage: actualDamage,
      isCritical,
      isWeakness: damageCalc.isWeakness,
      isResisted: damageCalc.isResisted,
      monsterDefeated: wasDefeated,
      remainingHp: this.state.currentHp,
    };
    
    if (wasDefeated) {
      result.rewards = {
        coins: this.config.rewards.coins,
        experience: this.config.rewards.experience,
      };
    }
    
    return result;
  }
  
  /**
   * Heal the monster (for testing or special abilities)
   */
  heal(amount: number): void {
    if (!this.state.isAlive) return;
    
    this.state.currentHp = Math.min(this.state.maxHp, this.state.currentHp + amount);
    this.updateDisplay();
    
    console.log(`${this.config.name} healed for ${amount} HP`);
  }
  
  /**
   * Set monster as active (currently being attacked)
   */
  setActive(active: boolean): void {
    this.state.isActive = active;
    this.updateDisplay();
  }
  
  /**
   * Start fade out animation for defeated monster
   */
  async fadeOut(): Promise<void> {
    if (this.state.isFading) return;
    
    this.state.isFading = true;
    this.updateDisplay();
    
    return new Promise((resolve) => {
      const startAlpha = this.alpha;
      const duration = 1000; // 1 second fade
      const startTime = Date.now();
      
      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.alpha = startAlpha * (1 - progress);
        
        if (progress >= 1) {
          clearInterval(fadeInterval);
          this.visible = false;
          resolve();
        }
      }, 16); // ~60 FPS
    });
  }
  
  /**
   * Enhanced damage animation with better visual feedback
   */
  private playDamageAnimation(isCritical: boolean, isWeakness: boolean, isResisted: boolean): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Enhanced shake animation with easing
    const originalX = this.x;
    const originalY = this.y;
    const shakeIntensity = isCritical ? 12 : 6;
    const shakeDuration = isCritical ? 400 : 200;
    const shakeSteps = 20;
    let currentStep = 0;
    
    const shakeInterval = setInterval(() => {
      if (currentStep >= shakeSteps) {
        clearInterval(shakeInterval);
        this.x = originalX;
        this.y = originalY;
        this.isAnimating = false;
        return;
      }
      
      // Easing function for natural shake decay
      const progress = currentStep / shakeSteps;
      const intensity = shakeIntensity * (1 - progress); // Decay over time
      
      this.x = originalX + (Math.random() - 0.5) * intensity;
      this.y = originalY + (Math.random() - 0.5) * intensity * 0.5; // Less vertical shake
      
      currentStep++;
    }, shakeDuration / shakeSteps);
    
    // Enhanced color flash with multiple colors
    let flashColor = 0xFFFFFF;
    let flashIntensity = 0.8;
    
    if (isCritical) {
      flashColor = 0xFFD700; // Gold for critical
      flashIntensity = 1.2;
    } else if (isWeakness) {
      flashColor = 0x00FF88; // Bright green for weakness
      flashIntensity = 1.0;
    } else if (isResisted) {
      flashColor = 0x666666; // Dark gray for resist
      flashIntensity = 0.5;
    }
    
    // Apply flash effect to sprite
    if (this.monsterSprite) {
      this.monsterSprite.tint = flashColor;
      
      // Scale pulse for impact
      const originalScale = this.monsterSprite.scale.x;
      this.monsterSprite.scale.set(originalScale * flashIntensity);
      
      setTimeout(() => {
        if (this.monsterSprite) {
          this.monsterSprite.tint = 0xFFFFFF;
          this.monsterSprite.scale.set(originalScale);
        }
      }, 150);
    }
    
    // Add screen shake effect for critical hits
    if (isCritical && this.parent) {
      const parentOriginalX = this.parent.x;
      const parentOriginalY = this.parent.y;
      
      setTimeout(() => {
        if (this.parent) {
          this.parent.x = parentOriginalX + (Math.random() - 0.5) * 4;
          this.parent.y = parentOriginalY + (Math.random() - 0.5) * 2;
          
          setTimeout(() => {
            if (this.parent) {
              this.parent.x = parentOriginalX;
              this.parent.y = parentOriginalY;
            }
          }, 100);
        }
      }, 50);
    }
  }
  
  /**
   * Set the base scale (called from external positioning systems)
   */
  public setBaseScale(scale: number): void {
    this.baseScale = scale;
    this.scale.set(scale);
    
    // Debug logging for final monster size
    if (this.monsterSprite) {
      const internalScale = this.monsterSprite.scale.x;
      const finalEffectiveWidth = this.monsterSprite.width * internalScale * scale;
      const finalEffectiveHeight = this.monsterSprite.height * internalScale * scale;
      console.log(`Monster: ${this.config.name} final size with baseScale ${scale}:`, {
        effectiveSize: `${finalEffectiveWidth.toFixed(0)}x${finalEffectiveHeight.toFixed(0)}px`,
        internalSpriteScale: internalScale.toFixed(2),
        externalBaseScale: scale,
        totalScale: (internalScale * scale).toFixed(2)
      });
    }
    
    // Reposition monster info after scale change
    this.positionMonsterInfo();
  }

  /**
   * Start pulsing animation for active monster with enhanced effects
   */
  private startPulseAnimation(): void {
    if (!this.state.isActive) return;
    
    let pulseDirection = 1;
    let pulseProgress = 0;
    
    const pulseInterval = setInterval(() => {
      if (!this.state.isActive) {
        clearInterval(pulseInterval);
        this.scale.set(this.baseScale); // Reset to base scale
        return;
      }
      
      // Smooth sine wave animation for natural pulsing
      pulseProgress += 0.1 * pulseDirection;
      
      if (pulseProgress >= 1) {
        pulseDirection = -1;
      } else if (pulseProgress <= 0) {
        pulseDirection = 1;
      }
      
      // Apply smooth easing using sine function
      const easeInOut = 0.5 * (1 + Math.sin((pulseProgress - 0.5) * Math.PI));
      const scaleFactor = 1 + (easeInOut * 0.1); // Subtle 10% scale variation for cleaner look
      
      this.scale.set(this.baseScale * scaleFactor);
      
    }, 50); // Smooth 20 FPS animation
  }
  
  /**
   * Get monster state
   */
  getState(): MonsterState {
    return { ...this.state };
  }
  
  /**
   * Get monster configuration
   */
  getConfig(): any {
    return this.config;
  }
  
  /**
   * Check if monster is alive
   */
  isAlive(): boolean {
    return this.state.isAlive;
  }
  
  /**
   * Get current HP percentage
   */
  getHpPercentage(): number {
    return this.state.currentHp / this.state.maxHp;
  }
  
  /**
   * Reset monster to full health
   */
  reset(): void {
    const randomHp = generateMonsterHp(this.state.type);
    this.state.currentHp = randomHp;
    this.state.maxHp = randomHp;
    this.state.isAlive = true;
    this.state.isFading = false;
    this.visible = true;
    this.alpha = 1.0;
    this.updateDisplay();
  }

  /**
   * Switch to a new monster type with fresh HP
   */
  switchToNewMonster(newMonsterType: MonsterType): void {
    // Update configuration
    this.config = MONSTER_CONFIGS[newMonsterType];
    
    // Generate new HP
    const randomHp = generateMonsterHp(newMonsterType);
    
    // Update state
    this.state.type = newMonsterType;
    this.state.currentHp = randomHp;
    this.state.maxHp = randomHp;
    this.state.isAlive = true;
    this.state.isFading = false;
    this.state.isActive = false;
    
    // Reset visual state
    this.visible = true;
    this.alpha = 1.0;
    this.scale.set(this.baseScale); // Restore the intended scale instead of hardcoded 1.0
    
    // Update visual components
    this.updateMonsterVisual();
    this.updateNameText();
    this.updateDisplay();
    
    console.log(`Monster: Switched to ${this.config.name} with ${randomHp} HP`);
  }

  /**
   * Update monster visual (when switching monsters) with enhanced effects
   */
  private updateMonsterVisual(): void {
    // Remove existing visual and shadow effects
    if (this.monsterSprite) {
      // Stop animation if it's an animated sprite
      if (this.isAnimatedSprite) {
        (this.monsterSprite as AnimatedSprite).stop();
      }
      this.removeChild(this.monsterSprite);
      this.monsterSprite.destroy();
    }
    if (this.monsterEmoji) {
      this.removeChild(this.monsterEmoji);
      this.monsterEmoji.destroy();
    }
    
    // Remove any shadow sprites created by addMonsterEffects
    const shadowSprites = this.children.filter(child => 
      child instanceof Sprite && child !== this.monsterSprite && child.alpha === 0.3
    );
    shadowSprites.forEach(shadow => {
      this.removeChild(shadow);
      shadow.destroy();
    });
    
    // Reset animation state
    this.isAnimatedSprite = false;
    
    // Create new enhanced visual
    this.createMonsterVisual();
  }

  /**
   * Update name text (when switching monsters)
   */
  private updateNameText(): void {
    this.nameText.text = this.config.name;
  }
} 