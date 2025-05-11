import * as THREE from 'three';
import { controls } from '../utils/controls';

export class Player {
  constructor(scene) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }) // TODO: Replace with player model/art
    );
    scene.add(this.mesh);
    this.scene = scene;
    
    // First person camera settings
    this.cameraHeight = 1.7; // Average eye height
    this.pitch = 0; // Vertical look angle
    this.yaw = 0; // Horizontal look angle
    this.mouseSensitivity = 0.002;
    
    this.initCameraControls();
    
    // Movement and physics
    this.velocity = new THREE.Vector3();
    this.acceleration = 0.03;
    this.deceleration = 0.95;
    this.maxSpeed = 0.25;
    this.isGrounded = true;
    this.jumpStrength = 0.18;
    this.gravity = -0.01;
    
    // Attack
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackDuration = 12; // frames
    this.attackTimer = 0;
    
    // Special ability
    this.specialCooldown = 0;
    this.activeSpecial = 'boomerang';
    this.boomerangs = [];
    
    // Listen for attack/jump input
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') this.tryJump();
      if (e.code === 'KeyQ') this.tryAttack();
      if (e.code === 'KeyE') this.trySpecial();
    });
    
    // Add mouse click for attack
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        this.tryAttack();
      }
    });
    
    // MobileControls integration
    if (window && window.MobileControlsInstance) {
      window.MobileControlsInstance.buttons.attack.onclick = () => this.tryAttack();
      window.MobileControlsInstance.buttons.special.onclick = () => this.trySpecial();
    }
  }

  initCameraControls() {
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    
    // Lock pointer on click
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', () => {
      canvas.requestPointerLock();
    });
    
    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isDragging = document.pointerLockElement === canvas;
    });
    
    // Handle mouse movement
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        // Update yaw (horizontal) and pitch (vertical) angles
        this.yaw -= e.movementX * this.mouseSensitivity;
        this.pitch -= e.movementY * this.mouseSensitivity;
        
        // Clamp pitch to prevent over-rotation
        this.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitch));
      }
    });
    
    // Handle escape key to exit pointer lock
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    });
  }

  tryJump() {
    if (this.isGrounded) {
      this.velocity.y = this.jumpStrength;
      this.isGrounded = false;
    }
  }

  tryAttack() {
    if (!this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.attackTimer = this.attackDuration;
      this.attackCooldown = 20; // frames
    }
  }

  trySpecial() {
    if (this.specialCooldown <= 0 && this.activeSpecial === 'boomerang') {
      this.throwBoomerang();
      this.specialCooldown = 60; // frames
    }
  }

  throwBoomerang() {
    // Create a boomerang mesh
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.08, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    mesh.position.copy(this.mesh.position);
    // Calculate forward direction based on camera yaw
    mesh.userData = {
      direction: new THREE.Vector3(
        Math.cos(this.yaw),  // Swapped sin with cos
        0,                    // No vertical component
        Math.sin(this.yaw)   // Swapped cos with sin
      ),
      time: 0
    };
    this.scene.add(mesh);
    this.boomerangs.push(mesh);
  }

  updateBoomerangs() {
    for (let i = this.boomerangs.length - 1; i >= 0; i--) {
      const b = this.boomerangs[i];
      b.userData.time += 1;
      // Outward for 30 frames, then return
      let t = b.userData.time;
      let dir = b.userData.direction;
      if (t <= 30) {
        b.position.addScaledVector(dir, 0.25);
      } else if (t <= 60) {
        // Return to player
        const toPlayer = new THREE.Vector3().subVectors(this.mesh.position, b.position).normalize();
        b.position.addScaledVector(toPlayer, 0.25);
      } else {
        this.scene.remove(b);
        this.boomerangs.splice(i, 1);
      }
      b.rotation.y += 0.3;
    }
  }

  update() {
    const input = controls.getInput();
    
    // Calculate forward and right vectors based on camera direction
    // Forward is along negative Z axis in Three.js
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw),  // Forward X
      0,
      -Math.cos(this.yaw)   // Forward Z
    );
    
    // Right is perpendicular to forward
    const right = new THREE.Vector3(
      Math.cos(this.yaw),   // Right X
      0,
      -Math.sin(this.yaw)   // Right Z
    );
    
    // Calculate desired velocity based on input and camera direction
    const desiredVelocity = new THREE.Vector3();
    
    // Forward/backward movement
    if (input.y !== 0) {
      desiredVelocity.addScaledVector(forward, input.y);
    }
    
    // Left/right movement
    if (input.x !== 0) {
      desiredVelocity.addScaledVector(right, input.x);
    }
    
    // Normalize if moving diagonally
    if (desiredVelocity.length() > 1) {
      desiredVelocity.normalize();
    }
    
    // Scale by max speed
    desiredVelocity.multiplyScalar(this.maxSpeed);
    
    // Apply acceleration towards desired velocity
    this.velocity.x += (desiredVelocity.x - this.velocity.x) * this.acceleration;
    this.velocity.z += (desiredVelocity.z - this.velocity.z) * this.acceleration;
    
    // Apply deceleration
    this.velocity.x *= this.deceleration;
    this.velocity.z *= this.deceleration;
    
    // Apply horizontal movement
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.z += this.velocity.z;
    
    // Vertical movement (jumping and gravity)
    this.velocity.y += this.gravity;
    this.mesh.position.y += this.velocity.y;
    
    // Ground check
    if (this.mesh.position.y <= 0) {
      this.mesh.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
    
    // Attack logic
    if (this.isAttacking) {
      const stabAmount = Math.sin((Math.PI * (this.attackDuration - this.attackTimer)) / this.attackDuration) * 0.3;
      this.mesh.position.z = stabAmount;
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.mesh.position.z = 0;
      }
    }
    
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    
    this.updateBoomerangs();
    
    // Update camera position and rotation
    if (this.scene && this.scene.camera) {
      const cam = this.scene.camera;
      
      // Position camera at player's eye level
      cam.position.copy(this.mesh.position);
      cam.position.y += this.cameraHeight;
      
      // Set camera rotation based on yaw and pitch
      cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }
  }
} 