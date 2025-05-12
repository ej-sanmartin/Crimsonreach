import * as THREE from 'three';
import { Player } from '../components/Player';
import { MobileControls } from '../components/MobileControls';
import { createAuroraMaterial } from '../shaders/AuroraMaterial';

export class AshmoorScene extends THREE.Scene {
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
    
    // Add skybox with aurora
    this.createSkybox();
    
    // Add player
    this.player = new Player(this);
    
    // Add lighting
    this.add(new THREE.AmbientLight(0xffffff, 0.3)); // Reduced ambient light for night effect
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.add(directionalLight);
    
    // Minimal village geometry
    this.add(this.createGround());
    this.add(this.createHouse(-3, 0));
    this.add(this.createHouse(3, 0));
    
    // Mobile controls (only on touch devices)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.mobileControls = new MobileControls();
    }
    // TODO: Replace placeholder geometry with art assets
  }

  createSkybox() {
    // Create a large sphere for the sky with proper inversion
    const skyGeometry = new THREE.SphereGeometry(50, 32, 32, 0, Math.PI * 2, 0, Math.PI, true);
    
    // Create aurora shader material
    const auroraMaterial = createAuroraMaterial();
    
    const sky = new THREE.Mesh(skyGeometry, auroraMaterial);
    sky.position.set(0, 0, 0); // Center the skybox
    this.add(sky);
    this.sky = sky;
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x334422,
      roughness: 0.8,
      metalness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1;
    return mesh;
  }

  createHouse(x, z) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0, z);
    return mesh;
  }

  update() {
    // Update sky animation
    if (this.sky && this.sky.material.uniforms) {
      this.sky.material.uniforms.time.value += 0.01;
    }
    this.player.update();
  }
} 