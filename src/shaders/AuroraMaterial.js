import * as THREE from 'three';

/**
 * Creates a shader material for an aurora effect in the sky
 * @returns {THREE.ShaderMaterial} The aurora shader material
 */
export function createAuroraMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
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
      varying vec2 vUv;
      varying vec3 vPosition;
      
      // Noise functions
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
      
      void main() {
        // Base night sky color
        vec3 nightColor = vec3(0.05, 0.05, 0.1);
        
        // Aurora effect
        float aurora = 0.0;
        vec2 auroraPos = vPosition.xy * 0.5;
        auroraPos.y += time * 0.1;
        
        // Multiple layers of noise for aurora
        aurora += noise(auroraPos * 2.0) * 0.5;
        aurora += noise(auroraPos * 4.0) * 0.25;
        aurora += noise(auroraPos * 8.0) * 0.125;
        
        // Aurora color (crimson with some green)
        vec3 auroraColor = mix(
          vec3(0.8, 0.1, 0.1), // Crimson
          vec3(0.1, 0.8, 0.1), // Green
          noise(auroraPos * 0.5 + time * 0.05)
        );
        
        // Combine everything
        vec3 finalColor = nightColor;
        finalColor += aurora * auroraColor * 0.5;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false
  });
} 