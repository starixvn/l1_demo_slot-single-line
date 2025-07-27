import { Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';
import { SymbolType } from '@/types/slot-types';
import { SYMBOL_CONFIGS } from '@/config/symbol-config';
import { currentUnlockedSymbolPool } from '@/config/level-config';
import { LEVEL_DATA } from '@/config/level-config';
import { GlobalPlayerState, playerLevel } from '@/config/game-globals';
import { getSymbolTexture } from '@/systems/asset-manager';
import { GAME_CONSTANTS } from '@/config/game-config';

/**
 * Simplified Symbol System Screen with fixed dimensions and proper scroll
 */
export class SymbolSystemScreen extends Container {
  private background!: Graphics;
  private overlay!: Graphics;
  private headerContainer!: Container;
  private gridScrollContainer!: Container;
  private gridContentContainer!: Container;
  private progressContainer!: Container;
  private closeButton!: Container;
  
  // Fixed layout dimensions - no over-calculation
  private readonly SCREEN_WIDTH = 1400;
  private readonly SCREEN_HEIGHT = 900;
  private readonly HEADER_HEIGHT = 120; // Fixed 120px
  private readonly PROGRESS_HEIGHT = 120; // Fixed 120px
  private readonly GRID_HEIGHT = this.SCREEN_HEIGHT - (this.HEADER_HEIGHT + this.PROGRESS_HEIGHT); // 660px
  private readonly GRID_PADDING = 20; // Grid padding
  private readonly SYMBOL_SPACING = 5; // Spacing between symbols
  private readonly GRID_COLS = 7;
  private readonly SYMBOL_SIZE = 160;
  
  // Scroll properties
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private scrollMask!: Graphics;

  constructor() {
    super();
    this.setupScreen();
    this.setupLevelUpListener();
    this.visible = false;
  }

  /**
   * Set up the simplified screen with fixed dimensions
   */
  private setupScreen(): void {
    // Create overlay background
    this.overlay = new Graphics();
    this.overlay.beginFill(0x000000, 0.8);
    this.overlay.drawRect(-2000, -1200, 4000, 2400);
    this.overlay.endFill();
    this.overlay.interactive = true;
    this.addChild(this.overlay);

    // Create main background
    this.background = new Graphics();
    this.addChild(this.background);

    // Create fixed sections
    this.createHeaderSection();
    this.createGridScrollContainer();
    this.createProgressSection();
    this.createCloseButton();
    this.setupScrolling();

    this.drawBackground();
    this.updateContent();
  }

  /**
   * Set up level up event listener to refresh symbol display
   */
  private setupLevelUpListener(): void {
    window.addEventListener('playerLevelUp', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔮 SymbolSystemScreen: Level up event received, refreshing display');
      console.log('🔮 SymbolSystemScreen: Event details:', customEvent.detail);
      console.log('🔮 SymbolSystemScreen: Current visible state:', this.visible);
      
      // Always refresh, even if not visible, so it's ready when opened
      this.updateContent();
      this.createSymbolGrid();
      console.log('🔮 SymbolSystemScreen: Refresh completed');
    });
  }

  /**
   * Draw background with fixed section lines
   */
  private drawBackground(): void {
    this.background.clear();
    
    // Main panel background (centered on screen)
    this.background.beginFill(0x0a0a1e, 0.95);
    this.background.lineStyle(3, 0x00FFFF, 1);
    this.background.drawRoundedRect(
      -this.SCREEN_WIDTH / 2, 
      -this.SCREEN_HEIGHT / 2, 
      this.SCREEN_WIDTH, 
      this.SCREEN_HEIGHT, 
      20
    );
    this.background.endFill();

    // Header separator line 
    const headerBottomY = -this.SCREEN_HEIGHT / 2 + this.HEADER_HEIGHT;
    this.background.lineStyle(2, 0x00FFFF, 0.6);
    this.background.moveTo(-this.SCREEN_WIDTH / 2 + 20, headerBottomY);
    this.background.lineTo(this.SCREEN_WIDTH / 2 - 20, headerBottomY);
    
    // Progress separator line
    const progressTopY = this.SCREEN_HEIGHT / 2 - this.PROGRESS_HEIGHT;
    this.background.lineStyle(2, 0x00FFFF, 0.6);
    this.background.moveTo(-this.SCREEN_WIDTH / 2 + 20, progressTopY);
    this.background.lineTo(this.SCREEN_WIDTH / 2 - 20, progressTopY);
  }

  /**
   * Create header section (120px, centrally aligned)
   */
  private createHeaderSection(): void {
    this.headerContainer = new Container();
    
    // Title text centered in 120px header
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
      fontWeight: 'bold',
      fill: 0x00FFFF,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    });

    const titleText = new Text('🔮 SYMBOL SYSTEM 🔮', titleStyle);
    titleText.anchor.set(0.5, 0.5);
    titleText.x = 0;
    titleText.y = -this.SCREEN_HEIGHT / 2 + this.HEADER_HEIGHT / 2; // Center in header
    this.headerContainer.addChild(titleText);

    this.addChild(this.headerContainer);
  }

  /**
   * Create grid scroll container with mask
   */
  private createGridScrollContainer(): void {
    // Create scroll container for the grid
    this.gridScrollContainer = new Container();
    
    // Position the scroll container at the start of the grid area
    const gridStartY = -this.SCREEN_HEIGHT / 2 + this.HEADER_HEIGHT; // Grid starts after header
    this.gridScrollContainer.x = 0;
    this.gridScrollContainer.y = gridStartY;
    
    // Create mask for the full grid area (660px)
    this.scrollMask = new Graphics();
    this.scrollMask.beginFill(0x000000);
    this.scrollMask.drawRect(
      -this.SCREEN_WIDTH / 2 + this.GRID_PADDING,
      gridStartY,
      this.SCREEN_WIDTH - (this.GRID_PADDING * 2),
      this.GRID_HEIGHT
    );
    this.scrollMask.endFill();
    this.addChild(this.scrollMask);
    
    // Apply mask
    this.gridScrollContainer.mask = this.scrollMask;
    
    // Create content container inside scroll container
    this.gridContentContainer = new Container();
    this.gridScrollContainer.addChild(this.gridContentContainer);
    
    this.addChild(this.gridScrollContainer);
    this.createSymbolGrid();
  }

  /**
   * Create symbol grid with 5px spacing
   */
  private createSymbolGrid(): void {
    this.gridContentContainer.removeChildren();
    
    const allSymbols = Object.values(SymbolType).slice(0, 28);
    const symbolTotalSize = this.SYMBOL_SIZE + this.SYMBOL_SPACING;
    
    // Calculate grid layout
    const startX = -((this.GRID_COLS - 1) * symbolTotalSize) / 2;
    const startY = this.GRID_PADDING + (this.SYMBOL_SIZE / 2); // 20px padding + 60px to center = 80px from container

    allSymbols.forEach((symbolType, index) => {
      const col = index % this.GRID_COLS;
      const row = Math.floor(index / this.GRID_COLS);
      
      const symbolDisplay = this.createSymbolCard(symbolType);
      symbolDisplay.x = startX + (col * symbolTotalSize);
      symbolDisplay.y = startY + (row * symbolTotalSize);
      
      this.gridContentContainer.addChild(symbolDisplay);
    });

    // Calculate scroll limits
    const totalRows = Math.ceil(allSymbols.length / this.GRID_COLS);
    const contentHeight = (totalRows * symbolTotalSize) + (this.GRID_PADDING * 2); // Include top and bottom padding
    const availableHeight = this.GRID_HEIGHT; // Full 660px grid area
    this.maxScrollY = Math.max(0, contentHeight - availableHeight);
  }

  /**
   * Create symbol card with uniform background
   */
  private createSymbolCard(symbolType: SymbolType): Container {
    const cardContainer = new Container();
    const config = SYMBOL_CONFIGS[symbolType];
    const isUnlocked = currentUnlockedSymbolPool.includes(symbolType);
    const unlockLevel = this.findUnlockLevel(symbolType);

    // Symbol sprite (120x120px)
    const texture = getSymbolTexture(symbolType);
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      const scale = Math.min(120 / sprite.width, 120 / sprite.height); // Set to 120x120px
      sprite.scale.set(scale);
      
      if (!isUnlocked) {
        sprite.tint = 0x666666;
        sprite.alpha = 0.5;
      }
      
      cardContainer.addChild(sprite);
    }

    // Lock overlay for locked symbols
    if (!isUnlocked) {
      const lockOverlay = new Graphics();
      lockOverlay.beginFill(0x000000, 0.7);
      lockOverlay.drawRoundedRect(-this.SYMBOL_SIZE/2, -this.SYMBOL_SIZE/2, this.SYMBOL_SIZE, this.SYMBOL_SIZE, 12);
      lockOverlay.endFill();
      cardContainer.addChild(lockOverlay);

      const lockIcon = new Text('🔒', new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
        fill: 0xFFFFFF,
        align: 'center',
      }));
      lockIcon.anchor.set(0.5, 0.5);
      cardContainer.addChild(lockIcon);
    }

    // Damage value (bigger with "DAM" postfix)
    const damageText = new Text(`${config.value} DAM`, new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM, // Increased from SMALL to MEDIUM
      fontWeight: 'bold',
      fill: isUnlocked ? 0x00FF00 : 0x888888, // Green for unlocked, gray for locked
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 2,
    }));

    damageText.anchor.set(1, 0);
    damageText.x = this.SYMBOL_SIZE/2 - 8;
    damageText.y = -this.SYMBOL_SIZE/2 + 8;
    cardContainer.addChild(damageText);

    // Unlock level label (only for locked symbols)
    if (!isUnlocked) {
      const unlockText = new Text(`unlock at level ${unlockLevel}`, new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL,
        fill: 0x999999,
        align: 'center',
      }));
      unlockText.anchor.set(0.5, 1);
      unlockText.x = 0;
      unlockText.y = this.SYMBOL_SIZE/2 - 8;
      cardContainer.addChild(unlockText);
    }

    return cardContainer;
  }

  /**
   * Find which level unlocks the given symbol
   */
  private findUnlockLevel(symbolType: SymbolType): number {
    // Level 1 default symbols (0-9)
    const symbolNumber = parseInt(symbolType.replace('symbol_', ''));
    if (symbolNumber >= 0 && symbolNumber <= 9) {
      return 1;
    }
    
    // For levels 2-10, each level unlocks 2 symbols
    // Level 2: symbols 10-11, Level 3: symbols 12-13, etc.
    const level = Math.floor((symbolNumber - 10) / 2) + 2;
    return Math.min(level, 10); // Cap at level 10
  }

  /**
   * Create progress section (120px, centrally aligned)
   */
  private createProgressSection(): void {
    this.progressContainer = new Container();
    this.progressContainer.y = this.SCREEN_HEIGHT / 2 - this.PROGRESS_HEIGHT / 2; // Center in progress section
    this.addChild(this.progressContainer);
  }

  /**
   * Create close button
   */
  private createCloseButton(): void {
    this.closeButton = new Container();
    
    const buttonBg = new Graphics();
    buttonBg.beginFill(0xFF4444, 0.8);
    buttonBg.lineStyle(2, 0xFFFFFF, 1);
    buttonBg.drawRoundedRect(-15, -15, 30, 30, 8);
    buttonBg.endFill();
    this.closeButton.addChild(buttonBg);

    const closeText = new Text('✕', new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    }));
    closeText.anchor.set(0.5, 0.5);
    this.closeButton.addChild(closeText);

    this.closeButton.x = this.SCREEN_WIDTH / 2 - 25;
    this.closeButton.y = -this.SCREEN_HEIGHT / 2 + 25; // 25px from screen top

    this.closeButton.interactive = true;
    this.closeButton.cursor = 'pointer';
    this.closeButton.on('pointerdown', () => this.hide());

    this.addChild(this.closeButton);
  }

  /**
   * Set up simple scrolling
   */
  private setupScrolling(): void {
    this.overlay.on('wheel', (event: any) => {
      if (this.maxScrollY > 0) {
        const deltaY = event.deltaY;
        this.scroll(deltaY * 0.5);
        event.preventDefault();
      }
    });

    let startY = 0;
    let isDragging = false;

    this.overlay.on('pointerdown', (event: any) => {
      startY = event.data.global.y;
      isDragging = true;
    });

    this.overlay.on('pointermove', (event: any) => {
      if (isDragging && this.maxScrollY > 0) {
        const currentY = event.data.global.y;
        const deltaY = startY - currentY;
        this.scroll(deltaY * 1.5);
        startY = currentY;
      }
    });

    this.overlay.on('pointerup', () => {
      isDragging = false;
    });

    this.overlay.on('pointerupoutside', () => {
      isDragging = false;
    });
  }

  /**
   * Simple scroll function
   */
  private scroll(deltaY: number): void {
    this.scrollY += deltaY;
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY));
    this.gridContentContainer.y = -this.scrollY;
  }

  /**
   * Update progress section content
   */
  private updateContent(): void {
    this.progressContainer.removeChildren();

    const unlockedCount = currentUnlockedSymbolPool.length;
    const totalSymbols = 28;

    // Level and progress text (horizontally arranged)
    const levelText = new Text(`Level ${playerLevel}`, new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
      fontWeight: 'bold',
      fill: 0xFFD700,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 2,
    }));
    levelText.anchor.set(0.5, 0.5);
    levelText.x = -200;
    levelText.y = -20;

    const progressText = new Text(`🔓 Unlocked: ${unlockedCount}/${totalSymbols}`, new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE,
      fontWeight: 'bold',
      fill: 0x00FFFF,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 2,
    }));
    progressText.anchor.set(0.5, 0.5);
    progressText.x = 200;
    progressText.y = -20;

    this.progressContainer.addChild(levelText);
    this.progressContainer.addChild(progressText);

    // Progress bar
    const barWidth = 500;
    const barHeight = 24;
    const progressPercentage = unlockedCount / totalSymbols;

    const progressBg = new Graphics();
    progressBg.beginFill(0x333333);
    progressBg.lineStyle(2, 0x00FFFF, 1);
    progressBg.drawRoundedRect(-barWidth/2, 20, barWidth, barHeight, 12);
    progressBg.endFill();
    this.progressContainer.addChild(progressBg);

    if (progressPercentage > 0) {
      const progressBar = new Graphics();
      progressBar.beginFill(0x00FFFF);
      progressBar.drawRoundedRect(-barWidth/2 + 2, 22, (barWidth - 4) * progressPercentage, barHeight - 4, 10);
      progressBar.endFill();
      this.progressContainer.addChild(progressBar);

      const percentText = new Text(`${Math.round(progressPercentage * 100)}%`, new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        align: 'center',
      }));
      percentText.anchor.set(0.5, 0.5);
      percentText.x = 0;
      percentText.y = 32;
      this.progressContainer.addChild(percentText);
    }

    // Scroll hint if needed
    if (this.maxScrollY > 0) {
      const scrollHint = new Text('🖱️ Scroll to see more symbols', new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL,
        fill: 0x888888,
        align: 'center',
      }));
      scrollHint.anchor.set(0.5, 0);
      scrollHint.y = 55;
      this.progressContainer.addChild(scrollHint);
    }
  }

  /**
   * Show the screen
   */
  show(): void {
    this.visible = true;
    this.updateContent();
    this.scrollY = 0;
    this.gridContentContainer.y = 0;
    
    this.alpha = 0;
    this.scale.set(0.8);
    
    const animateIn = () => {
      this.alpha = Math.min(1, this.alpha + 0.1);
      this.scale.set(Math.min(1, this.scale.x + 0.02));
      
      if (this.alpha < 1) {
        requestAnimationFrame(animateIn);
      }
    };
    
    animateIn();
  }

  /**
   * Hide the screen
   */
  hide(): void {
    const animateOut = () => {
      this.alpha = Math.max(0, this.alpha - 0.15);
      this.scale.set(Math.max(0.8, this.scale.x - 0.03));
      
      if (this.alpha > 0) {
        requestAnimationFrame(animateOut);
      } else {
        this.visible = false;
        this.alpha = 1;
        this.scale.set(1);
      }
    };
    
    animateOut();
  }

  /**
   * Refresh the screen content
   */
  refresh(): void {
    if (this.visible) {
      this.updateContent();
      this.createSymbolGrid();
    }
  }

  /**
   * Check if screen is visible
   */
  isVisible(): boolean {
    return this.visible;
  }
} 