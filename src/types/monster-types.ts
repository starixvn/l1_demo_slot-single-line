import { SymbolType } from './slot-types';

/**
 * Monster types with different difficulties and HP ranges
 */
export enum MonsterType {
  GRUMBLE_GREMLIN = 'grumble_gremlin',
  VENOM = 'venom',
  MUMMY = 'mummy',
  FIERCE_HELLHOUND = 'fierce_hellhound',
  // Legacy monsters for compatibility
  GOBLIN = 'goblin',
  ORC = 'orc',
  TROLL = 'troll',
  DRAGON = 'dragon',
  DEMON_LORD = 'demon_lord',
}

/**
 * Monster configuration with stats and display properties
 */
export interface MonsterConfig {
  type: MonsterType;
  name: string;
  minHp: number; // Minimum HP for random range
  maxHp: number; // Maximum HP for random range
  imagePath?: string; // Path to monster image
  emoji?: string; // Fallback emoji if image not available
  color: number;
  difficulty: number; // 1-5 scale
  rewards: {
    coins: number;
    experience: number;
  };
  weakTo?: SymbolType[]; // Weapons that deal extra damage
  resistantTo?: SymbolType[]; // Weapons that deal reduced damage
}

/**
 * Individual monster state
 */
export interface MonsterState {
  type: MonsterType;
  currentHp: number;
  maxHp: number;
  isAlive: boolean;
  position: {
    x: number;
    y: number;
  };
  isActive: boolean; // Currently being attacked
  isFading: boolean; // In defeat animation
}

/**
 * Combat result information
 */
export interface CombatResult {
  damage: number;
  isCritical: boolean;
  isWeakness: boolean; // Weapon was effective against monster
  isResisted: boolean; // Weapon was resisted by monster
  monsterDefeated: boolean;
  remainingHp: number;
  rewards?: {
    coins: number;
    experience: number;
  };
}

/**
 * Critical hit configuration
 */
export interface CriticalHitConfig {
  baseChance: number; // Base critical hit percentage (0-100)
  multiplier: number; // Damage multiplier for critical hits
  weaponModifiers: Record<SymbolType, number>; // Per-weapon crit chance modifiers
}

/**
 * Monster trail configuration
 */
export interface MonsterTrailConfig {
  maxMonsters: number;
  monsterSpacing: number;
  centerPosition: { x: number; y: number };
  trailStartX: number;
  iconSize: number;
  fadeOutDuration: number;
  moveAnimationDuration: number;
}

/**
 * HP Bar configuration
 */
export interface HpBarConfig {
  width: number;
  height: number;
  backgroundColor: number;
  healthColor: number;
  criticalColor: number; // Color when HP is low
  borderColor: number;
  criticalThreshold: number; // HP percentage when bar turns critical color
}

/**
 * Visual effect types for combat
 */
export enum EffectType {
  CRITICAL_HIT = 'critical_hit',
  WEAKNESS_HIT = 'weakness_hit',
  RESIST_HIT = 'resist_hit',
  MONSTER_DEFEAT = 'monster_defeat',
  HEALING = 'healing',
}

/**
 * Visual effect configuration
 */
export interface EffectConfig {
  type: EffectType;
  duration: number;
  color: number;
  scale: number;
  text?: string;
  particles?: boolean;
} 