import * as THREE from 'three';
import type { BirdDef } from '../core/types';

/**
 * The mounts are assembled from primitives at runtime — no model files, so the
 * mode ships inside the bundle and still runs a full stride, tail sway and
 * wing flap. One rig per racer; `animateBird` drives it from the simulation.
 */
export interface BirdRig {
  root: THREE.Group;
  /** Everything above the feet; leans and bobs. */
  chassis: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  wingL: THREE.Group;
  wingR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  shinL: THREE.Group;
  shinR: THREE.Group;
  rider: THREE.Group;
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
  /** Stride phase, advanced by `animateBird`. */
  phase: number;
}

function lambert(color: number, extra: THREE.MeshLambertMaterialParameters = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

export function buildBirdRig(bird: BirdDef, riderColor = 0x2f3a56): BirdRig {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const track = <T extends THREE.BufferGeometry>(geo: T): T => {
    geometries.push(geo);
    return geo;
  };
  const mat = (color: number, extra?: THREE.MeshLambertMaterialParameters) => {
    const m = lambert(color, extra);
    materials.push(m);
    return m;
  };

  const plume = mat(bird.body);
  const light = mat(bird.accent);
  const beakMat = mat(bird.beak);
  const dark = mat(0x2b2f3d);
  const eyeMat = mat(0x141821);
  const cloth = mat(riderColor);
  const skin = mat(0xf0c8a0);

  const root = new THREE.Group();
  const chassis = new THREE.Group();
  chassis.position.y = 1.18;
  root.add(chassis);

  // ── body ────────────────────────────────────────────────────────────────
  const bodyGeo = track(new THREE.SphereGeometry(0.62, 16, 12));
  const body = new THREE.Mesh(bodyGeo, plume);
  body.scale.set(0.86, 0.9, 1.16);
  body.castShadow = true;
  chassis.add(body);

  const chest = new THREE.Mesh(track(new THREE.SphereGeometry(0.4, 14, 10)), light);
  chest.position.set(0, -0.06, 0.42);
  chest.scale.set(0.9, 0.95, 0.85);
  chassis.add(chest);

  // ── neck & head ─────────────────────────────────────────────────────────
  const neck = new THREE.Group();
  neck.position.set(0, 0.34, 0.44);
  chassis.add(neck);

  const neckGeo = track(new THREE.CapsuleGeometry(0.17, 0.52, 4, 10));
  const neckMesh = new THREE.Mesh(neckGeo, plume);
  neckMesh.position.y = 0.32;
  neckMesh.rotation.x = -0.22;
  neckMesh.castShadow = true;
  neck.add(neckMesh);

  const head = new THREE.Group();
  head.position.set(0, 0.68, 0.12);
  neck.add(head);

  const skull = new THREE.Mesh(track(new THREE.SphereGeometry(0.24, 14, 12)), plume);
  skull.scale.set(0.92, 1, 1.05);
  skull.castShadow = true;
  head.add(skull);

  const beak = new THREE.Mesh(track(new THREE.ConeGeometry(0.11, 0.34, 8)), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.03, 0.28);
  head.add(beak);

  const eyeGeo = track(new THREE.SphereGeometry(0.045, 8, 6));
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.15, 0.07, 0.16);
    head.add(eye);
  }

  // Crest: three swept feathers, the silhouette that reads at any distance.
  const crestGeo = track(new THREE.ConeGeometry(0.07, 0.42, 6));
  [-0.16, 0, 0.16].forEach((offset, i) => {
    const feather = new THREE.Mesh(crestGeo, i === 1 ? light : plume);
    feather.position.set(offset, 0.24, -0.06 - Math.abs(offset) * 0.3);
    feather.rotation.set(-0.5, 0, offset * 1.6);
    head.add(feather);
  });

  // ── tail ────────────────────────────────────────────────────────────────
  const tail = new THREE.Group();
  tail.position.set(0, 0.16, -0.6);
  chassis.add(tail);
  const tailGeo = track(new THREE.ConeGeometry(0.13, 0.95, 6));
  for (let i = -2; i <= 2; i += 1) {
    const feather = new THREE.Mesh(tailGeo, i % 2 === 0 ? plume : light);
    feather.position.set(i * 0.11, 0.1 + (2 - Math.abs(i)) * 0.06, -0.2);
    feather.rotation.set(2.35, 0, i * 0.22);
    feather.castShadow = true;
    tail.add(feather);
  }

  // ── wings ───────────────────────────────────────────────────────────────
  // Folded against the flank at rest; the pivot opens them out for a boost.
  const wingGeo = track(new THREE.BoxGeometry(0.24, 0.34, 0.78));
  const makeWing = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.46, 0.16, -0.02);
    const wing = new THREE.Mesh(wingGeo, plume);
    wing.position.set(side * 0.05, -0.16, -0.06);
    wing.rotation.set(0.12, side * 0.18, side * 0.12);
    wing.castShadow = true;
    pivot.add(wing);
    chassis.add(pivot);
    return pivot;
  };
  const wingL = makeWing(-1);
  const wingR = makeWing(1);

  // ── legs ────────────────────────────────────────────────────────────────
  const thighGeo = track(new THREE.CapsuleGeometry(0.13, 0.3, 3, 8));
  const shinGeo = track(new THREE.CapsuleGeometry(0.08, 0.42, 3, 8));
  const footGeo = track(new THREE.BoxGeometry(0.26, 0.08, 0.38));
  const makeLeg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.28, -0.32, -0.04);
    const thigh = new THREE.Mesh(thighGeo, plume);
    thigh.position.y = -0.16;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.34;
    hip.add(knee);
    const shin = new THREE.Mesh(shinGeo, dark);
    shin.position.y = -0.24;
    shin.castShadow = true;
    knee.add(shin);
    const foot = new THREE.Mesh(footGeo, beakMat);
    foot.position.set(0, -0.48, 0.1);
    knee.add(foot);

    chassis.add(hip);
    return { hip, knee };
  };
  const left = makeLeg(-1);
  const right = makeLeg(1);

  // ── saddle & rider ──────────────────────────────────────────────────────
  const saddle = new THREE.Mesh(track(new THREE.BoxGeometry(0.62, 0.14, 0.62)), cloth);
  saddle.position.set(0, 0.5, -0.06);
  chassis.add(saddle);

  const rider = new THREE.Group();
  rider.position.set(0, 0.58, -0.06);
  chassis.add(rider);

  const torso = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.17, 0.28, 4, 10)), cloth);
  torso.position.y = 0.26;
  torso.rotation.x = 0.35;
  torso.castShadow = true;
  rider.add(torso);

  const riderHead = new THREE.Mesh(track(new THREE.SphereGeometry(0.15, 12, 10)), skin);
  riderHead.position.set(0, 0.56, 0.06);
  rider.add(riderHead);

  const helmet = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.165, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62)),
    light,
  );
  helmet.position.set(0, 0.58, 0.06);
  rider.add(helmet);

  const armGeo = track(new THREE.CapsuleGeometry(0.055, 0.3, 3, 6));
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, cloth);
    arm.position.set(side * 0.19, 0.3, 0.2);
    arm.rotation.set(1.15, 0, side * 0.15);
    rider.add(arm);
  }
  const legGeo = track(new THREE.CapsuleGeometry(0.07, 0.26, 3, 6));
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, cloth);
    leg.position.set(side * 0.24, 0.06, 0.1);
    leg.rotation.set(0.9, 0, 0);
    rider.add(leg);
  }

  return {
    root,
    chassis,
    neck,
    head,
    tail,
    wingL,
    wingR,
    legL: left.hip,
    legR: right.hip,
    shinL: left.knee,
    shinR: right.knee,
    rider,
    materials,
    geometries,
    phase: Math.random() * Math.PI * 2,
  };
}

