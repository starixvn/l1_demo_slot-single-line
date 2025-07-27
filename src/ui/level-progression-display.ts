import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { LEVEL_DATA } from '@/config/level-config';
import { GlobalPlayerState, playerLevel, playerXP } from '@/config/game-globals';
import { GAME_CONSTANTS } from '@/config/game-config';
import { SYMBOL_CONFIGS } from '@/config/symbol-config';
import { SymbolType } from '@/types/slot-types';
import { SymbolSystemScreen } from './symbol-system-screen';

/**
 * Level progression display component showing current level, XP progress, and unlocked symbols
 */
export class LevelProgressionDisplay extends Container {
  private background!: Graphics;
  private levelText!: Text;
  private titleText!: Text;
  private xpProgressBar!: Graphics;
  private xpProgressBarBackground!: Graphics;
  private xpText!: Text;
  private unlockedSymbolsText!: Text;
  private newSymbolsNotification!: Container;
  private symbolSystemScreen: SymbolSystemScreen | null = null;

  // Layout configuration
  private displayWidth: number = 400;
  private displayHeight: number = 150;
  private padding: number = 15;

  constructor() {
    super();
    
    this.setupLevelDisplay();
    this.setupGlobalEventListeners();
    this.updateDisplay();
  }

  /**
   * Set the symbol system screen reference for opening it
   */
  setSymbolSystemScreen(symbolSystemScreen: SymbolSystemScreen): void {
    this.symbolSystemScreen = symbolSystemScreen;
  }

  /**
   * Handle weapons text click to open symbol system screen
   */
  private handleWeaponsClick(): void {
    console.log('LevelProgressionDisplay: Weapons text clicked');
    
    if (this.symbolSystemScreen) {
      if (this.symbolSystemScreen.isVisible()) {
        this.symbolSystemScreen.hide();
        console.log('🔮 Symbol System Screen hidden from level display');
      } else {
        this.symbolSystemScreen.show();
        console.log('🔮 Symbol System Screen opened from level display');
      }
    } else {
      console.warn('Symbol System Screen not available');
    }
  }

  /**
   * Set up global event listeners for level up events
   */
  private setupGlobalEventListeners(): void {
    // Listen for global level up events
    window.addEventListener('playerLevelUp', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { newLevel, newSymbols } = customEvent.detail;
      console.log(`🎉 LevelProgressionDisplay: Received level up event - Level ${newLevel}`);
      
      // Show level up effects
      this.showLevelUpEffects(newLevel, newSymbols);
      
      // Update display
      this.updateDisplay();
    });

