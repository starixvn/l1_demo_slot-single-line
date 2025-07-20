import { Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';
import { MonsterType, MonsterState, CombatResult } from '@/types/monster-types';
import { SymbolType } from '@/types/slot-types';
import { MONSTER_CONFIGS, HP_BAR_CONFIG, CombatCalculator, generateMonsterHp } from '@/config/monster-config';
import { getMonsterTexture } from '@/systems/asset-manager';

/**
 * Individual monster class with HP management and visual display
 */
export class Monster extends Container {
  private state: MonsterState;
  private config: any;
  private background!: Graphics;
  private monsterSprite!: Sprite;
  private monsterEmoji!: Text; // Fallback if image fails to load
  private nameText!: Text;
  private hpBar!: Graphics;
  private hpBarBackground!: Graphics;
  private hpText!: Text;
  private isAnimating: boolean = false;
  private baseScale: number = 1.0; // Store the intended scale from external sources

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
   * Create monster visual (sprite if available, emoji as fallback)
   */
  private createMonsterVisual(): void {
    const texture = getMonsterTexture(this.state.type);
    
    if (texture) {
      // Use monster image
      this.monsterSprite = new Sprite(texture);
      this.monsterSprite.anchor.set(0.5, 0.5);
      this.monsterSprite.x = 0;
      this.monsterSprite.y = -10;
      
      // Scale image to maintain high quality for large displays
      const maxSize = 90; // Balanced size relative to weapon slot symbols
      const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
      this.monsterSprite.scale.set(scale);
      
      this.addChild(this.monsterSprite);
      console.log(`Monster: Using image for ${this.config.name}`);
    } else {
      // Fallback to emoji
      const emojiStyle = new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 48,
        align: 'center',
      });
      
      this.monsterEmoji = new Text(this.config.emoji || '👹', emojiStyle);
      this.monsterEmoji.anchor.set(0.5, 0.5);
      this.monsterEmoji.x = 0;
      this.monsterEmoji.y = -10;
      this.addChild(this.monsterEmoji);
      console.log(`Monster: Using emoji fallback for ${this.config.name}`);
    }
  }
  
  /**
   * Draw the monster background
   */
  private drawBackground(): void {
    this.background.clear();
    
    const radius = 50; // Reduced for smaller 2x monster scale
    const alpha = this.state.isActive ? 1.0 : 0.6;
    
    // Draw background circle with monster color
    this.background.beginFill(this.config.color, alpha);
    this.background.drawCircle(0, 0, radius);
    this.background.endFill();
    
    // Draw border
    const borderColor = this.state.isActive ? 0xFFD700 : 0xFFFFFF;
    const borderWidth = this.state.isActive ? 3 : 2;
    
    this.background.lineStyle(borderWidth, borderColor, 1);
    this.background.drawCircle(0, 0, radius);
    
    // Add pulsing effect if active
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
   * Play damage animation
   */
  private playDamageAnimation(isCritical: boolean, isWeakness: boolean, isResisted: boolean): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Shake animation
    const originalX = this.x;
    const shakeIntensity = isCritical ? 8 : 4;
    const shakeDuration = isCritical ? 300 : 150;
    let shakeTime = 0;
    
    const shakeInterval = setInterval(() => {
      if (shakeTime >= shakeDuration) {
        clearInterval(shakeInterval);
        this.x = originalX;
        this.isAnimating = false;
        return;
      }
      
      this.x = originalX + (Math.random() - 0.5) * shakeIntensity;
      shakeTime += 16;
    }, 16);
    
    // Color flash
    let flashColor = 0xFFFFFF;
    if (isCritical) flashColor = 0xFFD700; // Gold for critical
    else if (isWeakness) flashColor = 0x00FF00; // Green for weakness
    else if (isResisted) flashColor = 0x888888; // Gray for resist
    
    (this as any).tint = flashColor;
    setTimeout(() => {
      (this as any).tint = 0xFFFFFF;
    }, 100);
  }
  
  /**
   * Set the base scale (called from external positioning systems)
   */
  public setBaseScale(scale: number): void {
    this.baseScale = scale;
    this.scale.set(scale);
  }

  /**
   * Start pulsing animation for active monster
   */
  private startPulseAnimation(): void {
    if (!this.state.isActive) return;
    
    const pulseInterval = setInterval(() => {
      if (!this.state.isActive) {
        clearInterval(pulseInterval);
        return;
      }
      
      // Subtle scale pulse using base scale
      this.scale.set(this.baseScale * 1.1);
      setTimeout(() => {
        this.scale.set(this.baseScale);
      }, 200);
    }, 1000);
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
   * Update monster visual (when switching monsters)
   */
  private updateMonsterVisual(): void {
    // Remove existing visual
    if (this.monsterSprite) {
      this.removeChild(this.monsterSprite);
      this.monsterSprite.destroy();
    }
    if (this.monsterEmoji) {
      this.removeChild(this.monsterEmoji);
      this.monsterEmoji.destroy();
    }
    
    // Create new visual
    this.createMonsterVisual();
  }

  /**
   * Update name text (when switching monsters)
   */
  private updateNameText(): void {
    this.nameText.text = this.config.name;
  }
} 