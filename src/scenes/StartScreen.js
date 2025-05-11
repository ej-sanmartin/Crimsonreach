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
    this.overlay.style.flexDirection = 'column';
    this.overlay.style.alignItems = 'center';
    this.overlay.style.justifyContent = 'center';
    this.overlay.style.background = 'rgba(0,0,0,0.8)';
    this.overlay.style.zIndex = '10';
    this.overlay.style.color = 'white';
    this.overlay.style.fontFamily = 'Arial, sans-serif';
    this.overlay.style.textAlign = 'center';
    this.overlay.style.padding = '20px';

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Crimson Reach';
    title.style.fontSize = '3rem';
    title.style.marginBottom = '2rem';
    title.style.color = '#ff3333';
    this.overlay.appendChild(title);

    // Controls section
    const controlsSection = document.createElement('div');
    controlsSection.style.marginBottom = '2rem';
    controlsSection.style.maxWidth = '600px';
    
    const controlsTitle = document.createElement('h2');
    controlsTitle.textContent = 'Controls';
    controlsTitle.style.fontSize = '1.5rem';
    controlsTitle.style.marginBottom = '1rem';
    controlsSection.appendChild(controlsTitle);

    const controlsList = document.createElement('div');
    controlsList.style.display = 'grid';
    controlsList.style.gridTemplateColumns = 'auto 1fr';
    controlsList.style.gap = '1rem';
    controlsList.style.textAlign = 'left';
    
    const controls = [
      ['WASD', 'Move'],
      ['Mouse', 'Look around'],
      ['Space', 'Jump'],
      ['Q / Left Click', 'Attack'],
      ['E', 'Special ability (Boomerang)'],
      ['Escape', 'Release mouse']
    ];

    controls.forEach(([key, action]) => {
      const keySpan = document.createElement('span');
      keySpan.textContent = key;
      keySpan.style.color = '#ffcc00';
      keySpan.style.fontWeight = 'bold';
      
      const actionSpan = document.createElement('span');
      actionSpan.textContent = action;
      
      controlsList.appendChild(keySpan);
      controlsList.appendChild(actionSpan);
    });

    controlsSection.appendChild(controlsList);
    this.overlay.appendChild(controlsSection);

    // Start button
    const button = document.createElement('button');
    button.textContent = 'Start Game';
    button.style.fontSize = '2rem';
    button.style.padding = '1rem 2rem';
    button.style.background = '#ff3333';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.transition = 'background 0.3s';
    
    button.onmouseover = () => button.style.background = '#ff4444';
    button.onmouseout = () => button.style.background = '#ff3333';
    
    button.onclick = () => {
      this.overlay.remove();
      if (this.onStartGame) this.onStartGame();
    };
    
    this.overlay.appendChild(button);
    document.body.appendChild(this.overlay);
  }

  update() {}
} 