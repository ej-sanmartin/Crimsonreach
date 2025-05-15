import * as THREE from 'three';
import { SceneManager } from './scenes/SceneManager';
import { StartScreen } from './scenes/StartScreen';
import { AshmoorScene } from './scenes/AshmoorScene';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { createPS1ShaderPass } from './shaders/PS1Shader';
import { CollisionSystem } from './physics/CollisionSystem';
import { UIManager } from './ui/UIManager';

// Initialize the game canvas
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create global collision system
export const collisionSystem = new CollisionSystem();

const sceneManager = new SceneManager(renderer);

let composer, renderPass, ps1Pass;
let lastTime = 0;
let uiManager;

function setupComposer(scene, camera) {
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  ps1Pass = createPS1ShaderPass(new THREE.Vector2(320, 240));
  composer.addPass(ps1Pass);
}

function startGame() {
  const ashmoor = new AshmoorScene(collisionSystem);
  sceneManager.setScene(ashmoor);
  setupComposer(ashmoor, ashmoor.camera);
  
  // Create UI manager after scene is initialized
  if (uiManager) {
    uiManager.dispose(); // Clean up old UI
  }
  uiManager = new UIManager(ashmoor);
  
  // Give the player access to the UI manager
  if (ashmoor.player) {
    ashmoor.player.setUIManager(uiManager);
  }
  
  // Add collision listeners
  window.addEventListener('collision', (event) => {
    const { colliderA, colliderB } = event.detail;
    
    // Handle collision response
    if (colliderA.mesh.userData.onCollision) {
      colliderA.mesh.userData.onCollision(colliderB);
    }
    if (colliderB.mesh.userData.onCollision) {
      colliderB.mesh.userData.onCollision(colliderA);
    }
  });
}

// Initialize with start screen
const startScreen = new StartScreen(() => {
  startGame();
});
sceneManager.setScene(startScreen);
setupComposer(startScreen, startScreen.camera);

let isPaused = false;
document.addEventListener('visibilitychange', () => (isPaused = document.hidden));

function animate(time) {
  if (!isPaused) {
    // Calculate delta time in seconds
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    // Update collision system with fixed time step
    collisionSystem.update(deltaTime);
    
    // Update scene
    sceneManager.update();
    
    // Update UI if available
    if (uiManager) {
      uiManager.update();
    }
    
    if (ps1Pass) {
      ps1Pass.uniforms.time.value = time * 0.001;
    }
    composer.render();
  }
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  if (sceneManager.camera) {
    sceneManager.camera.aspect = window.innerWidth / window.innerHeight;
    sceneManager.camera.updateProjectionMatrix();
  }
}); 