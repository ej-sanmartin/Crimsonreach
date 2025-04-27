import * as THREE from 'three';
import { controls } from '../utils/controls';

export class Player {
  constructor(scene) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    scene.add(this.mesh);
  }

  update() {
    const input = controls.getInput();
    this.mesh.position.x += input.x * 0.1;
    this.mesh.position.y += input.y * 0.1;
  }
} 