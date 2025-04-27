uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  pos.z += sin(pos.x * 0.1 + uTime) * 2.0; // Procedural height
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
} 