import { GameApplication } from '@/core/game-application';
import { GameController } from '@/game/game-controller';
import type { AssetConfig } from '@/types/game-types';

/**
 * Example asset URLs for demonstration
 */
const EXAMPLE_ASSETS: AssetConfig[] = [
  {
    name: 'background',
    url: 'https://pixijs.io/examples/examples/assets/bg_grass.jpg',
    type: 'texture',
    priority: 1,
  },
  {
    name: 'bunny',
    url: 'https://pixijs.io/examples/examples/assets/bunny.png', 
    type: 'texture',
    priority: 2,
  },
  {
    name: 'spritesheet',
    url: 'https://pixijs.io/examples/examples/assets/spritesheet/mc.json',
    type: 'spritesheet',
    priority: 1,
  },
];

/**
 * Main application instance
 */
let gameApp: GameApplication | null = null;

/**
 * Game controller instance
 */
let gameController: GameController | null = null;

/**
 * Initialize and start the game
 */
async function initializeGame(): Promise<void> {
  try {
    console.log('🎮 Initializing Slot Single-Line Game...');

    // Create the game application
    gameApp = new GameApplication({
      width: 1920,
      height: 1080,
      backgroundColor: 0x1a1a2e,
    });

    // Set up asset loading event listeners
    setupAssetLoadingEvents();

    // Initialize the application
    await gameApp.initialize('game-container');

    // Load game assets
    console.log('📦 Loading game assets...');
    await gameApp.getAssetManager().loadAssets(EXAMPLE_ASSETS);

    // Start the game
    gameApp.start();

    console.log('✅ Game initialized successfully!');

    // Initialize the slot machine game
    initializeSlotMachine();

  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    displayErrorMessage('Failed to load game. Please refresh the page.');
  }
}

/**
 * Set up event listeners for asset loading progress and errors
 */
function setupAssetLoadingEvents(): void {
  if (!gameApp) return;
  const assetManager = gameApp.getAssetManager();

  assetManager.addEventListener('loading-start', () => {
    console.log('🔄 Asset loading started');
    showLoadingScreen();
  });

  assetManager.addEventListener('loading-progress', (event: any) => {
    const progress = event.detail.data;
    console.log(`📈 Loading progress: ${progress.progress.toFixed(1)}% (${progress.currentAsset})`);
    updateLoadingProgress(progress);
  });

  assetManager.addEventListener('loading-complete', () => {
    console.log('✅ All assets loaded successfully');
    hideLoadingScreen();
  });

  assetManager.addEventListener('loading-error', (event: any) => {
    const error = event.detail.data;
    console.error('❌ Asset loading error:', error);
  });

  assetManager.addEventListener('asset-error', (event: any) => {
    const error = event.detail.data;
    console.warn(`⚠️ Failed to load asset: ${error.asset.name}`, error.error);
  });
}

/**
 * Initialize the slot machine game
 */
function initializeSlotMachine(): void {
  if (!gameApp) return;
  
  // Create game controller
  gameController = new GameController();
  
  // Position the game in the center of the screen
  const app = gameApp.getApp();
  if (app) {
    gameController.x = app.screen.width / 2;
    gameController.y = app.screen.height / 2 - 100;
  } else {
    gameController.x = 960;
    gameController.y = 440;
  }
  
  // Add to game container
  gameApp.getGameContainer().addChild(gameController);
  
  console.log('🎰 Slot machine initialized');
  
  // Set up keyboard controls
  setupKeyboardControls();
}

/**
 * Set up keyboard controls for the game
 */
function setupKeyboardControls(): void {
  if (!gameController) return;
  
  document.addEventListener('keydown', (event) => {
    gameController?.handleKeyPress(event.key);
  });
  
  console.log('⌨️ Keyboard controls enabled (Space/Enter: Spin, T: Test Win, R: Reset)');
}

/**
 * Show loading screen
 */
function showLoadingScreen(): void {
  const existingLoader = document.getElementById('loading-screen');
  if (existingLoader) return;

  const loadingScreen = document.createElement('div');
  loadingScreen.id = 'loading-screen';
  loadingScreen.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 1000;
    ">
      <h1 style="margin-bottom: 20px; font-size: 2rem;">🎰 Loading Slot Game</h1>
      <div style="
        width: 300px;
        height: 20px;
        background: rgba(255,255,255,0.2);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 10px;
      ">
        <div id="progress-bar" style="
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #0f4c75, #3282b8);
          border-radius: 10px;
          transition: width 0.3s ease;
        "></div>
      </div>
      <div id="progress-text">0% - Initializing...</div>
    </div>
  `;
  
  document.body.appendChild(loadingScreen);
}

/**
 * Update loading progress
 */
function updateLoadingProgress(progress: { progress: number; currentAsset: string }): void {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  if (progressBar) {
    progressBar.style.width = `${progress.progress}%`;
  }
  
  if (progressText) {
    progressText.textContent = `${Math.round(progress.progress)}% - ${progress.currentAsset}`;
  }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen(): void {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }
}

/**
 * Display error message to user
 */
function displayErrorMessage(message: string): void {
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4757;
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      text-align: center;
      z-index: 1001;
    ">
      <h2>⚠️ Error</h2>
      <p>${message}</p>
      <button onclick="location.reload()" style="
        background: white;
        color: #ff4757;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">Reload Game</button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
}

/**
 * Clean up when page unloads
 */
window.addEventListener('beforeunload', () => {
  if (gameApp) {
    gameApp.destroy();
  }
});

// Initialize the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}

// Export for debugging (only after initialization)
if (gameApp) {
  (window as any).gameApp = gameApp;
  (window as any).gameController = gameController;
} 