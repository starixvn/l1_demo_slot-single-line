import { Container } from 'pixi.js';
import { SlotMachine } from './slot-machine';
import { MonstersTrail } from './monsters-trail';
import { CriticalHitEffects } from './critical-hit-effects';
import { SymbolType, SpinResult, GameState } from '@/types/slot-types';
import { CombatResult } from '@/types/monster-types';
import { MonsterGenerator } from '@/config/monster-config';
import { GameLoopManager } from '@/systems/game-loop-manager';

/**
 * Combat system that connects slot machine results to monster attacks
 */
export class CombatSystem extends Container {
  private slotMachine!: SlotMachine;
  private monstersTrail!: MonstersTrail;
  private effects!: CriticalHitEffects;
  private gameLoopManager: GameLoopManager;

  constructor() {
    super();
    
    this.gameLoopManager = GameLoopManager.getInstance();
    
    this.setupCombatSystem();
    this.setupGameLoopListeners();
    
    // Initialize monster generator
    MonsterGenerator.initialize();
    
    // Start the game loop
    this.gameLoopManager.startGameLoop();
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
   * Set up game loop event listeners
   */
  private setupGameLoopListeners(): void {
    this.gameLoopManager.on('stateChanged', (newState: GameState, oldState: GameState) => {
      console.log(`CombatSystem: State changed from ${oldState} to ${newState}`);
      
      // Update slot machine respin display when state changes
      const respinInfo = this.gameLoopManager.getCurrentRespinInfo();
      this.slotMachine.updateRespinDisplay(respinInfo);
    });
    
    this.gameLoopManager.on('respinActivated', (respinInfo: any) => {
      console.log('CombatSystem: Respins activated!', respinInfo);
      this.slotMachine.updateRespinDisplay(respinInfo);
    });
    
    this.gameLoopManager.on('respinCompleted', (respinInfo: any) => {
      console.log('CombatSystem: Respins completed!', respinInfo);
      this.slotMachine.updateRespinDisplay(null);
    });
    
    this.gameLoopManager.on('gameError', (error: any) => {
      console.error('CombatSystem: Game loop error:', error);
    });
  }
  
  /**
   * Perform a combat spin - spins slot machine and attacks monsters
   */
  async performCombatSpin(): Promise<{
    spinResult: SpinResult;
    combatResults: CombatResult[];
  }> {
    console.log('CombatSystem: performCombatSpin() called');
    
    if (!this.gameLoopManager.canSpin()) {
      console.log('CombatSystem: Cannot spin, gameLoopManager.canSpin() returned false');
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
    
    // Set state to spinning
    console.log('CombatSystem: Setting state to SPINNING');
    this.gameLoopManager.setState(GameState.SPINNING);
    
    try {
      // Determine if this is a respin or regular spin
      const isRespin = this.gameLoopManager.isInRespinMode();
      console.log(`CombatSystem: Calling slot machine ${isRespin ? 'respin' : 'spin'}()`);
      
      const spinResult = isRespin ? 
        await this.slotMachine.respin() : 
        await this.slotMachine.spin();
        
      console.log('CombatSystem: Slot machine spin completed, result:', spinResult);
      
      // Process combat based on spin results
      const combatResults = await this.processCombatFromSpin(spinResult);
      
      // Add any combat rewards to slot machine balance
      const totalCombatCoins = combatResults.reduce((sum, result) => 
        sum + (result.rewards?.coins || 0), 0);
      
      if (totalCombatCoins > 0) {
        this.slotMachine.addCoins(totalCombatCoins);
        this.gameLoopManager.updateBalance(totalCombatCoins);
        console.log(`Combat rewards: ${totalCombatCoins} coins added to balance`);
      }
      
      // Let game loop manager handle the state transitions
      if (isRespin) {
        await this.gameLoopManager.processRespin(spinResult);
      } else {
        await this.gameLoopManager.processSpinResult(spinResult);
      }
      
      console.log('CombatSystem: performCombatSpin() completing successfully');
      
      return {
        spinResult,
        combatResults,
      };
      
    } catch (error) {
      console.error('CombatSystem: Error in combat spin:', error);
      this.gameLoopManager.setState(GameState.IDLE);
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
      SymbolType.BRONZE_AXE,
      SymbolType.SILVER_SWORD,
      SymbolType.IRON_AXE,
      SymbolType.CRUSADER_BLADE,
      SymbolType.WAR_HAMMER,
      SymbolType.MAGIC_STAFF,
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
    const currentState = this.gameLoopManager.getCurrentState();
    return currentState === GameState.SPINNING || 
           currentState === GameState.ATTACKING || 
           currentState === GameState.RESPINNING;
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
    this.gameLoopManager.resetGame();
    this.slotMachine.updateRespinDisplay(null);
  }
} 