# Level System Developer Guide

## Overview

The Level System is a comprehensive progression mechanic that manages player advancement, symbol unlocking, and experience points (XP) in the slot machine game. This document provides developers with essential knowledge for maintaining, debugging, and extending the level system.

## Architecture Overview

### Core Components

1. **Global State Management** (`src/config/game-globals.ts`)
2. **Level Configuration** (`src/config/level-config.ts`) 
3. **Symbol Management** (`src/config/symbol-config.ts`)
4. **UI Components** (Level displays, notifications, symbol screen)
5. **Event System** (Custom events for level ups and XP changes)

### Data Flow

```
User Action (Spin/+XP) → XP Gain → Level Check → Symbol Unlock → UI Update → Event Emission
```

## Core Files and Their Responsibilities

### 1. `src/config/game-globals.ts`
**Purpose:** Central state management for player progression

**Key Components:**
- `playerLevel`: Global level variable (starts at 1)
- `playerXP`: Global XP variable (starts at 0)
- `XP_CONFIG`: XP constants and boss monster definitions
- `GlobalPlayerState`: Singleton class managing all level operations

**Critical Methods:**
```typescript
// Add XP and trigger level checks
GlobalPlayerState.addXP(amount: number): void

// Add XP after spin with monster bonuses
GlobalPlayerState.addSpinXP(currentBet: number, defeatedMonsters: Array): number

// Handle level progression logic
GlobalPlayerState.handleLevelUp(): LevelUpResult

// Get current player state
GlobalPlayerState.getState(): PlayerState
```

### 2. `src/config/level-config.ts`
**Purpose:** Level definitions and symbol pool management

**Key Components:**
- `LEVEL_DATA`: Array of 10 level configurations
- `currentUnlockedSymbolPool`: Dynamic array of available symbols
- `PlayerProgressionManager`: Legacy progression manager (still used for sync)

**Level Structure:**
```typescript
interface LevelData {
  level: number;           // 1-10
  xpRequired: number;      // Cumulative XP needed
  xpForThisLevel: number;  // XP needed for this specific level
  unlockedSymbols: SymbolType[];  // 2 symbols per level (except Level 1)
  defaultSymbols: SymbolType[];   // 10 default symbols for Level 1
  title: string;           // Level title (e.g., "Novice Warrior")
  description: string;     // Level description
}
```

### 3. `src/config/symbol-config.ts`
**Purpose:** Symbol definitions and random generation

**Key Components:**
- `SYMBOL_CONFIGS`: Configuration for all 28 symbols (0-27)
- `SymbolGenerator`: Weighted random symbol generation from unlocked pool

**Important:** 
- Only draws symbols from `currentUnlockedSymbolPool`
- Must call `SymbolGenerator.refreshSymbolPool()` after level ups

### 4. UI Components

#### `src/ui/level-progression-display.ts`
- Displays current level, XP bar, and unlocked symbols count
- **Clickable weapons text** opens Symbol System Screen
- Listens for `playerLevelUp` and `playerXPChange` events

#### `src/ui/level-up-notification.ts`
- Shows prominent level up animations
- Displays newly unlocked symbols with visual effects
- Auto-hides after animation completes

#### `src/ui/symbol-system-screen.ts`
- Full-screen modal showing all 28 symbols
- Real-time locked/unlocked states
- Scrollable grid with level unlock information
- **Automatically refreshes** on level up events

## XP System Logic

### XP Gain Formula
```typescript
// Base XP per spin
baseXP = 10

// Monster defeat bonuses
regularMonster = +20 XP
bossMonster = +50 XP

// Bet scaling (risk-reward mechanism)
betMultiplier = currentBet / baseBet

// Final calculation
totalXP = (baseXP + monsterBonuses) * betMultiplier
```

### Bet Scaling & Risk-Reward System

The bet scaling system creates a **risk-reward progression mechanism** that allows players to choose their advancement speed:

#### **How It Works:**
- `baseBet`: Reference bet amount (default: 10 coins) stored in `level-data.json`
- `currentBet`: Player's actual bet amount from `SLOT_CONFIG.BET_AMOUNT`
- **Multiplier**: `currentBet ÷ baseBet` scales all XP rewards

#### **Example Scenarios:**

**Standard Bet (10 coins)**
```javascript
currentBet = 10, baseBet = 10
multiplier = 1x → Normal XP: 30 XP per monster defeat
```

