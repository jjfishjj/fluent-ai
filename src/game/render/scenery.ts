import * as THREE from 'three';
import { Rng } from '../core/rng';
import { generateProps, terrainHeight, zoneSeed } from '../core/terrain';
import type { ZoneDef } from '../core/types';

const TERRAIN_SEGMENTS = 150;

/** Everything that makes up one zone, so it can be disposed in one go. */
export interface ZoneScene {
  root: THREE.Group;
  ground: THREE.Mesh;
  dispose(): void;
}

/**
 * Builds the visible zone: a displaced ground plane with vertex colours,
 * water, instanced vegetation, portals and NPC-marking lanterns.
 */
export function buildZoneScene(zone: ZoneDef): ZoneScene {
  const root = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  const size = zone.half * 2;
  const geo = track(new THREE.PlaneGeometry(size, size, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS));
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const groundColor = new THREE.Color(zone.palette.ground);
  const altColor = new THREE.Color(zone.palette.groundAlt);
  const rockColor = new THREE.Color(zone.palette.rock);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = terrainHeight(zone, x, z);
    pos.setY(i, h);

    // Blend by height, then tint steep faces towards rock.
    const t = THREE.MathUtils.clamp((h + zone.terrain.amplitude) / (zone.terrain.amplitude * 2), 0, 1);
    tmp.copy(groundColor).lerp(altColor, t);
    const hx = terrainHeight(zone, x + 1.2, z);
    const hz = terrainHeight(zone, x, z + 1.2);
    const slope = Math.min(1, (Math.abs(hx - h) + Math.abs(hz - h)) / 1.6);
    tmp.lerp(rockColor, slope * 0.8);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const groundMat = track(
    new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.FrontSide }),
  );
  const ground = new THREE.Mesh(geo, groundMat);
  ground.receiveShadow = true;
  ground.name = 'ground';
  root.add(ground);

  // Water plane, only where the terrain dips below the water level.
  const waterGeo = track(new THREE.PlaneGeometry(size, size, 1, 1));
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = track(
    new THREE.MeshLambertMaterial({
      color: zone.palette.water,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
  );
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = zone.terrain.waterLevel;
  water.renderOrder = 1;
  root.add(water);

  const props = generateProps(zone);
  const rng = new Rng(zoneSeed(zone.id) ^ 0xa11ce);

  // ── vegetation ────────────────────────────────────────────────────────
  const treeGroup = buildTrees(zone, props.trees, rng, track);
  if (treeGroup) root.add(treeGroup);

  // ── rocks ─────────────────────────────────────────────────────────────
  if (props.rocks.length) {
    const rockGeo = track(new THREE.DodecahedronGeometry(0.9, 0));
    const rockMat = track(new THREE.MeshLambertMaterial({ color: zone.palette.rock, flatShading: true }));
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, props.rocks.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    props.rocks.forEach((p, i) => {
      e.set(rng.range(-0.4, 0.4), p.rot, rng.range(-0.4, 0.4));
      q.setFromEuler(e);
      m.compose(
        new THREE.Vector3(p.x, p.y + p.scale * 0.35, p.z),
        q,
        new THREE.Vector3(p.scale, p.scale * rng.range(0.6, 1.1), p.scale),
      );
      rocks.setMatrixAt(i, m);
    });
    rocks.instanceMatrix.needsUpdate = true;
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    root.add(rocks);
  }

  // ── grass tufts ───────────────────────────────────────────────────────
  if (props.grass.length) {
    const bladeGeo = track(new THREE.ConeGeometry(0.16, 0.9, 4, 1, true));
    const bladeMat = track(
      new THREE.MeshLambertMaterial({ color: zone.palette.foliage, side: THREE.DoubleSide }),
    );
    const grass = new THREE.InstancedMesh(bladeGeo, bladeMat, props.grass.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    props.grass.forEach((p, i) => {
      q.setFromEuler(new THREE.Euler(rng.range(-0.2, 0.2), p.rot, rng.range(-0.2, 0.2)));
      m.compose(
        new THREE.Vector3(p.x, p.y + 0.4 * p.scale, p.z),
        q,
        new THREE.Vector3(p.scale, p.scale * rng.range(0.8, 1.6), p.scale),
      );
      grass.setMatrixAt(i, m);
    });
    grass.instanceMatrix.needsUpdate = true;
    root.add(grass);
  }

  // ── lanterns / crystals ───────────────────────────────────────────────
  if (props.lanterns.length) {
    const poleGeo = track(new THREE.CylinderGeometry(0.07, 0.09, 2.4, 6));
    const poleMat = track(new THREE.MeshLambertMaterial({ color: 0x6b4a2f }));
    const lampGeo = track(new THREE.SphereGeometry(0.34, 10, 8));
    const lampMat = track(
      new THREE.MeshBasicMaterial({ color: zone.id === 'abyss' ? 0x9a86ff : 0xffb44a }),
    );
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, props.lanterns.length);
    const lamps = new THREE.InstancedMesh(lampGeo, lampMat, props.lanterns.length);
    const m = new THREE.Matrix4();
    props.lanterns.forEach((p, i) => {
      m.makeTranslation(p.x, p.y + 1.2, p.z);
      poles.setMatrixAt(i, m);
      m.makeTranslation(p.x, p.y + 2.6, p.z);
      lamps.setMatrixAt(i, m);
    });
    poles.instanceMatrix.needsUpdate = true;
    lamps.instanceMatrix.needsUpdate = true;
    poles.castShadow = true;
    root.add(poles, lamps);
  }

  // ── town platform ─────────────────────────────────────────────────────
  if (zone.safe) root.add(buildVillage(zone, track));

  // ── portals ───────────────────────────────────────────────────────────
  for (const portal of zone.portals) {
    root.add(buildPortal(zone, portal.at.x, portal.at.z, track));
  }

  return {
    root,
    ground,
    dispose() {
      for (const d of disposables) d.dispose();
      root.clear();
    },
  };
}

type Track = <T extends { dispose(): void }>(x: T) => T;

function buildTrees(
  zone: ZoneDef,
  instances: ReturnType<typeof generateProps>['trees'],
  rng: Rng,
  track: Track,
): THREE.Group | undefined {
  if (!instances.length) return undefined;
  const group = new THREE.Group();
  const kind = zone.props.treeKind;

  const trunkMat = track(
    new THREE.MeshLambertMaterial({ color: kind === 'crystal' ? 0x4a3f6b : kind === 'dead' ? 0x5a3a26 : 0x6b4a2f }),
  );
  const leafMat = track(
    new THREE.MeshLambertMaterial({
      color: zone.palette.foliage,
      flatShading: true,
      transparent: kind === 'crystal',
      opacity: kind === 'crystal' ? 0.85 : 1,
    }),
  );
  const blossomMat = track(new THREE.MeshLambertMaterial({ color: zone.palette.foliageAlt, flatShading: true }));

  const trunkGeo = track(
    kind === 'bamboo'
      ? new THREE.CylinderGeometry(0.12, 0.16, 7, 6)
      : new THREE.CylinderGeometry(0.22, 0.4, 3.2, 6),
  );
  const canopyGeo = track(
    kind === 'bamboo'
      ? new THREE.ConeGeometry(1.0, 2.6, 5)
      : kind === 'crystal'
        ? new THREE.OctahedronGeometry(1.5, 0)
        : kind === 'dead'
          ? new THREE.IcosahedronGeometry(0.9, 0)
          : new THREE.IcosahedronGeometry(1.9, 0),
  );

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, instances.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, leafMat, instances.length);
  const blossomCount = kind === 'willow' ? Math.floor(instances.length * 0.35) : 0;
  const blossoms = blossomCount
    ? new THREE.InstancedMesh(track(new THREE.IcosahedronGeometry(1.2, 0)), blossomMat, blossomCount)
    : undefined;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  let blossomIdx = 0;

  instances.forEach((p, i) => {
    const s = p.scale;
    const trunkH = kind === 'bamboo' ? 7 * s : 3.2 * s;
    q.setFromEuler(new THREE.Euler(0, p.rot, kind === 'bamboo' ? rng.range(-0.06, 0.06) : 0));
    m.compose(new THREE.Vector3(p.x, p.y + trunkH / 2, p.z), q, new THREE.Vector3(s, s, s));
    trunks.setMatrixAt(i, m);

    const canopyY = p.y + trunkH + (kind === 'bamboo' ? 0.8 * s : 1.1 * s);
    q.setFromEuler(new THREE.Euler(rng.range(-0.2, 0.2), p.rot * 1.7, rng.range(-0.2, 0.2)));
    m.compose(new THREE.Vector3(p.x, canopyY, p.z), q, new THREE.Vector3(s, s * (kind === 'dead' ? 0.7 : 1), s));
    canopies.setMatrixAt(i, m);

    if (blossoms && blossomIdx < blossomCount && i % 3 === 0) {
      m.compose(
        new THREE.Vector3(p.x + rng.range(-0.8, 0.8), canopyY + 0.9 * s, p.z + rng.range(-0.8, 0.8)),
        q,
        new THREE.Vector3(s * 0.8, s * 0.6, s * 0.8),
      );
      blossoms.setMatrixAt(blossomIdx++, m);
    }
  });

  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  trunks.castShadow = true;
  canopies.castShadow = true;
  canopies.receiveShadow = true;
  group.add(trunks, canopies);
  if (blossoms) {
    blossoms.count = blossomIdx;
    blossoms.instanceMatrix.needsUpdate = true;
    blossoms.castShadow = true;
    group.add(blossoms);
  }
  return group;
}

