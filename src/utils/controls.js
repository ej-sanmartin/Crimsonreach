/**
 * Unified input system for touch and mouse controls
 */
export const controls = {
  input: { x: 0, y: 0 },
  isTouching: false,
  
  init() {
    // Detect if device supports touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
      // Touch events for mobile devices
      window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    } else {
      // Mouse events for desktop
      window.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
    }
    
    // Cleanup on page unload
    window.addEventListener('unload', this.cleanup.bind(this));
  },
  
  handleMouseMove(event) {
    this.input.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.input.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }
};

// Initialize controls
controls.init(); 