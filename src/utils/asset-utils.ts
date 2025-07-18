import type { AssetConfig } from '@/types/game-types';

/**
 * Asset utility functions for validation, optimization, and management
 */
export class AssetUtils {
  
  /**
   * Supported asset formats by type
   */
  private static readonly SUPPORTED_FORMATS = {
    texture: ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'],
    spritesheet: ['.json'],
    sound: ['.mp3', '.wav', '.ogg', '.m4a', '.webm'],
    json: ['.json'],
  } as const;

  /**
   * Maximum file size recommendations (in bytes)
   */
  private static readonly MAX_FILE_SIZES = {
    texture: 5 * 1024 * 1024, // 5MB
    spritesheet: 10 * 1024 * 1024, // 10MB  
    sound: 2 * 1024 * 1024, // 2MB
    json: 1 * 1024 * 1024, // 1MB
  } as const;

  /**
   * Validate asset configuration
   */
  static validateAssetConfig(asset: AssetConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!asset.name || asset.name.trim() === '') {
      errors.push('Asset name is required');
    }

    if (!asset.url || asset.url.trim() === '') {
      errors.push('Asset URL is required');
    }

    if (!asset.type) {
      errors.push('Asset type is required');
    }

    // Validate asset name format
    if (asset.name && !/^[a-zA-Z0-9_-]+$/.test(asset.name)) {
      warnings.push('Asset name should only contain letters, numbers, underscores, and hyphens');
    }

    // Validate URL format
    if (asset.url) {
      try {
        new URL(asset.url);
      } catch {
        // Check if it's a relative path
        if (!asset.url.startsWith('/') && !asset.url.startsWith('./') && !asset.url.startsWith('../')) {
          errors.push('Invalid URL format');
        }
      }
    }

    // Validate file extension
    if (asset.url && asset.type) {
      const extension = this.getFileExtension(asset.url);
      const supportedExts = this.SUPPORTED_FORMATS[asset.type] as readonly string[];
      
      if (extension && !(supportedExts as string[]).includes(extension)) {
        warnings.push(`File extension ${extension} may not be supported for ${asset.type} assets`);
      }
    }

    // Validate priority
    if (asset.priority !== undefined) {
      if (asset.priority < 0 || asset.priority > 10) {
        warnings.push('Priority should be between 0 and 10');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get file extension from URL
   */
  static getFileExtension(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = pathname.substring(pathname.lastIndexOf('.')).toLowerCase();
      return extension || null;
    } catch {
      // Handle relative paths
      const lastDot = url.lastIndexOf('.');
      const lastSlash = url.lastIndexOf('/');
      
      if (lastDot > lastSlash && lastDot !== -1) {
        return url.substring(lastDot).toLowerCase();
      }
      
      return null;
    }
  }

  /**
   * Estimate asset file size from URL (if possible)
   */
  static async estimateFileSize(url: string): Promise<number | null> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if asset size is within recommended limits
   */
  static async validateAssetSize(asset: AssetConfig): Promise<{
    isValid: boolean;
    actualSize?: number;
    maxSize: number;
    warning?: string;
  }> {
    const maxSize = this.MAX_FILE_SIZES[asset.type];
    const actualSize = await this.estimateFileSize(asset.url);

    if (actualSize === null) {
      return {
        isValid: true,
        maxSize,
        warning: 'Could not determine file size',
      };
    }

    const isValid = actualSize <= maxSize;
    
    return {
      isValid,
      actualSize,
      maxSize,
      warning: isValid ? undefined : `File size (${this.formatFileSize(actualSize)}) exceeds recommended limit (${this.formatFileSize(maxSize)})`,
    };
  }

  /**
   * Format file size for human reading
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Create CDN URLs for assets (example implementations)
   */
  static createCdnUrl(asset: AssetConfig, cdnBase: string): string {
    // Remove leading slash if present
    const cleanUrl = asset.url.startsWith('/') ? asset.url.slice(1) : asset.url;
    
    // Combine CDN base with asset URL
    return `${cdnBase.replace(/\/$/, '')}/${cleanUrl}`;
  }

  /**
   * Create optimized asset variants for different devices
   */
  static createAssetVariants(baseAsset: AssetConfig): AssetConfig[] {
    const variants: AssetConfig[] = [baseAsset];

    if (baseAsset.type === 'texture') {
      // Create lower resolution variants for mobile
      const mobileAsset: AssetConfig = {
        ...baseAsset,
        name: `${baseAsset.name}_mobile`,
        url: baseAsset.url.replace(/(\.[^.]+)$/, '_mobile$1'),
        priority: (baseAsset.priority || 1) - 1,
      };

      // Create WebP variant if not already WebP
      if (!baseAsset.url.includes('.webp')) {
        const webpAsset: AssetConfig = {
          ...baseAsset,
          name: `${baseAsset.name}_webp`,
          url: baseAsset.url.replace(/\.[^.]+$/, '.webp'),
          priority: (baseAsset.priority || 1) + 1,
        };
        variants.push(webpAsset);
      }

      variants.push(mobileAsset);
    }

    return variants;
  }

  /**
   * Sort assets by loading priority and dependencies
   */
  static sortAssetsByPriority(assets: AssetConfig[]): AssetConfig[] {
    return [...assets].sort((a, b) => {
      // Sort by priority (higher first)
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // Sort by type (critical assets first)
      const typeOrder = { json: 0, spritesheet: 1, texture: 2, sound: 3 };
      const typeA = typeOrder[a.type] ?? 99;
      const typeB = typeOrder[b.type] ?? 99;
      
      return typeA - typeB;
    });
  }

  /**
   * Group assets by type for batch loading
   */
  static groupAssetsByType(assets: AssetConfig[]): Record<string, AssetConfig[]> {
    return assets.reduce((groups, asset) => {
      const type = asset.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(asset);
      return groups;
    }, {} as Record<string, AssetConfig[]>);
  }

  /**
   * Create asset preload hints for HTML
   */
  static createPreloadHints(assets: AssetConfig[]): string[] {
    return assets
      .filter(asset => asset.priority && asset.priority >= 8) // High priority assets
      .map(asset => {
        const type = asset.type === 'texture' ? 'image' : 'fetch';
        return `<link rel="preload" href="${asset.url}" as="${type}" />`;
      });
  }

  /**
   * Validate asset URLs are accessible
   */
  static async validateAssetAccessibility(assets: AssetConfig[]): Promise<{
    accessible: AssetConfig[];
    inaccessible: Array<{ asset: AssetConfig; error: string }>;
  }> {
    const accessible: AssetConfig[] = [];
    const inaccessible: Array<{ asset: AssetConfig; error: string }> = [];

    await Promise.allSettled(
      assets.map(async (asset) => {
        try {
          const response = await fetch(asset.url, { method: 'HEAD' });
          if (response.ok) {
            accessible.push(asset);
          } else {
            inaccessible.push({
              asset,
              error: `HTTP ${response.status}: ${response.statusText}`,
            });
          }
        } catch (error) {
          inaccessible.push({
            asset,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );

    return { accessible, inaccessible };
  }

  /**
   * Generate asset manifest for caching
   */
  static generateAssetManifest(assets: AssetConfig[]): {
    version: string;
    timestamp: number;
    assets: AssetConfig[];
    totalSize?: number;
  } {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      assets: assets.map(asset => ({ ...asset })),
    };
  }
} 