    // Listen for XP change events for real-time updates
    window.addEventListener('playerXPChange', (event: Event) => {
      // Update display in real-time when XP changes
      this.updateDisplay();
    });
  }

  /**
   * Show level up effects and animations
   */
  private showLevelUpEffects(newLevel: number, newSymbols: SymbolType[]): void {
    // Flash the level display
    this.levelText.style.fill = 0xFFD700; // Gold
    this.levelText.scale.set(1.2);
    
    // Reset after animation
    setTimeout(() => {
      this.levelText.style.fill = 0xFFD700; // Keep gold
      this.levelText.scale.set(1.0);
    }, 1000);

    // Show new symbols notification
    if (newSymbols.length > 0) {
      this.showNewSymbolsNotification(newSymbols);
    }
  }

  /**
   * Set up the visual components
   */
  private setupLevelDisplay(): void {
    // Create background
    this.background = new Graphics();
    this.addChild(this.background);

    // Create level text (large, prominent)
    const levelStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.LARGE, // Large text for level
      fontWeight: 'bold',
      fill: 0xFFD700, // Gold color for level
      align: 'left',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 2,
    });
    
    this.levelText = new Text('Level 1', levelStyle);
    this.levelText.x = this.padding;
    this.levelText.y = this.padding;
    this.addChild(this.levelText);

    // Create title text (level title)
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL, // Small text for title
      fontWeight: 'normal',
      fill: 0xCCCCCC, // Light gray for subtitle
      align: 'left',
    });
    
    this.titleText = new Text('Novice Warrior', titleStyle);
    this.titleText.x = this.padding;
    this.titleText.y = this.padding + 35;
    this.addChild(this.titleText);

    // Create XP progress bar background
    this.xpProgressBarBackground = new Graphics();
    this.addChild(this.xpProgressBarBackground);

    // Create XP progress bar
    this.xpProgressBar = new Graphics();
    this.addChild(this.xpProgressBar);

    // Create XP text
    const xpStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL, // Small text for XP
      fontWeight: 'normal',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    this.xpText = new Text('0 / 100 XP', xpStyle);
    this.addChild(this.xpText);

    // Create unlocked symbols text (styled as clickable button)
    const symbolsStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.MEDIUM, // Medium text for symbols
      fontWeight: 'bold', // Bold to indicate it's clickable
      fill: 0x00FFFF, // Cyan for symbols
      align: 'left',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    });
    
    this.unlockedSymbolsText = new Text('', symbolsStyle);
    this.unlockedSymbolsText.x = this.padding;
    this.unlockedSymbolsText.y = this.padding + 120;
    
    // Make the weapons text clickable
    this.unlockedSymbolsText.eventMode = 'static';
    this.unlockedSymbolsText.cursor = 'pointer';
    this.unlockedSymbolsText.on('pointerdown', () => {
      this.handleWeaponsClick();
    });
    
    this.addChild(this.unlockedSymbolsText);

    // Create new symbols notification container (initially hidden)
    this.newSymbolsNotification = new Container();
    this.newSymbolsNotification.visible = false;
    this.addChild(this.newSymbolsNotification);

    this.drawBackground();
  }

  /**
   * Draw the background panel
   */
  private drawBackground(): void {
    this.background.clear();
    
    // Semi-transparent background
    this.background.beginFill(0x000000, 0.7);
    this.background.lineStyle(2, 0x444444, 1);
    this.background.drawRoundedRect(0, 0, this.displayWidth, this.displayHeight, 8);
    this.background.endFill();
  }

  /**
   * Create visual XP bar with enhanced graphics
   */
  private createVisualXPBar(): void {
    const barWidth = this.displayWidth - (this.padding * 2);
    const barHeight = 16; // Slightly taller for better visibility
    const barX = this.padding;
    const barY = this.padding + 65;

    // Clear previous bars
    this.xpProgressBarBackground.clear();
    this.xpProgressBar.clear();

    // Get XP progress from global state
    const xpProgress = GlobalPlayerState.getXPProgress();
    const progressPercentage = xpProgress.percentage / 100;

    // Create background with border
    this.xpProgressBarBackground.beginFill(0x333333);
    this.xpProgressBarBackground.lineStyle(2, 0x666666, 1);
    this.xpProgressBarBackground.drawRoundedRect(barX, barY, barWidth, barHeight, 8);
    this.xpProgressBarBackground.endFill();

    // Draw progress with gradient effect
    if (progressPercentage > 0) {
      const fillWidth = barWidth * progressPercentage;
      
      // Dynamic color based on progress
      let progressColor = 0x9932CC; // Purple normally
      if (progressPercentage > 0.8) {
        progressColor = 0xFFD700; // Gold when near complete
      } else if (progressPercentage > 0.5) {
        progressColor = 0x00AAFF; // Blue when halfway
      }
      
      this.xpProgressBar.beginFill(progressColor);
      this.xpProgressBar.drawRoundedRect(barX + 2, barY + 2, fillWidth - 4, barHeight - 4, 6);
      this.xpProgressBar.endFill();

      // Add shine effect on the progress bar
      if (fillWidth > 20) {
        this.xpProgressBar.beginFill(0xFFFFFF, 0.3);
        this.xpProgressBar.drawRoundedRect(barX + 2, barY + 2, Math.min(fillWidth - 4, 40), (barHeight - 4) / 2, 3);
        this.xpProgressBar.endFill();
      }
    }

    // Position XP text in center of bar with shadow
    this.xpText.text = `${xpProgress.current} / ${xpProgress.required} XP (${Math.round(xpProgress.percentage)}%)`;
    this.xpText.x = barX + barWidth / 2;
    this.xpText.y = barY + barHeight / 2;
    this.xpText.anchor.set(0.5, 0.5);
    
    // Add text glow effect
    this.xpText.style.dropShadow = true;
    this.xpText.style.dropShadowColor = 0x000000;
    this.xpText.style.dropShadowBlur = 3;
    this.xpText.style.dropShadowDistance = 1;
  }

  /**
   * Draw the XP progress bar (legacy method, now calls createVisualXPBar)
   */
  private drawXpProgressBar(): void {
    this.createVisualXPBar();
  }

  /**
   * Update all display elements using global state
   */
  private updateDisplay(): void {
    const globalState = GlobalPlayerState.getState();
    const currentLevelData = LEVEL_DATA[globalState.level - 1]; // Convert to 0-indexed

    // Update level text using global variable
    this.levelText.text = `Level ${playerLevel}`;

    // Update title text
    this.titleText.text = currentLevelData.title;

    // Update XP progress bar
    this.drawXpProgressBar();

    // Update unlocked symbols count using global state
    const totalSymbols = Object.keys(SYMBOL_CONFIGS).length;
    const unlockedCount = this.calculateUnlockedSymbolsCount();
    this.unlockedSymbolsText.text = `🔓 Weapons: ${unlockedCount}/${totalSymbols} ⚔️`;
  }

  /**
   * Calculate unlocked symbols count based on current level
   */
  private calculateUnlockedSymbolsCount(): number {
    let count = LEVEL_DATA[0].defaultSymbols.length; // Level 1 defaults
    
    // Add symbols from completed levels
    for (let i = 1; i < playerLevel; i++) {
      if (LEVEL_DATA[i]) {
        count += LEVEL_DATA[i].unlockedSymbols.length;
      }
    }
    
    return count;
  }

  /**
   * Show notification for newly unlocked symbols
   */
  private showNewSymbolsNotification(newSymbols: SymbolType[]): void {
    this.newSymbolsNotification.visible = true;
    this.newSymbolsNotification.removeChildren(); // Clear previous notification

    // Create notification background
    const notificationBg = new Graphics();
    notificationBg.beginFill(0x00FFFF, 0.8);
    notificationBg.lineStyle(2, 0x00AAAA, 1);
    notificationBg.drawRoundedRect(0, 0, this.displayWidth - 20, 40, 5);
    notificationBg.endFill();
    
    notificationBg.x = 10;
    notificationBg.y = this.displayHeight + 10;
    this.newSymbolsNotification.addChild(notificationBg);

    // Create notification text
    const symbolNames = newSymbols.map(symbol => SYMBOL_CONFIGS[symbol].name).join(', ');
    const notificationStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL, // Small text for notification
      fontWeight: 'bold',
      fill: 0x000000,
      align: 'center',
    });

    const notificationText = new Text(`🎉 New: ${symbolNames}`, notificationStyle);
    notificationText.anchor.set(0.5, 0.5);
    notificationText.x = (this.displayWidth - 20) / 2;
    notificationText.y = 20;
    notificationBg.addChild(notificationText);

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      this.hideNewSymbolsNotification();
    }, 5000);
  }

  /**
   * Hide new symbols notification
   */
  private hideNewSymbolsNotification(): void {
    this.newSymbolsNotification.visible = false;
  }

  /**
   * Refresh the display (call when progression changes)
   */
  public refresh(): void {
    this.updateDisplay();
  }

  /**
   * Set display position
   */
  public setDisplayPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Get display dimensions
   */
  public getDisplaySize(): { width: number; height: number } {
    return {
      width: this.displayWidth,
      height: this.displayHeight
    };
  }

  /**
   * Set display dimensions
   */
  public setDisplaySize(width: number, height: number): void {
    this.displayWidth = width;
    this.displayHeight = height;
    this.drawBackground();
    this.repositionElements();
  }

  /**
   * Reposition elements after size change
   */
  private repositionElements(): void {
    // Update positions based on new dimensions
    this.levelText.x = this.padding;
    this.levelText.y = this.padding;
    
    this.titleText.x = this.padding;
    this.titleText.y = this.padding + 35;
    
    this.unlockedSymbolsText.x = this.padding;
    this.unlockedSymbolsText.y = this.displayHeight - 30;
    
    // Redraw XP progress bar with new dimensions
    this.drawXpProgressBar();
  }

  /**
   * Get current progression info for external use
   */
  public getProgressionInfo(): {
    level: number;
    xpProgress: { current: number; required: number; percentage: number };
    unlockedSymbolsCount: number;
  } {
    const globalState = GlobalPlayerState.getState();
    const xpProgress = GlobalPlayerState.getXPProgress();
    
    return {
      level: globalState.level,
      xpProgress,
      unlockedSymbolsCount: this.calculateUnlockedSymbolsCount()
    };
  }
} 