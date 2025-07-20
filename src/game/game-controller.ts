import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CombatSystem } from './combat-system';
import { SymbolType, GameState } from '@/types/slot-types';
import { GameLoopManager } from '@/systems/game-loop-manager';
import { PlayerInfoDisplay } from '@/ui/player-info-display';
import { SettingsPanel } from '@/ui/settings-panel';

/**
 * Game controller that manages user interactions and game flow with new responsive layout
 */
export class GameController extends Container {
  private combatSystem!: CombatSystem;
  private spinButton!: Container;
  private testButton!: Container;
  private resetButton!: Container;
  private buttonContainer!: Container;
  private statusText!: Text;
  private gameLoopManager: GameLoopManager;
  private playerInfoDisplay!: PlayerInfoDisplay;
  private settingsPanel!: SettingsPanel;

  // Layout configuration based on canvas dimensions
  private canvasWidth: number = 1920;
  private canvasHeight: number = 1080;
  private readonly MONSTER_AREA_HEIGHT_RATIO = 0.30;
  private readonly WEAPON_AREA_HEIGHT_RATIO = 0.40;
  private readonly UI_PADDING = 20;

  constructor() {
    super();
    
    this.gameLoopManager = GameLoopManager.getInstance();
    
    this.setupGameController();
    this.setupGameLoopListeners();
    this.setupUIComponents();
    
    // Position all elements after everything is created
    this.repositionAllElements();
  }

