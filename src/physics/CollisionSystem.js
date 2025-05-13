import * as THREE from 'three';
import { Collider } from './Collider';
import { EventEmitter } from '../utils/EventEmitter';
import { Octree } from './Octree';

/**
 * Manages collision detection and response
 */
export class CollisionSystem extends EventEmitter {
  constructor() {
    super();
    this.staticColliders = new Set();
    this.dynamicColliders = new Set();
    this.fixedTimeStep = 1/60;
    this.accumulator = 0;
    this.debug = false; // Debug flag to control logging
    this.layerMatrix = {
      // Only check these pairs (add more as needed)
      'player': ['environment', 'enemy', 'projectile'],
      'enemy': ['environment', 'player', 'projectile'],
      'projectile': ['enemy', 'player', 'environment'],
      'environment': ['player', 'enemy', 'projectile'],
      'default': ['default']
    };

    // Create octree with initial bounds
    const initialBounds = new THREE.Box3(
      new THREE.Vector3(-50, -50, -50),
      new THREE.Vector3(50, 50, 50)
    );
    this.octree = new Octree(initialBounds, {
      maxDepth: 8,
      minSize: 2,
      loosenessFactor: 1.2,
      maxObjectsPerNode: 8
    });
  }

  /**
   * Add a collider to the system
   * @param {THREE.Object3D} mesh
   * @param {string} type
   * @param {boolean} isStatic
   * @param {string} layer
   * @returns {Collider}
   */
  addCollider(mesh, type = 'box', isStatic = false, layer = 'default') {
    const collider = new Collider(mesh, type, isStatic, layer);
    if (isStatic) {
      this.staticColliders.add(collider);
    } else {
      this.dynamicColliders.add(collider);
    }
    this.octree.insert(collider);
    return collider;
  }

  /**
   * Remove a collider from the system
   * @param {Collider} collider
   */
  removeCollider(collider) {
    if (collider.isStatic) {
      this.staticColliders.delete(collider);
    } else {
      this.dynamicColliders.delete(collider);
    }
    this.octree.remove(collider);
  }

  /**
   * Layer/mask filtering
   */
  shouldCheckLayers(layerA, layerB) {
    return (this.layerMatrix[layerA] && this.layerMatrix[layerA].includes(layerB)) ||
           (this.layerMatrix[layerB] && this.layerMatrix[layerB].includes(layerA));
  }

  /**
   * Broad phase: use octree to find potential collisions
   */
  broadPhase() {
    // Update dynamic colliders in octree
    for (const collider of this.dynamicColliders) {
      collider.update();
      this.octree.update(collider);
    }
    
    // Rebuild octree if needed
    this.octree.rebuild();
  }

  /**
   * Narrow phase collision detection
   * @returns {Array<[Collider, Collider]>}
   */
  narrowPhase() {
    const collisions = [];
    const checked = new Set();
    
    // Check dynamic colliders against all other colliders
    for (const dyn of this.dynamicColliders) {
      // Skip if collider is not active
      if (!dyn.mesh.visible) continue;
      
      // Update dynamic collider bounds
      dyn.update();
      
      // Check against static colliders
      for (const other of this.staticColliders) {
        // Skip if collider is not active
        if (!other.mesh.visible) continue;
        
        // Skip if layers don't interact
        if (!this.canCollide(dyn.layer, other.layer)) {
          continue;
        }
        
        const key = dyn.mesh.id < other.mesh.id ? 
          `${dyn.mesh.id}-${other.mesh.id}` : 
          `${other.mesh.id}-${dyn.mesh.id}`;
          
        if (!checked.has(key)) {
          checked.add(key);
          
          // Check for collision using bounding boxes
          if (dyn.boundingBox.intersectsBox(other.boundingBox)) {
            collisions.push([dyn, other]);
            
            // Emit collision event
            this.emit('collision', { colliderA: dyn, colliderB: other });
            
            // Call collision handlers if they exist
            if (dyn.mesh.userData.onCollision) {
              dyn.mesh.userData.onCollision(other);
            }
            if (other.mesh.userData.onCollision) {
              other.mesh.userData.onCollision(dyn);
            }
          }
        }
      }
      
      // Check against other dynamic colliders
      for (const other of this.dynamicColliders) {
        // Skip self and inactive colliders
        if (dyn === other || !other.mesh.visible) continue;
        
        // Skip if layers don't interact
        if (!this.canCollide(dyn.layer, other.layer)) {
          continue;
        }
        
        const key = dyn.mesh.id < other.mesh.id ? 
          `${dyn.mesh.id}-${other.mesh.id}` : 
          `${other.mesh.id}-${dyn.mesh.id}`;
          
        if (!checked.has(key)) {
          checked.add(key);
          
          // Check for collision using bounding boxes
          if (dyn.boundingBox.intersectsBox(other.boundingBox)) {
            collisions.push([dyn, other]);
            
            // Emit collision event
            this.emit('collision', { colliderA: dyn, colliderB: other });
            
            // Call collision handlers if they exist
            if (dyn.mesh.userData.onCollision) {
              dyn.mesh.userData.onCollision(other);
            }
            if (other.mesh.userData.onCollision) {
              other.mesh.userData.onCollision(dyn);
            }
          }
        }
      }
    }
    
    return collisions;
  }
  
  /**
   * Check if two layers can collide based on the layer matrix
   */
  canCollide(layerA, layerB) {
    // If either layer is not in the matrix, use default
    const layerAInteractions = this.layerMatrix[layerA] || this.layerMatrix['default'];
    const layerBInteractions = this.layerMatrix[layerB] || this.layerMatrix['default'];
    
    // Check if layers can interact with each other
    return layerAInteractions.includes(layerB) && layerBInteractions.includes(layerA);
  }

  /**
   * Update the collision system
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    this.accumulator += deltaTime;
    while (this.accumulator >= this.fixedTimeStep) {
      this.broadPhase();
      const collisions = this.narrowPhase();
      this.handleCollisions(collisions);
      this.accumulator -= this.fixedTimeStep;
    }
  }

  /**
   * Handle collision responses
   * @param {Array<[Collider, Collider]>} collisions
   */
  handleCollisions(collisions) {
    for (const [a, b] of collisions) {
      // Emit collision event
      this.emit('collision', { colliderA: a, colliderB: b });
    }
  }
} 