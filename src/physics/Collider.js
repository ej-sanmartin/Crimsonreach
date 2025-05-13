import * as THREE from 'three';

/**
 * Represents a collider in the physics system
 */
export class Collider {
  /**
   * @param {THREE.Object3D} mesh - The mesh to create a collider for
   * @param {string} type - 'box' or 'sphere'
   * @param {boolean} isStatic - Whether this collider moves
   * @param {string} layer - e.g. 'player', 'enemy', 'environment', 'projectile'
   */
  constructor(mesh, type = 'box', isStatic = false, layer = 'default') {
    this.mesh = mesh;
    this.type = type;
    this.isStatic = isStatic;
    this.layer = layer;
    this.boundingBox = new THREE.Box3();
    this.boundingSphere = new THREE.Sphere();
    this.needsUpdate = true; // Always initialize bounds
    this.debug = false; // Debug flag to control logging
    this.update();
    this.needsUpdate = !isStatic; // Set to false only after initialization if static
  }

  /**
   * Updates the collider's bounds in world space
   * For static colliders, this is only done once
   * For dynamic colliders, this is done every frame
   */
  update() {
    if (this.isStatic && !this.needsUpdate) return;

    // For box colliders, we need to transform the local bounds to world space
    if (this.type === 'box') {
      // Get world space bounds directly from the mesh
      this.boundingBox.setFromObject(this.mesh);
    } else {
      // For sphere colliders, we can use the simpler approach
      this.boundingBox.setFromObject(this.mesh);
    }

    // Update bounding sphere
    this.boundingBox.getBoundingSphere(this.boundingSphere);
    this.needsUpdate = false;
  }

  /**
   * Checks if this collider intersects with another collider
   * @param {Collider} other - The other collider to check against
   * @returns {boolean} Whether the colliders intersect
   */
  intersects(other) {   
    let result = false;
    if (this.type === 'box' && other.type === 'box') {
      result = this.boundingBox.intersectsBox(other.boundingBox);
    } else if (this.type === 'sphere' && other.type === 'sphere') {
      result = this.boundingSphere.intersectsSphere(other.boundingSphere);
    } else {
      // Mixed collision types
      const sphere = this.type === 'sphere' ? this.boundingSphere : other.boundingSphere;
      const box = this.type === 'box' ? this.boundingBox : other.boundingBox;
      result = sphere.intersectsBox(box);
    }
    
    return result;
  }
} 