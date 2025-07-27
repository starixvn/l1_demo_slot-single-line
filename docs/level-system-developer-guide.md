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

// Bet scaling
betMultiplier = currentBet / baseBet

// Final calculation
totalXP = (baseXP + monsterBonuses) * betMultiplier
```

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

### Symbol Unlocking Pattern
- **Level 1**: 10 default symbols (0-9)
- **Level 2-10**: 2 new symbols per level
  - Level 2: symbols 10-11
  - Level 3: symbols 12-13
  - Level 4: symbols 14-15
  - ...and so on

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

### 1. State Management
- **Always use `GlobalPlayerState` methods** for XP/level changes
- **Never directly modify** `playerLevel` or `playerXP` outside of `GlobalPlayerState`
- **Always emit events** after state changes

### 2. Symbol Pool Management
- **Call `SymbolGenerator.refreshSymbolPool()`** after level ups
- **Use `currentUnlockedSymbolPool`** for all symbol generation
- **Never hardcode symbol availability**

### 3. UI Updates
- **Listen for events** rather than polling for changes
- **Update UI immediately** when events are received
- **Handle both visible and hidden states** for modals

### 4. Event Handling
```typescript
// ✅ Correct: Listen for specific events
window.addEventListener('playerLevelUp', (event: Event) => {
  const customEvent = event as CustomEvent;
  // Handle level up
});

// ❌ Incorrect: Direct method calls
// this.someOtherComponent.updateLevel();
```

### 5. Error Handling
- **Validate XP amounts** before processing
- **Check level bounds** (1-10)
- **Handle missing symbol configurations** gracefully
- **Log errors** for debugging

## Extension Guidelines

### Adding New Levels
1. **Update `LEVEL_DATA`** with new level configuration
2. **Add new symbols** to `SYMBOL_CONFIGS` 
3. **Update symbol assets** in asset manager
4. **Test XP progression** thoroughly
5. **Update UI layouts** if needed

### Adding New XP Sources
1. **Use `GlobalPlayerState.addXP()`** or `addSpinXP()`
2. **Follow existing bonus patterns**
3. **Emit appropriate events**
4. **Add logging** for debugging

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

*This document should be updated whenever the level system is modified. Last updated: $(date)* 