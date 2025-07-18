# Reel System Implementation

## Overview

The reel system is implemented with a modular design focusing on simplicity and extensibility. The POC features instant symbol changes with weighted random generation.

## Architecture

### Core Components

1. **SymbolType Enum** (`src/types/slot-types.ts`)
   - Defines all available symbols (weapons + special symbols)
   - Includes Iron Sword, Steel Sword, Silver Sword, Gold Sword, Crusader Blade
   - Special symbols: Bonus, Wild, Scatter

2. **SymbolGenerator** (`src/config/symbol-config.ts`)
   - Weighted random symbol generation
   - Probability-based symbol pool
   - Statistics tracking

3. **Reel Class** (`src/game/reel.ts`)
   - Individual reel management
   - Symbol display with emoji and text
   - Spin/stop functionality
   - Visual feedback and highlighting

4. **SlotMachine Class** (`src/game/slot-machine.ts`)
   - Manages multiple reels
   - Win calculation logic
   - Payout system
   - Balance management

5. **GameController** (`src/game/game-controller.ts`)
   - User interaction handling
   - Button interface
   - Keyboard controls

## Symbol Probabilities

| Symbol | Probability Weight | Percentage | Value |
|--------|-------------------|------------|-------|
| Iron Sword | 35 | ~30.4% | 10 coins |
| Steel Sword | 25 | ~21.7% | 25 coins |
| Silver Sword | 20 | ~17.4% | 50 coins |
| Gold Sword | 12 | ~10.4% | 100 coins |
| Crusader Blade | 5 | ~4.3% | 250 coins |
| Bonus | 8 | ~7.0% | Special |
| Wild | 6 | ~5.2% | Substitute |
| Scatter | 4 | ~3.5% | Special |

**Total Weight:** 115

## Key Features

### Instant Symbol Changes
- `reel.spin()` - Marks reel as spinning
- `reel.stop()` - Instantly sets new random symbol
- No complex animations in POC

### Weighted Random Generation
```typescript
// Symbols added to pool based on probability weight
Object.values(SYMBOL_CONFIGS).forEach(config => {
  for (let i = 0; i < config.probability; i++) {
    symbolPool.push(config.type);
  }
});
```

### Win Detection
- **Three of a Kind**: Same symbol on all 3 reels
- **Bonus Trigger**: 2+ bonus symbols
- **Wild Win**: Wild + 2 matching symbols

### Visual Feedback
- Color-coded symbol backgrounds
- Border highlighting for wins
- Gold border during spinning
- Green border for winning reels

## Usage

### Basic Spinning
```typescript
const slotMachine = new SlotMachine();
const result = await slotMachine.spin();
console.log(result.isWin, result.payout);
```

### Testing Specific Symbols
```typescript
slotMachine.setSymbols([
  SymbolType.CRUSADER_BLADE,
  SymbolType.CRUSADER_BLADE,
  SymbolType.CRUSADER_BLADE
]);
```

### Controls
- **Click "SPIN"** or **Space/Enter**: Normal spin
- **Click "Test Win"** or **T**: Force winning combination
- **Click "Reset"** or **R**: Add 500 coins to balance

## Reel Implementation Details

### Individual Reel (`Reel.ts`)
```typescript
class Reel extends Container {
  spin(): void           // Start spinning
  stop(): SymbolType     // Stop with random symbol
  setSymbol(): void      // Force specific symbol
  highlight(): void      // Visual win feedback
  getCurrentSymbol(): SymbolType
}
```

### Symbol Display
- **200x200px** reel size
- **Emoji representation** for visual appeal
- **Color-coded backgrounds** by symbol type
- **Text labels** for symbol names

### State Management
```typescript
interface ReelState {
  currentSymbol: SymbolType;
  isSpinning: boolean;
  position: number;
  index: number;
}
```

## Performance Considerations

- **Object Pooling**: Symbol pool pre-generated for fast access
- **Minimal DOM Manipulation**: PIXI handles rendering efficiently
- **Instant Updates**: No animation overhead in POC
- **Memory Efficient**: Reuses graphics objects

## Future Enhancements

1. **Animation System**
   - Smooth reel spinning
   - Symbol transitions
   - Win celebrations

2. **Sound Integration**
   - Spin sounds
   - Win sounds
   - Background music

3. **Advanced Features**
   - Multi-line payouts
   - Progressive jackpots
   - Bonus rounds
   - Auto-spin functionality

4. **Visual Improvements**
   - Texture atlases for symbols
   - Particle effects
   - Enhanced UI design

## Testing

The system includes several testing utilities:

- **Probability Verification**: `SymbolGenerator.getProbabilityStats()`
- **Forced Wins**: Test win button sets guaranteed winning combination
- **Balance Management**: Reset button adds test funds
- **Console Logging**: Detailed spin and win information

## Integration

The reel system integrates seamlessly with the existing PIXI application:

1. **GameController** added to main game container
2. **Responsive positioning** based on screen size
3. **Event handling** for both mouse and keyboard
4. **Asset management** compatibility maintained 