import * as THREE from 'three';
import { Player } from '../components/Player';
import { MobileControls } from '../components/MobileControls';
import { createAuroraMaterial } from '../shaders/AuroraMaterial';

export class AshmoorScene extends THREE.Scene {
  constructor(collisionSystem) {
    super();
    // Store reference to global collision system
    this.collisionSystem = collisionSystem;
    
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
    this.add(new THREE.AmbientLight(0xffffff, 0.5)); // Increased ambient light
    
    // Main directional light (moonlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.add(directionalLight);
    
    // Add point lights near houses for local illumination
    const houseLight1 = new THREE.PointLight(0xffaa44, 1, 10);
    houseLight1.position.set(-3, 1, 0);
    this.add(houseLight1);
    
    const houseLight2 = new THREE.PointLight(0xffaa44, 1, 10);
    houseLight2.position.set(3, 1, 0);
    this.add(houseLight2);
    
    // Add a subtle hemisphere light for better overall illumination
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    this.add(hemisphereLight);
    
    // Minimal village geometry
    const ground = this.createGround();
    this.add(ground);

    // Add a test wall
    const wall = this.createWall(0, 0, -5);
    this.add(wall);
    this.collisionSystem.addCollider(wall, 'box', true, 'environment');
    
    // Add colliders with correct layers
    this.collisionSystem.addCollider(ground, 'box', true, 'environment');
    this.collisionSystem.addCollider(this.player.mesh, 'box', false, 'player');
    
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

  createWall(x, y, z) {
    // Create a group to hold wall and its collision box
    const wallGroup = new THREE.Group();
    wallGroup.position.set(x, y, z);
    
    // Create a wall mesh
    const geometry = new THREE.BoxGeometry(4, 2, 0.2); // Wide but thin wall
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.2
    });
    const wall = new THREE.Mesh(geometry, material);
    wallGroup.add(wall);
    
    // Create a slightly larger collision box
    const collisionBox = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, 2.1, 0.3), // Slightly larger than visual mesh
      new THREE.MeshBasicMaterial({ visible: false })
    );
    wallGroup.add(collisionBox);
    
    // Add collision handling
    collisionBox.userData.onCollision = (otherCollider) => {
      // Handle weapon collisions
      if (otherCollider.mesh.userData.isWeapon) {
        if (otherCollider.mesh.userData.weaponType === 'boomerang') {
          otherCollider.mesh.userData.shouldReturn = true;
        } else if (otherCollider.mesh.userData.weaponType === 'dagger') {
          otherCollider.mesh.userData.stopAttack = true;
        }
      }
    };
    
    // Add group to scene
    this.add(wallGroup);
    
    return wallGroup;
  }

  update() {
    // Update sky animation
    if (this.sky && this.sky.material.uniforms) {
      this.sky.material.uniforms.time.value += 0.01;
    }
    this.player.update();
  }
} 