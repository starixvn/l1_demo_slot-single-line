# Dimension Guidelines

This document provides comprehensive guidelines for all dimensions, sizes, and spacing used throughout the slot machine game. Following these guidelines ensures visual consistency, optimal performance, and maintains alignment with official Pixi.js best practices.

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

### Pixi.js TextStyle Best Practices

#### Font Sizing Guidelines
Following official Pixi.js recommendations for optimal performance and readability:

| Size | Pixel Value | Usage | Performance Impact |
|------|-------------|-------|-------------------|
| **SMALL (16px)** | 16px | Secondary information, status text | Low - Efficient texture usage |
| **MEDIUM (20px)** | 20px | Standard UI labels, settings | Medium - Balanced quality/performance |
| **LARGE (24px)** | 24px | Primary elements, main values | Higher - Larger textures but crisp rendering |

#### Line Height Configuration
Implement consistent line spacing for improved readability:

```typescript
// Recommended lineHeight ratios (relative to fontSize)
LINE_HEIGHT_RATIOS: {
  TIGHT: 1.0,    // For compact UI elements
  NORMAL: 1.2,   // Standard reading text (recommended)
  LOOSE: 1.4,    // For better accessibility
}

// Implementation example
const textStyle = {
  fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM,
  lineHeight: GAME_CONSTANTS.FONT_SIZES.MEDIUM * 1.2, // 24px lineHeight
}
```

#### Resolution and Quality Management
Optimize text quality across different devices:

```typescript
// High-DPI text configuration
const highQualityTextStyle = {
  fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
  resolution: window.devicePixelRatio || 1, // Auto-scale for device
}

// Performance-optimized for mobile
const mobileTextStyle = {
  fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM,
  resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x
}
```

### Usage Guidelines

| Size | Usage | Examples | Pixi.js Optimization |
|------|-------|----------|---------------------|
| **SMALL (16px)** | Secondary information | Game status, monster names, progress text, info messages | Use BitmapText for static content |
| **MEDIUM (20px)** | Standard UI labels | Section labels ("BALANCE", "BET"), settings options, close buttons | Standard Text class |
| **LARGE (24px)** | Primary elements | Button text, balance values, panel titles, win amounts | Consider caching for static text |

### Typography Configuration Standards

#### Font Family and Weight
- **Primary**: `'Arial, sans-serif'`
- **Weight**: `'bold'` for most UI elements
- **Fallback**: System fonts for maximum compatibility

#### Text Anchoring Best Practices
Follow Pixi.js anchor recommendations for consistent positioning:

```typescript
// Common anchor patterns
ANCHOR_PRESETS: {
  TOP_LEFT: { x: 0, y: 0 },      // Default
  CENTER: { x: 0.5, y: 0.5 },    // Center positioning
  BOTTOM_CENTER: { x: 0.5, y: 1 }, // Bottom-aligned
  TOP_CENTER: { x: 0.5, y: 0 },   // Top-aligned center
}
```

#### Word Wrapping Guidelines
For responsive text containers:

```typescript
// Word wrap configuration
const wrappedTextStyle = {
  fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM,
  wordWrap: true,
  wordWrapWidth: 200, // Adjust based on container width
  lineHeight: GAME_CONSTANTS.FONT_SIZES.MEDIUM * 1.2,
  align: 'center', // 'left', 'center', 'right'
}
```

#### Performance Optimizations

**Text Class Selection:**
- **Text**: Dynamic content, frequent updates
- **BitmapText**: Static content, better performance for repeated text
- **HTMLText**: Complex formatting needs

**Texture Management:**
```typescript
// Minimize texture regeneration
const staticTextStyle = {
  fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
  fill: 0xFFFFFF,
  // Avoid changing style properties after creation
}

// Cache complex text as textures
text.cacheAsTexture = true; // For static, complex styled text
```

#### Mobile Optimization

