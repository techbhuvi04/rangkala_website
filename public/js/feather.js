// 3D Feather animation — Three.js model aur scroll transforms

class FeatherAnimator {
  constructor() {
    this.container = document.getElementById('feather-container');
    this.canvas = document.getElementById('feather-canvas');
    
    // Mobile pe 3D band rakho
    if (window.innerWidth < 768) {
      if (this.container) this.container.style.display = 'none';
      return;
    }

    if (!this.container || !this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.pivot = null;
    
    this.scrollProgress = 0;

    this.initThree();
    this.setupScrollAnimation();
  }

  initThree() {
    // Scene setup
    this.scene = new THREE.Scene();

    // Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.z = 5;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      alpha: true,
      antialias: true 
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);
    
    const backLight = new THREE.DirectionalLight(0xffcc00, 2.0);
    backLight.position.set(-5, -5, -5);
    this.scene.add(backLight);

    // GLB Model load karo
    const loader = new THREE.GLTFLoader();
    loader.load(
      '/images/final_feather.glb',
      (gltf) => {
        this.model = gltf.scene;
        
        // Model center aur scale karo
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.1 / maxDim;
        this.model.scale.set(scale, scale, scale);
        
        this.model.position.sub(center.multiplyScalar(scale));
        this.model.rotation.z = Math.PI;
        
        // Material settings
        this.model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.roughness = 0.3;
            child.material.metalness = 0.7;
            child.material.emissive = new THREE.Color(0x331100);
            child.material.emissiveIntensity = 0.6;
            child.material.needsUpdate = true;
          }
        });
        
        // Pivot group me wrap karo
        this.pivot = new THREE.Group();
        this.pivot.add(this.model);
        
        // Glow lights
        const pointLight = new THREE.PointLight(0xffaa00, 1.5, 8);
        this.pivot.add(pointLight);

        this.blueLight = new THREE.PointLight(0x0066ff, 2.0, 12);
        this.blueLight.position.set(0, 0, -1);
        this.scene.add(this.blueLight);
        
        this.pivot.rotation.z = -15 * (Math.PI / 180);
        
        this.scene.add(this.pivot);
        this.updateModelTransform();

        // Model ready event
        window.dispatchEvent(new CustomEvent('featherLoaded'));
      },
      undefined,
      (error) => {
        console.error('Feather load error:', error);
      }
    );

    // Window resize handle karo
    window.addEventListener('resize', () => {
      if (!this.container || !this.camera || !this.renderer) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(width, height);
    });

    // Render loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  updateModelTransform() {
    if (!this.pivot) return;

    // Scroll ke sath rotate aur float karo
    const baseRot = -15 * (Math.PI / 180);
    this.pivot.rotation.z = baseRot + (this.scrollProgress * Math.PI * 4); 
    this.pivot.rotation.x = this.scrollProgress * Math.PI * 6;
    
    // Left-right sway
    const swayX = Math.sin(this.scrollProgress * Math.PI * 5) * 1.2;
    this.pivot.position.x = swayX;

    // Up-down floating
    const swayY = (Math.cos(this.scrollProgress * Math.PI * 6) * 0.5) - 0.5;
    this.pivot.position.y = swayY;
    
    if (this.blueLight) {
      this.blueLight.position.x = swayX;
      this.blueLight.position.y = swayY;
    }
    
    const depthScale = 1 - (Math.abs(swayX) * 0.15);
    this.pivot.scale.set(depthScale, depthScale, depthScale);

    // Particles ko offset update bhejo
    if (window.particleSystem) {
      window.particleSystem.setCenterOffset(swayX, swayY);
    }

    const glowDiv = document.getElementById('feather-glow');
    if (glowDiv) {
      glowDiv.style.transform = `translate(calc(-50% + ${swayX * 10}vw), calc(-50% - ${swayY * 15}vh))`;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.pivot) {
      this.pivot.rotation.y += 0.003;
      
      const time = this.clock.getElapsedTime();
      this.pivot.position.z = Math.sin(time * 1.5) * 0.15;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setupScrollAnimation() {
    // Scroll trigger track karo
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: (self) => {
        this.scrollProgress = self.progress;
        this.updateModelTransform();
      }
    });
  }
}

window.FeatherAnimator = FeatherAnimator;

// DOM ready pe init karo
document.addEventListener("DOMContentLoaded", () => {
  window.featherAnimator = new FeatherAnimator();
});
