import { Container } from 'pixi.js';
import { SlotMachine } from './slot-machine';
import { MonstersTrail } from './monsters-trail';
import { CriticalHitEffects } from './critical-hit-effects';
import { SymbolType, SpinResult } from '@/types/slot-types';
import { CombatResult } from '@/types/monster-types';
import { MonsterGenerator } from '@/config/monster-config';

/**
 * Combat system that connects slot machine results to monster attacks
 */
export class CombatSystem extends Container {
  private slotMachine!: SlotMachine;
  private monstersTrail!: MonstersTrail;
  private effects!: CriticalHitEffects;
  private isInCombat: boolean = false;

  constructor() {
    super();
    
    this.setupCombatSystem();
    
    // Initialize monster generator
    MonsterGenerator.initialize();
  }

  /**
   * Set up the combat system layout
   */
  private setupCombatSystem(): void {
    // Create slot machine
    this.slotMachine = new SlotMachine();
    this.slotMachine.x = 0;
    this.slotMachine.y = 150;
    this.addChild(this.slotMachine);
    
    // Create monsters trail
    this.monstersTrail = new MonstersTrail();
    this.monstersTrail.x = 0;
    this.monstersTrail.y = 0;
    this.addChild(this.monstersTrail);
    
    // Create effects layer (on top)
    this.effects = new CriticalHitEffects();
    this.addChild(this.effects);
    
    console.log('CombatSystem: Initialized slot machine vs monster combat');
  }
  
  /**
   * Perform a combat spin - spins slot machine and attacks monsters
   */
  async performCombatSpin(): Promise<{
    spinResult: SpinResult;
    combatResults: CombatResult[];
  }> {
    if (this.isInCombat || this.slotMachine.getIsSpinning()) {
      return {
        spinResult: {
          reels: [],
          isWin: false,
          winType: undefined,
          payout: 0,
        },
        combatResults: [],
      };
    }
    
    this.isInCombat = true;
    
    try {
      // Spin the slot machine
      const spinResult = await this.slotMachine.spin();
      
      // Process combat based on spin results
      const combatResults = await this.processCombatFromSpin(spinResult);
      
      // Add any combat rewards to slot machine balance
      const totalCombatCoins = combatResults.reduce((sum, result) => 
        sum + (result.rewards?.coins || 0), 0);
      
      if (totalCombatCoins > 0) {
        this.slotMachine.addCoins(totalCombatCoins);
        console.log(`Combat rewards: ${totalCombatCoins} coins added to balance`);
      }
      
      this.isInCombat = false;
      
      return {
        spinResult,
        combatResults,
      };
      
    } catch (error) {
      this.isInCombat = false;
      throw error;
    }
  }
  
  /**
   * Process combat attacks based on slot machine spin results
   */
  private async processCombatFromSpin(spinResult: SpinResult): Promise<CombatResult[]> {
    const combatResults: CombatResult[] = [];
    
    // Get weapon symbols from the spin
    const weaponSymbols = spinResult.reels
      .map(reel => reel.symbol)
      .filter(symbol => this.isWeaponSymbol(symbol));
    
    if (weaponSymbols.length === 0) {
      console.log('No weapon symbols - no combat this turn');
      return combatResults;
    }
    
    // Attack with each weapon symbol
    for (const weapon of weaponSymbols) {
      const combatResult = this.attackWithWeapon(weapon);
      if (combatResult) {
        combatResults.push(combatResult);
        
        // Show visual effects
        await this.showCombatEffects(combatResult);
        
        // Small delay between attacks for visual appeal
        if (weaponSymbols.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    
    // Bonus damage for three of a kind
    if (spinResult.isWin && weaponSymbols.length === 3 && 
        weaponSymbols.every(w => w === weaponSymbols[0])) {
      
      console.log('🎉 THREE OF A KIND BONUS ATTACK! 🎉');
      
      // Extra powerful attack
      const bonusResult = this.attackWithWeapon(weaponSymbols[0], true);
      if (bonusResult) {
        combatResults.push(bonusResult);
        await this.showCombatEffects(bonusResult, true);
      }
    }
    
    return combatResults;
  }
  
  /**
   * Attack the current monster with a specific weapon
   */
  private attackWithWeapon(weapon: SymbolType, isBonusAttack: boolean = false): CombatResult | null {
    const currentMonster = this.monstersTrail.getCurrentMonster();
    if (!currentMonster || !currentMonster.isAlive()) {
      return null;
    }
    
    console.log(`Attacking with ${weapon}${isBonusAttack ? ' (BONUS ATTACK)' : ''}`);
    
    let result = currentMonster.takeDamage(weapon);
    
    // Apply bonus attack multiplier
    if (isBonusAttack) {
      result.damage = Math.round(result.damage * 1.5);
      result.isCritical = true; // Bonus attacks are always critical
    }
    
    return result;
  }
  
  /**
   * Show visual effects for combat results
   */
  private async showCombatEffects(result: CombatResult, isBonusAttack: boolean = false): Promise<void> {
    const currentMonster = this.monstersTrail.getCurrentMonster();
    if (!currentMonster) return;
    
    const monsterX = currentMonster.x;
    const monsterY = currentMonster.y;
    
    // Show damage number
    this.effects.showDamageNumber(result.damage, monsterX + 50, monsterY - 30, result.isCritical);
    
    // Show special effects
    if (result.isCritical || isBonusAttack) {
      this.effects.showCriticalHit(monsterX, monsterY - 50);
    }
    
    if (result.isWeakness) {
      this.effects.showWeaknessHit(monsterX - 40, monsterY - 20);
    } else if (result.isResisted) {
      this.effects.showResistHit(monsterX + 40, monsterY - 20);
    }
    
    // Show monster defeat effect
    if (result.monsterDefeated) {
      this.effects.showMonsterDefeat(monsterX, monsterY);
    }
    
    // Wait for effects to be visible
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  /**
   * Check if a symbol is a weapon
   */
  private isWeaponSymbol(symbol: SymbolType): boolean {
    return [
      SymbolType.IRON_SWORD,
      SymbolType.STEEL_SWORD,
      SymbolType.SILVER_SWORD,
      SymbolType.GOLD_SWORD,
      SymbolType.CRUSADER_BLADE,
      SymbolType.WILD, // Wild can be a weapon
    ].includes(symbol);
  }
  
  /**
   * Get the slot machine instance
   */
  getSlotMachine(): SlotMachine {
    return this.slotMachine;
  }
  
  /**
   * Get the monsters trail instance
   */
  getMonstersTrail(): MonstersTrail {
    return this.monstersTrail;
  }
  
  /**
   * Get the effects instance
   */
  getEffects(): CriticalHitEffects {
    return this.effects;
  }
  
  /**
   * Check if currently in combat
   */
  getIsInCombat(): boolean {
    return this.isInCombat;
  }
  
  /**
   * Get current monster for external access
   */
  getCurrentMonster() {
    return this.monstersTrail.getCurrentMonster();
  }
  
  /**
   * Force attack current monster (for testing)
   */
  testAttackMonster(weapon: SymbolType): CombatResult | null {
    const result = this.attackWithWeapon(weapon);
    if (result) {
      this.showCombatEffects(result);
    }
    return result;
  }
  
  /**
   * Reset combat system
   */
  resetCombat(): void {
    this.monstersTrail.resetTrail();
    this.effects.clearAllEffects();
    this.isInCombat = false;
  }
} 