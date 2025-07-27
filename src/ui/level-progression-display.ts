import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PlayerProgressionManager, LEVEL_DATA } from '@/config/level-config';
import { GAME_CONSTANTS } from '@/config/game-config';
import { SYMBOL_CONFIGS } from '@/config/symbol-config';
import { SymbolType } from '@/types/slot-types';

/**
 * Level progression display component showing current level, XP progress, and unlocked symbols
 */
export class LevelProgressionDisplay extends Container {
  private progressionManager: PlayerProgressionManager;
  private background!: Graphics;
  private levelText!: Text;
  private titleText!: Text;
  private xpProgressBar!: Graphics;
  private xpProgressBarBackground!: Graphics;
  private xpText!: Text;
  private unlockedSymbolsText!: Text;
  private newSymbolsNotification!: Container;

  // Layout configuration
  private displayWidth: number = 400;
  private displayHeight: number = 150;
  private padding: number = 15;

  constructor() {
    super();
    
    this.progressionManager = PlayerProgressionManager.getInstance();
    this.setupLevelDisplay();
    this.updateDisplay();
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

    // Create unlocked symbols text
    const symbolsStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: GAME_CONSTANTS.FONT_SIZES.SMALL, // Small text for symbols
      fontWeight: 'normal',
      fill: 0x00FFFF, // Cyan for symbols
      align: 'left',
    });
    
    this.unlockedSymbolsText = new Text('', symbolsStyle);
    this.unlockedSymbolsText.x = this.padding;
    this.unlockedSymbolsText.y = this.padding + 120;
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
   * Draw the XP progress bar
   */
  private drawXpProgressBar(): void {
    const barWidth = this.displayWidth - (this.padding * 2);
    const barHeight = 12;
    const barX = this.padding;
    const barY = this.padding + 65;

    // Clear previous bars
    this.xpProgressBarBackground.clear();
    this.xpProgressBar.clear();

    // Get XP progress
    const xpProgress = this.progressionManager.getXpProgress();
    const progressPercentage = xpProgress.percentage / 100;

    // Draw background
    this.xpProgressBarBackground.beginFill(0x333333);
    this.xpProgressBarBackground.lineStyle(1, 0x666666, 1);
    this.xpProgressBarBackground.drawRoundedRect(barX, barY, barWidth, barHeight, 6);
    this.xpProgressBarBackground.endFill();

    // Draw progress
    if (progressPercentage > 0) {
      const fillWidth = barWidth * progressPercentage;
      
      // Gradient effect for progress bar
      const isNearComplete = progressPercentage > 0.8;
      const progressColor = isNearComplete ? 0xFFD700 : 0x9932CC; // Gold when near complete, purple normally
      
      this.xpProgressBar.beginFill(progressColor);
      this.xpProgressBar.drawRoundedRect(barX, barY, fillWidth, barHeight, 6);
      this.xpProgressBar.endFill();
    }

    // Position XP text in center of bar
    this.xpText.text = `${xpProgress.current} / ${xpProgress.required} XP`;
    this.xpText.x = barX + barWidth / 2;
    this.xpText.y = barY + barHeight / 2;
    this.xpText.anchor.set(0.5, 0.5);
  }

  /**
   * Update all display elements
   */
  private updateDisplay(): void {
    const progression = this.progressionManager.getProgression();
    const currentLevelData = this.progressionManager.getCurrentLevelData();

    // Update level text
    this.levelText.text = `Level ${progression.currentLevel}`;

    // Update title text
    this.titleText.text = currentLevelData.title;

    // Update XP progress bar
    this.drawXpProgressBar();

    // Update unlocked symbols count
    const unlockedCount = progression.unlockedSymbols.length;
    const totalSymbols = Object.keys(SYMBOL_CONFIGS).length;
    this.unlockedSymbolsText.text = `🔓 Weapons: ${unlockedCount}/${totalSymbols}`;

    // Check for new symbols notification
    if (progression.newSymbolsToShow.length > 0) {
      this.showNewSymbolsNotification(progression.newSymbolsToShow);
    }
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
    this.progressionManager.clearNewSymbolsNotification();
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
    const progression = this.progressionManager.getProgression();
    const xpProgress = this.progressionManager.getXpProgress();
    
    return {
      level: progression.currentLevel,
      xpProgress,
      unlockedSymbolsCount: progression.unlockedSymbols.length
    };
  }
} 