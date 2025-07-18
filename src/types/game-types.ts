import { Texture } from 'pixi.js';

/**
 * Asset configuration for loading resources
 */
export interface AssetConfig {
  name: string;
  url: string;
  type: 'texture' | 'spritesheet' | 'sound' | 'json';
  priority?: number;
}

/**
 * Asset loading progress information
 */
export interface LoadingProgress {
  progress: number;
  currentAsset: string;
  totalAssets: number;
  loadedAssets: number;
}

/**
 * Asset loading error information
 */
export interface LoadingError {
  asset: AssetConfig;
  error: Error;
  timestamp: number;
  retry?: boolean;
}

/**
 * Asset manager state
 */
export interface AssetManagerState {
  isLoading: boolean;
  hasLoaded: boolean;
  progress: LoadingProgress;
  errors: LoadingError[];
  loadedAssets: Map<string, Texture | any>;
}

/**
 * Application configuration
 */
export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  resolution: number;
  antialias: boolean;
  powerPreference: 'default' | 'high-performance' | 'low-power';
  preserveDrawingBuffer: boolean;
  clearBeforeRender: boolean;
  forceFXAA: boolean;
  hello: boolean;
}

/**
 * Mobile-specific configuration
 */
export interface MobileConfig {
  forceCanvas: boolean;
  useInteractionPlugin: boolean;
  autoResize: boolean;
  orientation: 'portrait' | 'landscape' | 'auto';
}

/**
 * Event types for asset loading
 */
export type AssetEventType = 
  | 'loading-start'
  | 'loading-progress' 
  | 'loading-complete'
  | 'loading-error'
  | 'asset-loaded'
  | 'asset-error';

/**
 * Asset loading event data
 */
export interface AssetEvent {
  type: AssetEventType;
  data: LoadingProgress | LoadingError | AssetConfig;
} 