**Touch-Friendly Sizing:**
- Minimum touch target: 44×44px (iOS/Android guidelines)
- Increase font sizes proportionally for small screens
- Consider reduced line heights for compact mobile UI

**Resolution Scaling:**
```typescript
// Mobile-specific text configuration
const mobileTextConfig = {
  fontSize: isMobile() ? GAME_CONSTANTS.FONT_SIZES.LARGE : GAME_CONSTANTS.FONT_SIZES.MEDIUM,
  resolution: isMobile() ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio,
  lineHeight: isMobile() ? fontSize * 1.1 : fontSize * 1.2, // Tighter on mobile
}
```

#### Accessibility Considerations

**Contrast and Readability:**
- Ensure sufficient color contrast (WCAG AA: 4.5:1 minimum)
- Support system font size preferences when possible
- Provide alternative text sizing options

**Implementation Example:**
```typescript
// Accessibility-enhanced text style
const accessibleTextStyle = {
  fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM,
  fill: 0xFFFFFF,
  stroke: { color: 0x000000, width: 1 }, // Outline for better contrast
  dropShadow: {
    color: 0x000000,
    blur: 2,
    distance: 1,
  },
}
```

### Special Font Sizes
These are used for specific visual purposes:
- **48px**: Monster emoji fallbacks (visual elements)
- **72px**: Slot machine symbol emojis (game symbols)

*Note: These larger sizes should be used sparingly and with consideration for texture memory usage.*

### Text Effects and Styling

Based on official Pixi.js TextStyle capabilities, implement consistent visual effects:

#### Drop Shadows
```typescript
// Standard drop shadow configuration
DROP_SHADOW_PRESETS: {
  SUBTLE: {
    color: 0x000000,
    blur: 2,
    distance: 1,
    alpha: 0.3,
  },
  STRONG: {
    color: 0x000000,
    blur: 4,
    distance: 3,
    alpha: 0.6,
  },
  GLOW: {
    color: 0xFFFFFF,
    blur: 6,
    distance: 0,
    alpha: 0.4,
  },
}
```

#### Text Strokes
```typescript
// Outline configurations for better readability
STROKE_PRESETS: {
  THIN: { color: 0x000000, width: 1 },
  MEDIUM: { color: 0x000000, width: 2 },
  THICK: { color: 0x000000, width: 3 },
}
```

#### Color Standards
```typescript
// Typography color palette
TEXT_COLORS: {
  PRIMARY: 0xFFFFFF,      // White - primary text
  SECONDARY: 0xCCCCCC,    // Light gray - secondary text
  ACCENT: 0xFFD700,       // Gold - values and highlights
  SUCCESS: 0x00FF00,      // Green - wins and positive values
  WARNING: 0xFFAA00,      // Orange - warnings
  ERROR: 0xFF0000,        // Red - errors and critical alerts
  DISABLED: 0x666666,     // Dark gray - disabled elements
}
```

### Text Performance Guidelines

#### Texture Management Best Practices
Following official Pixi.js performance recommendations:

```typescript
// Group 1: Static Text (Use BitmapText or cached Text)
// - UI labels that never change
// - Button text that remains constant
// - Static informational text

// Group 2: Semi-Static Text (Use Text with manual caching)
// - Values that change infrequently
// - Status text with limited states

// Group 3: Dynamic Text (Use Text, avoid caching)
// - Real-time counters
// - Frequently updating values
// - User input fields
```

#### Memory Optimization
```typescript
// Efficient text creation patterns
class TextManager {
  private textPool: Map<string, Text> = new Map();
  
  // Reuse text objects for similar styling
  getText(style: TextStyleOptions): Text {
    const styleKey = this.getStyleKey(style);
    if (!this.textPool.has(styleKey)) {
      this.textPool.set(styleKey, new Text('', style));
    }
    return this.textPool.get(styleKey)!;
  }
}
```

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

