# Monster System Implementation

## Overview

The monster system integrates with the slot machine to create a combat-based gameplay experience. Players use weapon symbols from slot spins to attack monsters in a sequential trail, with visual effects for damage, critical hits, and special interactions.

## Architecture

### Core Components

1. **Monster Class** (`src/game/monster.ts`)
   - Individual monster with HP management
   - Visual display with emoji, name, and HP bar
   - Damage animations and state management

2. **MonstersTrail Class** (`src/game/monsters-trail.ts`)
   - Manages sequence of 5 monsters
   - Handles monster progression and positioning
   - Trail completion and reward tracking

3. **CriticalHitEffects Class** (`src/game/critical-hit-effects.ts`)
   - Visual effects for combat feedback
   - Particle systems and animations
   - Damage number displays

4. **CombatSystem Class** (`src/game/combat-system.ts`)
   - Integrates slot machine with monster combat
   - Processes weapon symbols into attacks
   - Manages combat flow and rewards

## Monster Types & Stats

| Monster | HP | Emoji | Difficulty | Coin Reward | XP Reward |
|---------|----|----|-----------|------------|----------|
| Goblin | 50 | 👺 | 1 | 25 | 10 |
| Orc Warrior | 100 | 👹 | 2 | 50 | 25 |
| Mountain Troll | 200 | 👾 | 3 | 100 | 50 |
| Ancient Dragon | 400 | 🐉 | 4 | 250 | 100 |
| Demon Lord | 666 | 😈 | 5 | 500 | 200 |

## Weapon Damage & Effectiveness

### Base Damage Values
- **Iron Sword**: 15 damage
- **Steel Sword**: 25 damage  
- **Silver Sword**: 40 damage
- **Gold Sword**: 60 damage
- **Crusader Blade**: 100 damage
- **Wild**: 35 damage (average)

### Weakness/Resistance System

**Goblin (👺)**
- Weak to: Iron Sword, Steel Sword (1.5x damage)
- Resistant to: None

**Orc Warrior (👹)**
- Weak to: Steel Sword, Silver Sword (1.5x damage)
- Resistant to: Iron Sword (0.5x damage)

**Mountain Troll (👾)**
- Weak to: Silver Sword, Gold Sword (1.5x damage)
- Resistant to: Iron Sword, Steel Sword (0.5x damage)

**Ancient Dragon (🐉)**
- Weak to: Gold Sword, Crusader Blade (1.5x damage)
- Resistant to: Iron Sword, Steel Sword, Silver Sword (0.5x damage)

**Demon Lord (😈)**
- Weak to: Crusader Blade only (1.5x damage)
- Resistant to: All other weapons (0.5x damage)

## Critical Hit System

### Base Critical Hit Chances
- **Base chance**: 10%
- **Iron Sword**: 10% (no modifier)
- **Steel Sword**: 12% (+2%)
- **Silver Sword**: 15% (+5%)
- **Gold Sword**: 20% (+10%)
- **Crusader Blade**: 30% (+20%)
- **Wild**: 25% (+15%)

### Critical Hit Effects
- **2x damage multiplier**
- **Golden flash animation**
- **Screen shake effect**
- **"CRITICAL HIT!" text display**

## Combat Flow

### 1. Slot Machine Spin
Player spins the slot machine with weapon symbols

### 2. Weapon Processing
System identifies weapon symbols from the spin result

### 3. Combat Execution
Each weapon attacks the current monster in sequence:
- Calculate critical hit chance
- Apply damage with weakness/resistance modifiers
- Show visual effects
- Update monster HP

### 4. Special Attacks
**Three of a Kind Bonus**:
- If all 3 reels show the same weapon
- Triggers an additional bonus attack
- 1.5x damage multiplier
- Always critical hit
- Extra visual effects

### 5. Monster Defeat
When monster HP reaches 0:
- Play defeat animation
- Award coins and experience
- Fade out defeated monster
- Move next monster to center position
- Continue with next monster

### 6. Trail Completion
After defeating all 5 monsters:
- Display completion message
- Show total rewards earned
- Generate new random trail
- Reset progress

