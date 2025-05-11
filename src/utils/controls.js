/**
 * Unified input system for touch and mouse controls
 */
export const controls = {
  input: { x: 0, y: 0 },
  isTouching: false,
  keys: {},
  
  init() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.updateMovement();
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.updateMovement();
    });
    
    // Touch controls for mobile
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }
    
    // Cleanup on page unload
    window.addEventListener('unload', this.cleanup.bind(this));
  },
  
  updateMovement() {
    // Reset input
    this.input.x = 0;
    this.input.y = 0;
    
    // WASD movement
    if (this.keys['KeyW']) this.input.y = 1;   // Forward
    if (this.keys['KeyS']) this.input.y = -1;  // Backward
    if (this.keys['KeyA']) this.input.x = -1;  // Left
    if (this.keys['KeyD']) this.input.x = 1;   // Right
    
    // Normalize diagonal movement
    if (this.input.x !== 0 && this.input.y !== 0) {
      const length = Math.sqrt(this.input.x * this.input.x + this.input.y * this.input.y);
      this.input.x /= length;
      this.input.y /= length;
    }
  },
  
  handleTouchStart(event) {
    this.isTouching = true;
    const touch = event.touches[0];
    this.input.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.input.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  },
  
  handleTouchMove(event) {
    if (!this.isTouching) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.input.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.input.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  },
  
  handleTouchEnd() {
    this.isTouching = false;
    this.input.x = 0;
    this.input.y = 0;
  },
  
  getInput() {
    return this.input;
  },
  
  cleanup() {
    // Remove all possible event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }
};

// Initialize controls
controls.init(); 