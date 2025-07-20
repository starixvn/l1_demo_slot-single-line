import { Container, Text, TextStyle } from 'pixi.js';
import { Monster } from './monster';
import { MonsterType, CombatResult } from '@/types/monster-types';
import { SymbolType } from '@/types/slot-types';
import { MONSTER_TRAIL_CONFIG, MonsterGenerator } from '@/config/monster-config';

/**
 * Manages a trail of monsters with positioning and defeat animations
 * Now supports simple sequential monster switching
 */
export class MonstersTrail extends Container {
  private monsters: Monster[] = [];
  private currentMonsterIndex: number = 0;
  private trailTitle!: Text;
  private progressText!: Text;
  private totalCoinsEarned: number = 0;
  private totalExperienceEarned: number = 0;
  
  // Sequential monster trail configuration
  private sequentialMonsters: MonsterType[] = MonsterGenerator.generateSequentialTrail();
  private currentSequentialIndex: number = 0;
  private currentMonster: Monster | null = null;

  constructor() {
    super();
    
    this.setupTrail();
    this.startSequentialMonsterTrail();
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
   * Start the sequential monster trail system
   */
  private startSequentialMonsterTrail(): void {
    // Create the first monster
    const firstMonsterType = this.sequentialMonsters[0];
    this.currentMonster = new Monster(firstMonsterType, 0, -300);
    this.currentMonster.setActive(true);
    this.addChild(this.currentMonster);
    
    console.log(`MonstersTrail: Started with ${firstMonsterType}`);
    this.updateProgressDisplay();
  }

  /**
   * Switch to the next monster in the sequence
   */
  private switchToNextMonster(): void {
    this.currentSequentialIndex++;
    
    if (this.currentSequentialIndex >= this.sequentialMonsters.length) {
      // Trail completed, restart
      this.currentSequentialIndex = 0;
      this.totalCoinsEarned = 0;
      this.totalExperienceEarned = 0;
      console.log('MonstersTrail: Trail completed! Restarting...');
    }
    
    const nextMonsterType = this.sequentialMonsters[this.currentSequentialIndex];
    
    if (this.currentMonster) {
      // Switch the existing monster to the new type
      this.currentMonster.switchToNewMonster(nextMonsterType);
      this.currentMonster.setActive(true);
    } else {
      // Create new monster if none exists
      this.currentMonster = new Monster(nextMonsterType, 0, -300);
      this.currentMonster.setActive(true);
      this.addChild(this.currentMonster);
    }
    
    console.log(`MonstersTrail: Switched to ${nextMonsterType} (${this.currentSequentialIndex + 1}/${this.sequentialMonsters.length})`);
    this.updateProgressDisplay();
  }

  /**
   * Update progress display
   */
  private updateProgressDisplay(): void {
    const current = this.currentSequentialIndex + 1;
    const total = this.sequentialMonsters.length;
    const currentMonsterName = this.currentMonster?.getConfig().name || 'Unknown';
    
    this.progressText.text = `Monster ${current}/${total}: ${currentMonsterName} | Coins: ${this.totalCoinsEarned} | XP: ${this.totalExperienceEarned}`;
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
   * Handle monster defeat and switch to next monster
   */
  async handleMonsterDefeat(combatResult: CombatResult): Promise<void> {
    if (!combatResult.monsterDefeated || !this.currentMonster) return;
    
    // Add rewards
    if (combatResult.rewards) {
      this.totalCoinsEarned += combatResult.rewards.coins;
      this.totalExperienceEarned += combatResult.rewards.experience;
    }
    
    console.log(`Monster defeated! Earned ${combatResult.rewards?.coins || 0} coins, ${combatResult.rewards?.experience || 0} XP`);
    
    // Play defeat animation
    await this.currentMonster.fadeOut();
    
    // Switch to next monster
    this.switchToNextMonster();
  }
  
  /**
   * Get the currently active monster
   */
  getCurrentMonster(): Monster | null {
    return this.currentMonster;
  }
  
  /**
   * Get all monsters in the trail (for compatibility - now returns array with current monster)
   */
  getMonsters(): Monster[] {
    return this.currentMonster ? [this.currentMonster] : [];
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
      current: this.currentSequentialIndex + 1,
      total: this.sequentialMonsters.length,
      coinsEarned: this.totalCoinsEarned,
      experienceEarned: this.totalExperienceEarned,
    };
  }
  
  /**
   * Check if trail is completed
   */
  isTrailCompleted(): boolean {
    return this.currentSequentialIndex >= this.sequentialMonsters.length - 1 && 
           (!this.currentMonster || !this.currentMonster.isAlive());
  }
  
  /**
   * Reset the trail to the beginning
   */
  resetTrail(): void {
    this.currentSequentialIndex = 0;
    this.totalCoinsEarned = 0;
    this.totalExperienceEarned = 0;
    
    if (this.currentMonster) {
      const firstMonsterType = this.sequentialMonsters[0];
      this.currentMonster.switchToNewMonster(firstMonsterType);
    }
    
    this.updateProgressDisplay();
  }
  
  /**
   * Skip to next monster (for testing)
   */
  skipToNextMonster(): void {
    if (this.currentMonster && this.currentMonster.isAlive()) {
      // Create a mock defeat result
      const mockResult: CombatResult = {
        damage: this.currentMonster.getState().currentHp,
        isCritical: false,
        isWeakness: false,
        isResisted: false,
        monsterDefeated: true,
        remainingHp: 0,
        rewards: this.currentMonster.getConfig().rewards,
      };
      
      // Force defeat the monster
      this.currentMonster.takeDamage(this.currentMonster.getState().currentHp as any);
      this.handleMonsterDefeat(mockResult);
    }
  }

  // Legacy compatibility methods (no longer used but kept for existing code)
  private async moveNextMonsterToCenter(): Promise<void> {
    // No longer needed in sequential system
    return Promise.resolve();
  }
  
  private handleTrailCompletion(): void {
    // Handled in switchToNextMonster now
  }
  
  private clearTrail(): void {
    // No longer needed in sequential system
  }
  
  generateNewTrail(): void {
    // Reset to first monster for compatibility
    this.resetTrail();
  }
  
  private updateActiveMonster(): void {
    // No longer needed - single monster is always active
    if (this.currentMonster) {
      this.currentMonster.setActive(true);
    }
  }
} 