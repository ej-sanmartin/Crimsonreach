import { StatusBars } from './StatusBars';

/**
 * Manages all UI elements in the game
 * @class UIManager
 */
export class UIManager {
  /**
   * Create a UI manager
   * @param {Object} scene - The scene with player reference
   */
  constructor(scene) {
    this.elements = {};
    
    // Store player reference if available
    this.player = scene.player || null;
    
    // Create status bars
    this.elements.statusBars = new StatusBars({
      healthMax: this.player ? this.player.getMaxHealth() : 100,
      healthCurrent: this.player ? this.player.getHealth() : 100,
      magicMax: this.player ? this.player.getMaxMagic() : 100,
      magicCurrent: this.player ? this.player.getMagic() : 100
    });
    
    // Initialize UI with player stats if player is available
    if (this.player) {
      this._updatePlayerStats();
    }
  }
  
  /**
   * Update player stats in the UI
   * @private
   */
  _updatePlayerStats() {
    if (!this.player || !this.elements.statusBars) return;
    
    // Update health and magic bars
    const statusBars = this.elements.statusBars;
    
    statusBars.setHealth(this.player.getHealth());
    statusBars.setMagic(this.player.getMagic());
  }
  
  /**
   * Update all UI elements
   */
  update() {
    // Update player stats if player is available
    if (this.player) {
      this._updatePlayerStats();
    }
    
    // Update all UI elements
    Object.values(this.elements).forEach(element => {
      if (element && element.update) {
        element.update();
      }
    });
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Dispose all UI elements
    Object.values(this.elements).forEach(element => {
      if (element && element.dispose) {
        element.dispose();
      }
    });
    
    this.elements = {};
  }
  
  /**
   * Get the status bars element
   * @returns {StatusBars} The status bars UI element
   */
  getStatusBars() {
    return this.elements.statusBars;
  }
} 