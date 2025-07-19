import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/**
 * Interface for settings configuration
 */
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  autoSpin: boolean;
  fastMode: boolean;
  showAnimations: boolean;
}

/**
 * Settings panel with gear button and popup interface
 */
export class SettingsPanel extends Container {
  private gearButton!: Container;
  private settingsPopup!: Container;
  private isPopupVisible: boolean = false;
  private overlay!: Graphics;

  // Settings state
  private settings: GameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    autoSpin: false,
    fastMode: false,
    showAnimations: true,
  };

  // Configuration
  private readonly GEAR_SIZE = 40;
  private readonly POPUP_WIDTH = 400;
  private readonly POPUP_HEIGHT = 300;

  constructor() {
    super();
    
    this.setupSettingsPanel();
    
    console.log('SettingsPanel: Initialized');
  }

  /**
   * Set up the settings panel components
   */
  private setupSettingsPanel(): void {
    // Create gear button
    this.createGearButton();
    
    // Create popup (initially hidden)
    this.createSettingsPopup();
    
    // Hide popup initially
    this.hidePopup();
  }

  /**
   * Create the gear icon button
   */
  private createGearButton(): void {
    this.gearButton = new Container();
    
    // Create gear icon background
    const gearBg = new Graphics();
    gearBg.beginFill(0x333333, 0.8);
    gearBg.lineStyle(2, 0x666666, 1);
    gearBg.drawCircle(0, 0, this.GEAR_SIZE / 2);
    gearBg.endFill();
    this.gearButton.addChild(gearBg);
    
    // Create gear icon (simplified gear using graphics)
    const gearIcon = this.createGearIcon();
    this.gearButton.addChild(gearIcon);
    
    // Add gear text
    const gearText = new Text('⚙️', new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fill: 0xFFFFFF,
      align: 'center',
    }));
    gearText.anchor.set(0.5, 0.5);
    this.gearButton.addChild(gearText);
    
    // Make interactive
    this.gearButton.eventMode = 'static';
    this.gearButton.cursor = 'pointer';
    this.gearButton.on('pointerdown', () => this.togglePopup());
    this.gearButton.on('pointerover', () => this.onGearHover(true));
    this.gearButton.on('pointerout', () => this.onGearHover(false));
    
    this.addChild(this.gearButton);
  }

  /**
   * Create a simple gear icon using graphics
   */
  private createGearIcon(): Graphics {
    const gear = new Graphics();
    gear.lineStyle(2, 0xAAAAAA, 1);
    
    // Draw gear teeth
    const numTeeth = 8;
    const outerRadius = 15;
    const innerRadius = 10;
    
    for (let i = 0; i < numTeeth; i++) {
      const angle1 = (i / numTeeth) * Math.PI * 2;
      const angle2 = ((i + 0.3) / numTeeth) * Math.PI * 2;
      const angle3 = ((i + 0.7) / numTeeth) * Math.PI * 2;
      const angle4 = ((i + 1) / numTeeth) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * innerRadius;
      const y1 = Math.sin(angle1) * innerRadius;
      const x2 = Math.cos(angle2) * outerRadius;
      const y2 = Math.sin(angle2) * outerRadius;
      const x3 = Math.cos(angle3) * outerRadius;
      const y3 = Math.sin(angle3) * outerRadius;
      const x4 = Math.cos(angle4) * innerRadius;
      const y4 = Math.sin(angle4) * innerRadius;
      
      if (i === 0) {
        gear.moveTo(x1, y1);
      }
      gear.lineTo(x2, y2);
      gear.lineTo(x3, y3);
      gear.lineTo(x4, y4);
    }
    
    // Draw center hole
    gear.drawCircle(0, 0, 4);
    
    return gear;
  }

  /**
   * Handle gear button hover effects
   */
  private onGearHover(isHovering: boolean): void {
    const scale = isHovering ? 1.1 : 1.0;
    this.gearButton.scale.set(scale);
    
    const gearBg = this.gearButton.getChildAt(0) as Graphics;
    gearBg.tint = isHovering ? 0xDDDDDD : 0xFFFFFF;
  }

  /**
   * Create the settings popup
   */
  private createSettingsPopup(): void {
    this.settingsPopup = new Container();
    
    // Create overlay background
    this.overlay = new Graphics();
    this.overlay.beginFill(0x000000, 0.5);
    this.overlay.drawRect(-2000, -2000, 4000, 4000); // Large overlay
    this.overlay.endFill();
    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => this.hidePopup());
    this.settingsPopup.addChild(this.overlay);
    
    // Create popup background
    const popupBg = new Graphics();
    popupBg.beginFill(0x2A2A2A, 0.95);
    popupBg.lineStyle(3, 0x555555, 1);
    popupBg.drawRoundedRect(
      -this.POPUP_WIDTH / 2, 
      -this.POPUP_HEIGHT / 2, 
      this.POPUP_WIDTH, 
      this.POPUP_HEIGHT, 
      15
    );
    popupBg.endFill();
    
    // Add header decoration
    popupBg.beginFill(0x444444, 1);
    popupBg.drawRoundedRect(
      -this.POPUP_WIDTH / 2 + 10, 
      -this.POPUP_HEIGHT / 2 + 10, 
      this.POPUP_WIDTH - 20, 
      40, 
      8
    );
    popupBg.endFill();
    
    this.settingsPopup.addChild(popupBg);
    
    // Create popup content
    this.createPopupContent();
    
    this.addChild(this.settingsPopup);
  }

  /**
   * Create the content inside the popup
   */
  private createPopupContent(): void {
    // Title
    const title = new Text('⚙️ GAME SETTINGS', new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    }));
    title.anchor.set(0.5, 0.5);
    title.y = -this.POPUP_HEIGHT / 2 + 30;
    this.settingsPopup.addChild(title);
    
    // Settings options
    const optionStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fill: 0xFFFFFF,
      align: 'left',
    });
    
    const valueStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x00FF00,
      align: 'right',
    });
    
    // Create settings options
    const settingsData = [
      { key: 'soundEnabled', label: 'Sound Effects', value: this.settings.soundEnabled },
      { key: 'musicEnabled', label: 'Background Music', value: this.settings.musicEnabled },
      { key: 'autoSpin', label: 'Auto Spin', value: this.settings.autoSpin },
      { key: 'fastMode', label: 'Fast Mode', value: this.settings.fastMode },
      { key: 'showAnimations', label: 'Show Animations', value: this.settings.showAnimations },
    ];
    
    settingsData.forEach((setting, index) => {
      const y = -60 + (index * 40);
      
      // Setting label
      const label = new Text(setting.label, optionStyle);
      label.x = -this.POPUP_WIDTH / 2 + 30;
      label.y = y;
      this.settingsPopup.addChild(label);
      
      // Setting value/toggle
      const valueText = new Text(setting.value ? 'ON' : 'OFF', valueStyle);
      valueText.anchor.set(1, 0);
      valueText.x = this.POPUP_WIDTH / 2 - 30;
      valueText.y = y;
      valueText.eventMode = 'static';
      valueText.cursor = 'pointer';
      valueText.on('pointerdown', () => this.toggleSetting(setting.key as keyof GameSettings, valueText));
      this.settingsPopup.addChild(valueText);
      
      // Toggle button background
      const toggleBg = new Graphics();
      this.updateToggleBackground(toggleBg, setting.value, valueText.x - 50, y + 10);
      this.settingsPopup.addChild(toggleBg);
    });
    
    // Game info section
    const infoY = 60;
    const infoStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      fill: 0xAAAAAA,
      align: 'center',
    });
    
    const gameInfo = new Text('Slot Machine Game v1.0\nBuilt with PIXI.js\nFeatures: Respins, Combat, Monsters', infoStyle);
    gameInfo.anchor.set(0.5, 0);
    gameInfo.y = infoY;
    this.settingsPopup.addChild(gameInfo);
    
    // Close button
    const closeButton = this.createCloseButton();
    closeButton.x = this.POPUP_WIDTH / 2 - 30;
    closeButton.y = -this.POPUP_HEIGHT / 2 + 15;
    this.settingsPopup.addChild(closeButton);
  }

  /**
   * Create close button for popup
   */
  private createCloseButton(): Container {
    const closeBtn = new Container();
    
    // Close button background
    const closeBg = new Graphics();
    closeBg.beginFill(0xFF4444, 0.8);
    closeBg.lineStyle(2, 0xFF6666, 1);
    closeBg.drawCircle(0, 0, 15);
    closeBg.endFill();
    closeBtn.addChild(closeBg);
    
    // Close button text
    const closeText = new Text('✕', new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
    }));
    closeText.anchor.set(0.5, 0.5);
    closeBtn.addChild(closeText);
    
    // Make interactive
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this.hidePopup());
    closeBtn.on('pointerover', () => closeBtn.scale.set(1.1));
    closeBtn.on('pointerout', () => closeBtn.scale.set(1.0));
    
    return closeBtn;
  }

  /**
   * Update toggle button background
   */
  private updateToggleBackground(graphics: Graphics, isOn: boolean, x: number, y: number): void {
    graphics.clear();
    graphics.beginFill(isOn ? 0x00AA00 : 0xAA0000, 0.7);
    graphics.lineStyle(1, isOn ? 0x00FF00 : 0xFF0000, 1);
    graphics.drawRoundedRect(x, y, 40, 20, 10);
    graphics.endFill();
    
    // Toggle circle
    graphics.beginFill(0xFFFFFF, 1);
    graphics.drawCircle(x + (isOn ? 30 : 10), y + 10, 8);
    graphics.endFill();
  }

  /**
   * Toggle a setting value
   */
  private toggleSetting(key: keyof GameSettings, valueText: Text): void {
    this.settings[key] = !this.settings[key];
    valueText.text = this.settings[key] ? 'ON' : 'OFF';
    valueText.style.fill = this.settings[key] ? 0x00FF00 : 0xFF0000;
    
    console.log(`SettingsPanel: ${key} toggled to ${this.settings[key]}`);
    
    // Update the toggle background by finding the correct graphics element
    const toggleBg = this.settingsPopup.children.find(child => 
      child instanceof Graphics && child.x !== 0
    ) as Graphics;
    
    if (toggleBg) {
      this.updateToggleBackground(toggleBg, this.settings[key], valueText.x - 50, valueText.y + 10);
    }
  }

  /**
   * Toggle popup visibility
   */
  public togglePopup(): void {
    if (this.isPopupVisible) {
      this.hidePopup();
    } else {
      this.showPopup();
    }
  }

  /**
   * Show the settings popup
   */
  public showPopup(): void {
    this.settingsPopup.visible = true;
    this.isPopupVisible = true;
    
    // Animate popup appearance
    this.settingsPopup.alpha = 0;
    this.settingsPopup.scale.set(0.8);
    
    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.settingsPopup.alpha = easeOut;
      this.settingsPopup.scale.set(0.8 + (0.2 * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    console.log('SettingsPanel: Popup shown');
  }

  /**
   * Hide the settings popup
   */
  public hidePopup(): void {
    this.settingsPopup.visible = false;
    this.isPopupVisible = false;
    
    console.log('SettingsPanel: Popup hidden');
  }

  /**
   * Set position for the gear button
   */
  public setPosition(x: number, y: number): void {
    this.gearButton.x = x;
    this.gearButton.y = y;
  }

  /**
   * Set popup center position
   */
  public setPopupCenter(x: number, y: number): void {
    this.settingsPopup.x = x;
    this.settingsPopup.y = y;
  }

  /**
   * Get current settings
   */
  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  /**
   * Update settings from external source
   */
  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('SettingsPanel: Settings updated', this.settings);
  }

  /**
   * Check if popup is currently visible
   */
  public isPopupOpen(): boolean {
    return this.isPopupVisible;
  }

  /**
   * Reset settings to defaults
   */
  public resetToDefaults(): void {
    this.settings = {
      soundEnabled: true,
      musicEnabled: true,
      autoSpin: false,
      fastMode: false,
      showAnimations: true,
    };
    
    console.log('SettingsPanel: Settings reset to defaults');
  }
} 