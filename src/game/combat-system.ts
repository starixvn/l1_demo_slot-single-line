import { Container } from 'pixi.js';
import { SlotMachine } from './slot-machine';
import { MonstersTrail } from './monsters-trail';
import { CriticalHitEffects } from './critical-hit-effects';
import { SymbolType, SpinResult, GameState } from '@/types/slot-types';
import { CombatResult, MonsterType } from '@/types/monster-types';
import { MonsterGenerator } from '@/config/monster-config';
import { GameLoopManager } from '@/systems/game-loop-manager';
import { GlobalPlayerState } from '@/config/game-globals';
import { SymbolGenerator } from '@/config/symbol-config';

/**
 * Layout configuration for responsive positioning
 */
interface LayoutConfig {
  monsterAreaY: number;
  weaponAreaY: number;
  canvasWidth: number;
  canvasHeight: number;
}

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
   * Set up the combat system layout with default positioning
   */
  private setupCombatSystem(): void {
    // Create slot machine
    this.slotMachine = new SlotMachine();
    this.addChild(this.slotMachine);
    
    // Create monsters trail
    this.monstersTrail = new MonstersTrail();
    this.addChild(this.monstersTrail);
    
    // Create effects layer (on top)
    this.effects = new CriticalHitEffects();
    this.addChild(this.effects);
    
    console.log('CombatSystem: Initialized slot machine vs monster combat');
  }

  /**
   * Update layout positioning based on responsive design requirements
   */
  public updateLayout(config: LayoutConfig): void {
    const { monsterAreaY, weaponAreaY, canvasWidth, canvasHeight } = config;
    
    // Position monster trails in the top 30% area
    this.monstersTrail.x = 0; // Centered horizontally
    this.monstersTrail.y = monsterAreaY;
    
    // Update monsters trail layout for the new area
    this.monstersTrail.updateAreaLayout({
      areaHeight: canvasHeight * 0.30,
      areaWidth: canvasWidth * 0.8, // Use 80% of width for content
      centerX: 0,
      topY: 0
    });
    
    // Position slot machine in the weapon area (40% of canvas height)
    this.slotMachine.x = 0; // Centered horizontally
    this.slotMachine.y = weaponAreaY;
    
    // Update slot machine layout for the new area
    this.slotMachine.updateAreaLayout({
      areaHeight: canvasHeight * 0.40,
      areaWidth: canvasWidth * 0.8, // Use 80% of width for content
      centerX: 0,
      topY: 0
    });
    
    // Effects layer follows the combat areas
    this.effects.x = 0;
    this.effects.y = monsterAreaY;
    
    console.log('CombatSystem: Layout updated for responsive design', {
      monsterAreaY,
      weaponAreaY,
      canvasWidth,
      canvasHeight
    });
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
    
    // Attack monster with all weapon symbols at once
    const attackResults = this.monstersTrail.attackMonster(weaponSymbols);
    combatResults.push(...attackResults);
    
    // Track defeated monsters for XP calculation
    const defeatedMonsters: Array<{ type: MonsterType; wasBoss?: boolean }> = [];
    let monsterWasDefeatedThisSpin = false;
    
    for (const result of attackResults) {
      // Show visual effects for each attack
      await this.showCombatEffects(result);
      
      // Track defeated monsters (only count once per spin)
      if (result.monsterDefeated && !monsterWasDefeatedThisSpin) {
        const currentMonster = this.monstersTrail.getCurrentMonster();
        if (currentMonster) {
          const monsterType = currentMonster.getState().type;
          defeatedMonsters.push({
            type: monsterType,
            wasBoss: GlobalPlayerState.isBossMonster(monsterType)
          });
          monsterWasDefeatedThisSpin = true;
          console.log(`🎯 Monster defeated: ${monsterType} (XP will be awarded)`);
        }
      }
      
      // Small delay between attacks for visual appeal
      if (attackResults.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Bonus damage for three of a kind
    if (spinResult.isWin && weaponSymbols.length === 3 && 
        weaponSymbols.every(w => w === weaponSymbols[0])) {
      
      console.log('🎉 THREE OF A KIND BONUS ATTACK! 🎉');
      
      // Extra powerful attack - attack again with the same weapon
      const bonusResults = this.monstersTrail.attackMonster([weaponSymbols[0]]);
      if (bonusResults.length > 0) {
        const bonusResult = bonusResults[0];
        // Apply bonus attack multiplier
        bonusResult.damage = Math.round(bonusResult.damage * 1.5);
        bonusResult.isCritical = true; // Bonus attacks are always critical
        
        // Track bonus defeated monsters (only if not already defeated this spin)
        if (bonusResult.monsterDefeated && !monsterWasDefeatedThisSpin) {
          const currentMonster = this.monstersTrail.getCurrentMonster();
          if (currentMonster) {
            const monsterType = currentMonster.getState().type;
            defeatedMonsters.push({
              type: monsterType,
              wasBoss: GlobalPlayerState.isBossMonster(monsterType)
            });
            monsterWasDefeatedThisSpin = true;
            console.log(`🎯 Bonus attack defeated monster: ${monsterType} (XP will be awarded)`);
          }
        }
        
        combatResults.push(bonusResult);
        await this.showCombatEffects(bonusResult, true);
      }
    }
    
    // Apply global XP gain logic after combat
    await this.applySpinXPGain(defeatedMonsters);
    
    return combatResults;
  }

  /**
   * Apply XP gain logic after a spin with bet scaling
   */
  private async applySpinXPGain(defeatedMonsters: Array<{ type: MonsterType; wasBoss?: boolean }>): Promise<void> {
    // Get current bet from slot machine
    const currentBet = this.slotMachine.getCurrentBet();
    
    // Apply global XP gain logic
    const xpGained = GlobalPlayerState.addSpinXP(currentBet, defeatedMonsters);
    
    // Show XP gain effect
    if (xpGained > 0) {
      const currentMonster = this.monstersTrail.getCurrentMonster();
      if (currentMonster) {
        this.effects.showXpGain(xpGained, currentMonster.x, currentMonster.y - 150);
      } else {
        // Show at center if no monster
        this.effects.showXpGain(xpGained, 0, -150);
      }
    }
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
   * Check if a symbol is a weapon (any symbol with damage value > 0)
   */
  private isWeaponSymbol(symbol: SymbolType): boolean {
    const symbolConfig = SymbolGenerator.getSymbolConfig(symbol);
    return symbolConfig && symbolConfig.value > 0;
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
  async testAttackMonster(weapon: SymbolType): Promise<CombatResult | null> {
    const results = this.monstersTrail.attackMonster([weapon]);
    if (results.length > 0) {
      const result = results[0];
      await this.showCombatEffects(result);
      return result;
    }
    return null;
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