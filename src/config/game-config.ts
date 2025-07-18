import type { GameConfig, MobileConfig } from '@/types/game-types';

/**
 * Game constants and configuration values
 */
export const GAME_CONSTANTS = {
  // Canvas dimensions
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  
  // Performance settings
  MAX_FPS: 60,
  TARGET_FPS: 60,
  
  // Asset loading
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  // Mobile optimization
  MOBILE_BREAKPOINT: 768,
  TOUCH_THRESHOLD: 10,
  
  // Colors
  BACKGROUND_COLOR: 0x1a1a2e,
  PRIMARY_COLOR: 0x16213e,
  ACCENT_COLOR: 0x0f4c75,
  
  // Z-index layers
  LAYERS: {
    BACKGROUND: 0,
    GAME_ELEMENTS: 10,
    UI: 20,
    OVERLAY: 30,
    DEBUG: 100,
  },
} as const;

/**
 * Default game configuration optimized for performance
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  width: GAME_CONSTANTS.CANVAS_WIDTH,
  height: GAME_CONSTANTS.CANVAS_HEIGHT,
  backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
  resolution: window.devicePixelRatio || 1,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
  clearBeforeRender: true,
  forceFXAA: false,
  hello: false, // Disable PIXI hello message
};

/**
 * Mobile-specific configuration
 */
export const MOBILE_CONFIG: MobileConfig = {
  forceCanvas: false,
  useInteractionPlugin: true,
  autoResize: true,
  orientation: 'landscape',
};

/**
 * Detect if running on mobile device
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= GAME_CONSTANTS.MOBILE_BREAKPOINT;
};

/**
 * Get optimized configuration based on device capabilities
 */
export const getOptimizedConfig = (): GameConfig => {
  const config = { ...DEFAULT_GAME_CONFIG };
  
  if (isMobile()) {
    // Optimize for mobile devices
    config.resolution = Math.min(window.devicePixelRatio || 1, 2);
    config.antialias = false;
    config.powerPreference = 'low-power';
    config.forceFXAA = true;
  }
  
  // Further optimize for older devices
  const isOldDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  if (isOldDevice) {
    config.resolution = 1;
    config.antialias = false;
  }
  
  return config;
}; 