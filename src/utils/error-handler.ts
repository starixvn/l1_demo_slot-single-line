import type { LoadingError, AssetConfig } from '@/types/game-types';

/**
 * Error types for better error handling
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  MEMORY_ERROR = 'MEMORY_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Enhanced error information
 */
export interface EnhancedError extends LoadingError {
  errorType: ErrorType;
  userMessage: string;
  suggestions: string[];
  isRetryable: boolean;
}

/**
 * Comprehensive error handler for PIXI.js asset loading
 */
export class AssetErrorHandler {
  private static errorCounts = new Map<string, number>();
  private static errorHistory: EnhancedError[] = [];

  /**
   * Handle PIXI.js asset loading errors with detailed analysis
   */
  static handleAssetError(error: LoadingError): EnhancedError {
    const enhancedError = this.analyzeError(error);
    
    // Track error counts
    const errorKey = `${error.asset.name}-${enhancedError.errorType}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    
    // Add to history
    this.errorHistory.push(enhancedError);
    
    // Log error with appropriate level
    this.logError(enhancedError);
    
    // Handle specific error types
    this.handleSpecificError(enhancedError);
    
    return enhancedError;
  }

  /**
   * Analyze error and determine type and appropriate response
   */
  private static analyzeError(error: LoadingError): EnhancedError {
    const { asset, error: originalError } = error;
    const errorMessage = originalError.message.toLowerCase();
    const errorName = originalError.name.toLowerCase();

    let errorType = ErrorType.UNKNOWN;
    let userMessage = 'An unexpected error occurred while loading assets.';
    let suggestions: string[] = [];
    let isRetryable = false;

    // Network-related errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || 
        errorName.includes('networkerror')) {
      errorType = ErrorType.NETWORK_ERROR;
      userMessage = 'Network connection issue detected.';
      suggestions = [
        'Check your internet connection',
        'Try refreshing the page',
        'Ensure the asset server is accessible',
      ];
      isRetryable = true;
    }
    
    // 404 Not Found errors
    else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      errorType = ErrorType.NOT_FOUND;
      userMessage = `Asset '${asset.name}' could not be found.`;
      suggestions = [
        'Verify the asset URL is correct',
        'Check if the file exists on the server',
        'Ensure proper file permissions',
      ];
      isRetryable = false;
    }
    
    // CORS errors
    else if (errorMessage.includes('cors') || errorMessage.includes('cross-origin')) {
      errorType = ErrorType.CORS_ERROR;
      userMessage = 'Cross-origin resource sharing (CORS) error.';
      suggestions = [
        'Configure proper CORS headers on the asset server',
        'Use a proxy server for development',
        'Serve assets from the same domain',
      ];
      isRetryable = false;
    }
    
    // Parse/format errors
    else if (errorMessage.includes('parse') || errorMessage.includes('invalid') ||
             errorMessage.includes('format')) {
      errorType = ErrorType.PARSE_ERROR;
      userMessage = `Asset '${asset.name}' has an invalid format.`;
      suggestions = [
        'Verify the file format is supported',
        'Check if the file is corrupted',
        'Ensure proper file encoding',
      ];
      isRetryable = false;
    }
    
    // Timeout errors
    else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      errorType = ErrorType.TIMEOUT_ERROR;
      userMessage = 'Asset loading timed out.';
      suggestions = [
        'Check network stability',
        'Try reducing asset file sizes',
        'Increase timeout duration',
      ];
      isRetryable = true;
    }
    
    // Memory errors
    else if (errorMessage.includes('memory') || errorMessage.includes('out of memory')) {
      errorType = ErrorType.MEMORY_ERROR;
      userMessage = 'Insufficient memory to load asset.';
      suggestions = [
        'Close other browser tabs',
        'Reduce asset quality/size',
        'Restart the browser',
      ];
      isRetryable = false;
    }
    
    // Unsupported format
    else if (errorMessage.includes('unsupported') || errorMessage.includes('unknown format')) {
      errorType = ErrorType.UNSUPPORTED_FORMAT;
      userMessage = `Asset format for '${asset.name}' is not supported.`;
      suggestions = [
        'Convert to a supported format (PNG, JPG, WebP)',
        'Check PIXI.js supported formats',
        'Use proper file extensions',
      ];
      isRetryable = false;
    }

    return {
      ...error,
      errorType,
      userMessage,
      suggestions,
      isRetryable,
    };
  }

  /**
   * Log error with appropriate level and formatting
   */
  private static logError(error: EnhancedError): void {
    const { asset, errorType, userMessage, suggestions } = error;
    
    const logMessage = `
🚨 Asset Loading Error:
   Asset: ${asset.name} (${asset.type})
   URL: ${asset.url}
   Type: ${errorType}
   Message: ${userMessage}
   Retryable: ${error.isRetryable ? '✅' : '❌'}
   Suggestions: ${suggestions.join(', ')}
   Timestamp: ${new Date(error.timestamp).toISOString()}
    `;

    if (error.isRetryable) {
      console.warn(logMessage);
    } else {
      console.error(logMessage);
    }
  }

  /**
   * Handle specific error types with custom logic
   */
  private static handleSpecificError(error: EnhancedError): void {
    switch (error.errorType) {
      case ErrorType.MEMORY_ERROR:
        this.handleMemoryError();
        break;
      
      case ErrorType.CORS_ERROR:
        this.handleCorsError(error.asset);
        break;
      
      case ErrorType.NETWORK_ERROR:
        this.handleNetworkError();
        break;
      
      default:
        // Generic error handling
        break;
    }
  }

  /**
   * Handle memory-related errors
   */
  private static handleMemoryError(): void {
    // Attempt to free memory by clearing caches
    try {
      // Clear PIXI assets cache if available
      if (typeof window !== 'undefined' && (window as any).PIXI?.Assets) {
        (window as any).PIXI.Assets.cache.reset();
      }
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
    } catch (e) {
      console.warn('Failed to clear caches:', e);
    }
  }

  /**
   * Handle CORS-related errors
   */
  private static handleCorsError(asset: AssetConfig): void {
    console.warn(`CORS error for ${asset.name}. Consider using a proxy or CDN.`);
    
    // In development, suggest using a proxy
    if (process.env.NODE_ENV === 'development') {
      console.info('Development tip: Use Vite proxy configuration for CORS issues');
    }
  }

  /**
   * Handle network-related errors
   */
  private static handleNetworkError(): void {
    // Check if we're offline
    if (!navigator.onLine) {
      console.warn('Device appears to be offline');
    }
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    mostFailedAssets: Array<{ asset: string; count: number }>;
  } {
    const errorsByType = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<ErrorType, number>);

    this.errorHistory.forEach(error => {
      errorsByType[error.errorType]++;
    });

    const assetFailures = new Map<string, number>();
    this.errorHistory.forEach(error => {
      const count = assetFailures.get(error.asset.name) || 0;
      assetFailures.set(error.asset.name, count + 1);
    });

    const mostFailedAssets = Array.from(assetFailures.entries())
      .map(([asset, count]) => ({ asset, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      mostFailedAssets,
    };
  }

  /**
   * Clear error history and statistics
   */
  static clearHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
  }

  /**
   * Get user-friendly error message for display
   */
  static getUserMessage(error: LoadingError): string {
    const enhanced = this.analyzeError(error);
    return enhanced.userMessage;
  }

  /**
   * Get suggestions for error resolution
   */
  static getSuggestions(error: LoadingError): string[] {
    const enhanced = this.analyzeError(error);
    return enhanced.suggestions;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: LoadingError): boolean {
    const enhanced = this.analyzeError(error);
    return enhanced.isRetryable;
  }
} 