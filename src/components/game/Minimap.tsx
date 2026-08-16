import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { World } from '@/game/core/world';

const SIZE = 148;

/**
 * Top-down radar. It reads the world directly on its own animation frame
 * instead of going through React state, so it stays smooth without forcing
 * the HUD to re-render every tick.
 */
export function Minimap({
  worldRef,
  yawRef,
}: {
  worldRef: MutableRefObject<World | null>;
  yawRef: MutableRefObject<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let last = 0;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 66) return; // ~15 fps is plenty for a radar
      last = t;

      const world = worldRef.current;
      ctx.clearRect(0, 0, SIZE, SIZE);
      if (!world) return;

      const half = world.zone.half;
      const scale = (SIZE / 2 - 6) / half;
      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const p = world.player;
      // Map coordinates are centred on the player, rotated with the camera.
      const rot = -yawRef.current + Math.PI;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const project = (x: number, z: number) => {
        const dx = (x - p.pos.x) * scale;
        const dz = (z - p.pos.z) * scale;
        return [cx + dx * cos - dz * sin, cy - (dx * sin + dz * cos)] as const;
      };

      ctx.fillStyle = 'rgba(10,14,22,0.78)';
      ctx.beginPath();
      ctx.arc(cx, cy, SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.clip();

      // Zone boundary.
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1;
      const corners = [
        project(-half, -half),
        project(half, -half),
        project(half, half),
        project(-half, half),
      ];
      ctx.beginPath();
      corners.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.stroke();

      const dot = (x: number, z: number, color: string, r: number) => {
        const [px, py] = project(x, z);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      };

      for (const portal of world.zone.portals) dot(portal.at.x, portal.at.z, '#7fe3ff', 3.5);
      for (const e of world.entities.values()) {
        if (e.state === 'dead') continue;
        if (e.kind === 'monster') dot(e.pos.x, e.pos.z, e.boss ? '#ff9f43' : '#ff6b6b', e.boss ? 4 : 2);
        else if (e.kind === 'npc') dot(e.pos.x, e.pos.z, '#ffd166', 2.6);
        else if (e.kind === 'remote') dot(e.pos.x, e.pos.z, '#7fd0ff', 2.4);
      }
      for (const d of world.drops) dot(d.pos.x, d.pos.z, d.silver ? '#ffd76b' : '#b9ffd0', 1.4);

      // Player arrow, always pointing up-ish relative to the camera.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-(p.facing + rot));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -5.5);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 1.6);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.stroke();
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [worldRef, yawRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE }}
      className="pointer-events-none rounded-full"
      aria-label="小地圖"
    />
  );
}
