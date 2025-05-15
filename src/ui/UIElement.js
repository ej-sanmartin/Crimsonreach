/**
 * Base class for all UI elements
 * @class UIElement
 */
export class UIElement {
  /**
   * Create a UI element
   */
  constructor() {
    // Nothing to initialize in base class
  }
  
  /**
   * Update the UI element
   */
  update() {
    // Override in subclasses
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Override in subclasses
  }
} 