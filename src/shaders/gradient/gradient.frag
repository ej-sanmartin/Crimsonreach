precision mediump float;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec3 color = mix(vec3(0.2, 0.4, 0.8), vec3(0.8, 0.2, 0.4), sin(uTime + vUv.y));
  gl_FragColor = vec4(color, 1.0);
} 