### Typography Quick Reference
```typescript
// Font Sizes
SMALL: 16px     // Secondary text, optimal texture usage
MEDIUM: 20px    // Standard UI, balanced performance
LARGE: 24px     // Primary elements, larger textures

// Line Height Ratios
TIGHT: 1.0      // Compact UI elements
NORMAL: 1.2     // Standard reading (recommended)
LOOSE: 1.4      // Better accessibility

// Pixi.js Text Classes
Text            // Dynamic content, frequent updates
BitmapText      // Static content, better performance
HTMLText        // Complex formatting needs
```

### Color Palette
```typescript
// Typography Colors (Enhanced)
TEXT_COLORS: {
  PRIMARY: 0xFFFFFF,      // White - primary text
  SECONDARY: 0xCCCCCC,    // Light gray - secondary text
  ACCENT: 0xFFD700,       // Gold - values and highlights
  SUCCESS: 0x00FF00,      // Green - wins and positive
  WARNING: 0xFFAA00,      // Orange - warnings
  ERROR: 0xFF0000,        // Red - errors and critical
  DISABLED: 0x666666,     // Dark gray - disabled
}

// UI Colors
backgroundColor: 0x1A1A1A       // Dark panels
borderColor: 0x333333          // Panel borders
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
2. **Select optimal Text class** based on content type:
   - Static text: `BitmapText` or cached `Text`
   - Dynamic text: Standard `Text` class
   - Complex formatting: `HTMLText`
3. **Apply consistent styling** using predefined presets
4. **Use standard padding** values (`UI_PADDING`, etc.)
5. **Follow color palette** for consistency
6. **Maintain responsive scaling** relative to canvas dimensions
7. **Consider mobile touch targets** (minimum 44×44px)
8. **Implement proper line height** ratios for readability

### When Modifying Existing Elements

1. **Check if constants exist** before hardcoding values
2. **Update related positioning** when changing component sizes
3. **Test on different screen sizes** to ensure responsiveness
4. **Maintain visual hierarchy** with appropriate font sizes
5. **Verify text readability** across different devices
6. **Update texture cache** if text styling changes significantly

### Performance Considerations

1. **Minimize texture regeneration** by avoiding frequent style changes
2. **Use appropriate text classes** for content type:
   - Static content: BitmapText for better performance
   - Dynamic content: Text class with careful cache management
3. **Cache dimension values** when possible
4. **Use object pooling** for frequently created/destroyed elements
5. **Optimize texture sizes** based on display dimensions
6. **Implement text pooling** for similar styled text elements
7. **Consider resolution scaling** for high-DPI displays

### Pixi.js Text Best Practices

1. **Resolution management**: Set appropriate resolution for device capabilities
2. **Anchor positioning**: Use consistent anchor presets for predictable positioning
3. **Line height control**: Implement proper line spacing for readability
4. **Word wrapping**: Configure responsive text containers with proper wrapping
5. **Accessibility**: Ensure sufficient contrast and support for various screen sizes

---

## File Locations

- **Font Constants**: `src/config/game-config.ts`
- **Monster Config**: `src/config/monster-config.ts`
- **Layout Ratios**: `src/game/game-controller.ts`
- **Component Sizes**: Individual component files in `src/ui/` and `src/game/`

## Official References

- **Pixi.js TextStyle Documentation**: [Text Style Guide](https://pixijs.com/8.x/guides/components/scene-objects/text/style.md)
- **Pixi.js Text Class**: [Text API Reference](https://pixijs.download/dev/docs/scene.Text.html)
- **Pixi.js BitmapText**: [BitmapText Documentation](https://pixijs.com/8.x/guides/components/scene-objects/text/bitmap.md)
- **Pixi.js Performance Tips**: [Performance Guidelines](https://pixijs.com/8.x/guides/concepts/performance-tips.md)
- **Mobile Optimization**: [Mobile Best Practices](https://pixijs.com/8.x/guides/concepts/environments.md)

---

*Last Updated: Current Version - Enhanced with Official Pixi.js TextStyle Best Practices*
*Next Review: When Pixi.js releases major text rendering updates or when adding new typography features* 