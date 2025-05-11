export class MobileControls {
  constructor() {
    this.createJoystick();
    this.createButtons();
    window.MobileControlsInstance = this;
  }

  createJoystick() {
    this.joystick = document.createElement('div');
    this.joystick.style.position = 'fixed';
    this.joystick.style.left = '2vw';
    this.joystick.style.bottom = '10vh';
    this.joystick.style.width = '80px';
    this.joystick.style.height = '80px';
    this.joystick.style.background = 'rgba(80,80,80,0.3)';
    this.joystick.style.borderRadius = '50%';
    this.joystick.style.zIndex = '20';
    this.joystick.style.touchAction = 'none';
    document.body.appendChild(this.joystick);
    this.active = false;
    this.center = { x: 0, y: 0 };
    this.handle = document.createElement('div');
    this.handle.style.width = '40px';
    this.handle.style.height = '40px';
    this.handle.style.background = 'rgba(200,200,200,0.7)';
    this.handle.style.borderRadius = '50%';
    this.handle.style.position = 'absolute';
    this.handle.style.left = '20px';
    this.handle.style.top = '20px';
    this.joystick.appendChild(this.handle);
    this.joystick.addEventListener('touchstart', (e) => this.onStart(e), { passive: false });
    this.joystick.addEventListener('touchmove', (e) => this.onMove(e), { passive: false });
    this.joystick.addEventListener('touchend', (e) => this.onEnd(e), { passive: false });
  }

  onStart(e) {
    this.active = true;
    const rect = this.joystick.getBoundingClientRect();
    this.center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  onMove(e) {
    if (!this.active) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - this.center.x;
    const dy = touch.clientY - this.center.y;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    this.handle.style.left = 20 + x + 'px';
    this.handle.style.top = 20 + y + 'px';
    // Update controls.js input
    window.controls.input.x = x / 40;
    window.controls.input.y = -y / 40;
  }

  onEnd(e) {
    this.active = false;
    this.handle.style.left = '20px';
    this.handle.style.top = '20px';
    window.controls.input.x = 0;
    window.controls.input.y = 0;
  }

  createButtons() {
    this.buttons = {};
    const actions = [
      { name: 'attack', label: 'A', right: '18vw' },
      { name: 'dodge', label: 'D', right: '10vw' },
      { name: 'interact', label: 'E', right: '2vw' },
      { name: 'special', label: 'S', right: '10vw', bottom: '22vh' }
    ];
    actions.forEach((action, i) => {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.style.position = 'fixed';
      btn.style.bottom = action.bottom || '10vh';
      btn.style.right = action.right;
      btn.style.width = '60px';
      btn.style.height = '60px';
      btn.style.borderRadius = '50%';
      btn.style.fontSize = '2rem';
      btn.style.opacity = '0.8';
      btn.style.zIndex = '20';
      // TODO: Hook up to game actions
      document.body.appendChild(btn);
      this.buttons[action.name] = btn;
    });
  }
} 