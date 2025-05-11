import * as THREE from 'three';
import { Player } from '../components/Player';
import { MobileControls } from '../components/MobileControls';

export class AshmoorScene extends THREE.Scene {
  constructor() {
    super();
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    
    // Add skybox with aurora
    this.createSkybox();
    
    // Add player
    this.player = new Player(this);
    
    // Add lighting
    this.add(new THREE.AmbientLight(0xffffff, 0.3)); // Reduced ambient light for night effect
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.add(directionalLight);
    
    // Minimal village geometry
    this.add(this.createGround());
    this.add(this.createHouse(-3, 0));
    this.add(this.createHouse(3, 0));
    
    // Mobile controls (only on touch devices)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.mobileControls = new MobileControls();
    }
    // TODO: Replace placeholder geometry with art assets
  }

  createSkybox() {
    // Create a large sphere for the sky
    const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
    // Invert the geometry so the texture is on the inside
    skyGeometry.scale(-1, 1, 1);
    
    // Create aurora shader material
    const auroraMaterial = new THREE.ShaderMaterial({
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
          
          // Stars
          float stars = 0.0;
          vec2 starPos = vPosition.xy * 100.0;
          starPos.y += time * 0.05;
          stars = random(starPos) > 0.995 ? 1.0 : 0.0;
          
          // Combine everything
          vec3 finalColor = nightColor;
          finalColor += aurora * auroraColor * 0.5;
          finalColor += stars * vec3(1.0);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    const sky = new THREE.Mesh(skyGeometry, auroraMaterial);
    sky.position.set(0, 0, 0); // Center the skybox
    this.add(sky);
    this.sky = sky;
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x334422,
      roughness: 0.8,
      metalness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1;
    return mesh;
  }

  createHouse(x, z) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0, z);
    return mesh;
  }

  update() {
    // Update sky animation
    if (this.sky && this.sky.material.uniforms) {
      this.sky.material.uniforms.time.value += 0.01;
    }
    this.player.update();
  }
} 