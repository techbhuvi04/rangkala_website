// Backup: Particle system implementation

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 100;
    this.ambientParticleCount = 40;
    this.globalAlpha = 1;
    this.isActive = true;
    this.mouse = { x: 0, y: 0 };
    this.time = 0;
    
    this.colors = [
      { r: 244, g: 208, b: 63 }, { r: 212, g: 160, b: 21 },
      { r: 255, g: 223, b: 100 }, { r: 196, g: 30, b: 30 },
      { r: 255, g: 180, b: 50 }, { r: 0, g: 150, b: 255 }
    ];
    
    this.swayOffsetX = 0;
    this.swayOffsetY = 0;

    this.init();
    
    window.addEventListener('resize', () => {
      if(!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    this.animate();
  }

  init() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle(false));
    }
    for (let i = 0; i < this.ambientParticleCount; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(isAmbient) {
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    let x, y, size, shimmerSpeed, glowSize;
    if (isAmbient) {
      x = Math.random() * this.canvas.width;
      y = Math.random() * this.canvas.height;
      size = Math.random() * 2 + 0.5;
      shimmerSpeed = Math.random() * 0.01 + 0.002;
      glowSize = Math.random() * 10 + 2;
    } else {
      const centerX = this.canvas.width * 0.8; 
      const centerY = this.canvas.height * 0.45; 
      const radius = Math.random() * (this.canvas.height * 0.25);
      const angle = Math.random() * Math.PI * 2;
      
      x = centerX + Math.cos(angle) * radius;
      y = centerY + Math.sin(angle) * radius;
      size = Math.random() * 3 + 0.5;
      shimmerSpeed = Math.random() * 0.02 + 0.005;
      glowSize = Math.random() * 15 + 5;
    }
    
    return {
      x: x, y: y, size: size, color: color,
      alpha: Math.random() * 0.6 + 0.1,
      baseAlpha: Math.random() * 0.6 + 0.1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      shimmerSpeed: shimmerSpeed,
      shimmerOffset: Math.random() * Math.PI * 2,
      glowSize: glowSize,
      drift: Math.random() * 0.5 + 0.2,
      driftOffset: Math.random() * Math.PI * 2,
      isAmbient: isAmbient
    };
  }

  updateParticle(p) {
    p.alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(this.time * p.shimmerSpeed + p.shimmerOffset));
    p.x += p.vx + Math.sin(this.time * 0.001 + p.driftOffset) * p.drift * 0.3;
    p.y += p.vy + Math.cos(this.time * 0.0008 + p.driftOffset) * p.drift * 0.2;
    
    const dx = p.x - this.mouse.x;
    const dy = p.y - this.mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 250) {
      const force = (250 - dist) / 250 * 1.5;
      p.x += (dx / dist) * force;
      p.y += (dy / dist) * force;
    }
    
    if (p.x < 0) p.x = this.canvas.width;
    if (p.x > this.canvas.width) p.x = 0;
    if (p.y < 0) p.y = this.canvas.height;
    if (p.y > this.canvas.height) p.y = 0;
  }

  drawParticle(p) {
    const alpha = p.alpha * this.globalAlpha;
    if (alpha <= 0.01) return;
    
    const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowSize);
    gradient.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.6})`);
    gradient.addColorStop(0.4, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.2})`);
    gradient.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.glowSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = `rgba(${Math.min(p.color.r + 60, 255)}, ${Math.min(p.color.g + 60, 255)}, ${Math.min(p.color.b + 30, 255)}, ${alpha})`;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  animate() {
    if (!this.isActive) return;
    this.time++;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      this.updateParticle(p);
      this.drawParticle(p);
    }
    requestAnimationFrame(() => this.animate());
  }

  setAlpha(alpha) {
    this.globalAlpha = Math.max(0, Math.min(1, alpha));
  }

  setCenterOffset(osx, osy) {
    this.swayOffsetX = osx;
    this.swayOffsetY = osy;
  }
}
