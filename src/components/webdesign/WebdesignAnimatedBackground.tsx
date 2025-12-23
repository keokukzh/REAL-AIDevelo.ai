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
  const animationFrameRef = useRef<number>();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    // Performance optimization: Use devicePixelRatio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Particle configuration based on intensity
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
    
    // Throttle connection checks for performance
    let connectionCheckCounter = 0;
    const connectionCheckInterval = 2; // Check every 2 frames

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
        // Swiss red color scheme
        this.color = variant === 'hero' 
          ? `rgba(218, 41, 28, ${this.opacity})` 
          : `rgba(99, 102, 241, ${this.opacity})`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const drawConnection = (p1: Particle, p2: Particle) => {
      if (!ctx) return;
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < connectionDistance) {
        const opacity = (1 - distance / connectionDistance) * 0.2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = variant === 'hero'
          ? `rgba(218, 41, 28, ${opacity})`
          : `rgba(99, 102, 241, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameInterval) {
        ctx.clearRect(0, 0, width, height);

        // Update and draw particles
        particles.forEach((particle) => {
          particle.update();
          particle.draw();
        });

        // Draw connections (throttled for performance)
        connectionCheckCounter++;
        if (connectionCheckCounter >= connectionCheckInterval) {
          connectionCheckCounter = 0;
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              drawConnection(particles[i], particles[j]);
            }
          }
        }

        lastFrameTime = currentTime - (deltaTime % frameInterval);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [variant, intensity, prefersReducedMotion]);

  return (
    <>
      {/* Animated Gradient Mesh */}
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

      {/* Canvas Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none gpu-accelerated"
        style={{ zIndex: 0, imageRendering: 'auto' }}
        aria-hidden="true"
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 90%)',
        }}
        aria-hidden="true"
      />

      {/* Radial Glow Effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            background: variant === 'hero'
              ? 'radial-gradient(circle, rgba(218, 41, 28, 0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
            animation: prefersReducedMotion ? 'none' : 'pulse 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{
            background: variant === 'hero'
              ? 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
            animation: prefersReducedMotion ? 'none' : 'pulse 6s ease-in-out infinite 2s',
          }}
        />
      </div>

      {/* Wave Animation */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-10"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${variant === 'hero' ? 'rgba(218, 41, 28, 0.1)' : 'rgba(99, 102, 241, 0.1)'} 100%)`,
          clipPath: 'polygon(0 20%, 100% 0%, 100% 100%, 0% 100%)',
        }}
        aria-hidden="true"
      />
    </>
  );
};

