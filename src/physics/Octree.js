import * as THREE from 'three';

/**
 * A loose octree implementation for spatial partitioning
 */
export class Octree {
  constructor(bounds, options = {}) {
    this.bounds = bounds; // THREE.Box3
    this.maxDepth = options.maxDepth || 8;
    this.minSize = options.minSize || 2;
    this.loosenessFactor = options.loosenessFactor || 1.2;
    this.maxObjectsPerNode = options.maxObjectsPerNode || 8;
    
    this.depth = 0;
    this.objects = new Set();
    this.children = null;
    this.needsRebuild = false;
    
    // Calculate loose bounds
    this.looseBounds = this.calculateLooseBounds();
  }

  /**
   * Calculate loose bounds for this node
   * @returns {THREE.Box3}
   */
  calculateLooseBounds() {
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    this.bounds.getCenter(center);
    this.bounds.getSize(size);
    
    // Expand bounds by looseness factor
    size.multiplyScalar(this.loosenessFactor);
    
    const looseBounds = new THREE.Box3();
    looseBounds.setFromCenterAndSize(center, size);
    return looseBounds;
  }

  /**
   * Split this node into 8 children
   */
  subdivide() {
    const center = new THREE.Vector3();
    this.bounds.getCenter(center);
    
    const size = new THREE.Vector3();
    this.bounds.getSize(size).multiplyScalar(0.5);
    
    this.children = [];
    
    // Create 8 children
    for (let i = 0; i < 8; i++) {
      const childCenter = new THREE.Vector3(
        center.x + (i & 1 ? size.x : -size.x),
        center.y + (i & 2 ? size.y : -size.y),
        center.z + (i & 4 ? size.z : -size.z)
      );
      
      const childBounds = new THREE.Box3().setFromCenterAndSize(childCenter, size);
      
      const child = new Octree(childBounds, {
        maxDepth: this.maxDepth,
        minSize: this.minSize,
        loosenessFactor: this.loosenessFactor,
        maxObjectsPerNode: this.maxObjectsPerNode
      });
      
      child.depth = this.depth + 1;
      this.children.push(child);
    }
  }

  /**
   * Insert an object into the octree
   * @param {Collider} collider
   */
  insert(collider) {
    // If this is a leaf node and we haven't reached max objects, add here
    if (!this.children && this.objects.size < this.maxObjectsPerNode) {
      this.objects.add(collider);
      return;
    }
    
    // If this is a leaf node and we've reached max objects, subdivide
    if (!this.children) {
      if (this.depth >= this.maxDepth || 
          this.bounds.min.distanceTo(this.bounds.max) <= this.minSize) {
        this.objects.add(collider);
        return;
      }

      this.subdivide();
      
      // Redistribute existing objects
      for (const obj of this.objects) {
        this.insertIntoChildren(obj);
      }
      this.objects.clear();
    }
    
    // Insert new object into children
    this.insertIntoChildren(collider);
  }

  /**
   * Insert an object into the appropriate children
   * @param {Collider} collider
   */
  insertIntoChildren(collider) {
    const box = collider.boundingBox;
    
    for (const child of this.children) {
      if (child.looseBounds.intersectsBox(box)) {
        child.insert(collider);
      }
    }
  }

  /**
   * Remove an object from the octree
   * @param {Collider} collider
   */
  remove(collider) {
    if (this.children) {
      for (const child of this.children) {
        child.remove(collider);
      }
    } else {
      this.objects.delete(collider);
    }
  }

  /**
   * Update an object's position in the octree
   * @param {Collider} collider
   */
  update(collider) {
    this.remove(collider);
    this.insert(collider);
    this.needsRebuild = true;
  }

  /**
   * Get all potential collisions for a collider
   * @param {Collider} collider
   * @returns {Set<Collider>}
   */
  query(collider) {
    const result = new Set();
    this.queryCollider(collider, result);
    return result;
  }

  /**
   * Recursive query implementation
   * @param {Collider} collider
   * @param {Set<Collider>} result
   */
  queryCollider(collider, result) {
    if (!this.looseBounds.intersectsBox(collider.boundingBox)) {
      return;
    }

    if (this.children) {
      for (const child of this.children) {
        child.queryCollider(collider, result);
      }
    } else {
      for (const obj of this.objects) {
        if (obj !== collider) {
          result.add(obj);
        }
      }
    }
  }

  /**
   * Rebuild the octree
   */
  rebuild() {
    if (!this.needsRebuild) return;
    
    if (this.children) {
      for (const child of this.children) {
        child.rebuild();
      }
    }
    
    this.needsRebuild = false;
  }

  /**
   * Clear the octree
   */
  clear() {
    this.objects.clear();
    if (this.children) {
      for (const child of this.children) {
        child.clear();
      }
      this.children = null;
    }
  }
} 