/**
 * Simple noise function for procedural effects
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} - Noise value between -1 and 1
 */
export function noise(x, y) {
  return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} - Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Dot product of two 3D vectors
 * @param {{x:number, y:number, z:number}} a
 * @param {{x:number, y:number, z:number}} b
 * @returns {number}
 */
export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Cross product of two 3D vectors
 * @param {{x:number, y:number, z:number}} a
 * @param {{x:number, y:number, z:number}} b
 * @returns {{x:number, y:number, z:number}}
 */
export function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

/**
 * Normalize a 3D vector
 * @param {{x:number, y:number, z:number}} v
 * @returns {{x:number, y:number, z:number}}
 */
export function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Optimized squared distance between two 3D points
 * @param {{x:number, y:number, z:number}} a
 * @param {{x:number, y:number, z:number}} b
 * @returns {number}
 */
export function distSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Euclidean distance between two 3D points
 * @param {{x:number, y:number, z:number}} a
 * @param {{x:number, y:number, z:number}} b
 * @returns {number}
 */
export function dist(a, b) {
  return Math.sqrt(distSq(a, b));
}

/**
 * Clamp a value between min and max
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Returns a random float between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randRange(min, max) {
  return Math.random() * (max - min) + min;
} 