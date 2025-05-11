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
    this.orbitAngle = 0;
    this.zoom = 5;
    this.initCameraControls();
    // Movement and jump
    this.velocity = new THREE.Vector3();
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
      if (e.code === 'KeyA') this.tryAttack();
      if (e.code === 'KeyS') this.trySpecial();
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
    window.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastX = e.clientX;
    });
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastX;
        this.orbitAngle -= dx * 0.01;
        this.lastX = e.clientX;
      }
    });
    window.addEventListener('wheel', (e) => {
      this.zoom += e.deltaY * 0.01;
      this.zoom = Math.max(2, Math.min(12, this.zoom));
    });
    // Touch controls for mobile
    let lastTouchDist = null;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastX = e.touches[0].clientX;
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
      }
    });
    window.addEventListener('touchend', () => {
      this.isDragging = false;
      lastTouchDist = null;
    });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.lastX;
        this.orbitAngle -= dx * 0.01;
        this.lastX = e.touches[0].clientX;
      } else if (e.touches.length === 2) {
        const dist = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
        if (lastTouchDist !== null) {
          this.zoom += (lastTouchDist - dist) * 0.01;
          this.zoom = Math.max(2, Math.min(12, this.zoom));
        }
        lastTouchDist = dist;
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
    mesh.userData = {
      direction: new THREE.Vector3(Math.sin(this.orbitAngle), 0, Math.cos(this.orbitAngle)),
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
    // Horizontal movement
    this.mesh.position.x += input.x * 0.13;
    // Only allow y movement for jump/vertical
    // Gravity
    this.velocity.y += this.gravity;
    this.mesh.position.y += this.velocity.y;
    // Ground check
    if (this.mesh.position.y <= 0) {
      this.mesh.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
    // Attack logic (stab motion)
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
    // Special ability cooldown
    if (this.specialCooldown > 0) this.specialCooldown--;
    this.updateBoomerangs();
    // Camera orbit logic
    if (this.scene && this.scene.camera) {
      const cam = this.scene.camera;
      cam.position.x = this.mesh.position.x + Math.sin(this.orbitAngle) * this.zoom;
      cam.position.z = this.mesh.position.z + Math.cos(this.orbitAngle) * this.zoom;
      cam.position.y = this.mesh.position.y + 2;
      cam.lookAt(this.mesh.position);
    }
  }
} 