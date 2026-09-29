import { useEffect, useRef } from 'react';

/**
 * Draws an animated aurora/nebula background on a canvas.
 * Three slowly-drifting radial blobs of color.
 */
export default function AuroraBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let t = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const blobs = [
      { x: 0.18, y: 0.20, r: 0.42, color: '139,127,247', speed: 0.0003, offsetX: 0.06, offsetY: 0.04 },
      { x: 0.80, y: 0.75, r: 0.38, color:  '34,211,238', speed: 0.0004, offsetX: 0.04, offsetY: 0.06 },
      { x: 0.50, y: 0.50, r: 0.30, color:  '90,138,255', speed: 0.0002, offsetX: 0.08, offsetY: 0.05 },
    ];

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blobs.forEach(b => {
        const cx = (b.x + Math.sin(t * b.speed * 1.3) * b.offsetX) * canvas.width;
        const cy = (b.y + Math.cos(t * b.speed)       * b.offsetY) * canvas.height;
        const r  = b.r * Math.min(canvas.width, canvas.height);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0,   `rgba(${b.color}, 0.13)`);
        grad.addColorStop(0.5, `rgba(${b.color}, 0.05)`);
        grad.addColorStop(1,   `rgba(${b.color}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
