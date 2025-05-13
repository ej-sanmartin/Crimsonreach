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
    this.dagger.position.set(0, -0.4, -0.5);
    // Set initial rotation to point towards center
    this.dagger.rotation.set(0.2, 0, 0);
    
    // Add weapon properties to dagger
    this.dagger.userData.isWeapon = true;
    this.dagger.userData.weaponType = 'dagger';
    this.dagger.userData.stopAttack = false;
    
    scene.add(this.dagger);
    
    // Add dagger as a dynamic collider with 'projectile' layer
    if (scene.collisionSystem) {
      this.daggerCollider = scene.collisionSystem.addCollider(this.dagger, 'box', false, 'projectile');
    }
    
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

    // Collision handling
    this.mesh.userData.onCollision = this.handleCollision.bind(this);
    
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

    // Subscribe to collision events
    if (scene.collisionSystem) {
      this.unsubscribe = scene.collisionSystem.on('collision', ({ colliderA, colliderB }) => {
        console.log('Player received collision event:', { 
          colliderA: colliderA.mesh.id, 
          colliderB: colliderB.mesh.id,
          layers: [colliderA.layer, colliderB.layer]
        });
        // Check if this player is involved in the collision
        if (colliderA.mesh === this.mesh || colliderB.mesh === this.mesh) {
          const otherCollider = colliderA.mesh === this.mesh ? colliderB : colliderA;
          this.handleCollision(otherCollider);
        }
      });
    }
  }

  handleCollision(otherCollider) {
    // Handle collision with static objects
    if (otherCollider.isStatic) {
      // Get world space bounds
      const playerBox = new THREE.Box3().setFromObject(this.mesh);
      const otherBox = new THREE.Box3().setFromObject(otherCollider.mesh);
      
      // Calculate overlap
      const overlap = new THREE.Vector3();
      overlap.x = Math.min(playerBox.max.x - otherBox.min.x, otherBox.max.x - playerBox.min.x);
      overlap.y = Math.min(playerBox.max.y - otherBox.min.y, otherBox.max.y - playerBox.min.y);
      overlap.z = Math.min(playerBox.max.z - otherBox.min.z, otherBox.max.z - playerBox.min.z);
      
      // Find minimum overlap axis
      let minOverlap = Math.min(overlap.x, overlap.y, overlap.z);
      
      // Calculate player's center and other object's center
      const playerCenter = new THREE.Vector3();
      const otherCenter = new THREE.Vector3();
      playerBox.getCenter(playerCenter);
      otherBox.getCenter(otherCenter);
      
      // Calculate direction from player to other object
      const direction = new THREE.Vector3().subVectors(otherCenter, playerCenter).normalize();
      
      // Store previous position for velocity calculation
      const prevPosition = this.mesh.position.clone();
      
      // Add a small buffer to prevent phasing through
      const buffer = 0.01;
      
      // Resolve collision by moving player
      if (minOverlap === overlap.x) {
        // Move player out of collision on X axis
        const moveX = direction.x > 0 ? -(overlap.x + buffer) : (overlap.x + buffer);
        this.mesh.position.x += moveX;
        // Zero out velocity in collision direction
        this.velocity.x = 0;
      } else if (minOverlap === overlap.y) {
        // Move player out of collision on Y axis
        const moveY = direction.y > 0 ? -(overlap.y + buffer) : (overlap.y + buffer);
        this.mesh.position.y += moveY;
        // Zero out velocity in collision direction
        this.velocity.y = 0;
        if (this.velocity.y < 0) {
          this.isGrounded = true;
        }
      } else {
        // Move player out of collision on Z axis
        const moveZ = direction.z > 0 ? -(overlap.z + buffer) : (overlap.z + buffer);
        this.mesh.position.z += moveZ;
        // Zero out velocity in collision direction
        this.velocity.z = 0;
      }
      
      // Calculate position delta and update velocity
      const positionDelta = new THREE.Vector3().subVectors(this.mesh.position, prevPosition);
      this.velocity.sub(positionDelta);
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
      this.attackCooldown = 20;
      this.dagger.userData.stopAttack = false;
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
      new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI * 2/3),
      new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    mesh.position.copy(this.mesh.position);
    mesh.userData.isWeapon = true;
    mesh.userData.weaponType = 'boomerang';
    mesh.userData.shouldReturn = false;
    const direction = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(direction, up).normalize();
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction
    );
    mesh.rotateOnAxis(right, Math.PI / 4);
    const pausePosition = new THREE.Vector3().copy(mesh.position).addScaledVector(direction, 7.5);
    mesh.userData.direction = direction;
    mesh.userData.pausePosition = pausePosition;
    mesh.userData.time = 0;
    this.scene.add(mesh);
    this.boomerangs.push(mesh);
    // Add collider for the boomerang with 'projectile' layer
    if (this.scene.collisionSystem) {
      mesh.userData.collider = this.scene.collisionSystem.addCollider(mesh, 'sphere', false, 'projectile');
    }
  }

  updateBoomerangs() {
    for (let i = this.boomerangs.length - 1; i >= 0; i--) {
      const b = this.boomerangs[i];
      
      // Check if boomerang should return due to collision
      if (b.userData.shouldReturn) {
        b.userData.time = 60; // Skip to return phase
        b.userData.shouldReturn = false;
      }
      
      b.userData.time += 1;
      let t = b.userData.time;
      let dir = b.userData.direction;
      
      if (t <= 30) {
        // Move outward
        b.position.addScaledVector(dir, 0.25);
      } else if (t <= 60) {
        // Pause at furthest point
        b.position.copy(b.userData.pausePosition);
      } else {
        // Return to player
        const toPlayer = new THREE.Vector3().subVectors(this.mesh.position, b.position).normalize();
        b.position.addScaledVector(toPlayer, 0.25);
        
        // Check if boomerang has reached the player
        const distanceToPlayer = b.position.distanceTo(this.mesh.position);
        if (distanceToPlayer < 0.5) {
          this.scene.remove(b);
          this.boomerangs.splice(i, 1);
          
          // Remove collider when boomerang is destroyed
          if (this.scene.collisionSystem && b.userData.collider) {
            this.scene.collisionSystem.removeCollider(b.userData.collider);
          }
        }
      }
      
      // Rotate around the forward direction
      b.rotateOnAxis(dir, 0.3);
    }
  }

  update() {
    const input = controls.getInput();
    
    // Calculate forward and right vectors based on camera direction
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );
    
    const right = new THREE.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
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

    // Store current position for collision resolution
    const currentPosition = this.mesh.position.clone();
    
    // Try horizontal movement first
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.z += this.velocity.z;
    
    // Check for collisions after horizontal movement
    if (this.scene.collisionSystem) {
      this.scene.collisionSystem.broadPhase();
      const collisions = this.scene.collisionSystem.narrowPhase();
      
      // If there are collisions with environment objects, resolve them
      const hasCollision = collisions.some(([a, b]) => {
        const isPlayer = a.mesh === this.mesh || b.mesh === this.mesh;
        const isEnvironment = a.layer === 'environment' || b.layer === 'environment';
        return isPlayer && isEnvironment;
      });
      
      if (hasCollision) {
        // Revert position and zero out velocity in collision direction
        this.mesh.position.copy(currentPosition);
        this.velocity.set(0, this.velocity.y, 0);
      }
    }
    
    // Apply vertical movement (jumping and gravity)
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
        // Check if attack should be stopped due to collision
        if (this.dagger.userData.stopAttack) {
          this.isAttacking = false;
          this.dagger.userData.stopAttack = false;
          return;
        }

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

  // Add cleanup method
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
} 