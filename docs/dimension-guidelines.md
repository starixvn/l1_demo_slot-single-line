# Dimension Guidelines

This document provides comprehensive guidelines for all dimensions, sizes, and spacing used throughout the slot machine game. Following these guidelines ensures visual consistency and maintainability.

## Table of Contents

1. [Typography](#typography)
2. [Layout Areas](#layout-areas)
3. [Monster System](#monster-system)
4. [UI Components](#ui-components)
5. [Spacing & Padding](#spacing--padding)
6. [Game Elements](#game-elements)
7. [Quick Reference](#quick-reference)

---

## Typography

### Font Size Constants
All text uses standardized font sizes defined in `src/config/game-config.ts`:

```typescript
FONT_SIZES: {
  SMALL: 16,   // Status, info, secondary text
  MEDIUM: 20,  // Labels, standard UI text
  LARGE: 24,   // Main values, buttons, titles
}
```

### Usage Guidelines

| Size | Usage | Examples |
|------|-------|----------|
| **SMALL (16px)** | Secondary information, status text | Game status, monster names, progress text, info messages |
| **MEDIUM (20px)** | Standard UI labels, settings | Section labels ("BALANCE", "BET"), settings options, close buttons |
| **LARGE (24px)** | Primary elements, main values | Button text, balance values, panel titles, win amounts |

### Font Family
- **Primary**: `'Arial, sans-serif'`
- **Weight**: `'bold'` for most UI elements
- **Special Effects**: Drop shadows for monster names and emojis

### Special Font Sizes
These are hardcoded for specific visual purposes:
- **48px**: Monster emoji fallbacks (visual elements)
- **72px**: Slot machine symbol emojis (game symbols)

---

## Layout Areas

### Canvas Dimensions
- **Base Resolution**: 1920×1080px (16:9 aspect ratio)
- **Responsive**: Scales proportionally for different screen sizes

### Area Distribution
```typescript
// Game Controller Layout Ratios
MONSTER_AREA_HEIGHT_RATIO = 0.267  // 288px / 1080px
WEAPON_AREA_HEIGHT_RATIO = 0.40    // 432px / 1080px
UI_PADDING = 20px
```

| Area | Height | Percentage | Purpose |
|------|--------|------------|---------|
| **Monster Area** | 288px | 26.7% | Monster trail and current monster |
| **Weapon Area** | 432px | 40.0% | Slot machine reels |
| **Control Area** | ~300px | ~28% | Buttons and player info |
| **Padding** | 20px | - | Between areas |

### Responsive Positioning
- **Center X**: 0 (all elements centered on screen)
- **Container Scale**: Maintains aspect ratio across screen sizes
- **Mobile Optimization**: Touch-friendly sizing and spacing

---

## Monster System

### Monster Display Sizes
```typescript
// Internal sprite sizing
MAX_MONSTER_SIZE = 200px        // Base sprite limit (width × height)

// Display scaling in monster trail
CURRENT_MONSTER_SCALE = 1.4     // 200px × 1.4 = 280×280px effective
NEXT_MONSTER_SCALE = 0.8        // 200px × 0.8 = 160×160px effective
```

### Monster Trail Layout
```typescript
// Area configuration
areaHeight: 288px               // Compact monster display area
areaWidth: 1536px              // 80% of canvas width
monsterSpacing: 300px          // Distance between current and next monster
```

### Monster Info Components
```typescript
// Name text
fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL  // 16px
anchor: (0.5, 0)                           // Top-center aligned
position: (0, 15)                          // Relative to info container

// HP Bar
width: 150px
height: 6px                               // Compact height
borderRadius: 2px
position: 22px below name text
```

### Monster Positioning
- **Current Monster**: Center stage with 280×280px display
- **Next Monster**: 300px left of center with 160×160px display
- **Info Offset**: 110px below monster center
- **Alpha**: Next monster at 70% opacity

---

## UI Components

### Game Control Buttons
```typescript
// Button dimensions
width: 170px                    // Increased for larger text
height: 60px                    // Increased for larger text
borderRadius: 12px              // Proportional to size
borderWidth: 2px

// Button spacing
buttonSpacing: 180px            // Center-to-center distance
verticalPosition: below weapon area + 30px

// Text
fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE  // 24px
fontWeight: 'bold'
color: 0xFFFFFF
```

### Player Info Display Panel
```typescript
// Panel dimensions
width: 600px
height: 100px                   // Increased for larger text
borderRadius: 10px
backgroundColor: 0x1A1A1A

// Section layout
sections: 4                     // BALANCE, BET, LAST WIN, TOTAL WINS
sectionWidth: 150px             // 600px ÷ 4
dividerColor: 0x444444

// Text positioning
labelY: 15px                    // Top of panel
valueY: 50px                    // Below labels
```

### Settings Panel
```typescript
// Gear button
size: 40px diameter             // Circular button
backgroundColor: 0x333333
borderColor: 0x666666

// Popup dimensions
width: 400px
height: 300px
borderRadius: 15px
backgroundColor: 0x2A2A2A
borderColor: 0x555555

// Close button
size: 30px diameter             // Smaller than gear button
color: 0xFF4444                 // Red background
```

---

## Spacing & Padding

### Standard Spacing Values
```typescript
UI_PADDING = 20px               // Standard padding between major areas
BUTTON_SPACING = 180px          // Horizontal spacing between buttons
SECTION_SPACING = 30px          // Vertical spacing between sections
INFO_OFFSET = 110px             // Monster info below sprite
TEXT_SPACING = 15px             // Between related text elements
```

### Margin Guidelines
- **Panel Margins**: 20px from screen edges
- **Button Margins**: 30px vertical spacing from other elements
- **Text Margins**: 5-15px depending on hierarchy
- **Section Dividers**: 10px padding from edges

### Interactive Element Spacing
- **Touch Targets**: Minimum 44×44px for mobile
- **Button Groups**: 180px center-to-center spacing
- **Panel Spacing**: 60px between major panels

---

## Game Elements

### Slot Machine Reels
```typescript
// Reel configuration (from SLOT_CONFIG)
REEL_WIDTH: configurable        // Set in symbol config
REEL_HEIGHT: configurable       // Set in symbol config
REEL_COUNT: 3                   // Number of reels

// Symbol sizing
symbolFontSize: 72px            // For emoji fallbacks
maxSpriteSize: based on reel dimensions
```

### Background & Visual Effects
```typescript
// Background scaling
scaleMode: cover entire screen
position: centered
fallbackColor: 0x000000        // Black background

// Shadow effects
shadowOffset: (2px, 2px)
shadowAlpha: 0.3
shadowColor: 0x000000

// Animation effects
pulseRange: 1.0 to 1.1          // 10% scale variation
shakeIntensity: 6-12px          // Based on damage type
```

---

## Quick Reference

### Most Common Dimensions

| Element | Dimension | Constant/Value |
|---------|-----------|----------------|
| **Small Text** | 16px | `GAME_CONSTANTS.FONT_SIZES.SMALL` |
| **Medium Text** | 20px | `GAME_CONSTANTS.FONT_SIZES.MEDIUM` |
| **Large Text** | 24px | `GAME_CONSTANTS.FONT_SIZES.LARGE` |
| **Standard Padding** | 20px | `UI_PADDING` |
| **Button Size** | 170×60px | - |
| **Monster Current** | 280×280px | `200px × 1.4` |
| **Monster Next** | 160×160px | `200px × 0.8` |
| **HP Bar** | 150×6px | `HP_BAR_CONFIG` |
| **Info Panel** | 600×100px | - |
| **Monster Spacing** | 300px | - |

### Color Palette
```typescript
// UI Colors
backgroundColor: 0x1A1A1A       // Dark panels
borderColor: 0x333333          // Panel borders
textPrimary: 0xFFFFFF          // White text
textSecondary: 0xAAAAAA        // Gray text
textValue: 0xFFD700            // Gold values
textWin: 0x00FF00              // Green win amounts
textCritical: 0xFF0000         // Red critical/warning
```

### Layout Calculations
```typescript
// Responsive positioning
centerX = canvasWidth / 2
centerY = canvasHeight / 2
monsterAreaY = topY + (canvasHeight × 0.267)
weaponAreaY = monsterAreaY + areaHeight + padding
controlAreaY = weaponAreaY + areaHeight + padding
```

---

## Implementation Guidelines

### When Adding New UI Elements

1. **Choose appropriate font size** from `GAME_CONSTANTS.FONT_SIZES`
2. **Use standard padding** values (`UI_PADDING`, etc.)
3. **Follow color palette** for consistency
4. **Maintain responsive scaling** relative to canvas dimensions
5. **Consider mobile touch targets** (minimum 44×44px)

### When Modifying Existing Elements

1. **Check if constants exist** before hardcoding values
2. **Update related positioning** when changing component sizes
3. **Test on different screen sizes** to ensure responsiveness
4. **Maintain visual hierarchy** with appropriate font sizes

### Performance Considerations

1. **Avoid frequent size calculations** during gameplay
2. **Cache dimension values** when possible
3. **Use object pooling** for frequently created/destroyed elements
4. **Optimize texture sizes** based on display dimensions

---

## File Locations

- **Font Constants**: `src/config/game-config.ts`
- **Monster Config**: `src/config/monster-config.ts`
- **Layout Ratios**: `src/game/game-controller.ts`
- **Component Sizes**: Individual component files in `src/ui/` and `src/game/`

---

*Last Updated: Current Version - Standardized Font System Implementation*
*Next Review: When adding new UI components or modifying layout areas* 