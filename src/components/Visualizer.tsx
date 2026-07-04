import React, { useEffect, useRef } from 'react';
import { rockyAudioEngine } from '../services/rockyEngine';

export const Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const analyser = rockyAudioEngine.getAnalyser();

    // Resize handler
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle systems
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      alpha: number;
      color: string;
    }
    const particles: Particle[] = [];

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // 1. CRT motion blur background clearing
      ctx.fillStyle = 'rgba(5, 6, 13, 0.2)';
      ctx.fillRect(0, 0, w, h);

      // 2. Draw spaceship terminal grid lines
      ctx.strokeStyle = 'rgba(245, 185, 113, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 3. Draw oscilloscope centerline
      ctx.strokeStyle = 'rgba(255, 157, 66, 0.05)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // 4. Retrieve audio data or simulate thermal antenna noise
      let waveData = new Float32Array(256);
      let isPlaying = false;

      if (analyser) {
        const values = analyser.getValue() as Float32Array;
        // check if values actually have audio (not just silence zeroes)
        let sumSquare = 0;
        for (let i = 0; i < values.length; i++) {
          waveData[i] = values[i];
          sumSquare += values[i] * values[i];
        }
        const rms = Math.sqrt(sumSquare / values.length);
        if (rms > 0.005) {
          isPlaying = true;
        }
      }

      // If silent, inject standard sci-fi white/thermal background static
      if (!isPlaying) {
        for (let i = 0; i < waveData.length; i++) {
          waveData[i] = (Math.random() - 0.5) * 0.02; // Small background electromagnetic flutter
        }
      }

      // 5. Draw the Waveform (Oscilloscope)
      ctx.strokeStyle = isPlaying ? '#ff9d42' : '#f5b971';
      ctx.lineWidth = isPlaying ? 2.5 : 1.5;
      ctx.shadowBlur = isPlaying ? 10 : 3;
      ctx.shadowColor = '#ff9d42';

      ctx.beginPath();
      const sliceWidth = w / waveData.length;
      let x = 0;

      for (let i = 0; i < waveData.length; i++) {
        // waveData values range from -1.0 to 1.0, map to canvas height
        const v = waveData[i] * 1.2; // slight scale boost for visibility
        const y = (v * h) / 2 + h / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Reset shadow for standard elements
      ctx.shadowBlur = 0;

      // 6. Draw floating energy particles
      // If audio is playing, spawn particles matching wave spikes
      if (isPlaying && Math.random() < 0.3) {
        particles.push({
          x: Math.random() * w,
          y: h - 10,
          size: Math.random() * 3 + 1,
          speedY: -(Math.random() * 1.5 + 0.5),
          alpha: 1.0,
          color: Math.random() > 0.5 ? '#57ffb3' : '#f5b971' // Success Green or Accent Amber
        });
      }

      // Render/update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.speedY;
        p.alpha -= 0.01;

        if (p.alpha <= 0 || p.y < 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 7. NASA-style console text overlay
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(245, 185, 113, 0.4)';
      ctx.fillText(`OSCILLOSCOPE LINK: ${isPlaying ? 'ACTIVE' : 'STANDBY'}`, 12, 20);
      ctx.fillText(`FREQ_RES: 256B | W_FORM: SINE_COMP`, 12, 32);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="relative w-full h-[90px] bg-[#05060d] border border-[#f5b971]/25 rounded-lg overflow-hidden shadow-[inset_0_0_15px_rgba(245,185,113,0.05)]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* HUD scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10" />
    </div>
  );
};