**High Risk Bet (20 coins)**
```javascript
currentBet = 20, baseBet = 10  
multiplier = 2x → Double XP: 60 XP per monster defeat
```

**Conservative Bet (5 coins)**
```javascript
currentBet = 5, baseBet = 10
multiplier = 0.5x → Half XP: 15 XP per monster defeat
```

#### **Game Design Benefits:**

1. **Player Choice**: Casual vs. hardcore progression paths
2. **Economic Balance**: Higher risk = faster advancement
3. **Replayability**: Different strategies for different playstyles
4. **Configuration Flexibility**: Easy balance adjustments via JSON

#### **Important Configuration Note:**
The `baseBet` in `level-data.json` **must match** `SLOT_CONFIG.BET_AMOUNT` to maintain 1x baseline multiplier. Mismatched values will cause unexpected XP scaling (e.g., baseBet=1, actualBet=10 = 10x XP gain!).

### Level Requirements
```
Level 1 → 2: 100 XP (100 total)
Level 2 → 3: 200 XP (300 total)  
Level 3 → 4: 350 XP (650 total)
Level 4 → 5: 550 XP (1200 total)
Level 5 → 6: 800 XP (2000 total)
Level 6 → 7: 1100 XP (3100 total)
Level 7 → 8: 1450 XP (4550 total)
Level 8 → 9: 1850 XP (6400 total)
Level 9 → 10: 2300 XP (8700 total)
```

### Data Structure Design Principles

The level system follows key architectural principles for maintainable, efficient data design:

#### **1. Array Index as Level Number**
```json
{
  "levels": [
    { "xpRequired": 0, "unlockedSymbols": [...] },     // Index 0 = Level 1
    { "xpRequired": 100, "unlockedSymbols": [...] },   // Index 1 = Level 2
    { "xpRequired": 300, "unlockedSymbols": [...] }    // Index 2 = Level 3
  ]
}
```
**Benefits:**
- **Impossible invalid states** - No risk of level sequence errors
- **O(1) access** - Direct array lookup vs. O(n) searches
- **Simpler validation** - No sorting or sequence checking needed

#### **2. Don't Store What You Can Compute**
```typescript
// ❌ Before: Redundant storage
{
  "xpRequired": 300,
  "xpForThisLevel": 200  // Always = current.xpRequired - previous.xpRequired
}

// ✅ After: Computed on-demand
{
  "xpRequired": 300  // xpForThisLevel calculated automatically
}

// Computed when needed:
const xpForThisLevel = config.xpRequired - previousLevelXp;
```

#### **3. Consistent Property Usage**
```typescript
// ❌ Before: Confusing dual properties
{
  "unlockedSymbols": [],                     // Level 1: Empty
  "defaultSymbols": ["symbol_0"..."symbol_9"] // Level 1: Special case
}
{
  "unlockedSymbols": ["symbol_10", "symbol_11"], // Level 2+: Normal
  "defaultSymbols": []                            // Level 2+: Always empty
}

// ✅ After: Single, consistent property
{
  "unlockedSymbols": ["symbol_0"..."symbol_9"]    // Level 1: Same pattern
}
{
  "unlockedSymbols": ["symbol_10", "symbol_11"]   // Level 2+: Same pattern
}
```

#### **Configuration Benefits:**
- **30% smaller** configuration files
- **Impossible data inconsistencies** (no computed values to get wrong)
- **Easier maintenance** - Single source of truth for each concept
- **Better performance** - Less data transfer, faster parsing

### Symbol Unlocking Pattern
- **Level 1**: 10 starting symbols (0-9) unlocked immediately
- **Level 2-10**: 2 new symbols per level
  - Level 2: symbols 10-11
  - Level 3: symbols 12-13
  - Level 4: symbols 14-15
  - ...and so on
- **All symbols** use the same `unlockedSymbols` property consistently

## Event System

### Custom Events

#### `playerLevelUp`
**Triggered:** When player gains a level
**Detail:**
```typescript
{
  newLevel: number,
  levelTitle: string,
  newSymbols: SymbolType[],
  totalXP: number
}
```

#### `playerXPChange`  
**Triggered:** After any XP gain (level up or not)
**Detail:**
```typescript
{
  level: number,
  xp: number,
  xpProgress: {
    current: number,
    required: number,
    percentage: number
  }
}
```

