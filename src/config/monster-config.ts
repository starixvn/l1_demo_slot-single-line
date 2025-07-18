import { MonsterType, MonsterConfig, CriticalHitConfig, MonsterTrailConfig, HpBarConfig } from '@/types/monster-types';
import { SymbolType } from '@/types/slot-types';

/**
 * Monster configurations with stats, weaknesses, and rewards
 */
export const MONSTER_CONFIGS: Record<MonsterType, MonsterConfig> = {
  [MonsterType.GOBLIN]: {
    type: MonsterType.GOBLIN,
    name: 'Goblin',
    maxHp: 50,
    emoji: '👺',
    color: 0x8B4513,
    difficulty: 1,
    rewards: {
      coins: 25,
      experience: 10,
    },
    weakTo: [SymbolType.IRON_SWORD, SymbolType.STEEL_SWORD],
    resistantTo: [],
  },
  
  [MonsterType.ORC]: {
    type: MonsterType.ORC,
    name: 'Orc Warrior',
    maxHp: 100,
    emoji: '👹',
    color: 0x4B0000,
    difficulty: 2,
    rewards: {
      coins: 50,
      experience: 25,
    },
    weakTo: [SymbolType.STEEL_SWORD, SymbolType.SILVER_SWORD],
    resistantTo: [SymbolType.IRON_SWORD],
  },
  
  [MonsterType.TROLL]: {
    type: MonsterType.TROLL,
    name: 'Mountain Troll',
    maxHp: 200,
    emoji: '👾',
    color: 0x2F4F2F,
    difficulty: 3,
    rewards: {
      coins: 100,
      experience: 50,
    },
    weakTo: [SymbolType.SILVER_SWORD, SymbolType.GOLD_SWORD],
    resistantTo: [SymbolType.IRON_SWORD, SymbolType.STEEL_SWORD],
  },
  
  [MonsterType.DRAGON]: {
    type: MonsterType.DRAGON,
    name: 'Ancient Dragon',
    maxHp: 400,
    emoji: '🐉',
    color: 0x8B0000,
    difficulty: 4,
    rewards: {
      coins: 250,
      experience: 100,
    },
    weakTo: [SymbolType.GOLD_SWORD, SymbolType.CRUSADER_BLADE],
    resistantTo: [SymbolType.IRON_SWORD, SymbolType.STEEL_SWORD, SymbolType.SILVER_SWORD],
  },
  
  [MonsterType.DEMON_LORD]: {
    type: MonsterType.DEMON_LORD,
    name: 'Demon Lord',
    maxHp: 666,
    emoji: '😈',
    color: 0x4B0082,
    difficulty: 5,
    rewards: {
      coins: 500,
      experience: 200,
    },
    weakTo: [SymbolType.CRUSADER_BLADE],
    resistantTo: [SymbolType.IRON_SWORD, SymbolType.STEEL_SWORD, SymbolType.SILVER_SWORD, SymbolType.GOLD_SWORD],
  },
};

/**
 * Critical hit system configuration
 */
export const CRITICAL_HIT_CONFIG: CriticalHitConfig = {
  baseChance: 10, // 10% base critical hit chance
  multiplier: 2.0, // 2x damage on critical hits
  weaponModifiers: {
    [SymbolType.IRON_SWORD]: 0, // No modifier
    [SymbolType.STEEL_SWORD]: 2, // +2% crit chance
    [SymbolType.SILVER_SWORD]: 5, // +5% crit chance
    [SymbolType.GOLD_SWORD]: 10, // +10% crit chance
    [SymbolType.CRUSADER_BLADE]: 20, // +20% crit chance
    [SymbolType.BONUS]: 0,
    [SymbolType.WILD]: 15, // Wild gets bonus crit chance
    [SymbolType.SCATTER]: 0,
  },
};

/**
 * Monster trail display configuration
 */
export const MONSTER_TRAIL_CONFIG: MonsterTrailConfig = {
  maxMonsters: 5,
  monsterSpacing: 80,
  centerPosition: { x: 0, y: -300 },
  trailStartX: -200,
  iconSize: 60,
  fadeOutDuration: 1000,
  moveAnimationDuration: 500,
};

/**
 * HP Bar visual configuration
 */
export const HP_BAR_CONFIG: HpBarConfig = {
  width: 150,
  height: 12,
  backgroundColor: 0x333333,
  healthColor: 0x00FF00,
  criticalColor: 0xFF0000,
  borderColor: 0xFFFFFF,
  criticalThreshold: 0.25, // HP bar turns red when below 25%
};

