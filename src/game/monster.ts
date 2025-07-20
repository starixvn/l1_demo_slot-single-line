import { Container, Graphics, Text, TextStyle, Sprite, AnimatedSprite } from 'pixi.js';
import { MonsterType, MonsterState, CombatResult } from '@/types/monster-types';
import { SymbolType } from '@/types/slot-types';
import { MONSTER_CONFIGS, HP_BAR_CONFIG, CombatCalculator, generateMonsterHp } from '@/config/monster-config';
import { getMonsterTextureEnhanced, hasMonsterSpritesheet, getMonsterAnimationFrames } from '@/systems/asset-manager';

/**
 * Individual monster class with HP management and visual display
 */
export class Monster extends Container {
  private state: MonsterState;
  private config: any;
  private background!: Graphics;
  private monsterSprite!: Sprite | AnimatedSprite;
  private monsterEmoji!: Text; // Fallback if image fails to load
  private nameText!: Text;
  private hpBar!: Graphics;
  private hpBarBackground!: Graphics;
  private hpText!: Text;
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
    
    // Create name text
    const nameStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    this.nameText = new Text(this.config.name, nameStyle);
    this.nameText.anchor.set(0.5, 0);
    this.nameText.x = 0;
    this.nameText.y = 60; // Adjusted for smaller circle (radius 50)
    this.addChild(this.nameText);
    
    // Create HP bar background
    this.hpBarBackground = new Graphics();
    this.addChild(this.hpBarBackground);
    
    // Create HP bar
    this.hpBar = new Graphics();
    this.addChild(this.hpBar);
    
    // Create HP text
    const hpStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    this.hpText = new Text('', hpStyle);
    this.hpText.anchor.set(0.5, 0.5);
    this.hpText.x = 0;
    this.hpText.y = 90; // Adjusted for smaller circle layout
    this.addChild(this.hpText);
    
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
    this.monsterSprite.y = -10;
    
    // Enhanced scaling for better image quality
    const maxSize = 90; // Balanced size relative to weapon slot symbols
    const scale = Math.min(maxSize / this.monsterSprite.width, maxSize / this.monsterSprite.height);
    this.monsterSprite.scale.set(scale);
    
    // Add visual enhancements
    this.addMonsterEffects();
    
    this.addChild(this.monsterSprite);
    
    // Log spritesheet usage
    const source = isFromSpritesheet ? (this.isAnimatedSprite ? 'animated spritesheet' : 'spritesheet') : 'individual image';
    console.log(`Monster: Using enhanced ${source} for ${this.config.name}`);
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
    this.monsterEmoji.y = -10;
    this.addChild(this.monsterEmoji);
    console.log(`Monster: Using enhanced emoji fallback for ${this.config.name}`);
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
    shadowSprite.y = -8; // Slightly offset
    shadowSprite.alpha = 0.3;
    shadowSprite.tint = 0x000000; // Black shadow
    shadowSprite.scale.copyFrom(this.monsterSprite.scale);
    
    // Add shadow first (behind sprite)
    this.addChild(shadowSprite);
  }
  
  /**
   * Draw the monster background with enhanced visual effects
   */
  private drawBackground(): void {
    this.background.clear();
    
    const radius = 50; // Reduced for smaller 2x monster scale
    const alpha = this.state.isActive ? 1.0 : 0.6;
    
    // Create gradient effect by drawing multiple circles
    const baseColor = this.config.color;
    const darkerColor = this.adjustColor(baseColor, -0.3); // Darker variant
    const lighterColor = this.adjustColor(baseColor, 0.2); // Lighter variant
    
    // Draw outer glow/shadow
    this.background.beginFill(darkerColor, alpha * 0.3);
    this.background.drawCircle(0, 2, radius + 4); // Slightly offset and larger
    this.background.endFill();
    
    // Draw main background with gradient effect
    this.background.beginFill(baseColor, alpha);
    this.background.drawCircle(0, 0, radius);
    this.background.endFill();
    
    // Draw inner highlight
    this.background.beginFill(lighterColor, alpha * 0.4);
    this.background.drawCircle(-5, -8, radius * 0.6); // Offset for light source effect
    this.background.endFill();
    
    // Draw border with enhanced styling
    const borderColor = this.state.isActive ? 0xFFD700 : 0xFFFFFF;
    const borderWidth = this.state.isActive ? 3 : 2;
    
    this.background.lineStyle(borderWidth, borderColor, 1);
    this.background.drawCircle(0, 0, radius);
    
    // Add inner border for depth
    if (this.state.isActive) {
      this.background.lineStyle(1, lighterColor, 0.6);
      this.background.drawCircle(0, 0, radius - 3);
    }
    
    // Add pulsing effect if active
    if (this.state.isActive && !this.isAnimating) {
      this.startPulseAnimation();
    }
  }

  /**
   * Utility function to adjust color brightness
   */
  private adjustColor(color: number, factor: number): number {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    
    const newR = Math.max(0, Math.min(255, r + (r * factor)));
    const newG = Math.max(0, Math.min(255, g + (g * factor)));
    const newB = Math.max(0, Math.min(255, b + (b * factor)));
    
    return (newR << 16) | (newG << 8) | newB;
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
    
    // Draw HP bar background
    this.hpBarBackground.beginFill(config.backgroundColor);
    this.hpBarBackground.drawRoundedRect(
      -config.width / 2, 
      75, // Adjusted for smaller circle - between name text (60) and HP text (90)
      config.width, 
      config.height, 
      2
    );
    this.hpBarBackground.endFill();
    
    // Draw HP bar border
    this.hpBarBackground.lineStyle(1, config.borderColor, 1);
    this.hpBarBackground.drawRoundedRect(
      -config.width / 2, 
      75, // Adjusted to match background position
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
        75, // Adjusted to match background position
        barWidth, 
        config.height, 
        2
      );
      this.hpBar.endFill();
    }
    
    // Update HP text
    this.hpText.text = `${this.state.currentHp}/${this.state.maxHp}`;
  }
  
  /**
   * Update the visual display
   */
  private updateDisplay(): void {
    this.drawBackground();
    this.drawHpBar();
    
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
      const scaleFactor = 1 + (easeInOut * 0.15); // Subtle 15% scale variation
      
      this.scale.set(this.baseScale * scaleFactor);
      
      // Add subtle glow effect by adjusting alpha of background
      if (this.background) {
        this.background.alpha = 0.8 + (easeInOut * 0.2); // Pulse transparency
      }
      
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