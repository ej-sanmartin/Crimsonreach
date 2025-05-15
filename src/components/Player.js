import * as THREE from 'three';
import { controls } from '../utils/controls';
import { slerp } from '../utils/math';
import { VECTORS } from '../utils/vectors';

export class Player {
  constructor(scene) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }) // TODO: Replace with player model/art
    );
    scene.add(this.mesh);
    this.scene = scene;
    
    // Player stats
    this.stats = {
      health: {
        max: 100,
        current: 100
      },
      magic: {
        max: 100,
        current: 100
      }
    };
    
    // Abilities system - all unlocked for debugging
    this.abilities = {
      doubleJump: { 
        unlocked: true,
        uses: 0,
        maxUses: 1,
        resets: 'onLanding'
      },
      slideKick: { 
        unlocked: true,
        cooldown: 0,
        duration: 0,
        speed: 0.4,
        isActive: false,
        input: ['ControlLeft', 'KeyW']
      },
      breatheUnderwater: { 
        unlocked: true,
        passive: true
      },
      superJump: { 
        unlocked: true,
        combo: ['KeyW', 'Space'],
        comboWindow: 150, // ms
        jumpMultiplier: 3
      }
    };
    
    // Input state tracking
    this.inputState = {
      isCrouching: false,
      isChangingWeapon: true, // true = changing weapon, false = changing special
      isShiftHeld: false, // Track shift key state
    };
    
    // Crouching animation properties
    this.crouchAnimation = 0; // 0 = standing, 1 = crouched
    this.crouchSpeed = 0.1; // How fast to transition
    this.minCrouchForSlide = 0.8; // Must be 80% crouched to slide kick
    
    // Track key press events vs held keys
    this.keyPressed = new Set(); // Track fresh key presses
    
    // First person camera settings
    this.cameraHeight = 1.7; // Average eye height
    this.crouchHeight = 1.2; // Crouched eye height
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
      // Only process if this is a fresh key press (not a repeat)
      if (!this.keyPressed.has(e.code)) {
        this.keyPressed.add(e.code);
        
        // Check for slide kick when W is freshly pressed while sufficiently crouched
        if (e.code === 'KeyW' && this.inputState.isCrouching && this.crouchAnimation >= this.minCrouchForSlide) {
          this.useAbility('slideKick');
        }
      }
      
      if (e.code === 'Space') this.tryJump();
      if (e.code === 'KeyQ') this.trySpecial();
      if (e.code === 'KeyE') this.tryInteract();
      if (e.code === 'KeyZ') this.rotateEquipped(-1);
      if (e.code === 'KeyC') this.rotateEquipped(1);
      if (e.code === 'KeyX') this.toggleEquipmentMode();
      
      // Handle shift key
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.inputState.isShiftHeld = true;
      }
      
      // Handle crouching with multiple key code support
      if (e.code === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
        this.inputState.isCrouching = true;
      }
    });
    
    // Add keyup listener for crouch and key tracking
    window.addEventListener('keyup', (e) => {
      // Remove from pressed keys set
      this.keyPressed.delete(e.code);
      
      // Handle shift key release
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.inputState.isShiftHeld = false;
      }
      
      if (e.code === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
        this.inputState.isCrouching = false;
      }
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
        // Check if this player is involved in the collision
        if (colliderA.mesh === this.mesh || colliderB.mesh === this.mesh) {
          const otherCollider = colliderA.mesh === this.mesh ? colliderB : colliderA;
          this.handleCollision(otherCollider);
        }
      });
    }
  }

  hasAbility(name) {
    return this.abilities[name] && this.abilities[name].unlocked;
  }
  
  useAbility(name, ...args) {
    const ability = this.abilities[name];
    if (!ability || !ability.unlocked) return false;
    
    switch(name) {
    case 'doubleJump':
      return this.performDoubleJump();
    case 'slideKick':
      return this.performSlideKick();
    case 'superJump':
      return this.performSuperJump();
    default:
      return false;
    }
  }
  
  updateAbilities() {
    // Update cooldowns
    if (this.abilities.slideKick.cooldown > 0) {
      this.abilities.slideKick.cooldown--;
    }
    
    // Update active abilities
    if (this.abilities.slideKick.isActive) {
      this.abilities.slideKick.duration--;
      if (this.abilities.slideKick.duration <= 0) {
        this.abilities.slideKick.isActive = false;
      }
    }
    
    // Reset double jump on landing
    if (this.isGrounded && this.abilities.doubleJump.uses > 0) {
      this.abilities.doubleJump.uses = 0;
    }
  }

  performDoubleJump() {
    this.velocity.y = this.jumpStrength * 0.8; // Slightly weaker than regular jump
    this.abilities.doubleJump.uses++;
    return true;
  }
  
  performSlideKick() {
    if (this.abilities.slideKick.cooldown > 0) return false;
    
    this.abilities.slideKick.isActive = true;
    this.abilities.slideKick.duration = 20; // frames
    this.abilities.slideKick.cooldown = 60; // frames
    
    // Add forward momentum
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.velocity.add(forward.multiplyScalar(this.abilities.slideKick.speed));
    
    return true;
  }
  
  performSuperJump() {
    this.velocity.y = this.jumpStrength * this.abilities.superJump.jumpMultiplier;
    this.isGrounded = false;
    return true;
  }

  tryInteract() {
    // TODO: Implement interaction system
    console.log('Interact pressed');
  }
  
  rotateEquipped(direction) {
    // TODO: Implement equipment rotation
    const mode = this.inputState.isChangingWeapon ? 'weapon' : 'special';
    const dir = direction > 0 ? 'forward' : 'backward';
  }
  
  toggleEquipmentMode() {
    this.inputState.isChangingWeapon = !this.inputState.isChangingWeapon;
    const mode = this.inputState.isChangingWeapon ? 'weapon' : 'special attack';
    console.log(`Now changing: ${mode}`);
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
    // Check for super jump (Left Shift + Space)
    if (this.hasAbility('superJump') && this.inputState.isShiftHeld && this.isGrounded) {
      return this.useAbility('superJump');
    }
    
    // Regular jump
    if (this.isGrounded) {
      this.velocity.y = this.jumpStrength;
      this.isGrounded = false;
      return true;
    }
    
    // Double jump
    if (this.hasAbility('doubleJump') && this.abilities.doubleJump.uses < this.abilities.doubleJump.maxUses) {
      return this.useAbility('doubleJump');
    }
    
    return false;
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
    
    // Get forward direction from camera quaternion
    const direction = VECTORS.CAMERA_FORWARD();
    direction.applyQuaternion(this.scene.camera.quaternion);
    
    const right = new THREE.Vector3().crossVectors(direction, VECTORS.WORLD_UP()).normalize();
    mesh.quaternion.setFromUnitVectors(
      VECTORS.WORLD_FORWARD(),
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
    
    // Update crouching animation
    const targetCrouch = this.inputState.isCrouching ? 1 : 0;
    this.crouchAnimation += (targetCrouch - this.crouchAnimation) * this.crouchSpeed;
    
    // Apply smooth scaling to player mesh
    const scaleY = 1 - (this.crouchAnimation * 0.3); // 1.0 to 0.7
    this.mesh.scale.y = scaleY;
    
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
    
    // Handle movement and crouching
    if (!this.inputState.isCrouching || this.abilities.slideKick.isActive) {
      // Normal movement when not crouching or during slide kick
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
      
      // Scale by max speed (increase speed during slide kick)
      const speedMultiplier = this.abilities.slideKick.isActive ? 1.5 : 1;
      desiredVelocity.multiplyScalar(this.maxSpeed * speedMultiplier);
      
      // Apply acceleration towards desired velocity
      this.velocity.x += (desiredVelocity.x - this.velocity.x) * this.acceleration;
      this.velocity.z += (desiredVelocity.z - this.velocity.z) * this.acceleration;
      
      // Apply deceleration
      this.velocity.x *= this.deceleration;
      this.velocity.z *= this.deceleration;
    } else {
      // When crouching (not slide kicking), apply strong deceleration to stop quickly
      const crouchDeceleration = 0.85; // Stronger deceleration when crouching
      this.velocity.x *= crouchDeceleration;
      this.velocity.z *= crouchDeceleration;
      
      // Stop very small velocities to prevent micro-sliding
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }

    // Store current position for collision resolution
    const currentPosition = this.mesh.position.clone();
    
    // Try horizontal movement first
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.z += this.velocity.z;
    
    // Check for collisions after horizontal movement
    if (this.scene.collisionSystem) {
      this.scene.collisionSystem.broadPhase();
      const collisions = this.scene.collisionSystem.narrowPhase();
      
      // Handle each collision with wall sliding
      let hasCollision = false;
      collisions.forEach(([a, b]) => {
        const isPlayer = a.mesh === this.mesh || b.mesh === this.mesh;
        const isEnvironment = a.layer === 'environment' || b.layer === 'environment';
        
        if (isPlayer && isEnvironment) {
          hasCollision = true;
          const otherCollider = a.mesh === this.mesh ? b : a;
          
          // Calculate collision normal from centers
          const playerBox = new THREE.Box3().setFromObject(this.mesh);
          const otherBox = new THREE.Box3().setFromObject(otherCollider.mesh);
          
          const playerCenter = new THREE.Vector3();
          const otherCenter = new THREE.Vector3();
          playerBox.getCenter(playerCenter);
          otherBox.getCenter(otherCenter);
          
          // Normal points from wall to player
          const normal = new THREE.Vector3().subVectors(playerCenter, otherCenter).normalize();
          
          // Only consider horizontal sliding (ignore Y component)
          normal.y = 0;
          normal.normalize();
          
          // Calculate overlap for position correction
          const overlap = new THREE.Vector3();
          overlap.x = Math.min(playerBox.max.x - otherBox.min.x, otherBox.max.x - playerBox.min.x);
          overlap.z = Math.min(playerBox.max.z - otherBox.min.z, otherBox.max.z - playerBox.min.z);
          
          // Resolve overlap by moving player out
          let minOverlap = Math.min(overlap.x, overlap.z);
          const buffer = 0.01;
          
          if (minOverlap === overlap.x) {
            this.mesh.position.x = currentPosition.x + normal.x * (overlap.x + buffer);
          } else {
            this.mesh.position.z = currentPosition.z + normal.z * (overlap.z + buffer);
          }
          
          // Project velocity onto surface for sliding
          const horizontalVelocity = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
          const velocityDotNormal = horizontalVelocity.dot(normal);
          
          // Remove the velocity component going into the wall
          if (velocityDotNormal < 0) {
            horizontalVelocity.addScaledVector(normal, -velocityDotNormal);
            this.velocity.x = horizontalVelocity.x;
            this.velocity.z = horizontalVelocity.z;
          }
        }
      });
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
      
      // Position camera at player's eye level (smoothly interpolate height)
      cam.position.copy(this.mesh.position);
      const currentHeight = this.cameraHeight - (this.crouchAnimation * (this.cameraHeight - this.crouchHeight));
      cam.position.y += currentHeight;
      
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
    
    this.updateAbilities();
    this.updateBoomerangs();

    // Future: Add health and magic regeneration logic here
  }

  // Add cleanup method
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  /**
   * Get player's current health
   * @returns {number} Current health value
   */
  getHealth() {
    return this.stats.health.current;
  }

  /**
   * Get player's maximum health
   * @returns {number} Maximum health value
   */
  getMaxHealth() {
    return this.stats.health.max;
  }

  /**
   * Set player's health
   * @param {number} value - New health value
   */
  setHealth(value) {
    this.stats.health.current = Math.min(Math.max(0, value), this.stats.health.max);
    return this.stats.health.current;
  }

  /**
   * Modify player's health
   * @param {number} amount - Amount to change (positive = heal, negative = damage)
   */
  modifyHealth(amount) {
    return this.setHealth(this.stats.health.current + amount);
  }

  /**
   * Get player's current magic
   * @returns {number} Current magic value
   */
  getMagic() {
    return this.stats.magic.current;
  }

  /**
   * Get player's maximum magic
   * @returns {number} Maximum magic value
   */
  getMaxMagic() {
    return this.stats.magic.max;
  }

  /**
   * Set player's magic
   * @param {number} value - New magic value
   */
  setMagic(value) {
    this.stats.magic.current = Math.min(Math.max(0, value), this.stats.magic.max);
    return this.stats.magic.current;
  }

  /**
   * Modify player's magic
   * @param {number} amount - Amount to change (positive = add, negative = consume)
   */
  modifyMagic(amount) {
    return this.setMagic(this.stats.magic.current + amount);
  }

  /**
   * Check if player has enough magic for a spell or ability
   * @param {number} cost - Magic cost
   * @returns {boolean} True if player has enough magic
   */
  hasMagic(cost) {
    return this.stats.magic.current >= cost;
  }

  /**
   * Consume magic if player has enough
   * @param {number} cost - Magic cost
   * @returns {boolean} True if magic was consumed
   */
  consumeMagic(cost) {
    if (!this.hasMagic(cost)) return false;
    this.modifyMagic(-cost);
    return true;
  }
} 