/** A few buildings and a paved square so the safe zone reads as a village. */
function buildVillage(zone: ZoneDef, track: Track): THREE.Group {
  const g = new THREE.Group();

  const plazaGeo = track(new THREE.CircleGeometry(16, 40));
  plazaGeo.rotateX(-Math.PI / 2);
  const plazaMat = track(new THREE.MeshLambertMaterial({ color: 0xcfc0a0 }));
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.position.y = 0.06;
  plaza.receiveShadow = true;
  g.add(plaza);

  const wallMat = track(new THREE.MeshLambertMaterial({ color: 0xe8dcc4 }));
  const roofMat = track(new THREE.MeshLambertMaterial({ color: 0x9c3b34, flatShading: true }));
  const wallGeo = track(new THREE.BoxGeometry(6, 3.2, 5));
  const roofGeo = track(new THREE.ConeGeometry(5.4, 2.4, 4));

  const houses: [number, number, number][] = [
    [-20, -12, 0.4],
    [-22, 6, -0.3],
    [20, -10, -0.5],
    [22, 8, 0.6],
    [-4, 22, Math.PI],
    [12, 20, 2.6],
  ];
  for (const [x, z, rot] of houses) {
    const y = terrainHeight(zone, x, z);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, y + 1.6, z);
    wall.rotation.y = rot;
    wall.castShadow = true;
    wall.receiveShadow = true;
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(x, y + 4.2, z);
    roof.rotation.y = rot + Math.PI / 4;
    roof.castShadow = true;
    g.add(wall, roof);
  }

  // 牌坊 — the village gate, framing the road south to the fields.
  const pillarGeo = track(new THREE.BoxGeometry(0.7, 7, 0.7));
  const beamGeo = track(new THREE.BoxGeometry(9, 0.7, 1.0));
  const gateMat = track(new THREE.MeshLambertMaterial({ color: 0xb1402f }));
  const gateY = terrainHeight(zone, 0, -30);
  for (const dx of [-4, 4]) {
    const pillar = new THREE.Mesh(pillarGeo, gateMat);
    pillar.position.set(dx, gateY + 3.5, -30);
    pillar.castShadow = true;
    g.add(pillar);
  }
  const beam = new THREE.Mesh(beamGeo, gateMat);
  beam.position.set(0, gateY + 6.4, -30);
  beam.castShadow = true;
  const beam2 = new THREE.Mesh(beamGeo, gateMat);
  beam2.position.set(0, gateY + 5.2, -30);
  beam2.scale.set(0.8, 0.5, 0.8);
  g.add(beam, beam2);

  return g;
}