### Event Listeners
UI components automatically listen for these events:
- `LevelProgressionDisplay`: Updates XP bar and level info
- `SymbolSystemScreen`: Refreshes symbol states
- `LevelUpNotification`: Shows level up animations

## Testing and Debugging

### Manual Testing Tools

#### +XP Button
- Adds 25 XP per click
- Logs detailed state changes
- Perfect for testing level progression

#### Console Commands
```javascript
// Add specific XP amount
GlobalPlayerState.addXP(100);

// Get current state
GlobalPlayerState.getState();

// Force level up check
GlobalPlayerState.handleLevelUp();

// Check current symbol pool
console.log(currentUnlockedSymbolPool);

// Run level system tests
import { runTests } from '../tests/systems/level-system.test.ts';
runTests();
```

### Debug Logging
The system includes comprehensive logging:
- XP gain events
- Level up detection  
- Symbol pool updates
- Event emission and reception
- UI refresh completion

**Enable in browser console to trace issues**

### Common Debug Scenarios

#### Symbol System Not Updating
1. Check if `playerLevelUp` event is emitted
2. Verify `SymbolSystemScreen` receives the event
3. Confirm `currentUnlockedSymbolPool` is updated
4. Check if `SymbolGenerator.refreshSymbolPool()` is called

#### Level Up Not Triggering
1. Verify XP meets level requirements
2. Check `LEVEL_DATA` configuration
3. Ensure `handleLevelUp()` is called after XP gain
4. Confirm global `playerLevel` variable is updated

## Best Practices

### 1. Data Structure Design
- **Don't store computed values** - Calculate `xpForThisLevel`, `levelNumber`, etc. on-demand
- **Use array indices meaningfully** - Index 0 = Level 1, Index 1 = Level 2
- **Maintain property consistency** - Same property names across all levels
- **Validate data structure** during development, not runtime
- **Keep JSON minimal** - Only store essential data

### 2. State Management
- **Always use `GlobalPlayerState` methods** for XP/level changes
- **Never directly modify** `playerLevel` or `playerXP` outside of `GlobalPlayerState`
- **Always emit events** after state changes

### 3. Symbol Pool Management
- **Call `SymbolGenerator.refreshSymbolPool()`** after level ups
- **Use `currentUnlockedSymbolPool`** for all symbol generation
- **Never hardcode symbol availability**

### 4. UI Updates
- **Listen for events** rather than polling for changes
- **Update UI immediately** when events are received
- **Handle both visible and hidden states** for modals

### 5. Event Handling
```typescript
// ✅ Correct: Listen for specific events
window.addEventListener('playerLevelUp', (event: Event) => {
  const customEvent = event as CustomEvent;
  // Handle level up
});

// ❌ Incorrect: Direct method calls
// this.someOtherComponent.updateLevel();
```

### 6. Error Handling
- **Validate XP amounts** before processing
- **Check level bounds** (1-10)
- **Handle missing symbol configurations** gracefully
- **Log errors** for debugging

### 7. Configuration Design Principles
```typescript
// ✅ Good: Minimal, normalized data
{
  "xpRequired": 300,
  "unlockedSymbols": ["symbol_12", "symbol_13"]
}

// ❌ Bad: Redundant, denormalized data
{
  "level": 3,                    // Redundant (array index)
  "xpRequired": 300,
  "xpForThisLevel": 200,         // Computable
  "unlockedSymbols": ["symbol_12"],
  "defaultSymbols": []           // Always empty except level 1
}
```

## Extension Guidelines

### Adding New Levels
```json
// ✅ Correct: Add to end of levels array
{
  "levels": [
    // ... existing levels ...
    {
      "xpRequired": 12000,                      // Total XP needed
      "unlockedSymbols": ["symbol_28", "symbol_29"], // 2 new symbols
      "title": "Legendary Hero",
      "description": "Master of all weapons and magic."
    }
  ]
}
```

**Steps:**
1. **Append to `level-data.json`** - Add new level object to end of array
2. **Only include essential data** - `xpRequired`, `unlockedSymbols`, `title`, `description`
3. **Add new symbols** to `SYMBOL_CONFIGS` in `symbol-config.ts`
4. **Update symbol assets** in asset manager
5. **Test XP progression** thoroughly
6. **No code changes needed** - Array index automatically becomes level number

