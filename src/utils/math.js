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