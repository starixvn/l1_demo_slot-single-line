import { Container, Text, TextStyle } from 'pixi.js';
import { Monster } from './monster';
import { MonsterType, CombatResult } from '@/types/monster-types';
import { SymbolType } from '@/types/slot-types';
import { MonsterGenerator } from '@/config/monster-config';
import { GAME_CONSTANTS } from '@/config/game-config';

/**
 * Area layout configuration for responsive positioning
 */
interface AreaLayoutConfig {
  areaHeight: number;
  areaWidth: number;
  centerX: number;
  topY: number;
}

/**
 * Manages a trail of monsters with positioning and defeat animations
 * Now supports responsive layout with current monster centered and next monster to the left
 */
export class MonstersTrail extends Container {
  private trailTitle!: Text;
  private progressText!: Text;
  private totalCoinsEarned: number = 0;
  private totalExperienceEarned: number = 0;
  
  // Sequential monster trail configuration
  private sequentialMonsters: MonsterType[] = MonsterGenerator.generateSequentialTrail();
  private currentSequentialIndex: number = 0;
  private currentMonster: Monster | null = null;
  private nextMonster: Monster | null = null;

  // Layout configuration
  private areaConfig: AreaLayoutConfig = {
    areaHeight: 288, // Reduced from 324px (30% of 1080) to 288px for more compact display
    areaWidth: 1536, // Default 80% of 1920
    centerX: 0,
    topY: 0
  };

  constructor() {
    super();
    
    this.setupTrail();
    this.startSequentialMonsterTrail();
  }

  /**
   * Update the area layout for responsive design
   */
  public updateAreaLayout(config: AreaLayoutConfig): void {
    this.areaConfig = config;
    this.repositionElements();
    console.log('MonstersTrail: Area layout updated', config);
  }

  /**
   * Reposition all elements according to the current area configuration
   */
  private repositionElements(): void {
    const { areaHeight, centerX, topY } = this.areaConfig;
    
    // Position title at the top of the area
    this.trailTitle.x = centerX;
    this.trailTitle.y = topY + 20;
    
    // Position progress text below title
    this.progressText.x = centerX;
    this.progressText.y = topY + 50;
    
    // Calculate monster positions - optimized for more compact display
    const monsterAreaCenterY = topY + areaHeight * 0.55; // Slightly higher for optimal positioning
    const currentMonsterX = centerX; // Center for current monster
    const nextMonsterX = centerX - 300; // Fixed 300px spacing for better layout
    
    // Position current monster (center, 280x280px effective size)
    if (this.currentMonster) {
      this.currentMonster.x = currentMonsterX;
      this.currentMonster.y = monsterAreaCenterY;
      this.currentMonster.setBaseScale(1.4); // 200px * 1.4 = 280px display size
    }
    
    // Position next monster (left side, 160x160px effective size)
    if (this.nextMonster) {
      this.nextMonster.x = nextMonsterX;
      this.nextMonster.y = monsterAreaCenterY;
      this.nextMonster.setBaseScale(0.8); // 200px * 0.8 = 160px display size
      this.nextMonster.alpha = 0.7; // Slightly transparent to indicate it's upcoming
    }
  }

