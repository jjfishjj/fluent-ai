import * as THREE from 'three';
import { Rng } from '../../core/rng';
import { pointAt, sampleAt } from '../core/track';
import type { Track, TrackPalette } from '../core/types';

/** Everything static in a course, plus the handles the renderer animates. */
export interface TrackScene {
  root: THREE.Group;
  /** Boost pad materials, pulsed each frame. */
  padMaterials: THREE.MeshBasicMaterial[];
  dispose(): void;
}

function roadTexture(palette: TrackPalette): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const base = new THREE.Color(palette.road);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  // Grain, so a flat-lit road still reads as a surface when you are on it.
  for (let i = 0; i < 900; i += 1) {
    const shade = Math.random() * 0.22 - 0.11;
    const c = base.clone().offsetHSL(0, 0, shade);
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  const edge = new THREE.Color(palette.roadEdge);
  ctx.fillStyle = `#${edge.getHexString()}`;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(0, 0, 4, size);
  ctx.fillRect(size - 4, 0, 4, size);
  // Dashed centre line — u runs across the road, v along it.
  ctx.globalAlpha = 0.5;
  ctx.fillRect(size / 2 - 2, 0, 4, size * 0.55);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function chevronTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0d3b58';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#7ff0ff';
  for (let row = 0; row < 3; row += 1) {
    const y = row * 22 + 4;
    ctx.beginPath();
    ctx.moveTo(6, y + 14);
    ctx.lineTo(32, y);
    ctx.lineTo(58, y + 14);
    ctx.lineTo(58, y + 20);
    ctx.lineTo(32, y + 6);
    ctx.lineTo(6, y + 20);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A closed ribbon centred on the track, spanning ±`edge` with banking. */
function ribbon(
  track: Track,
  edge: (halfWidth: number) => number,
  lift: number,
  vScale: number,
): THREE.BufferGeometry {
  const samples = track.samples;
  const count = samples.length;
  const positions = new Float32Array(count * 2 * 3);
  const uvs = new Float32Array(count * 2 * 2);
  const indices: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const s = samples[i];
    const half = edge(s.halfWidth);
    for (let side = 0; side < 2; side += 1) {
      // Banking tilts the ribbon around the centre line.
      const o = side === 0 ? -half : half;
      const idx = (i * 2 + side) * 3;
      positions[idx] = s.pos.x + s.right.x * o;
      positions[idx + 1] = s.y + lift - s.bank * o;
      positions[idx + 2] = s.pos.z + s.right.z * o;
      const uv = (i * 2 + side) * 2;
      uvs[uv] = side;
      uvs[uv + 1] = s.s / vScale;
    }
    const next = (i + 1) % count;
    const i0 = i * 2;
    const i1 = i * 2 + 1;
    const j0 = next * 2;
    const j1 = next * 2 + 1;
    indices.push(i0, j0, i1, i1, j0, j1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** One-sided ribbon on a single side of the road — used for kerbs and verges. */
function sideRibbon(
  track: Track,
  side: -1 | 1,
  from: (halfWidth: number) => number,
  to: (halfWidth: number) => number,
  drop: number,
  stripe?: { a: number; b: number; every: number },
): THREE.BufferGeometry {
  const samples = track.samples;
  const count = samples.length;
  const positions = new Float32Array(count * 2 * 3);
  const colors = stripe ? new Float32Array(count * 2 * 3) : undefined;
  const indices: number[] = [];
  const colA = stripe ? new THREE.Color(stripe.a) : null;
  const colB = stripe ? new THREE.Color(stripe.b) : null;

  for (let i = 0; i < count; i += 1) {
    const s = samples[i];
    const offsets = [from(s.halfWidth) * side, to(s.halfWidth) * side];
    offsets.forEach((o, k) => {
      const idx = (i * 2 + k) * 3;
      positions[idx] = s.pos.x + s.right.x * o;
      positions[idx + 1] = s.y - s.bank * o + (k === 1 ? drop : 0.0);
      positions[idx + 2] = s.pos.z + s.right.z * o;
      if (colors && colA && colB) {
        const c = Math.floor(i / stripe!.every) % 2 === 0 ? colA : colB;
        colors[idx] = c.r;
        colors[idx + 1] = c.g;
        colors[idx + 2] = c.b;
      }
    });
    const next = (i + 1) % count;
    const i0 = i * 2;
    const i1 = i * 2 + 1;
    const j0 = next * 2;
    const j1 = next * 2 + 1;
    if (side === 1) indices.push(i0, j0, i1, i1, j0, j1);
    else indices.push(i0, i1, j0, i1, j1, j0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function treeGeometry(kind: string): { trunk: THREE.BufferGeometry; crown: THREE.BufferGeometry } {
  switch (kind) {
    case 'desert':
      return {
        trunk: new THREE.CylinderGeometry(0.4, 0.5, 3.4, 7),
        crown: new THREE.SphereGeometry(0.9, 8, 6),
      };
    case 'glacier':
      return {
        trunk: new THREE.CylinderGeometry(0.28, 0.42, 2.6, 6),
        crown: new THREE.ConeGeometry(1.9, 6.5, 7),
      };
    default:
      return {
        trunk: new THREE.CylinderGeometry(0.32, 0.46, 2.8, 7),
        crown: new THREE.SphereGeometry(2.1, 9, 7),
      };
  }
}

/**
 * Builds the road, kerbs, verges, scenery and start gate for a course. All of
 * it is generated from the track spline, so a new course needs only new
 * control points.
 */
export function buildTrackScene(track: Track): TrackScene {
  const def = track.def;
  const palette = def.palette;
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const padMaterials: THREE.MeshBasicMaterial[] = [];
  const rng = new Rng(0x1f2b3c ^ def.id.length * 7919);

  const keepGeo = <T extends THREE.BufferGeometry>(g: T): T => (geometries.push(g), g);
  const keepMat = <T extends THREE.Material>(m: T): T => (materials.push(m), m);

  // ── road ────────────────────────────────────────────────────────────────
  const roadTex = roadTexture(palette);
  textures.push(roadTex);
  roadTex.repeat.set(1, 1);
  const roadGeo = keepGeo(ribbon(track, (h) => h, 0.02, 6));
  const road = new THREE.Mesh(roadGeo, keepMat(new THREE.MeshLambertMaterial({ map: roadTex })));
  road.receiveShadow = true;
  road.name = 'road';
  root.add(road);

  // ── kerbs ───────────────────────────────────────────────────────────────
  const kerbMat = keepMat(new THREE.MeshLambertMaterial({ vertexColors: true }));
  for (const side of [-1, 1] as const) {
    const kerb = new THREE.Mesh(
      keepGeo(sideRibbon(track, side, (h) => h, (h) => h + 1.3, -0.04, { a: 0xe4574c, b: 0xf7f2ea, every: 2 })),
      kerbMat,
    );
    kerb.receiveShadow = true;
    root.add(kerb);
  }

  // ── verges ──────────────────────────────────────────────────────────────
  const vergeMat = keepMat(new THREE.MeshLambertMaterial({ color: palette.groundAlt }));
  for (const side of [-1, 1] as const) {
    const verge = new THREE.Mesh(
      keepGeo(sideRibbon(track, side, (h) => h + 1.3, (h) => h + 26, -1.4)),
      vergeMat,
    );
    verge.receiveShadow = true;
    root.add(verge);
  }

  // ── ground ──────────────────────────────────────────────────────────────
  let minY = Infinity;
  for (const s of track.samples) minY = Math.min(minY, s.y);
  const ground = new THREE.Mesh(
    keepGeo(new THREE.CircleGeometry(460, 48)),
    keepMat(new THREE.MeshLambertMaterial({ color: palette.ground })),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = minY - 1.8;
  ground.receiveShadow = true;
  root.add(ground);

  // ── boost pads ──────────────────────────────────────────────────────────
  const chevron = chevronTexture();
  textures.push(chevron);
  const padGeo = keepGeo(new THREE.PlaneGeometry(5.4, 5));
  for (const pad of track.boosts) {
    const p = pointAt(track, pad.s);
    const mat = keepMat(
      new THREE.MeshBasicMaterial({ map: chevron, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    padMaterials.push(mat);
    const mesh = new THREE.Mesh(padGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -p.yaw;
    mesh.position.set(p.pos.x, p.y + 0.06, p.pos.z);
    root.add(mesh);
  }

  // ── hazards ─────────────────────────────────────────────────────────────
  const hazardGeo = keepGeo(new THREE.CircleGeometry(3.4, 18));
  const hazardMat = keepMat(
    new THREE.MeshLambertMaterial({
      color: def.props.kind === 'glacier' ? 0xbfe6ff : 0xd9b579,
      transparent: true,
      opacity: 0.85,
    }),
  );
  for (const hazard of track.hazards) {
    const p = pointAt(track, hazard.s);
    const sample = sampleAt(track, hazard.s);
    const mesh = new THREE.Mesh(hazardGeo, hazardMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
      p.pos.x + sample.right.x * hazard.lateral,
      p.y + 0.05,
      p.pos.z + sample.right.z * hazard.lateral,
    );
    root.add(mesh);
  }

  // ── start gate ──────────────────────────────────────────────────────────
  const start = pointAt(track, 0);
  const gate = new THREE.Group();
  gate.position.set(start.pos.x, start.y, start.pos.z);
  gate.rotation.y = start.yaw;
  const postGeo = keepGeo(new THREE.CylinderGeometry(0.42, 0.5, 7.5, 8));
  const postMat = keepMat(new THREE.MeshLambertMaterial({ color: 0x8a5a3a }));
  const bannerMat = keepMat(new THREE.MeshLambertMaterial({ color: 0xe0483c, side: THREE.DoubleSide }));
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(side * (start.halfWidth + 1.6), 3.75, 0);
    post.castShadow = true;
    gate.add(post);
  }
  const banner = new THREE.Mesh(
    keepGeo(new THREE.BoxGeometry((start.halfWidth + 2) * 2, 1.9, 0.3)),
    bannerMat,
  );
  banner.position.y = 7.1;
  gate.add(banner);
  root.add(gate);

  // Checkered start line, laid flat on the road.
  const lineGeo = keepGeo(new THREE.PlaneGeometry(start.halfWidth * 2, 2.2));
  const lineMat = keepMat(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.rotation.x = -Math.PI / 2;
  line.rotation.z = -start.yaw;
  line.position.set(start.pos.x, start.y + 0.07, start.pos.z);
  root.add(line);

  // ── scenery ─────────────────────────────────────────────────────────────
  const { trunk: trunkGeo, crown: crownGeo } = treeGeometry(def.props.kind);
  keepGeo(trunkGeo);
  keepGeo(crownGeo);
  const trunkMat = keepMat(new THREE.MeshLambertMaterial({ color: def.props.kind === 'glacier' ? 0x5a6b7e : 0x7a5a3a }));
  const crownMat = keepMat(new THREE.MeshLambertMaterial({ color: palette.foliage }));
  const trees = def.props.trees;
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, trees);
  const crownMesh = new THREE.InstancedMesh(crownGeo, crownMat, trees);
  crownMesh.castShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < trees; i += 1) {
    const s = rng.range(0, track.length);
    const p = pointAt(track, s);
    const sample = sampleAt(track, s);
    const side = rng.chance(0.5) ? -1 : 1;
    const offset = side * rng.range(p.halfWidth + 12, p.halfWidth + 90);
    const x = p.pos.x + sample.right.x * offset;
    const z = p.pos.z + sample.right.z * offset;
    const y = p.y - 1.6 - Math.min(3, Math.abs(offset) * 0.02);
    const scale = rng.range(0.75, 1.5);

    dummy.position.set(x, y + 1.4 * scale, z);
    dummy.scale.setScalar(scale);
    dummy.rotation.set(0, rng.range(0, Math.PI * 2), 0);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.y = y + (def.props.kind === 'glacier' ? 4.6 : 3.6) * scale;
    dummy.updateMatrix();
    crownMesh.setMatrixAt(i, dummy.matrix);
  }
  root.add(trunkMesh, crownMesh);

  const rockGeo = keepGeo(new THREE.DodecahedronGeometry(1.5, 0));
  const rockMat = keepMat(new THREE.MeshLambertMaterial({ color: palette.rock, flatShading: true }));
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, def.props.rocks);
  rocks.castShadow = true;
  for (let i = 0; i < def.props.rocks; i += 1) {
    const s = rng.range(0, track.length);
    const p = pointAt(track, s);
    const sample = sampleAt(track, s);
    const side = rng.chance(0.5) ? -1 : 1;
    const offset = side * rng.range(p.halfWidth + 9, p.halfWidth + 60);
    dummy.position.set(
      p.pos.x + sample.right.x * offset,
      p.y - 1.6 + rng.range(0, 0.6),
      p.pos.z + sample.right.z * offset,
    );
    dummy.scale.set(rng.range(0.5, 1.8), rng.range(0.4, 1.3), rng.range(0.5, 1.8));
    dummy.rotation.set(rng.range(0, 1), rng.range(0, Math.PI * 2), rng.range(0, 1));
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  root.add(rocks);

  // Spectators: a crowd packed along the start straight.
  const crowdGeo = keepGeo(new THREE.CapsuleGeometry(0.3, 0.7, 3, 6));
  const crowdMat = keepMat(new THREE.MeshLambertMaterial({ color: palette.foliageAlt }));
  const crowd = new THREE.InstancedMesh(crowdGeo, crowdMat, def.props.crowd);
  const colorAttr = new THREE.Color();
  for (let i = 0; i < def.props.crowd; i += 1) {
    const s = rng.range(-40, 60);
    const p = pointAt(track, (s + track.length) % track.length);
    const sample = sampleAt(track, (s + track.length) % track.length);
    const side = rng.chance(0.5) ? -1 : 1;
    const offset = side * rng.range(p.halfWidth + 4.5, p.halfWidth + 7.5);
    dummy.position.set(
      p.pos.x + sample.right.x * offset,
      p.y - 0.6 + rng.range(0, 0.2),
      p.pos.z + sample.right.z * offset,
    );
    dummy.scale.setScalar(rng.range(0.85, 1.15));
    dummy.rotation.set(0, Math.atan2(-sample.right.x * side, -sample.right.z * side), 0);
    dummy.updateMatrix();
    crowd.setMatrixAt(i, dummy.matrix);
    colorAttr.setHSL(rng.next(), 0.55, 0.6);
    crowd.setColorAt(i, colorAttr);
  }
  if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
  root.add(crowd);

  // Distant peaks close the horizon without any extra draw cost worth caring about.
  const peakGeo = keepGeo(new THREE.ConeGeometry(46, 70, 5));
  const peakMat = keepMat(new THREE.MeshLambertMaterial({ color: palette.rock, flatShading: true }));
  const peaks = new THREE.InstancedMesh(peakGeo, peakMat, 26);
  for (let i = 0; i < 26; i += 1) {
    const angle = (i / 26) * Math.PI * 2 + rng.range(-0.08, 0.08);
    const radius = rng.range(280, 370);
    const scale = rng.range(0.7, 1.8);
    dummy.position.set(Math.cos(angle) * radius, minY - 4 + 32 * scale, Math.sin(angle) * radius);
    dummy.scale.set(scale, scale, scale);
    dummy.rotation.set(0, rng.range(0, Math.PI), 0);
    dummy.updateMatrix();
    peaks.setMatrixAt(i, dummy.matrix);
  }
  root.add(peaks);

  return {
    root,
    padMaterials,
    dispose() {
      root.removeFromParent();
      for (const geo of geometries) geo.dispose();
      for (const mat of materials) mat.dispose();
      for (const tex of textures) tex.dispose();
      trunkMesh.dispose();
      crownMesh.dispose();
      rocks.dispose();
      crowd.dispose();
      peaks.dispose();
    },
  };
}

export function buildSky(palette: TrackPalette): THREE.Mesh {
  const geo = new THREE.SphereGeometry(500, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(palette.skyTop) },
      bottom: { value: new THREE.Color(palette.skyBottom) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 bottom;
      varying vec3 vPos;
      void main() {
        float h = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0);
        gl_FragColor = vec4(mix(bottom, top, pow(h, 0.8)), 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sky';
  return mesh;
}