  /**
   * Set canvas dimensions for responsive layout calculations
   */
  public setCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.repositionAllElements();
  }

  /**
   * Set up the game controller components with new layout
   */
  private setupGameController(): void {
    // Create combat system (includes slot machine and monsters)
    this.combatSystem = new CombatSystem();
    this.addChild(this.combatSystem);
    
    // Create button container
    this.buttonContainer = new Container();
    this.addChild(this.buttonContainer);
    
    // Create buttons
    this.createButtons();
    
    // Create status display
    this.createStatusDisplay();
    
    console.log('GameController: Initialized with new responsive layout');
  }

  /**
   * Set up additional UI components
   */
  private setupUIComponents(): void {
    // Create player info display
    this.playerInfoDisplay = new PlayerInfoDisplay();
    this.addChild(this.playerInfoDisplay);
    
    // Create settings panel
    this.settingsPanel = new SettingsPanel();
    this.addChild(this.settingsPanel);
    
    console.log('GameController: UI components setup complete');
  }

  /**
   * Position all UI elements according to the new responsive layout
   */
  private repositionAllElements(): void {
    const centerX = 0; // Game controller is already centered
    const topY = -this.canvasHeight / 2;
    const bottomY = this.canvasHeight / 2;
    
    // Calculate area boundaries
    const monsterAreaHeight = this.canvasHeight * this.MONSTER_AREA_HEIGHT_RATIO;
    const weaponAreaHeight = this.canvasHeight * this.WEAPON_AREA_HEIGHT_RATIO;
    
    const monsterAreaTop = topY + this.UI_PADDING;
    const monsterAreaBottom = monsterAreaTop + monsterAreaHeight;
    
    const weaponAreaTop = monsterAreaBottom + this.UI_PADDING;
    const weaponAreaBottom = weaponAreaTop + weaponAreaHeight;
    
    // 1. Position Combat System (Monster trails at top, Weapon slot below)
    if (this.combatSystem) {
      this.positionCombatSystem(centerX, monsterAreaTop, weaponAreaTop);
    }
    
    // 2. Position Settings Panel (top-left corner)
    if (this.settingsPanel) {
      this.settingsPanel.setPosition(
        -this.canvasWidth / 2 + this.UI_PADDING + 25, // Slightly offset from edge
        topY + this.UI_PADDING + 25
      );
      this.settingsPanel.setPopupCenter(centerX, 0); // Center popup on screen
    }
    
    // 3. Position Control Buttons (below weapon slot)
    if (this.buttonContainer) {
      const buttonsY = weaponAreaBottom + this.UI_PADDING + 30;
      this.buttonContainer.x = centerX;
      this.buttonContainer.y = buttonsY;
      
      // 4. Position Player Info Panel (below buttons)
      if (this.playerInfoDisplay) {
        const infoSize = this.playerInfoDisplay.getDisplaySize();
        this.playerInfoDisplay.setDisplayPosition(
          centerX - infoSize.width / 2,
          buttonsY + 60 // Below buttons with spacing
        );
      }
    }
    
    // 5. Position Status Display (left-bottom corner)
    if (this.statusText) {
      this.statusText.x = -this.canvasWidth / 2 + this.UI_PADDING;
      this.statusText.y = bottomY - 100; // Above bottom edge
    }
    
    console.log('GameController: All elements repositioned for new layout');
  }

  /**
   * Position the combat system components (monster trails and weapon slot)
   */
  private positionCombatSystem(centerX: number, monsterAreaTop: number, weaponAreaTop: number): void {
    if (!this.combatSystem) return;
    
    this.combatSystem.x = centerX;
    this.combatSystem.y = 0;
    
    // Update combat system internal layout
    this.combatSystem.updateLayout({
      monsterAreaY: monsterAreaTop,
      weaponAreaY: weaponAreaTop,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight
    });
  }

  /**
   * Create status display for game state and respin info
   */
  private createStatusDisplay(): void {
    const statusStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 12, // Smaller font for status
      fill: 0xAAAAAA,
      align: 'left',
    });
    
    this.statusText = new Text('', statusStyle);
    this.addChild(this.statusText);
    
    this.updateStatusDisplay();
  }

  /**
   * Set up game loop event listeners
   */
  private setupGameLoopListeners(): void {
    this.gameLoopManager.on('stateChanged', (newState: GameState, oldState: GameState) => {
      console.log(`GameController: State changed from ${oldState} to ${newState}`);
      this.updateStatusDisplay();
      this.updateButtonStates();
    });
    
    this.gameLoopManager.on('respinActivated', (respinInfo: any) => {
      console.log('GameController: Respins activated!', respinInfo);
      this.updateStatusDisplay();
    });
    
    this.gameLoopManager.on('respinCompleted', (respinInfo: any) => {
      console.log('GameController: Respins completed!', respinInfo);
      this.updateStatusDisplay();
    });
    
    this.gameLoopManager.on('gameError', (error: any) => {
      console.error('GameController: Game loop error:', error);
    });
  }

  /**
   * Update status display with current game state
   */
  private updateStatusDisplay(): void {
    const stats = this.gameLoopManager.getGameStats();
    this.statusText.text = `Status:\n${stats}`;
  }

  /**
   * Update button states based on game state
   */
  private updateButtonStates(): void {
    const canSpin = this.gameLoopManager.canSpin();
    const currentState = this.gameLoopManager.getCurrentState();
    
    console.log(`GameController: updateButtonStates() - canSpin: ${canSpin}, currentState: ${currentState}`);
    
    // Update spin button text based on state
    const spinButtonText = this.spinButton.getChildAt(1) as Text;
    if (currentState === GameState.RESPINNING) {
      spinButtonText.text = '🔄 RESPIN 🔄';
      (this.spinButton.getChildAt(0) as Graphics).tint = 0x00FFFF;
    } else {
      spinButtonText.text = '🎰 SPIN 🎰';
      (this.spinButton.getChildAt(0) as Graphics).tint = canSpin ? 0xFFFFFF : 0x666666;
    }
    
    // Disable/enable buttons based on state
    this.spinButton.alpha = canSpin ? 1.0 : 0.5;
    this.spinButton.eventMode = canSpin ? 'static' : 'none';
    
    console.log(`GameController: Spin button - alpha: ${this.spinButton.alpha}, eventMode: ${this.spinButton.eventMode}`);
  }
  
  /**
   * Create interactive buttons with new horizontal layout
   */
  private createButtons(): void {
    console.log('GameController: Creating buttons...');
    
    const buttonSpacing = 180; // Equal spacing between buttons
    
    // Spin button (left)
    this.spinButton = this.createButton('🎰 SPIN 🎰', 0x2ECC71, -buttonSpacing, 0);
    this.spinButton.eventMode = 'static';
    this.spinButton.cursor = 'pointer';
    this.spinButton.on('pointerdown', () => {
      console.log('GameController: Spin button pointerdown event triggered!');
      this.handleSpin();
    });
    this.buttonContainer.addChild(this.spinButton);
    
    console.log('GameController: Spin button created and added to container');
    
    // Reset button (center)
    this.resetButton = this.createButton('Reset', 0xE74C3C, 0, 0);
    this.resetButton.eventMode = 'static';
    this.resetButton.cursor = 'pointer';
    this.resetButton.on('pointerdown', () => {
      console.log('GameController: Reset button clicked');
      this.handleReset();
    });
    this.buttonContainer.addChild(this.resetButton);
    
    // Test win button (right)
    this.testButton = this.createButton('Test Win', 0xF39C12, buttonSpacing, 0);
    this.testButton.eventMode = 'static';
    this.testButton.cursor = 'pointer';
    this.testButton.on('pointerdown', () => {
      console.log('GameController: Test button clicked');
      this.handleTestWin();
    });
    this.buttonContainer.addChild(this.testButton);
    
    console.log('GameController: All buttons created successfully');
  }
  
  /**
   * Create a button with background and text
   */
  private createButton(text: string, color: number, x: number, y: number): Container {
    const button = new Container();
    button.x = x;
    button.y = y;
    
    // Button background
    const bg = new Graphics();
    bg.beginFill(color, 0.8);
    bg.drawRoundedRect(-75, -25, 150, 50, 10);
    bg.endFill();
    
    // Button border
    bg.lineStyle(2, 0xFFFFFF, 1);
    bg.drawRoundedRect(-75, -25, 150, 50, 10);
    
    // Button text
    const textStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    });
    
    const buttonText = new Text(text, textStyle);
    buttonText.anchor.set(0.5, 0.5);
    
    button.addChild(bg);
    button.addChild(buttonText);
    
    // Add hover effects
    button.on('pointerover', () => {
      bg.clear();
      bg.beginFill(color, 1.0);
      bg.drawRoundedRect(-75, -25, 150, 50, 10);
      bg.endFill();
      bg.lineStyle(3, 0xFFD700, 1);
      bg.drawRoundedRect(-75, -25, 150, 50, 10);
    });
    
    button.on('pointerout', () => {
      bg.clear();
      bg.beginFill(color, 0.8);
      bg.drawRoundedRect(-75, -25, 150, 50, 10);
      bg.endFill();
      bg.lineStyle(2, 0xFFFFFF, 1);
      bg.drawRoundedRect(-75, -25, 150, 50, 10);
    });
    
    return button;
  }
  
  /**
   * Handle spin button click
   */
  private async handleSpin(): Promise<void> {
    console.log('GameController: handleSpin() called - spin button was clicked!');
    
    if (!this.gameLoopManager.canSpin()) {
      console.log('GameController: Cannot spin in current state:', this.gameLoopManager.getCurrentState());
      return;
    }
    
    const currentState = this.gameLoopManager.getCurrentState();
    const isRespin = currentState === GameState.RESPINNING;
    console.log(`GameController: ${isRespin ? 'Respin' : 'Spin'} initiated, current state: ${currentState}`);
    
    // Reset win display at start of new spin (but not respin)
    if (!isRespin) {
      this.playerInfoDisplay.resetWin();
    }
    
    try {
      console.log('GameController: Calling combatSystem.performCombatSpin()');
      const { spinResult, combatResults } = await this.combatSystem.performCombatSpin();
      console.log('GameController: Combat results received:', { spinResult, combatResults });
      
      // Update player info display with spin results
      this.updatePlayerInfoFromSpin(spinResult, combatResults, isRespin);
      
      // Log detailed combat information
      if (combatResults.length > 0) {
        const totalDamage = combatResults.reduce((sum, result) => sum + result.damage, 0);
        const totalRewards = combatResults.reduce((sum, result) => sum + (result.rewards?.coins || 0), 0);
        console.log(`Combat summary: ${totalDamage} total damage, ${totalRewards} coins earned`);
      }
      
      // Update displays
      this.updateStatusDisplay();
      
    } catch (error) {
      console.error('GameController: Combat error:', error);
    }
  }

  /**
   * Update player info display based on spin results
   */
  private updatePlayerInfoFromSpin(spinResult: any, combatResults: any[], isRespin: boolean): void {
    // Update balance from game loop manager
    const gameState = this.gameLoopManager.getGameState();
    this.playerInfoDisplay.updateBalance(gameState.balance);
    
    // Update bet amount (only deducted on regular spins, not respins)
    if (!isRespin) {
      this.playerInfoDisplay.updateBet(10); // Default bet amount
    }
    
    // Calculate total win from spin result and combat rewards
    let totalWin = spinResult.payout || 0;
    if (combatResults && combatResults.length > 0) {
      const combatRewards = combatResults.reduce((sum, result) => 
        sum + (result.rewards?.coins || 0), 0);
      totalWin += combatRewards;
    }
    
    // Update win display
    if (totalWin > 0) {
      this.playerInfoDisplay.updateWin(totalWin);
    }
    
    console.log(`GameController: Updated player info - Balance: ${gameState.balance}, Win: ${totalWin}`);
  }
  
  /**
   * Handle test win button click (for demonstration)
   */
  private handleTestWin(): void {
    console.log('GameController: Test win button clicked');
    
    // Set all reels to the same high-value symbol for testing
    const testSymbols: SymbolType[] = [
      SymbolType.CRUSADER_BLADE,
      SymbolType.CRUSADER_BLADE,
      SymbolType.CRUSADER_BLADE,
    ];
    
    this.combatSystem.getSlotMachine().setSymbols(testSymbols);
    
    // Simulate a win calculation
    setTimeout(async () => {
      await this.combatSystem.performCombatSpin();
    }, 100);
  }
  
  /**
   * Handle reset button click
   */
  private handleReset(): void {
    console.log('GameController: Reset button clicked');
    
    // Add coins to balance
    this.combatSystem.getSlotMachine().addCoins(500);
    
    // Reset reel highlights and combat
    this.combatSystem.getSlotMachine().getReels().forEach(reel => reel.highlight(false));
    this.combatSystem.resetCombat();
    
    // Reset player info display
    this.playerInfoDisplay.resetStats();
    
    // Update player info with current game state
    const gameState = this.gameLoopManager.getGameState();
    this.playerInfoDisplay.updateBalance(gameState.balance);
    
    // Update displays
    this.updateStatusDisplay();
  }
  
  /**
   * Get the combat system instance
   */
  getCombatSystem(): CombatSystem {
    return this.combatSystem;
  }
  
  /**
   * Get the slot machine instance (through combat system)
   */
  getSlotMachine() {
    return this.combatSystem.getSlotMachine();
  }
  
  /**
   * Handle keyboard input
   */
  handleKeyPress(key: string): void {
    switch (key.toLowerCase()) {
      case ' ':
      case 'enter':
        this.handleSpin();
        break;
      case 't':
        this.handleTestWin();
        break;
      case 'r':
        this.handleReset();
        break;
      case 's':
      case 'escape':
        // Toggle settings panel
        this.settingsPanel.togglePopup();
        break;
      default:
        break;
    }
  }

  /**
   * Get player info display for external access
   */
  getPlayerInfoDisplay(): PlayerInfoDisplay {
    return this.playerInfoDisplay;
  }

  /**
   * Get settings panel for external access
   */
  getSettingsPanel(): SettingsPanel {
    return this.settingsPanel;
  }
  
  /**
   * Destroy and clean up
   */
  destroy(): void {
    // Remove event listeners
    this.spinButton?.off('pointerdown');
    this.testButton?.off('pointerdown');
    this.resetButton?.off('pointerdown');
    
    super.destroy();
  }
} 