  /**
   * Set up the trail display components
   */
  private setupTrail(): void {
    // Create title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    this.trailTitle = new Text('🗡️ MONSTER TRAIL 🗡️', titleStyle);
    this.trailTitle.anchor.set(0.5, 0);
    this.addChild(this.trailTitle);
    
    // Create progress text
    const progressStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL,
      fill: 0xFFD700,
      align: 'center',
    });
    
    this.progressText = new Text('', progressStyle);
    this.progressText.anchor.set(0.5, 0);
    this.addChild(this.progressText);
    
    this.updateProgressDisplay();
  }

  /**
   * Start the sequential monster trail system
   */
  private startSequentialMonsterTrail(): void {
    // Create the current monster
    const currentMonsterType = this.sequentialMonsters[this.currentSequentialIndex];
    this.currentMonster = new Monster(currentMonsterType, 0, 0);
    this.currentMonster.setActive(true);
    this.currentMonster.setBaseScale(1.4); // Set initial scale for compact display (280px effective size)
    this.addChild(this.currentMonster);
    
    // Create the next monster (preview)
    const nextIndex = (this.currentSequentialIndex + 1) % this.sequentialMonsters.length;
    const nextMonsterType = this.sequentialMonsters[nextIndex];
    this.nextMonster = new Monster(nextMonsterType, 0, 0);
    this.nextMonster.setActive(false);
    this.nextMonster.setBaseScale(1.4); // Set initial scale proportionally
    this.addChild(this.nextMonster);
    
    // Position elements
    this.repositionElements();
    
    console.log(`MonstersTrail: Started with ${currentMonsterType}, next: ${nextMonsterType}`);
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
    
    // Remove current monster
    if (this.currentMonster) {
      this.removeChild(this.currentMonster);
      this.currentMonster = null;
    }
    
    // Move next monster to current position
    if (this.nextMonster) {
      this.currentMonster = this.nextMonster;
      this.currentMonster.setActive(true);
      this.currentMonster.setBaseScale(1.4); // Match the scale for current monster compact display (280px effective size)
      this.currentMonster.alpha = 1.0;
    }
    
    // Create new next monster
    const nextIndex = (this.currentSequentialIndex + 1) % this.sequentialMonsters.length;
    const nextMonsterType = this.sequentialMonsters[nextIndex];
    this.nextMonster = new Monster(nextMonsterType, 0, 0);
    this.nextMonster.setActive(false);
    this.nextMonster.setBaseScale(1.4); // Set proportional base scale for new next monster
    this.addChild(this.nextMonster);
    
    // Reposition all elements
    this.repositionElements();
    
    this.updateProgressDisplay();
    console.log(`MonstersTrail: Switched to ${this.sequentialMonsters[this.currentSequentialIndex]}, next: ${nextMonsterType}`);
  }

  /**
   * Update progress display text
   */
  private updateProgressDisplay(): void {
    const currentIndex = this.currentSequentialIndex + 1;
    const totalMonsters = this.sequentialMonsters.length;
    const currentMonsterType = this.sequentialMonsters[this.currentSequentialIndex];
    
    this.progressText.text = `Monster ${currentIndex}/${totalMonsters} | ${currentMonsterType} | Coins: ${this.totalCoinsEarned} | XP: ${this.totalExperienceEarned}`;
  }

  /**
   * Attack the current monster with weapon symbols
   */
  public attackMonster(symbols: SymbolType[]): CombatResult[] {
    const results: CombatResult[] = [];
    
    if (!this.currentMonster) {
      console.warn('MonstersTrail: No current monster to attack');
      return results;
    }
    
    // Attack current monster with each symbol
    symbols.forEach(symbol => {
      const result = this.currentMonster!.takeDamage(symbol);
      results.push(result);
      
      // Add rewards to totals
      if (result.rewards) {
        this.totalCoinsEarned += result.rewards.coins || 0;
        this.totalExperienceEarned += result.rewards.experience || 0;
      }
    });
    
    // Check if current monster is defeated
    if (!this.currentMonster.isAlive()) {
      console.log(`MonstersTrail: ${this.sequentialMonsters[this.currentSequentialIndex]} defeated!`);
      
      // Switch to next monster after a delay
      setTimeout(() => {
        this.switchToNextMonster();
      }, 1000);
    }
    
    this.updateProgressDisplay();
    return results;
  }

  /**
   * Get current monster instance
   */
  public getCurrentMonster(): Monster | null {
    return this.currentMonster;
  }

  /**
   * Get next monster instance
   */
  public getNextMonster(): Monster | null {
    return this.nextMonster;
  }

  /**
   * Get total coins earned in this trail
   */
  public getTotalCoinsEarned(): number {
    return this.totalCoinsEarned;
  }

  /**
   * Get total experience earned in this trail
   */
  public getTotalExperienceEarned(): number {
    return this.totalExperienceEarned;
  }

  /**
   * Get current progress in the trail
   */
  public getTrailProgress(): { current: number; total: number; percentage: number } {
    const current = this.currentSequentialIndex + 1;
    const total = this.sequentialMonsters.length;
    const percentage = (current / total) * 100;
    
    return { current, total, percentage };
  }

  /**
   * Reset the trail to the beginning
   */
  public resetTrail(): void {
    this.currentSequentialIndex = 0;
    this.totalCoinsEarned = 0;
    this.totalExperienceEarned = 0;
    
    // Remove current monsters
    if (this.currentMonster) {
      this.removeChild(this.currentMonster);
      this.currentMonster = null;
    }
    
    if (this.nextMonster) {
      this.removeChild(this.nextMonster);
      this.nextMonster = null;
    }
    
    // Restart the trail
    this.startSequentialMonsterTrail();
    
    console.log('MonstersTrail: Trail reset to beginning');
  }
} 