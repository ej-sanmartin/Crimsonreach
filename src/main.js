import * as THREE from 'three';
import { MainScene } from './scenes/MainScene';

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new MainScene();
let isPaused = false;

document.addEventListener('visibilitychange', () => (isPaused = document.hidden));

function animate() {
  if (!isPaused) {
    scene.update();
    renderer.render(scene, scene.camera);
  }
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene.camera.aspect = window.innerWidth / window.innerHeight;
  scene.camera.updateProjectionMatrix();
}); 