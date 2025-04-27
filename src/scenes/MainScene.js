import * as THREE from 'three';
import { Player } from '../components/Player';

export class MainScene extends THREE.Scene {
  constructor() {
    super();
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    
    // Add player
    this.player = new Player(this);
    
    // Add lighting
    this.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.add(directionalLight);
  }
  
  update() {
    this.player.update();
  }
} 