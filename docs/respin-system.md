# Respin Logic and Game Loop System

## Overview

The respin system is a core gameplay mechanic that provides players with additional spins based on specific symbol combinations. This document explains the comprehensive respin logic, game state management, and integration with the combat system.

## Core Components

### 1. Game State Management (`GameLoopManager`)

The game uses a finite state machine to manage different phases of gameplay:

```typescript
export enum GameState {
  IDLE = 'idle',                    // Ready for player input
  SPINNING = 'spinning',            // Reels are spinning
  ATTACKING = 'attacking',          // Combat phase
  RESPINNING = 'respinning',        // Respin mode active
  RESPIN_EVALUATING = 'respin_evaluating', // Checking for respin triggers
  GAME_OVER = 'game_over',          // Insufficient balance
}
```

#### State Transitions

```
IDLE → SPINNING → ATTACKING → RESPIN_EVALUATING → [RESPINNING|IDLE]
                                    ↓
                              RESPINNING → ATTACKING → RESPIN_EVALUATING
```

### 2. Respin Logic (`RespinManager`)

#### Activation Conditions

Respins are triggered by **active symbols** (weapon symbols) appearing on the reels:

- **1 active symbol** = **1 respin**
- **3 active symbols** = **5 respins**

#### Active Symbols

The following symbols can trigger respins:
- Iron Sword
- Steel Sword  
- Silver Sword
- Gold Sword
- Crusader Blade

Special symbols (Bonus, Wild, Scatter) do **not** trigger respins.

#### Respin Chaining

Respins can chain indefinitely (up to a safety limit of 10 chains):

1. Player gets initial respin(s) from a spin
2. During respin, if more active symbols appear, additional respins are granted
3. Process continues until no more active symbols appear or chain limit is reached

## Implementation Details

### RespinManager Class

```typescript
// Evaluate if a spin should trigger respins
const activation = respinManager.evaluateRespinActivation(spinResult);

// Create respin info from activation
const respinInfo = respinManager.createRespinInfo(activation);

// Update respin info after each respin
const updatedInfo = respinManager.updateRespinInfo(respinInfo, newSpinResult);
```

### GameLoopManager Integration

```typescript
// Process regular spin result
await gameLoopManager.processSpinResult(spinResult);

// Process respin result
await gameLoopManager.processRespin(spinResult);

// Check if player can spin
const canSpin = gameLoopManager.canSpin();
```

## Game Flow Examples

### Example 1: Single Respin Activation

```
1. Player spins: [Iron Sword, Bonus, Steel Sword] 
   → 1 active symbol detected
   → 1 respin granted
   → State: RESPINNING

2. Player respins: [Wild, Gold Sword, Silver Sword]
   → No respin activation (only 2 active symbols)
   → State: IDLE
```

### Example 2: Multiple Respins with Chaining

```
1. Player spins: [Iron Sword, Steel Sword, Silver Sword]
   → 3 active symbols detected
   → 5 respins granted
   → State: RESPINNING

2. Respin 1: [Gold Sword, Bonus, Wild]
   → 1 active symbol detected
   → 1 additional respin granted (6 total remaining)
   → Chain count: 1

3. Respin 2: [Steel Sword, Steel Sword, Steel Sword]
   → 3 active symbols detected
   → 5 additional respins granted (10 total remaining)
   → Chain count: 2

4. Continue until no more active symbols or respins exhausted
```

### Example 3: No Respin Activation

```
1. Player spins: [Bonus, Wild, Scatter]
   → 0 active symbols detected
   → No respins granted
   → State: IDLE
```

## Visual Feedback

### Status Display

The game provides real-time feedback showing:
- Current game state
- Spin count and total respins used
- Active respin information
- Balance and consecutive wins

### Button States

- **SPIN button** becomes **RESPIN button** when in respin mode
- Button disabled when player cannot spin (insufficient balance, wrong state)
- Visual indicators (color changes, alpha) show button availability

### Respin Information

```
🔄 RESPINS ACTIVE! 🔄
Remaining: 3
Triggered by: Iron Sword, Steel Sword
⛓️ Chain: 1
```

## Combat Integration

### Spin vs Respin Differences

- **Regular Spin**: Deducts bet amount from balance
- **Respin**: No bet deduction, only adds payout rewards
- **Combat**: Both trigger monster attacks based on weapon symbols

### Balance Management

- Combat rewards are added to both slot machine and game loop manager
- Game loop manager tracks balance for game over conditions
- Respins don't cost additional coins

## Technical Implementation

### Key Files

1. **`src/systems/respin-manager.ts`** - Core respin logic
2. **`src/systems/game-loop-manager.ts`** - State management and flow control
3. **`src/game/slot-machine.ts`** - Updated with respin() method
4. **`src/game/combat-system.ts`** - Integrated with game loop
5. **`src/game/game-controller.ts`** - UI updates and state display

### Event System

The game uses an event-driven architecture:

```typescript
gameLoopManager.on('stateChanged', (newState, oldState) => {
  // Update UI elements
});

gameLoopManager.on('respinActivated', (respinInfo) => {
  // Show respin notifications
});

gameLoopManager.on('respinCompleted', (respinInfo) => {
  // Clear respin displays
});
```

## Usage Examples

### Starting a Spin/Respin

```typescript
// Game controller handles this automatically
if (gameLoopManager.canSpin()) {
  await combatSystem.performCombatSpin();
}
```

### Checking Respin Status

```typescript
const respinInfo = gameLoopManager.getCurrentRespinInfo();
if (respinInfo?.isRespinActive) {
  console.log(`${respinInfo.respinsRemaining} respins remaining`);
}
```

### Resetting Game State

```typescript
gameLoopManager.resetGame(); // Clears all state including respins
combatSystem.resetCombat(); // Resets monsters and effects
```

## Configuration

### Respin Rules

Modify the rules in `RespinManager`:

```typescript
private readonly RESPIN_RULES: Map<number, number> = new Map([
  [1, 1], // 1 active symbol = 1 respin
  [3, 5], // 3 active symbols = 5 respins
  // Add more rules as needed
]);
```

### Active Symbols

Modify which symbols trigger respins:

```typescript
private readonly ACTIVE_SYMBOLS: Set<SymbolType> = new Set([
  SymbolType.IRON_SWORD,
  SymbolType.STEEL_SWORD,
  // Add or remove symbols as needed
]);
```

## Safety Features

1. **Chain Limit**: Maximum 10 respin chains to prevent infinite loops
2. **Balance Checks**: Game over state when balance reaches zero
3. **State Validation**: Invalid state transitions are blocked
4. **Error Handling**: Comprehensive error catching and state recovery

## Performance Considerations

- Singleton pattern for managers reduces memory usage
- Event-driven updates minimize unnecessary calculations
- State machines provide predictable performance characteristics
- Efficient symbol lookups using Sets and Maps

## Future Enhancements

Potential improvements to consider:

1. **Animated Transitions**: Visual effects between states
2. **Sound Integration**: Audio feedback for respins and state changes
3. **Multiplier Systems**: Bonus multipliers during respin chains
4. **Achievement System**: Track respin statistics and chains
5. **Save/Load**: Persist respin state between sessions 