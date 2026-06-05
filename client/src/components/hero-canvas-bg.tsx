import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
}

interface Bokeh {
  x: number; y: number;
  size: number;
  opacity: number;
  color: string;
  phase: number;
}

const AURORA = [
  { cx: 0.76, cy: 0.28, rx: 0.58, ry: 0.68, r: 212, g: 175, b:  55, baseA: 0.14, phX: 0.0, phY: 0.0, ampX: 0.10, ampY: 0.08, sX: 0.28, sY: 0.22 },
  { cx: 0.18, cy: 0.18, rx: 0.56, ry: 0.66, r:  90, g:  60, b: 200, baseA: 0.09, phX: 1.5, phY: 1.1, ampX: 0.10, ampY: 0.09, sX: 0.20, sY: 0.18 },
  { cx: 0.50, cy: 0.88, rx: 0.58, ry: 0.46, r: 168, g: 123, b:  44, baseA: 0.07, phX: 3.0, phY: 2.2, ampX: 0.08, ampY: 0.06, sX: 0.15, sY: 0.12 },
];

const BOKEH_DATA: Bokeh[] = [
  { x: 0.08, y: 0.78, size: 55, opacity: 0.08, color: 'rgba(212,175,55,',  phase: 0.0 },
  { x: 0.37, y: 0.82, size: 65, opacity: 0.05, color: 'rgba(212,175,55,',  phase: 2.4 },
  { x: 0.70, y: 0.79, size: 58, opacity: 0.06, color: 'rgba(212,175,55,',  phase: 1.6 },
  { x: 0.22, y: 0.90, size: 38, opacity: 0.11, color: 'rgba(255,240,200,', phase: 1.2 },
  { x: 0.87, y: 0.72, size: 44, opacity: 0.08, color: 'rgba(255,240,200,', phase: 2.0 },
  { x: 0.48, y: 0.94, size: 80, opacity: 0.04, color: 'rgba(212,175,55,',  phase: 1.0 },
];

const SPOTLIGHT_BEAMS: [number, number, number][] = [
  [ 0.00, 0.22, 0.12],
  [-0.20, 0.13, 0.07],
  [ 0.20, 0.13, 0.07],
];

const GOLD_COLORS = [
  'rgba(246,229,176,', 'rgba(245,215,110,', 'rgba(212,175,55,',
  'rgba(255,248,160,', 'rgba(255,230,130,',
];

function spawnParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: h + 8,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -(0.25 + Math.random() * 0.65),
    life: 0,
    maxLife: 200 + Math.random() * 200,
    size: 0.6 + Math.random() * 2.2,
    color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
  };
}