## Visual Effects

### Damage Effects
- **Damage Numbers**: Float upward with size based on damage
- **Critical Hits**: Golden "CRITICAL HIT!" text with rotation
- **Weakness Hits**: Green "SUPER EFFECTIVE!" text
- **Resist Hits**: Gray "Resisted..." text

### Monster Effects
- **Active Highlighting**: Gold border and pulsing animation
- **Damage Animation**: Screen shake and color flash
- **HP Bar**: Color changes from green to red as HP decreases
- **Defeat Effect**: Particle explosion and fade out

### Combat Feedback
- **Color Coding**:
  - Gold: Critical hits
  - Green: Weakness damage
  - Gray: Resisted damage
  - Red: Standard damage

## Monster Trail Mechanics

### Trail Generation
- **5 monsters per trail**
- **Progressive difficulty**: Later monsters tend to be stronger
- **Weighted random**: Easier monsters more common
- **Balanced composition**: Mix of difficulties

### Position Management
- **Center Position**: Current active monster (larger, highlighted)
- **Trail Queue**: Remaining monsters (smaller, right side)
- **Smooth Animation**: Monsters slide to center when their turn comes

### Progress Tracking
- **Monster Counter**: "Monster 2/5" display
- **HP Display**: Shows current/max HP
- **Rewards Tracking**: Cumulative coins and XP earned

## Integration Points

### Slot Machine Connection
```typescript
// Combat system processes slot results
const { spinResult, combatResults } = await combatSystem.performCombatSpin();

// Weapon symbols trigger attacks
const weaponSymbols = spinResult.reels
  .map(reel => reel.symbol)
  .filter(symbol => isWeaponSymbol(symbol));
```

### Reward System
- **Monster rewards** added to slot machine balance
- **Combat coins** separate from slot machine payouts
- **Experience points** tracked for progression (future use)

### Event Handling
- **Keyboard Controls**: Same keys work for combat
- **Button Interface**: Spin button triggers combat
- **Visual Feedback**: All effects integrated seamlessly

## Usage Examples

### Basic Combat
```typescript
const combatSystem = new CombatSystem();
const result = await combatSystem.performCombatSpin();
console.log(`Dealt ${result.combatResults[0]?.damage} damage`);
```

### Testing Specific Attacks
```typescript
const result = combatSystem.testAttackMonster(SymbolType.CRUSADER_BLADE);
console.log(`Critical: ${result.isCritical}, Defeated: ${result.monsterDefeated}`);
```

### Accessing Components
```typescript
const currentMonster = combatSystem.getCurrentMonster();
const slotMachine = combatSystem.getSlotMachine();
const effects = combatSystem.getEffects();
```

## Performance Considerations

### Efficient Animations
- **60 FPS animations** with requestAnimationFrame equivalent
- **Cleanup on completion** prevents memory leaks
- **Effect pooling** for frequently used particles

### Memory Management
- **Monster lifecycle** properly managed with destroy()
- **Event listener cleanup** when components destroyed
- **Texture reuse** for repeated visual elements

### Mobile Optimization
- **Touch-friendly** interfaces
- **Performance scaling** based on device capabilities
- **Battery-conscious** animation frame rates

## Future Enhancements

### Gameplay Features
1. **Boss Battles**: Special powerful monsters
2. **Equipment System**: Weapon upgrades and enchantments
3. **Status Effects**: Poison, freeze, burning damage
4. **Combo System**: Chaining attacks for bonus damage

### Visual Improvements
1. **3D Models**: Replace emoji with detailed sprites
2. **Advanced Particles**: More sophisticated effect systems
3. **Sound Integration**: Combat sounds and music
4. **Animation Tweening**: Smooth interpolated movements

### Progression Systems
1. **Player Levels**: Experience-based progression
2. **Achievements**: Combat milestones and rewards
3. **Statistics**: Detailed combat analytics
4. **Leaderboards**: High score tracking

The monster system provides a solid foundation for combat gameplay while maintaining the fun slot machine mechanics. The modular design makes it easy to add new features and expand the game's complexity over time. 