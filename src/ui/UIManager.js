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
    
    // Add update throttling
    this.lastUpdateTime = 0;
    this.updateInterval = 50; // Update UI every 50ms (20fps) instead of every frame
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
    
    // Make sure to call update for lerping and other animations
    statusBars.update();
  }
  
  /**
   * Update all UI elements
   */
  update() {
    // Throttle updates to improve performance
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    this.lastUpdateTime = now;
    
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
   * Update the active special ability display
   * @param {string} specialName - The name of the active special
   * @param {number} cost - The magic cost of the special
   */
  updateActiveSpecial(specialName, cost) {
    if (this.elements.statusBars) {
      this.elements.statusBars.updateActiveSpecial(specialName, cost);
    }
  }
  
  /**
   * Get the status bars element
   * @returns {StatusBars} The status bars UI element
   */
  getStatusBars() {
    return this.elements.statusBars;
  }
} 