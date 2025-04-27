/**
 * Unified input system for touch and mouse controls
 */
export const controls = {
  input: { x: 0, y: 0 },
  
  init() {
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('touchmove', this.handleTouchMove.bind(this));
  },
  
  handleMouseMove(event) {
    this.input.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.input.y = -(event.clientY / window.innerHeight) * 2 + 1;
  },
  
  handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    this.input.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.input.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  },
  
  getInput() {
    return this.input;
  }
};

// Initialize controls
controls.init(); 