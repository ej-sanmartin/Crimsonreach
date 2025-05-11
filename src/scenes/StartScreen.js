import * as THREE from 'three';

export class StartScreen extends THREE.Scene {
  constructor(onStartGame) {
    super();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.onStartGame = onStartGame;
    this.createOverlay();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100vw';
    this.overlay.style.height = '100vh';
    this.overlay.style.display = 'flex';
    this.overlay.style.alignItems = 'center';
    this.overlay.style.justifyContent = 'center';
    this.overlay.style.background = 'rgba(0,0,0,0.8)';
    this.overlay.style.zIndex = '10';
    const button = document.createElement('button');
    button.textContent = 'New Game';
    button.style.fontSize = '2rem';
    button.onclick = () => {
      this.overlay.remove();
      if (this.onStartGame) this.onStartGame();
    };
    this.overlay.appendChild(button);
    document.body.appendChild(this.overlay);
  }

  update() {}
} 