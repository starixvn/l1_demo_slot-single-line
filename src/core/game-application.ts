import { Application, Container } from 'pixi.js';
import type { GameConfig } from '@/types/game-types';
import { AssetManager } from '@/systems/asset-manager';
import { getOptimizedConfig, isMobile, GAME_CONSTANTS } from '@/config/game-config';

/**
 * Main game application class handling PIXI initialization and lifecycle
 */
export class GameApplication {
  private app: Application | null = null;
  private assetManager: AssetManager;
  private gameContainer: Container;
  private isInitialized = false;
  private config: GameConfig;

  constructor(config?: Partial<GameConfig>) {
    this.config = { ...getOptimizedConfig(), ...config };
    this.assetManager = new AssetManager();
    this.gameContainer = new Container();
    
    // Bind methods to preserve context
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Initialize the PIXI application and add canvas to DOM
   */
  async initialize(containerId: string = 'game-container'): Promise<void> {
    if (this.isInitialized) {
      console.warn('GameApplication: Application already initialized');
      return;
    }

    try {
      console.log('GameApplication: Creating PIXI Application...');
      
      // Create PIXI Application with optimized settings
      this.app = new Application({
        width: this.config.width,
        height: this.config.height,
        backgroundColor: this.config.backgroundColor,
        resolution: this.config.resolution,
        antialias: this.config.antialias,
        powerPreference: this.config.powerPreference,
        preserveDrawingBuffer: this.config.preserveDrawingBuffer,
        clearBeforeRender: this.config.clearBeforeRender,
        hello: this.config.hello,
      });

      console.log('GameApplication: PIXI Application created, canvas:', (this.app as any).canvas || (this.app as any).view);

      // Add canvas to DOM
      this.addCanvasToDOM(containerId);
      
      // Set up the main game container
      this.setupGameContainer();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Apply mobile-specific optimizations
      if (isMobile()) {
        this.applyMobileOptimizations();
      }

      this.isInitialized = true;
      
      console.log('GameApplication: Successfully initialized', {
        renderer: this.app.renderer.type,
        resolution: this.app.renderer.resolution,
        dimensions: `${this.app.screen.width}x${this.app.screen.height}`,
      });

    } catch (error) {
      console.error('GameApplication: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Add canvas to DOM container with error handling
   */
  private addCanvasToDOM(containerId: string): void {
    if (!this.app) {
      throw new Error('Application not initialized');
    }

    const canvas = (this.app as any).canvas || (this.app as any).view;
    console.log('GameApplication: Adding canvas to DOM, canvas:', canvas);

    if (!canvas) {
      throw new Error('PIXI Application canvas/view is not available');
    }

    let container = document.getElementById(containerId);
    
    if (!container) {
      console.log('GameApplication: Creating container element');
      // Create container if it doesn't exist
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = `
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #000;
      `;
      document.body.appendChild(container);
    }

    // Style the canvas for responsive design
    canvas.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
    `;

    container.appendChild(canvas);
    console.log('GameApplication: Canvas added to DOM successfully');
  }

  /**
   * Set up the main game container
   */
  private setupGameContainer(): void {
    if (!this.app) return;

    this.gameContainer.name = 'GameContainer';
    this.gameContainer.sortableChildren = true;
    this.app.stage.addChild(this.gameContainer);
  }

  /**
   * Set up event listeners for resize and visibility
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Mobile-specific events
    if (isMobile()) {
      window.addEventListener('orientationchange', this.handleResize);
    }
  }

  /**
   * Handle window resize events
   */
  private handleResize(): void {
    if (!this.app) return;

    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.updateCanvasSize();
    }, 100);
  }

  private resizeTimeout: NodeJS.Timeout | number = 0;

  /**
   * Update canvas size for responsive design
   */
  private updateCanvasSize(): void {
    if (!this.app) return;

    const canvasElement = (this.app as any).canvas || (this.app as any).view;
    const container = canvasElement.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const gameAspectRatio = this.config.width / this.config.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let newWidth: number;
    let newHeight: number;

    if (containerAspectRatio > gameAspectRatio) {
      // Container is wider than game aspect ratio
      newHeight = containerHeight;
      newWidth = newHeight * gameAspectRatio;
    } else {
      // Container is taller than game aspect ratio
      newWidth = containerWidth;
      newHeight = newWidth / gameAspectRatio;
    }

    // Update renderer size
    this.app.renderer.resize(newWidth, newHeight);
    
    // Update stage scale to maintain game world dimensions
    const scaleX = newWidth / this.config.width;
    const scaleY = newHeight / this.config.height;
    const scale = Math.min(scaleX, scaleY);
    
    this.gameContainer.scale.set(scale);
    
    // Center the game container
    this.gameContainer.x = (newWidth - this.config.width * scale) / 2;
    this.gameContainer.y = (newHeight - this.config.height * scale) / 2;
  }

  /**
   * Handle page visibility changes (pause/resume optimization)
   */
  private handleVisibilityChange(): void {
    if (!this.app) return;

    if (document.hidden) {
      // Page is hidden, pause ticker for performance
      this.app.ticker.stop();
    } else {
      // Page is visible, resume ticker
      this.app.ticker.start();
    }
  }

  /**
   * Apply mobile-specific optimizations
   */
  private applyMobileOptimizations(): void {
    if (!this.app) return;

    // Prevent default touch behaviors
    const canvasElement = (this.app as any).canvas || (this.app as any).view;
    canvasElement.style.touchAction = 'none';
    
    // Optimize ticker for mobile
    this.app.ticker.maxFPS = GAME_CONSTANTS.TARGET_FPS;
    
    // Enable interaction events
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
  }

  /**
   * Load assets using the asset manager
   */
  async loadAssets(urls: string[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Application must be initialized before loading assets');
    }

    const assetConfigs = AssetManager.createAssetConfigs(urls);
    return this.assetManager.loadAssets(assetConfigs);
  }

  /**
   * Get the asset manager instance
   */
  getAssetManager(): AssetManager {
    return this.assetManager;
  }

  /**
   * Get the PIXI application instance
   */
  getApp(): Application | null {
    return this.app;
  }

  /**
   * Get the main game container
   */
  getGameContainer(): Container {
    return this.gameContainer;
  }

  /**
   * Check if application is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (!this.app) {
      throw new Error('Application not initialized');
    }

    this.app.ticker.start();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.app) return;

    this.app.ticker.stop();
  }

  /**
   * Destroy the application and clean up resources
   */
  destroy(): void {
    if (!this.app) return;

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('orientationchange', this.handleResize);

    // Clear assets
    this.assetManager.clear();

    // Destroy PIXI application
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    this.app = null;
    this.isInitialized = false;
  }
} 