export default function HeroCanvasBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width  = parent.clientWidth  || window.innerWidth;
        canvas.height = parent.clientHeight || window.innerHeight;
      } else {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

    // Pre-spawn 50 particles spread across canvas
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      const p = spawnParticle(canvas.width, canvas.height);
      p.y    = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    let shootX = 0, shootY = 0, shootVX = 0, shootVY = 0;
    let shootLife = -1, shootMax = 0;
    let nextShoot = 400 + Math.random() * 400;
    let frame = 0;
    let lastTime = 0;

    const draw = (timestamp: number) => {
      animRef.current = requestAnimationFrame(draw);
      // Cap at ~30fps
      if (timestamp - lastTime < 32) return;
      lastTime = timestamp;

      const w = canvas.width;
      const h = canvas.height;
      const t = frame / 30;
      frame++;

      ctx.fillStyle = '#09070e';
      ctx.fillRect(0, 0, w, h);

      // Aurora blobs
      ctx.globalCompositeOperation = 'screen';
      for (const b of AURORA) {
        const bx = (b.cx + Math.sin(t * b.sX + b.phX) * b.ampX) * w;
        const by = (b.cy + Math.cos(t * b.sY + b.phY) * b.ampY) * h;
        const rx = b.rx * w;
        const ry = b.ry * h;
        const a  = b.baseA * (0.85 + 0.15 * Math.sin(t * 0.4 + b.phX));
        const gr = ctx.createRadialGradient(bx, by * (rx / ry), 0, bx, by * (rx / ry), rx);
        gr.addColorStop(0,    `rgba(${b.r},${b.g},${b.b},${a.toFixed(3)})`);
        gr.addColorStop(0.45, `rgba(${b.r},${b.g},${b.b},${(a * 0.35).toFixed(3)})`);
        gr.addColorStop(1,    `rgba(${b.r},${b.g},${b.b},0)`);
        ctx.save();
        ctx.scale(1, ry / rx);
        ctx.beginPath();
        ctx.arc(bx, by * (rx / ry), rx, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Spotlight beams
      const cx = w * 0.5;
      for (const [angleOff, wFrac, alpha] of SPOTLIGHT_BEAMS) {
        const bx = cx + angleOff * w;
        const spreadX = wFrac * w;
        const gr = ctx.createLinearGradient(bx, 0, bx, h * 0.88);
        gr.addColorStop(0,    `rgba(212,175,55,${alpha})`);
        gr.addColorStop(0.35, `rgba(212,175,55,${(alpha * 0.4).toFixed(3)})`);
        gr.addColorStop(1,    `rgba(212,175,55,0)`);
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx - spreadX * 0.5, h * 0.88);
        ctx.lineTo(bx + spreadX * 0.5, h * 0.88);
        ctx.closePath();
        ctx.fillStyle = gr;
        ctx.fill();
      }

      // Edge vignette
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.44, h * 0.12, w * 0.5, h * 0.44, w * 0.88);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // Side curtains
      const lc = ctx.createLinearGradient(0, 0, w * 0.22, 0);
      lc.addColorStop(0, 'rgba(0,0,0,0.5)');
      lc.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lc;
      ctx.fillRect(0, 0, w * 0.22, h);
      const rc = ctx.createLinearGradient(w * 0.78, 0, w, 0);
      rc.addColorStop(0, 'rgba(0,0,0,0)');
      rc.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = rc;
      ctx.fillRect(w * 0.78, 0, w * 0.22, h);

      // Bokeh lights
      for (const bk of BOKEH_DATA) {
        const bkX = bk.x * w;
        const bkY = bk.y * h;
        const p   = 0.84 + 0.16 * Math.sin(t * 0.55 + bk.phase);
        const sz  = bk.size * p;
        const oa  = bk.opacity * p;
        const gr  = ctx.createRadialGradient(bkX, bkY, 0, bkX, bkY, sz);
        gr.addColorStop(0,   `${bk.color}${oa.toFixed(3)})`);
        gr.addColorStop(0.4, `${bk.color}${(oa * 0.3).toFixed(3)})`);
        gr.addColorStop(1,   `${bk.color}0)`);
        ctx.beginPath();
        ctx.arc(bkX, bkY, sz, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
      }

      // Gold particles — no trails, no halo
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(t * 0.4 + i * 0.27) * 0.15;
        p.y += p.vy;
        p.life++;
        const lr = p.life / p.maxLife;
        const a  = (lr < 0.1 ? lr * 10 : lr > 0.85 ? (1 - lr) / 0.15 : 1) * 0.48;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${a.toFixed(3)})`;
        ctx.fill();
        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > w + 10) {
          particles[i] = spawnParticle(w, h);
        }
      }

      // One shooting star at a time
      nextShoot--;
      if (nextShoot <= 0 && shootLife < 0) {
        shootX = Math.random() * w * 0.7 + w * 0.1;
        shootY = Math.random() * h * 0.35;
        shootVX = (Math.random() - 0.3) * 6;
        shootVY = Math.random() * 2.5 + 1.2;
        shootLife = 0;
        shootMax = 35 + Math.random() * 25;
        nextShoot = 320 + Math.random() * 480;
      }
      if (shootLife >= 0) {
        shootX += shootVX; shootY += shootVY; shootLife++;
        const lr = shootLife / shootMax;
        const sa = lr < 0.2 ? lr * 5 : lr > 0.65 ? (1 - lr) / 0.35 : 1;
        const gr = ctx.createLinearGradient(shootX, shootY, shootX - shootVX * 10, shootY - shootVY * 10);
        gr.addColorStop(0, `rgba(255,248,180,${(sa * 0.85).toFixed(2)})`);
        gr.addColorStop(1, 'rgba(255,248,180,0)');
        ctx.beginPath();
        ctx.moveTo(shootX, shootY);
        ctx.lineTo(shootX - shootVX * 11, shootY - shootVY * 11);
        ctx.strokeStyle = gr;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        if (shootLife >= shootMax) shootLife = -1;
      }

      // Top gold glow line
      const tl = ctx.createLinearGradient(0, 0, w, 0);
      tl.addColorStop(0,    'rgba(212,175,55,0)');
      tl.addColorStop(0.28, 'rgba(212,175,55,0.55)');
      tl.addColorStop(0.5,  `rgba(255,248,160,${(0.75 + 0.12 * Math.sin(t * 1.3)).toFixed(2)})`);
      tl.addColorStop(0.72, 'rgba(212,175,55,0.55)');
      tl.addColorStop(1,    'rgba(212,175,55,0)');
      ctx.fillStyle = tl;
      ctx.fillRect(0, 0, w, 1.5);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        display: 'block',
        willChange: 'transform',
      }}
    />
  );
}