/**
 * Weapon damage values against monsters
 */
export const WEAPON_DAMAGE: Record<SymbolType, number> = {
  [SymbolType.IRON_SWORD]: 15,
  [SymbolType.STEEL_SWORD]: 25,
  [SymbolType.SILVER_SWORD]: 40,
  [SymbolType.GOLD_SWORD]: 60,
  [SymbolType.CRUSADER_BLADE]: 100,
  [SymbolType.BONUS]: 0, // Bonus symbols don't deal damage
  [SymbolType.WILD]: 35, // Wild does average damage
  [SymbolType.SCATTER]: 0,
};

/**
 * Combat calculation utilities
 */
export class CombatCalculator {
  /**
   * Calculate if an attack is a critical hit
   */
  static calculateCriticalHit(weapon: SymbolType): boolean {
    const baseChance = CRITICAL_HIT_CONFIG.baseChance;
    const weaponModifier = CRITICAL_HIT_CONFIG.weaponModifiers[weapon] || 0;
    const totalChance = baseChance + weaponModifier;
    
    const roll = Math.random() * 100;
    return roll < totalChance;
  }
  
  /**
   * Calculate damage dealt by a weapon to a monster
   */
  static calculateDamage(
    weapon: SymbolType, 
    monster: MonsterType, 
    isCritical: boolean = false
  ): {
    damage: number;
    isWeakness: boolean;
    isResisted: boolean;
  } {
    const baseDamage = WEAPON_DAMAGE[weapon] || 0;
    const monsterConfig = MONSTER_CONFIGS[monster];
    
    let multiplier = 1.0;
    let isWeakness = false;
    let isResisted = false;
    
    // Check for weakness (extra damage)
    if (monsterConfig.weakTo?.includes(weapon)) {
      multiplier *= 1.5; // 50% extra damage
      isWeakness = true;
    }
    
    // Check for resistance (reduced damage)
    if (monsterConfig.resistantTo?.includes(weapon)) {
      multiplier *= 0.5; // 50% reduced damage
      isResisted = true;
    }
    
    // Apply critical hit multiplier
    if (isCritical) {
      multiplier *= CRITICAL_HIT_CONFIG.multiplier;
    }
    
    const finalDamage = Math.round(baseDamage * multiplier);
    
    return {
      damage: finalDamage,
      isWeakness,
      isResisted,
    };
  }
  
  /**
   * Get critical hit chance for a weapon
   */
  static getCriticalChance(weapon: SymbolType): number {
    const baseChance = CRITICAL_HIT_CONFIG.baseChance;
    const weaponModifier = CRITICAL_HIT_CONFIG.weaponModifiers[weapon] || 0;
    return Math.min(100, baseChance + weaponModifier);
  }
}

/**
 * Generate a random monster trail
 */
export class MonsterGenerator {
  private static monsterPool: MonsterType[] = [];
  
  /**
   * Initialize monster pool with weighted distribution
   */
  static initialize(): void {
    this.monsterPool = [];
    
    // Add monsters to pool based on difficulty (easier monsters more common)
    Object.values(MONSTER_CONFIGS).forEach(config => {
      const weight = 6 - config.difficulty; // Difficulty 1 = 5 weight, Difficulty 5 = 1 weight
      for (let i = 0; i < weight; i++) {
        this.monsterPool.push(config.type);
      }
    });
    
    console.log(`MonsterGenerator: Initialized with ${this.monsterPool.length} weighted monsters`);
  }
  
  /**
   * Generate a random monster
   */
  static generateMonster(): MonsterType {
    if (this.monsterPool.length === 0) {
      this.initialize();
    }
    
    const randomIndex = Math.floor(Math.random() * this.monsterPool.length);
    return this.monsterPool[randomIndex];
  }
  
  /**
   * Generate a monster trail with increasing difficulty
   */
  static generateMonsterTrail(count: number = 5): MonsterType[] {
    const trail: MonsterType[] = [];
    
    for (let i = 0; i < count; i++) {
      // Bias towards harder monsters later in the trail
      const difficultyBias = Math.floor((i / count) * 3) + 1; // 1-4 difficulty bias
      const availableMonsters = Object.values(MonsterType).filter(type => {
        const config = MONSTER_CONFIGS[type];
        return config.difficulty <= difficultyBias + 2; // Allow some variance
      });
      
      const randomMonster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
      trail.push(randomMonster);
    }
    
    return trail;
  }
} 