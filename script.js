/**
 * ALINA IS THE GOAT — Continuous Bespoke Confetti Physics Engine
 * High-performance 2D Canvas with 3D projection, flutter aerodynamics, and dynamic wind.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');

  // Palette: Luxury Gilded & Champagne Foil with Subtle Holographic Accents
  const COLOR_PALETTES = [
    { base: [212, 175, 55], name: 'pure-gold', weight: 30 },       // #d4af37
    { base: [247, 231, 180], name: 'pale-gold', weight: 25 },     // #f7e7b4
    { base: [229, 211, 179], name: 'champagne', weight: 20 },     // #e5d3b3
    { base: [255, 255, 255], name: 'silver-foil', weight: 15 },   // pure white foil
    { base: [200, 62, 77], name: 'crimson-accent', weight: 6 },    // #c83e4d
    { base: [167, 139, 250], name: 'soft-violet', weight: 4 },    // iridescent hint
  ];

  function getWeightedRandomColor() {
    const totalWeight = COLOR_PALETTES.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of COLOR_PALETTES) {
      if (rand < item.weight) return item.base;
      rand -= item.weight;
    }
    return COLOR_PALETTES[0].base;
  }

  // State Management
  let width = 0;
  let height = 0;
  let dpr = 1;
  let isRunning = true;
  let particles = [];
  let lastTime = performance.now();
  
  // Ambient Wind & Interaction
  let wind = 0;
  let targetWind = 0;
  let mouse = { x: -1000, y: -1000, vx: 0, lastX: 0, lastY: 0, lastMoveTime: 0 };

  // System Configuration
  const CONFIG = {
    continuousSpawnRate: 1.6, // Particles spawned per frame on average
    maxActiveParticles: 350,
    gravity: 0.18,
    drag: 0.988,
    types: ['strip', 'diamond', 'circle', 'streamer'],
  };

  /**
   * Confetti Particle Entity
   */
  class Particle {
    constructor(x, y, burst = false, angle = 0, speed = 0) {
      this.reset(x, y, burst, angle, speed);
    }

    reset(x, y, burst = false, angle = 0, speed = 0) {
      this.x = x !== undefined ? x : Math.random() * width;
      this.y = y !== undefined ? y : -20 - Math.random() * 50;
      
      const typeRand = Math.random();
      if (typeRand < 0.55) {
        this.type = 'strip';
        this.w = 9 + Math.random() * 8;
        this.h = 16 + Math.random() * 12;
      } else if (typeRand < 0.78) {
        this.type = 'diamond';
        this.w = 8 + Math.random() * 7;
        this.h = this.w;
      } else if (typeRand < 0.92) {
        this.type = 'circle';
        this.w = 6 + Math.random() * 6;
        this.h = this.w;
      } else {
        this.type = 'streamer';
        this.w = 6 + Math.random() * 4;
        this.h = 35 + Math.random() * 25;
      }

      this.colorRgb = getWeightedRandomColor();
      this.opacity = 0.85 + Math.random() * 0.15;

      if (burst) {
        const rad = angle !== undefined ? angle : Math.random() * Math.PI * 2;
        const velocity = speed || (8 + Math.random() * 14);
        this.vx = Math.cos(rad) * velocity;
        this.vy = Math.sin(rad) * velocity;
      } else {
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 1.8 + Math.random() * 2.8;
      }

      // 3D Rotation & Aerodynamic Flutter
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.08;
      
      this.tilt = Math.random() * Math.PI;
      this.tiltSpeed = 0.03 + Math.random() * 0.05;
      
      this.roll = Math.random() * Math.PI;
      this.rollSpeed = 0.02 + Math.random() * 0.04;

      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.04 + Math.random() * 0.06;

      this.terminalVelocity = 3.2 + Math.random() * 2.5;
    }

    update(dt) {
      // Wind integration
      this.vx += wind * 0.05;
      this.vx *= CONFIG.drag;

      // Gravity with terminal air resistance
      if (this.vy < 0) {
        this.vy *= CONFIG.drag;
      }
      if (this.vy < this.terminalVelocity) {
        this.vy += CONFIG.gravity * dt;
      } else {
        this.vy *= 0.99;
      }

      // Wobble & Flutter
      this.wobble += this.wobbleSpeed * dt;
      const flutterX = Math.sin(this.wobble) * 0.8;
      
      this.x += (this.vx + flutterX) * dt;
      this.y += this.vy * dt;

      // Angular transformations
      this.rotation += this.rotationSpeed * dt;
      this.tilt += this.tiltSpeed * dt;
      this.roll += this.rollSpeed * dt;

      // Wrap around edges gracefully
      if (this.x < -40) this.x = width + 30;
      if (this.x > width + 40) this.x = -30;
    }

    draw(ctx) {
      // Project 3D rotation onto 2D surface
      const cosTilt = Math.cos(this.tilt);
      const sinRoll = Math.sin(this.roll);

      // Specular foil shimmer calculation
      const shimmer = (cosTilt * 0.35 + sinRoll * 0.35);
      const r = Math.min(255, Math.max(0, Math.floor(this.colorRgb[0] + shimmer * 70)));
      const g = Math.min(255, Math.max(0, Math.floor(this.colorRgb[1] + shimmer * 70)));
      const b = Math.min(255, Math.max(0, Math.floor(this.colorRgb[2] + shimmer * 70)));
      
      // Foil back-face dimming
      const lightFactor = Math.abs(cosTilt);
      const currentAlpha = Math.max(0.2, this.opacity * (0.6 + 0.4 * lightFactor));

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(cosTilt, sinRoll);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;

      if (this.type === 'strip') {
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      } else if (this.type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, this.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(0, -this.h / 2);
        ctx.lineTo(this.w / 2, 0);
        ctx.lineTo(0, this.h / 2);
        ctx.lineTo(-this.w / 2, 0);
        ctx.closePath();
        ctx.fill();
      } else if (this.type === 'streamer') {
        // Subtle curve ribbon
        ctx.beginPath();
        ctx.moveTo(-this.w / 2, -this.h / 2);
        ctx.quadraticCurveTo(this.w * 1.5, 0, -this.w / 2, this.h / 2);
        ctx.lineTo(this.w / 2, this.h / 2);
        ctx.quadraticCurveTo(this.w * 2.5, 0, this.w / 2, -this.h / 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Resize Handling with DPR support
   */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  /**
   * Seed Initial Continuous Particles Across the Viewport
   */
  function seedInitialParticles() {
    const initialCount = Math.min(140, Math.floor((width * height) / 9000));
    for (let i = 0; i < initialCount; i++) {
      const p = new Particle();
      p.x = Math.random() * width;
      p.y = Math.random() * height; // Spread across the entire screen at start
      particles.push(p);
    }
  }

  /**
   * Burst Generator for Celebrations
   */
  function createBurst(originX, originY, count = 75) {
    playCelebrationTone();
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 1.2) - (Math.PI * 1.1); // Arched upwards
      const speed = 7 + Math.random() * 16;
      const p = new Particle(originX, originY, true, angle, speed);
      particles.push(p);
    }

    // Trim excess to maintain peak 60fps
    if (particles.length > CONFIG.maxActiveParticles * 1.5) {
      particles.splice(0, particles.length - CONFIG.maxActiveParticles);
    }
  }

  /**
   * Subtle Web Audio Synthesis
   * Elegant, crystalline pentatonic chime
   */
  let audioCtx = null;
  function playCelebrationTone() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      const freq = notes[Math.floor(Math.random() * notes.length)];
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.045, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
    } catch (e) {
      // Audio autoplay policy or unavailable — silent degrade
    }
  }

  /**
   * Mouse Dynamics & Wind Generation
   */
  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    const dt = Math.max(1, now - mouse.lastMoveTime);
    mouse.vx = (e.clientX - mouse.lastX) / dt;
    targetWind = Math.max(-2.5, Math.min(2.5, mouse.vx * 0.6));

    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
    mouse.lastMoveTime = now;
  }, { passive: true });

  // Burst on click/tap anywhere on canvas background
  function handlePointerBurst(e) {
    if (e.target.closest('button') || e.target.closest('#interactive-seal')) return;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : width / 2);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : height / 2);
    createBurst(clientX, clientY, 50);
  }

  window.addEventListener('click', handlePointerBurst);
  window.addEventListener('touchstart', (e) => {
    // Only fire if not on button/seal to prevent double triggers
    if (e.target.closest('button') || e.target.closest('#interactive-seal')) return;
    handlePointerBurst(e);
  }, { passive: true });

  /**
   * Controls & Seal Interaction
   */
  const burstBtn = document.getElementById('confetti-burst-btn');
  const toggleBtn = document.getElementById('confetti-toggle-btn');
  const pauseIcon = toggleBtn.querySelector('.pause-icon');
  const playIcon = toggleBtn.querySelector('.play-icon');
  const seal = document.getElementById('interactive-seal');

  if (burstBtn) {
    burstBtn.addEventListener('click', (e) => {
      const rect = burstBtn.getBoundingClientRect();
      createBurst(rect.left + rect.width / 2, rect.top, 85);
    });
  }

  if (seal) {
    seal.addEventListener('click', (e) => {
      const rect = seal.getBoundingClientRect();
      createBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
    });
    seal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        seal.click();
      }
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isRunning = !isRunning;
      if (isRunning) {
        pauseIcon.classList.remove('hidden');
        playIcon.classList.add('hidden');
        lastTime = performance.now();
        requestAnimationFrame(loop);
      } else {
        pauseIcon.classList.add('hidden');
        playIcon.classList.remove('hidden');
      }
    });
  }

  /**
   * Main Physics Animation Loop
   */
  function loop(currentTime) {
    if (!isRunning) return;

    // Normalizing delta-time to 60fps unit (~1.0 at 60fps)
    const rawDelta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    const dt = Math.min(2.5, Math.max(0.5, rawDelta * 60));

    // Smooth wind decay
    wind += (targetWind - wind) * 0.05 * dt;
    targetWind *= 0.95;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Continuous Spawn from top
    if (particles.length < CONFIG.maxActiveParticles) {
      if (Math.random() < CONFIG.continuousSpawnRate) {
        particles.push(new Particle());
      }
    }

    // Update and Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(dt);
      p.draw(ctx);

      // Cull particles that traveled past bottom
      if (p.y > height + 60) {
        if (particles.length <= CONFIG.maxActiveParticles) {
          // Recycle to the top
          p.reset(Math.random() * width, -20);
        } else {
          particles.splice(i, 1);
        }
      }
    }

    requestAnimationFrame(loop);
  }

  // Initialize
  seedInitialParticles();
  requestAnimationFrame(loop);
})();
