import * as THREE from 'three';
import { controls } from '../utils/controls';
import { slerp } from '../utils/math';

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
    
    // Create dagger weapon
    this.dagger = new THREE.Group();
    // Dagger blade
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.3, 8),
      new THREE.MeshBasicMaterial({ color: 0xC0C0C0 })
    );
    blade.position.y = 0.15; // Center the blade
    // Rotate blade to point forward instead of up
    blade.rotation.x = -Math.PI / 2;
    this.dagger.add(blade);
    // Position dagger in front of player
    this.dagger.position.set(0, -0.4, -0.5); // Centered horizontally (0.3 -> 0)
    // Set initial rotation to point towards center
    this.dagger.rotation.set(0.2, 0, 0); // Adjusted yaw to point straight ahead (-0.1 -> 0)
    scene.add(this.dagger);
    
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
    this.attackDistance = 0.5; // How far the dagger extends during attack
    
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
    
    // Create minimal lock status indicator
    this.lockIndicator = document.createElement('div');
    this.lockIndicator.style.position = 'fixed';
    this.lockIndicator.style.top = '10px';
    this.lockIndicator.style.right = '10px';
    this.lockIndicator.style.width = '8px';
    this.lockIndicator.style.height = '8px';
    this.lockIndicator.style.borderRadius = '50%';
    this.lockIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    this.lockIndicator.style.transition = 'background-color 0.3s';
    this.lockIndicator.style.pointerEvents = 'none';
    document.body.appendChild(this.lockIndicator);
    
    const canvas = document.getElementById('game-canvas');
    
    // Request pointer lock on game start
    canvas.requestPointerLock();
    
    // Store last known angles to prevent snapping
    let lastYaw = this.yaw;
    let lastPitch = this.pitch;
    
    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isDragging = document.pointerLockElement === canvas;
      // Update indicator color
      this.lockIndicator.style.backgroundColor = this.isDragging ? 
        'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
      
      // Restore last known angles when lock changes
      if (this.isDragging) {
        this.yaw = lastYaw;
        this.pitch = lastPitch;
      }
    });
    
    // Handle mouse movement
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        // Update yaw (horizontal) and pitch (vertical) angles
        this.yaw -= e.movementX * this.mouseSensitivity;
        this.pitch -= e.movementY * this.mouseSensitivity;
        
        // Clamp pitch to prevent over-rotation
        this.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitch));
        
        // Store current angles
        lastYaw = this.yaw;
        lastPitch = this.pitch;
      }
    });
    
    // Handle Tab key to toggle pointer lock
    let lastTabPress = 0;
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault(); // Prevent default tab behavior
        const now = Date.now();
        if (now - lastTabPress > 300) { // Prevent rapid toggling
          lastTabPress = now;
          if (document.pointerLockElement === canvas) {
            document.exitPointerLock();
          } else {
            canvas.requestPointerLock();
          }
        }
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
    
    // Update camera position and rotation
    if (this.scene && this.scene.camera) {
      const cam = this.scene.camera;
      
      // Position camera at player's eye level
      cam.position.copy(this.mesh.position);
      cam.position.y += this.cameraHeight;
      
      // Set camera rotation based on yaw and pitch
      cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      
      // Update dagger position and rotation to follow camera
      this.dagger.position.copy(cam.position);
      this.dagger.rotation.copy(cam.rotation);
      
      // Offset dagger in front of camera
      const daggerOffset = new THREE.Vector3(0.5, -0.4, -0.5);
      daggerOffset.applyQuaternion(cam.quaternion);
      this.dagger.position.add(daggerOffset);
      
      // Attack animation
      if (this.isAttacking) {
        // Calculate attack progress (0 to 1)
        const progress = this.attackTimer / this.attackDuration;
        // Create a smooth arc motion for the attack
        const attackArc = Math.sin(progress * Math.PI);
        
        // Create quaternions for start and end rotations
        const startQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
          0.2,  // Initial slight upward tilt
          -0.2, // Initial pointing towards center
          0
        ));
        
        const endQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
          -0.2, // End with downward tilt
          -0.2, // End pointing towards center
          0
        ));
        
        // Slerp between start and end rotations
        const attackQuat = new THREE.Quaternion();
        slerp(startQuat, endQuat, attackQuat, attackArc);
        
        // Apply the slerped rotation
        this.dagger.quaternion.copy(cam.quaternion);
        this.dagger.quaternion.multiply(attackQuat);
        
        // Move dagger forward and towards center during attack
        const attackOffset = new THREE.Vector3(
          -attackArc * 0.3, // Move towards center
          -attackArc * 0.1, // Slight downward motion
          -attackArc * this.attackDistance // Forward motion
        );
        attackOffset.applyQuaternion(cam.quaternion);
        this.dagger.position.add(attackOffset);
        
        this.attackTimer--;
        if (this.attackTimer <= 0) {
          this.isAttacking = false;
          // Reset dagger rotation to initial position
          this.dagger.rotation.set(0.2, -0.2, 0);
        }
      }
    }
    
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    
    this.updateBoomerangs();
  }
} 