import * as THREE from 'three';
import { SceneManager } from './scenes/SceneManager';
import { StartScreen } from './scenes/StartScreen';
import { AshmoorScene } from './scenes/AshmoorScene';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { createPS1ShaderPass } from './shaders/PS1Shader';

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

const sceneManager = new SceneManager(renderer);

let composer, renderPass, ps1Pass;

function setupComposer(scene, camera) {
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  ps1Pass = createPS1ShaderPass(new THREE.Vector2(320, 240));
  composer.addPass(ps1Pass);
}

function startGame() {
  const ashmoor = new AshmoorScene();
  sceneManager.setScene(ashmoor);
  setupComposer(ashmoor, ashmoor.camera);
}

const startScreen = new StartScreen(() => {
  startGame();
});
sceneManager.setScene(startScreen);
setupComposer(startScreen, startScreen.camera);

let isPaused = false;
document.addEventListener('visibilitychange', () => (isPaused = document.hidden));

function animate(time) {
  if (!isPaused) {
    sceneManager.update();
    if (ps1Pass) {
      ps1Pass.uniforms.time.value = time * 0.001;
    }
    composer.render();
  }
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  if (sceneManager.camera) {
    sceneManager.camera.aspect = window.innerWidth / window.innerHeight;
    sceneManager.camera.updateProjectionMatrix();
  }
}); 