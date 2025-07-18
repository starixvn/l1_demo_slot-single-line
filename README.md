# Slot Single-Line Game

A high-performance single-line slot machine game built with **PIXI.js** and **TypeScript**. Optimized for both web browsers and mobile devices with comprehensive asset management and error handling.

## 🎮 Features

- **High-Performance Rendering**: Built with PIXI.js for smooth 60fps gameplay
- **Mobile Optimized**: Responsive design with touch controls and mobile-specific optimizations
- **Robust Asset Management**: Comprehensive asset loading with error handling and retry logic
- **TypeScript**: Fully typed for better development experience and code reliability
- **Progressive Loading**: Smart asset loading with priority-based batching
- **Error Recovery**: Intelligent error handling with user-friendly messages and suggestions

## 🏗️ Architecture

### Project Structure
```
slot-single-line/
├── src/
│   ├── core/              # Core application logic
│   │   └── game-application.ts
│   ├── systems/           # Game systems and managers
│   │   └── asset-manager.ts
│   ├── types/             # TypeScript type definitions
│   │   └── game-types.ts
│   ├── config/            # Configuration and constants
│   │   └── game-config.ts
│   ├── utils/             # Utility functions
│   │   ├── asset-utils.ts
│   │   └── error-handler.ts
│   └── main.ts            # Application entry point
├── index.html             # Main HTML file
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite build configuration
```

### Key Components

#### 🎯 GameApplication
Main application class that handles PIXI.js initialization, canvas management, and lifecycle events.

```typescript
const gameApp = new GameApplication({
  width: 1920,
  height: 1080,
  backgroundColor: 0x1a1a2e,
});

await gameApp.initialize('game-container');
await gameApp.loadAssets(assetUrls);
gameApp.start();
```

#### 📦 AssetManager
Comprehensive asset loading system with error handling, retry logic, and progress tracking.

```typescript
const assetManager = new AssetManager();

// Load assets with automatic error handling
await assetManager.loadAssets([
  {
    name: 'background',
    url: '/assets/bg.jpg',
    type: 'texture',
    priority: 1,
  },
  {
    name: 'spritesheet',
    url: '/assets/sprites.json',
    type: 'spritesheet',
    priority: 2,
  },
]);

// Get loaded assets
const backgroundTexture = assetManager.getAsset('background');
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd slot-single-line
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
# or
yarn build
```

## 📱 Mobile Optimization

The application includes comprehensive mobile optimizations:

- **Responsive Canvas**: Automatically scales to fit different screen sizes
- **Touch Controls**: Optimized touch event handling with gesture support
- **Performance Tuning**: Reduced resolution and effects on lower-end devices
- **Battery Optimization**: Automatic pause/resume when app loses focus
- **Orientation Handling**: Supports both portrait and landscape modes

## 🛠️ Asset Management

### Supported Asset Types

| Type | Formats | Description |
|------|---------|-------------|
| `texture` | PNG, JPG, WebP, AVIF | Images and textures |
| `spritesheet` | JSON | PIXI.js spritesheet format |
| `sound` | MP3, WAV, OGG | Audio files (requires audio library) |
| `json` | JSON | Data files |

### Asset Configuration

```typescript
interface AssetConfig {
  name: string;           // Unique identifier
  url: string;           // Asset URL or path
  type: 'texture' | 'spritesheet' | 'sound' | 'json';
  priority?: number;      // Loading priority (1-10)
}
```

### Error Handling

The asset manager provides comprehensive error handling:

```typescript
// Listen for loading events
assetManager.addEventListener('loading-error', (event) => {
  const error = event.detail.data;
  console.error('Asset failed to load:', error.asset.name);
  
  // Get user-friendly error message
  const message = AssetErrorHandler.getUserMessage(error);
  const suggestions = AssetErrorHandler.getSuggestions(error);
});

// Check if errors are retryable
const canRetry = AssetErrorHandler.isRetryable(error);
```

## ⚡ Performance Optimization

### PIXI.js Optimizations
- WebGPU renderer with WebGL fallback
- Sprite batching and texture atlases
- Object pooling for frequently created objects
- Efficient scene graph management
- Smart culling for off-screen objects

### Mobile Optimizations
- Reduced resolution on older devices
- Battery-conscious rendering
- Optimized touch event handling
- Progressive asset loading
- Memory management and garbage collection

### Build Optimizations
- Tree shaking and dead code elimination
- Asset compression and optimization
- CDN-ready static assets
- Service worker caching (optional)

## 🔧 Configuration

### Game Configuration

```typescript
// src/config/game-config.ts
export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  MAX_FPS: 60,
  TARGET_FPS: 60,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  // ... more constants
};
```

### Device-Specific Optimization

The application automatically detects device capabilities and adjusts settings:

```typescript
// Automatically optimizes based on:
// - Device pixel ratio
// - Hardware concurrency
// - Mobile vs desktop
// - Memory constraints
const config = getOptimizedConfig();
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### TypeScript Configuration

The project uses strict TypeScript configuration with:
- Strict type checking
- Path mapping for clean imports
- ES2020 target for modern browser features
- Module resolution optimized for Vite

## 📊 Error Handling & Debugging

### Asset Loading Errors

Common error types and solutions:

| Error Type | Cause | Solution |
|------------|-------|----------|
| `NETWORK_ERROR` | Connection issues | Check internet, retry loading |
| `NOT_FOUND` | 404 errors | Verify asset URLs and server |
| `CORS_ERROR` | Cross-origin issues | Configure CORS headers |
| `PARSE_ERROR` | Invalid file format | Check file format and encoding |
| `TIMEOUT_ERROR` | Slow loading | Reduce file sizes, check network |

### Debug Mode

Access debug information in the browser console:

```javascript
// Access game application instance
window.gameApp.getAssetManager().getErrors();

// Get error statistics
AssetErrorHandler.getErrorStats();
```

## 🎯 Slot Game Implementation

This application provides the foundation for a slot machine game. The basic structure includes:

1. **PIXI Application Setup** - Canvas initialization and configuration
2. **Asset Loading System** - Sprites, sounds, and spritesheets
3. **Error Handling** - Comprehensive error recovery
4. **Mobile Optimization** - Touch controls and responsive design
5. **Performance Monitoring** - FPS tracking and optimization

To build your slot game logic, extend the `GameApplication` class and add your game-specific components to the `gameContainer`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PIXI.js](https://pixijs.com/) - Amazing 2D rendering library
- [Vite](https://vitejs.dev/) - Fast build tool and dev server
- [TypeScript](https://www.typescriptlang.org/) - Type safety and developer experience