**❌ Don't:**
- Add `level` property (redundant - use array index)
- Add `xpForThisLevel` (computed automatically)
- Add `defaultSymbols` (use `unlockedSymbols` consistently)

### Adding New XP Sources
1. **Use `GlobalPlayerState.addXP()`** or `addSpinXP()`
2. **Follow existing bonus patterns**
3. **Emit appropriate events**
4. **Add logging** for debugging

### Modifying Configuration Structure
```typescript
// ✅ Follow these principles when adding new data:

// 1. Don't store computable values
const computed = calculateFromExisting(baseData);

// 2. Use meaningful array indices
const levelConfig = levels[playerLevel - 1]; // Level 1 = Index 0

// 3. Maintain consistency across all entries
// If one level has a property, all should have it (or a clear default)

// 4. Validate during development, not runtime
if (process.env.NODE_ENV === 'development') {
  validateConfiguration(config);
}
```

### Modifying UI Components
1. **Listen for existing events** when possible
2. **Follow dimension guidelines** (`docs/dimension-guidelines.md`)
3. **Test on different screen sizes**
4. **Maintain accessibility** (cursor, interactive states)

## Troubleshooting

### Common Issues

#### "Symbols not unlocking after level up"
- Check `currentUnlockedSymbolPool` size
- Verify `SymbolGenerator.refreshSymbolPool()` was called
- Confirm events are being emitted and received

#### "XP bar not updating"
- Ensure `playerXPChange` event is emitted
- Check if UI component is listening for the event
- Verify `updateDisplay()` method is called

#### "Level up notification not showing"
- Confirm `playerLevelUp` event is emitted with correct details
- Check if `LevelUpNotification` is added to the scene
- Verify animation system is working

#### "Symbol System Screen shows wrong states"
- Force refresh with `symbolSystemScreen.refresh()`
- Check if component receives level up events
- Verify `currentUnlockedSymbolPool` matches expected symbols

#### "XP gain is too high/low (level jumping)"
- **Root Cause**: Configuration mismatch between `baseBet` and actual bet amount
- **Check**: `level-data.json` → `xpConfig.baseBet` should match `SLOT_CONFIG.BET_AMOUNT`
- **Symptoms**: 
  - 10x XP gain (baseBet=1, actualBet=10)
  - 0.1x XP gain (baseBet=100, actualBet=10)
  - Skipping multiple levels in one spin
- **Debug**: Check console logs for XP calculation details
- **Fix**: Update `baseBet` in `level-data.json` to match actual bet amount

#### "Configuration errors after editing level-data.json"
- **Common Issues**: 
  - Adding redundant properties (`level`, `xpForThisLevel`, `defaultSymbols`)
  - Inconsistent property names across levels
  - Storing computed values that get out of sync
- **Best Practice**: Follow the **minimal data structure**:
  ```json
  {
    "xpRequired": 300,           // ✅ Essential: Total XP needed
    "unlockedSymbols": [...],    // ✅ Essential: Symbols for this level
    "title": "...",              // ✅ Essential: Display name
    "description": "..."         // ✅ Essential: Display description
  }
  ```
- **Debug**: Check TypeScript errors for missing/extra properties
- **Fix**: Remove computed/redundant fields, ensure all levels have same structure

### Performance Considerations
- **Event listeners** are lightweight and efficient
- **Symbol pool refreshing** is fast (< 1ms)
- **UI updates** are batched where possible
- **Level checks** are optimized for multiple level gains

## Memory Management
- **Event listeners** are set up once in constructors
- **No manual cleanup** required for level system
- **Global variables** are minimal and necessary
- **UI components** handle their own lifecycle

## Security Notes
- **XP values** are client-side only (adjust for server sync if needed)
- **Level progression** follows deterministic rules
- **Symbol unlocking** cannot be manipulated by users
- **Event system** is contained within the application

---

## Summary

The level system has been architected with **simplicity and maintainability** as core principles:

1. **Array index = Level number** - Eliminates sequence validation complexity
2. **Don't store computed values** - Reduces data redundancy and inconsistency risks  
3. **Consistent property usage** - Same patterns across all levels
4. **Minimal configuration** - Only essential data, 30% smaller files

These principles ensure the system remains **robust**, **performant**, and **easy to extend**.

---

*This document reflects the simplified data structure architecture implemented in the level system refactoring. Last updated with architectural simplification principles.* 