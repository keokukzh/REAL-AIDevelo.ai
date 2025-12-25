import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface WebdesignAnimatedBackgroundProps {
  variant?: 'hero' | 'section';
  intensity?: 'low' | 'medium' | 'high';
}

export const WebdesignAnimatedBackground: React.FC<WebdesignAnimatedBackgroundProps> = ({
  variant = 'hero',
  intensity = 'medium',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    setupCanvas();

    const particleCounts = {
      low: 30,
      medium: 60,
      high: 100,
    };
    const particleCount = particleCounts[intensity];
    const connectionDistance = 150;
    let lastFrameTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    let scanlineY = 0;
    const scanlineSpeed = 1.5;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = variant === 'hero' 
          ? `rgba(218, 41, 28, ${this.opacity})` 
          : `rgba(99, 102, 241, ${this.opacity})`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add subtle glow to particles
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
      }
    }

    const particles: Particle[] = Array.from({ length: particleCount }, () => new Particle());

    const drawConnection = (p1: Particle, p2: Particle) => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < connectionDistance) {
        const opacity = (1 - distance / connectionDistance) * 0.15;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = variant === 'hero'
          ? `rgba(218, 41, 28, ${opacity})`
          : `rgba(99, 102, 241, ${opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    };

    const drawScanline = () => {
      if (variant !== 'hero') return;
      
      scanlineY = (scanlineY + scanlineSpeed) % height;
      
      const gradient = ctx.createLinearGradient(0, scanlineY - 50, 0, scanlineY + 50);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, 'rgba(218, 41, 28, 0.05)');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanlineY - 50, width, 100);
      
      // Draw actual thin scanline
      ctx.beginPath();
      ctx.moveTo(0, scanlineY);
      ctx.lineTo(width, scanlineY);
      ctx.strokeStyle = 'rgba(218, 41, 28, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameInterval) {
        ctx.clearRect(0, 0, width, height);
        ctx.shadowBlur = 0; // Reset shadow for basic elements

        particles.forEach((particle) => {
          particle.update();
          particle.draw();
        });

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            drawConnection(particles[i], particles[j]);
          }
        }

        drawScanline();

        lastFrameTime = currentTime - (deltaTime % frameInterval);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', setupCanvas);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [variant, intensity, prefersReducedMotion]);

  return (
    <>
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: variant === 'hero'
            ? 'radial-gradient(circle at 20% 50%, rgba(218, 41, 28, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(220, 38, 38, 0.2) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)'
            : 'radial-gradient(circle at 30% 40%, rgba(99, 102, 241, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
          animation: prefersReducedMotion ? 'none' : 'gradient-mesh 20s ease infinite',
        }}
        aria-hidden="true"
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none gpu-accelerated"
        style={{ zIndex: 0, imageRendering: 'auto' }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>
    </>
  );
};