export interface BirdAnimState {
  /** Current speed in world units per second. */
  speed: number;
  topSpeed: number;
  /** Slip angle in radians; leans the bird into a drift. */
  slip: number;
  boosting: boolean;
  drifting: boolean;
  /** Steering input, -1…1, for the rider's weight shift. */
  steer: number;
}

/** Runs the stride cycle. Call once per frame per visible bird. */
export function animateBird(rig: BirdRig, dt: number, state: BirdAnimState): void {
  const ratio = Math.min(1.4, state.speed / Math.max(1, state.topSpeed));
  // Stride rate rises with speed but flattens out, like a real gallop.
  const cadence = 3.2 + ratio * 7.5;
  rig.phase += dt * cadence;

  const swing = Math.sin(rig.phase);
  const counter = Math.sin(rig.phase + Math.PI);
  const amp = 0.35 + ratio * 0.55;

  rig.legL.rotation.x = swing * amp;
  rig.legR.rotation.x = counter * amp;
  // Knees fold on the recovery half of the stride only.
  rig.shinL.rotation.x = Math.max(0, -swing) * amp * 1.5;
  rig.shinR.rotation.x = Math.max(0, -counter) * amp * 1.5;

  const bob = Math.abs(Math.sin(rig.phase)) * (0.05 + ratio * 0.07);
  rig.chassis.position.y = 1.18 + bob;
  rig.chassis.rotation.x = -0.06 - ratio * 0.12 + Math.sin(rig.phase * 2) * 0.03;

  // Lean into the slide; the rider leans a little further than the mount.
  const lean = THREE.MathUtils.clamp(state.slip * 0.9 + state.steer * 0.16, -0.5, 0.5);
  rig.chassis.rotation.z = -lean;
  rig.rider.rotation.z = -lean * 0.4;
  rig.rider.rotation.x = -0.1 - ratio * 0.22;

  rig.neck.rotation.x = -0.12 - ratio * 0.3 + Math.sin(rig.phase) * 0.06;
  rig.neck.rotation.y = -lean * 0.5;
  rig.head.rotation.x = 0.16 + ratio * 0.28;

  rig.tail.rotation.x = -0.1 - ratio * 0.25;
  rig.tail.rotation.y = Math.sin(rig.phase * 0.5) * 0.14 - lean * 0.4;

  // Wings stay folded when cruising, half-open in a drift for balance, and
  // beat hard through a boost.
  const open = state.boosting
    ? 0.85 + Math.sin(rig.phase * 2.4) * 0.55
    : state.drifting
      ? 0.42
      : ratio * 0.12;
  rig.wingL.rotation.z = open;
  rig.wingR.rotation.z = -open;
  rig.wingL.rotation.x = -open * 0.25;
  rig.wingR.rotation.x = -open * 0.25;
}

export function disposeBirdRig(rig: BirdRig): void {
  rig.root.removeFromParent();
  for (const geo of rig.geometries) geo.dispose();
  for (const material of rig.materials) material.dispose();
}