/** A glowing ring the player walks into to change zones. */
function buildPortal(zone: ZoneDef, x: number, z: number, track: Track): THREE.Group {
  const g = new THREE.Group();
  const y = terrainHeight(zone, x, z);
  const ringGeo = track(new THREE.TorusGeometry(2.1, 0.18, 8, 32));
  const ringMat = track(new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.9 }));
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(x, y + 2.2, z);
  ring.rotation.x = Math.PI / 2;
  ring.name = 'portal-ring';

  const discGeo = track(new THREE.CircleGeometry(2.0, 32));
  discGeo.rotateX(-Math.PI / 2);
  const discMat = track(
    new THREE.MeshBasicMaterial({ color: 0x8ad0ff, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.set(x, y + 0.12, z);

  const beamGeo = track(new THREE.CylinderGeometry(1.9, 1.9, 8, 20, 1, true));
  const beamMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x8ad0ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(x, y + 4, z);

  g.add(ring, disc, beam);
  g.userData.spin = ring;
  return g;
}

/** Gradient dome used instead of a flat background colour. */
export function buildSky(zone: ZoneDef): THREE.Mesh {
  const geo = new THREE.SphereGeometry(400, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(zone.palette.skyTop) },
      bottom: { value: new THREE.Color(zone.palette.skyBottom) },
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
        gl_FragColor = vec4(mix(bottom, top, pow(h, 0.85)), 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sky';
  return mesh;
}
