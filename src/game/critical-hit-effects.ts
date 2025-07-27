import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { EffectType, EffectConfig } from '@/types/monster-types';
import { GAME_CONSTANTS } from '@/config/game-config';

/**
 * Visual effects system for combat feedback
 */
export class CriticalHitEffects extends Container {
  private activeEffects: Set<Container> = new Set();

  constructor() {
    super();
  }

  /**
   * Display a critical hit effect
   */
  showCriticalHit(x: number, y: number): void {
    const effect = this.createTextEffect({
      type: EffectType.CRITICAL_HIT,
      duration: 1500,
      color: 0xFFD700,
      scale: 2.0,
      text: 'CRITICAL HIT!',
    }, x, y);
    
    this.addEffect(effect);
    this.animateCriticalEffect(effect);
  }
  
  /**
   * Display a weakness hit effect
   */
  showWeaknessHit(x: number, y: number): void {
    const effect = this.createTextEffect({
      type: EffectType.WEAKNESS_HIT,
      duration: 1000,
      color: 0x00FF00,
      scale: 1.5,
      text: 'SUPER EFFECTIVE!',
    }, x, y);
    
    this.addEffect(effect);
    this.animateFloatEffect(effect);
  }
  
  /**
   * Display a resist hit effect
   */
  showResistHit(x: number, y: number): void {
    const effect = this.createTextEffect({
      type: EffectType.RESIST_HIT,
      duration: 800,
      color: 0x888888,
      scale: 1.0,
      text: 'Resisted...',
    }, x, y);
    
    this.addEffect(effect);
    this.animateFloatEffect(effect);
  }
  
  /**
   * Display a monster defeat effect
   */
  showMonsterDefeat(x: number, y: number): void {
    const effect = this.createParticleEffect({
      type: EffectType.MONSTER_DEFEAT,
      duration: 2000,
      color: 0xFFD700,
      scale: 1.0,
      particles: true,
    }, x, y);
    
    this.addEffect(effect);
    this.animateParticleEffect(effect);
  }
  
  /**
   * Display a damage number
   */
  showDamageNumber(damage: number, x: number, y: number, isCritical: boolean = false): void {
    const color = isCritical ? 0xFFD700 : 0xFF6B6B;
    const scale = isCritical ? 1.8 : 1.2;
    
    const effect = this.createTextEffect({
      type: EffectType.CRITICAL_HIT,
      duration: 1000,
      color,
      scale,
      text: `-${damage}`,
    }, x, y);
    
    this.addEffect(effect);
    this.animateDamageNumber(effect);
  }
  
  /**
   * Create a text-based effect
   */
  private createTextEffect(config: EffectConfig, x: number, y: number): Container {
    const effect = new Container();
    effect.x = x;
    effect.y = y;
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
      fontWeight: 'bold',
      fill: config.color,
      align: 'center',
      stroke: 0x000000,
      strokeThickness: 2,
    });
    
    const text = new Text(config.text || '', textStyle);
    text.anchor.set(0.5, 0.5);
    text.scale.set(config.scale);
    
    effect.addChild(text);
    
    return effect;
  }
  
  /**
   * Create a particle-based effect
   */
  private createParticleEffect(config: EffectConfig, x: number, y: number): Container {
    const effect = new Container();
    effect.x = x;
    effect.y = y;
    
    // Create multiple particles
    for (let i = 0; i < 8; i++) {
      const particle = new Graphics();
      
      // Random particle properties
      const size = Math.random() * 6 + 2;
      const angle = (i / 8) * Math.PI * 2;
      const velocity = Math.random() * 50 + 25;
      
      particle.beginFill(config.color);
      particle.drawCircle(0, 0, size);
      particle.endFill();
      
      // Set initial position
      particle.x = Math.cos(angle) * 10;
      particle.y = Math.sin(angle) * 10;
      
      // Store velocity for animation
      (particle as any).velocity = {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity,
      };
      
      effect.addChild(particle);
    }
    
    return effect;
  }
  
  /**
   * Animate critical hit effect with scaling and rotation
   */
  private animateCriticalEffect(effect: Container): void {
    const duration = 1500;
    const startTime = Date.now();
    const startScale = effect.scale.x;
    
    const animateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        clearInterval(animateInterval);
        this.removeEffect(effect);
        return;
      }
      
      // Scaling animation (grow then shrink)
      const scaleProgress = progress < 0.3 ? progress / 0.3 : 1 - ((progress - 0.3) / 0.7);
      effect.scale.set(startScale + scaleProgress * 0.5);
      
      // Rotation animation
      effect.rotation = Math.sin(progress * Math.PI * 4) * 0.1;
      
      // Fade out
      effect.alpha = 1 - progress;
      
      // Float upward
      effect.y -= 1;
    }, 16);
  }
  
  /**
   * Animate floating effect
   */
  private animateFloatEffect(effect: Container): void {
    const duration = 1000;
    const startTime = Date.now();
    const startY = effect.y;
    
    const animateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        clearInterval(animateInterval);
        this.removeEffect(effect);
        return;
      }
      
      // Float upward
      effect.y = startY - progress * 50;
      
      // Fade out
      effect.alpha = 1 - progress;
    }, 16);
  }
  
  /**
   * Animate particle effect
   */
  private animateParticleEffect(effect: Container): void {
    const duration = 2000;
    const startTime = Date.now();
    
    const animateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        clearInterval(animateInterval);
        this.removeEffect(effect);
        return;
      }
      
      // Animate each particle
      effect.children.forEach((child) => {
        const particle = child as Graphics;
        const velocity = (particle as any).velocity;
        
        if (velocity) {
          particle.x += velocity.x * 0.016; // 60 FPS
          particle.y += velocity.y * 0.016;
          
          // Apply gravity
          velocity.y += 200 * 0.016;
          
          // Fade out
          particle.alpha = 1 - progress;
        }
      });
    }, 16);
  }
  
  /**
   * Animate damage number
   */
  private animateDamageNumber(effect: Container): void {
    const duration = 1000;
    const startTime = Date.now();
    const startY = effect.y;
    
    const animateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        clearInterval(animateInterval);
        this.removeEffect(effect);
        return;
      }
      
      // Float upward with easing
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      effect.y = startY - easeProgress * 40;
      
      // Scale animation
      const scaleProgress = progress < 0.2 ? progress / 0.2 : 1 - ((progress - 0.2) / 0.8);
      effect.scale.set(1 + scaleProgress * 0.3);
      
      // Fade out
      effect.alpha = 1 - progress;
    }, 16);
  }
  
  /**
   * Add effect to active effects and display
   */
  private addEffect(effect: Container): void {
    this.activeEffects.add(effect);
    this.addChild(effect);
  }
  
  /**
   * Remove effect from active effects and display
   */
  private removeEffect(effect: Container): void {
    this.activeEffects.delete(effect);
    this.removeChild(effect);
    effect.destroy();
  }
  
  /**
   * Clear all active effects
   */
  clearAllEffects(): void {
    this.activeEffects.forEach(effect => {
      this.removeChild(effect);
      effect.destroy();
    });
    this.activeEffects.clear();
  }
  
  /**
   * Get number of active effects
   */
  getActiveEffectCount(): number {
    return this.activeEffects.size;
  }
} 