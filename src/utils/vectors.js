import * as THREE from 'three';

/**
 * Common vector constants used throughout the application.
 * These are functions that return new instances to ensure they can be safely modified.
 */
export const VECTORS = {
  // Camera forward direction in local space
  CAMERA_FORWARD: () => new THREE.Vector3(0, 0, -1),
  // World up direction
  WORLD_UP: () => new THREE.Vector3(0, 1, 0),
  // World right direction
  WORLD_RIGHT: () => new THREE.Vector3(1, 0, 0),
  // World forward direction
  WORLD_FORWARD: () => new THREE.Vector3(0, 0, 1)
}; 