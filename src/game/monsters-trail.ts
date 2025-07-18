import { Container, Text, TextStyle } from 'pixi.js';
import { Monster } from './monster';
import { MonsterType, CombatResult } from '@/types/monster-types';
import { SymbolType } from '@/types/slot-types';
import { MONSTER_TRAIL_CONFIG, MonsterGenerator } from '@/config/monster-config';

/**
 * Manages a trail of monsters with positioning and defeat animations
 */
export class MonstersTrail extends Container {
  private monsters: Monster[] = [];
  private currentMonsterIndex: number = 0;
  private trailTitle!: Text;
  private progressText!: Text;
  private totalCoinsEarned: number = 0;
  private totalExperienceEarned: number = 0;

  constructor() {
    super();
    
    this.setupTrail();
    this.generateNewTrail();
  }

  /**
   * Set up the trail display components
   */
  private setupTrail(): void {
    // Create title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    this.trailTitle = new Text('🗡️ MONSTER TRAIL 🗡️', titleStyle);
    this.trailTitle.anchor.set(0.5, 0);
    this.trailTitle.x = 0;
    this.trailTitle.y = -400;
    this.addChild(this.trailTitle);
    
    // Create progress text
    const progressStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fill: 0xFFD700,
      align: 'center',
    });
    
    this.progressText = new Text('', progressStyle);
    this.progressText.anchor.set(0.5, 0);
    this.progressText.x = 0;
    this.progressText.y = -370;
    this.addChild(this.progressText);
    
    this.updateProgressDisplay();
  }
  
  /**
   * Generate a new monster trail
   */
  generateNewTrail(): void {
    // Clear existing monsters
    this.clearTrail();
    
    // Generate monster types
    const monsterTypes = MonsterGenerator.generateMonsterTrail(MONSTER_TRAIL_CONFIG.maxMonsters);
    
    // Create monster instances
    monsterTypes.forEach((type, index) => {
      const monster = this.createMonster(type, index);
      this.monsters.push(monster);
      this.addChild(monster);
    });
    
    // Set first monster as active
    this.currentMonsterIndex = 0;
    this.updateActiveMonster();
    
    console.log('MonstersTrail: Generated new trail with monsters:', monsterTypes);
  }
  
  /**
   * Create a monster at the specified trail position
   */
  private createMonster(type: MonsterType, index: number): Monster {
    const config = MONSTER_TRAIL_CONFIG;
    
    // Calculate position
    let x: number, y: number;
    
    if (index === 0) {
      // Current monster in center
      x = config.centerPosition.x;
      y = config.centerPosition.y;
    } else {
      // Trail monsters on the right side
      x = config.trailStartX + (index - 1) * config.monsterSpacing;
      y = config.centerPosition.y + 100;
    }
    
    const monster = new Monster(type, x, y);
    
    // Scale down trail monsters
    if (index > 0) {
      monster.scale.set(0.7);
    }
    
    return monster;
  }
  
  /**
   * Update which monster is currently active
   */
  private updateActiveMonster(): void {
    this.monsters.forEach((monster, index) => {
      monster.setActive(index === this.currentMonsterIndex);
    });
    
    this.updateProgressDisplay();
  }
  
  /**
   * Attack the current monster with a weapon
   */
  attackCurrentMonster(weapon: SymbolType): CombatResult | null {
    const currentMonster = this.getCurrentMonster();
    if (!currentMonster || !currentMonster.isAlive()) {
      return null;
    }
    
    const result = currentMonster.takeDamage(weapon);
    
    // If monster is defeated, handle the defeat
    if (result.monsterDefeated) {
      this.handleMonsterDefeat(result);
    }
    
    return result;
  }
  
  /**
   * Handle monster defeat and trail progression
   */
  private async handleMonsterDefeat(result: CombatResult): Promise<void> {
    const defeatedMonster = this.getCurrentMonster();
    if (!defeatedMonster) return;
    
    // Add rewards
    if (result.rewards) {
      this.totalCoinsEarned += result.rewards.coins;
      this.totalExperienceEarned += result.rewards.experience;
    }
    
    console.log(`Monster defeated! Earned ${result.rewards?.coins} coins, ${result.rewards?.experience} XP`);
    
    // Fade out defeated monster
    await defeatedMonster.fadeOut();
    
    // Move to next monster
    this.currentMonsterIndex++;
    
    if (this.currentMonsterIndex >= this.monsters.length) {
      // Trail completed!
      this.handleTrailCompletion();
    } else {
      // Move next monster to center and update trail
      await this.moveNextMonsterToCenter();
      this.updateActiveMonster();
    }
  }
  
  /**
   * Move the next monster to center position
   */
  private async moveNextMonsterToCenter(): Promise<void> {
    const nextMonster = this.getCurrentMonster();
    if (!nextMonster) return;
    
    const config = MONSTER_TRAIL_CONFIG;
    const targetX = config.centerPosition.x;
    const targetY = config.centerPosition.y;
    
    return new Promise((resolve) => {
      const startX = nextMonster.x;
      const startY = nextMonster.y;
      const startScale = nextMonster.scale.x;
      
      const duration = config.moveAnimationDuration;
      const startTime = Date.now();
      
      const moveInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        nextMonster.x = startX + (targetX - startX) * easeProgress;
        nextMonster.y = startY + (targetY - startY) * easeProgress;
        nextMonster.scale.set(startScale + (1.0 - startScale) * easeProgress);
        
        if (progress >= 1) {
          clearInterval(moveInterval);
          resolve();
        }
      }, 16); // ~60 FPS
    });
  }
  
  /**
   * Handle trail completion
   */
  private handleTrailCompletion(): void {
    console.log(`🎉 Trail completed! Total rewards: ${this.totalCoinsEarned} coins, ${this.totalExperienceEarned} XP`);
    
    // Generate new trail after a delay
    setTimeout(() => {
      this.generateNewTrail();
      this.totalCoinsEarned = 0;
      this.totalExperienceEarned = 0;
    }, 2000);
  }
  
  /**
   * Clear all monsters from the trail
   */
  private clearTrail(): void {
    this.monsters.forEach(monster => {
      this.removeChild(monster);
      monster.destroy();
    });
    this.monsters = [];
  }
  
  /**
   * Update progress display
   */
  private updateProgressDisplay(): void {
    const current = this.currentMonsterIndex + 1;
    const total = this.monsters.length;
    const currentMonster = this.getCurrentMonster();
    
    if (currentMonster) {
      const monsterName = currentMonster.getConfig().name;
      const hp = currentMonster.getState().currentHp;
      const maxHp = currentMonster.getState().maxHp;
      
      this.progressText.text = `Monster ${current}/${total}: ${monsterName} (${hp}/${maxHp} HP)`;
    } else {
      this.progressText.text = `Trail Complete! Coins: ${this.totalCoinsEarned} | XP: ${this.totalExperienceEarned}`;
    }
  }
  
  /**
   * Get the currently active monster
   */
  getCurrentMonster(): Monster | null {
    return this.monsters[this.currentMonsterIndex] || null;
  }
  
  /**
   * Get all monsters in the trail
   */
  getMonsters(): Monster[] {
    return [...this.monsters];
  }
  
  /**
   * Get trail progress information
   */
  getProgress(): {
    current: number;
    total: number;
    coinsEarned: number;
    experienceEarned: number;
  } {
    return {
      current: this.currentMonsterIndex + 1,
      total: this.monsters.length,
      coinsEarned: this.totalCoinsEarned,
      experienceEarned: this.totalExperienceEarned,
    };
  }
  
  /**
   * Check if trail is completed
   */
  isTrailCompleted(): boolean {
    return this.currentMonsterIndex >= this.monsters.length;
  }
  
  /**
   * Reset the trail to the beginning
   */
  resetTrail(): void {
    this.monsters.forEach(monster => monster.reset());
    this.currentMonsterIndex = 0;
    this.totalCoinsEarned = 0;
    this.totalExperienceEarned = 0;
    this.updateActiveMonster();
  }
  
  /**
   * Skip to next monster (for testing)
   */
  skipToNextMonster(): void {
    const currentMonster = this.getCurrentMonster();
    if (currentMonster && currentMonster.isAlive()) {
      // Defeat current monster instantly
      const result = currentMonster.takeDamage(currentMonster.getState().currentHp as any);
      this.handleMonsterDefeat(result);
    }
  }
} 