import * as THREE from 'three';

/**
 * Creates a shader material for an aurora effect in the sky
 * @param {THREE.Vector3} [playerPosition] - Optional player or camera position for centering aurora
 * @returns {THREE.ShaderMaterial} The aurora shader material
 */
export function createAuroraMaterial(playerPosition = new THREE.Vector3(0,0,0)) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      playerXZ: { value: new THREE.Vector2(playerPosition.x, playerPosition.z) }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec2 playerXZ;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      // --- Noise functions ---
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      // --- Star field ---
      float starField(vec2 uv) {
        float stars = 0.0;
        for (int i = 0; i < 3; i++) {
          vec2 offset = vec2(float(i) * 12.0, float(i) * 7.0);
          float star = step(0.9999, random(uv * 100.0 + offset));
          stars += star;
        }
        return clamp(stars, 0.0, 1.0);
      }
      
      void main() {
        // --- Base dark sky ---
        vec3 nightColor = vec3(0.01, 0.01, 0.03);
        float skyFade = smoothstep(-0.2, 0.7, vPosition.y * 0.02 + 0.5);
        vec3 color = nightColor * skyFade;
        
        // --- Stars ---
        float stars = starField(normalize(vPosition).xy);
        color += vec3(1.0, 1.0, 1.0) * stars * 0.3;
        
        // --- Aurora effect: single large curtain, opens near ground ---
        float aurora = 0.0;
        // Use direction vector for a diagonal curtain in the sky
        vec3 dir = normalize(vPosition);
        float curtainPos = dir.x + dir.z * 0.7; // diagonal across sky
        float baseWidth = 0.24 + noise(vec2(time * 0.02, 0.0)) * 0.08;
        float widen = 0.8 + 2.0 * smoothstep(-1.0, 1.0, vPosition.y * 0.04); // wider higher up
        float bandWidth = baseWidth * widen;
        float y = vPosition.y * 0.18 - 1.0 + time * 0.12;
        // Main band shape (curtain)
        float band = exp(-pow((curtainPos) / bandWidth, 2.0));
        // Only show above horizon
        band *= smoothstep(0.0, 0.2, dir.y);
        // Add vertical wisps
        float wisp = noise(vec2(curtainPos * 2.0, y * 1.5 + sin(time * 0.1) * 2.0));
        wisp = pow(wisp, 2.0);
        // Combine
        aurora = band * wisp;
        aurora = smoothstep(0.2, 0.8, aurora);
        aurora = clamp(aurora, 0.0, 1.0);
        // Aurora color: green core, red edges
        float edge = smoothstep(0.5, 1.0, abs(curtainPos / bandWidth));
        vec3 auroraColor = mix(vec3(0.1, 1.0, 0.2), vec3(1.0, 0.1, 0.1), edge);
        // Add aurora to sky
        color += aurora * auroraColor * 1.3;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false
  });
} 