import { Rng, fbm } from './rng';
import type { ZoneDef } from './types';

/**
 * Terrain height at a world position. Shared by the simulation (prop
 * placement, collision) and the renderer (mesh generation) so the ground the
 * player walks on is exactly the ground that is drawn.
 */
export function terrainHeight(zone: ZoneDef, x: number, z: number): number {
  const { amplitude, frequency } = zone.terrain;
  const seed = zoneSeed(zone.id);
  const base = fbm(x * frequency, z * frequency, seed) * amplitude;

  // Flatten a circular clearing around the origin so towns and spawn points
  // are never on a slope.
  const d = Math.sqrt(x * x + z * z);
  const flatten = smoothstep(10, 26, d);
  return base * flatten;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function zoneSeed(zoneId: string): number {
  let h = 2166136261;
  for (let i = 0; i < zoneId.length; i++) {
    h ^= zoneId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface PropInstance {
  x: number;
  z: number;
  y: number;
  scale: number;
  rot: number;
  variant: number;
  /** Radius that blocks movement; 0 for decorative props. */
  block: number;
}

export interface ZoneProps {
  trees: PropInstance[];
  rocks: PropInstance[];
  grass: PropInstance[];
  lanterns: PropInstance[];
}

const propCache = new Map<string, ZoneProps>();

/** Deterministic scatter of scenery for a zone, cached per zone id. */
export function generateProps(zone: ZoneDef): ZoneProps {
  const cached = propCache.get(zone.id);
  if (cached) return cached;

  const rng = new Rng(zoneSeed(zone.id) ^ 0x5eed);
  const half = zone.half;
  const keepClear: { x: number; z: number; r: number }[] = [
    ...zone.npcs.map((n) => ({ x: n.at.x, z: n.at.z, r: 6 })),
    ...zone.portals.map((p) => ({ x: p.at.x, z: p.at.z, r: 7 })),
    { x: 0, z: 0, r: zone.safe ? 14 : 8 },
  ];

  const free = (x: number, z: number, pad: number) =>
    keepClear.every((c) => Math.hypot(x - c.x, z - c.z) > c.r + pad);

  const scatter = (count: number, pad: number, block: number, minScale: number, maxScale: number) => {
    const out: PropInstance[] = [];
    let guard = count * 12;
    while (out.length < count && guard-- > 0) {
      const x = rng.range(-half + 3, half - 3);
      const z = rng.range(-half + 3, half - 3);
      if (!free(x, z, pad)) continue;
      const y = terrainHeight(zone, x, z);
      if (y < zone.terrain.waterLevel) continue;
      out.push({
        x,
        z,
        y,
        scale: rng.range(minScale, maxScale),
        rot: rng.range(0, Math.PI * 2),
        variant: rng.int(0, 2),
        block,
      });
    }
    return out;
  };

  const props: ZoneProps = {
    trees: scatter(zone.props.trees, 1.5, zone.props.treeKind === 'bamboo' ? 0.45 : 0.9, 0.8, 1.5),
    rocks: scatter(zone.props.rocks, 1.2, 1.1, 0.6, 1.6),
    grass: scatter(zone.props.grass, 0, 0, 0.5, 1.2),
    lanterns: scatter(zone.props.lanterns, 1.5, 0.4, 0.9, 1.2),
  };
  propCache.set(zone.id, props);
  return props;
}

/** Every prop that blocks movement, flattened for collision queries. */
export function blockers(zone: ZoneDef): PropInstance[] {
  const p = generateProps(zone);
  return [...p.trees, ...p.rocks, ...p.lanterns].filter((i) => i.block > 0);
}
