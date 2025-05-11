import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { Vector2 } from 'three';

// Simple vertex jitter and resolution downscale shader
export function createPS1ShaderPass(resolution = new Vector2(320, 240)) {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      resolution: { value: resolution },
      time: { value: 0 }
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        // Vertex jitter (simple noise)
        pos.xy += (sin(position.yx * 10.0 + position.z * 2.0 + time * 2.0) * 0.01);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      varying vec2 vUv;
      void main() {
        // Downscale to low-res, then sample
        vec2 uv = floor(vUv * resolution) / resolution;
        gl_FragColor = texture2D(tDiffuse, uv);
        // TODO: Add dithering, CRT, vignette, etc.
      }
    `
  });
} 