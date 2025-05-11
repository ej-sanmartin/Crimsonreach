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
 * Spherical linear interpolation between two quaternions
 * @param {THREE.Quaternion} qa - Start quaternion
 * @param {THREE.Quaternion} qb - End quaternion
 * @param {THREE.Quaternion} qm - Output quaternion
 * @param {number} t - Interpolation factor (0-1)
 */
export function slerp(qa, qb, qm, t) {
  // Calculate angle between quaternions
  let cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;
  
  // If qa=qb or qa=-qb then theta = 0 and we can return qa
  if (Math.abs(cosHalfTheta) >= 1.0) {
    qm.w = qa.w;
    qm.x = qa.x;
    qm.y = qa.y;
    qm.z = qa.z;
    return;
  }
  
  // Calculate temporary values
  const halfTheta = Math.acos(cosHalfTheta);
  const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
  
  // If theta = 180 degrees then result is not fully defined
  // we could rotate around any axis normal to qa or qb
  if (Math.abs(sinHalfTheta) < 0.001) {
    qm.w = (qa.w * 0.5 + qb.w * 0.5);
    qm.x = (qa.x * 0.5 + qb.x * 0.5);
    qm.y = (qa.y * 0.5 + qb.y * 0.5);
    qm.z = (qa.z * 0.5 + qb.z * 0.5);
    return;
  }
  
  const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
  const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
  
  // Calculate Quaternion
  qm.w = (qa.w * ratioA + qb.w * ratioB);
  qm.x = (qa.x * ratioA + qb.x * ratioB);
  qm.y = (qa.y * ratioA + qb.y * ratioB);
  qm.z = (qa.z * ratioA + qb.z * ratioB);
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