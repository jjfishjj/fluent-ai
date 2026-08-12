import * as THREE from 'three';
import type { ClassDef, Entity, MonsterDef } from '../core/types';

/**
 * Characters are assembled from primitives at runtime — no external models, so
 * the game ships with the bundle and still animates (walk cycle, attack swing).
 */
export interface ActorRig {
  root: THREE.Group;
  /** Everything below the hips, rotated for the walk cycle. */
  legL?: THREE.Object3D;
  legR?: THREE.Object3D;
  armL?: THREE.Object3D;
  armR?: THREE.Object3D;
  body?: THREE.Object3D;
  head?: THREE.Object3D;
  weapon?: THREE.Object3D;
  materials: THREE.MeshLambertMaterial[];
  /** Baseline emissive colours so hit flashes can be restored. */
  shape: string;
  bob: number;
}

function mat(color: number, opts: THREE.MeshLambertMaterialParameters = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

export function buildPlayerRig(cls: ClassDef): ActorRig {
  const root = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];
  const robe = mat(cls.color);
  const skin = mat(0xf0c8a0);
  const trim = mat(cls.accent);
  const dark = mat(0x2a2a35);
  materials.push(robe, skin, trim, dark);

  const hips = new THREE.Group();
  hips.position.y = 0.86;
  root.add(hips);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 10), robe);
  body.position.y = 0.32;
  body.castShadow = true;
  hips.add(body);

  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.06, 6, 14), trim);
  sash.rotation.x = Math.PI / 2;
  sash.position.y = 0.16;
  hips.add(sash);

  const head = new THREE.Group();
  head.position.y = 0.78;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), skin);
  skull.castShadow = true;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.225, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), dark);
  hair.position.y = 0.02;
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), dark);
  bun.position.set(0, 0.18, -0.08);
  head.add(skull, hair, bun);
  hips.add(head);

  const armGeo = new THREE.CapsuleGeometry(0.08, 0.34, 3, 8);
  const makeArm = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.3, 0.52, 0);
    const limb = new THREE.Mesh(armGeo, robe);
    limb.position.y = -0.22;
    limb.castShadow = true;
    pivot.add(limb);
    hips.add(pivot);
    return pivot;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  const legGeo = new THREE.CapsuleGeometry(0.1, 0.42, 3, 8);
  const makeLeg = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.13, 0.02, 0);
    const limb = new THREE.Mesh(legGeo, dark);
    limb.position.y = -0.28;
    limb.castShadow = true;
    pivot.add(limb);
    hips.add(pivot);
    return pivot;
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  const weapon = buildWeapon(cls.weapon, cls.accent, materials);
  weapon.position.set(0, -0.34, 0.05);
  armR.add(weapon);

  return { root, legL, legR, armL, armR, body, head, weapon, materials, shape: 'player', bob: 0 };
}

function buildWeapon(kind: ClassDef['weapon'], accent: number, materials: THREE.MeshLambertMaterial[]) {
  const g = new THREE.Group();
  const steel = mat(0xdfe6ef);
  const wood = mat(0x6b4a2f);
  const glow = new THREE.MeshBasicMaterial({ color: accent });
  materials.push(steel, wood);

  switch (kind) {
    case 'blade': {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.15, 0.16), steel);
      blade.position.y = -0.5;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.24), wood);
      g.add(blade, guard);
      break;
    }
    case 'bow': {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 6, 16, Math.PI * 1.25), wood);
      arc.rotation.z = Math.PI / 2;
      arc.rotation.y = Math.PI / 2;
      arc.position.y = -0.35;
      g.add(arc);
      break;
    }
    case 'staff': {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.5, 6), wood);
      shaft.position.y = -0.5;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), glow);
      orb.position.y = 0.28;
      g.add(shaft, orb);
      break;
    }
    case 'talisman': {
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.42), new THREE.MeshBasicMaterial({
        color: 0xffe9b0,
        side: THREE.DoubleSide,
      }));
      paper.position.y = -0.3;
      const sigil = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 16), glow);
      sigil.position.set(0, -0.3, 0.02);
      g.add(paper, sigil);
      break;
    }
  }
  return g;
}

export function buildMonsterRig(def: MonsterDef): ActorRig {
  const root = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];
  const skin = mat(def.color, def.shape === 'spirit' ? { transparent: true, opacity: 0.72 } : {});
  const accent = mat(def.accent);
  materials.push(skin, accent);
  const s = def.size;

  switch (def.shape) {
    case 'slime': {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.6 * s, 16, 12), skin);
      body.scale.y = 0.8;
      body.position.y = 0.5 * s;
      body.castShadow = true;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42 * s, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), accent);
      cap.position.y = 0.9 * s;
      const eyeGeo = new THREE.SphereGeometry(0.07 * s, 8, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a22 });
      for (const dx of [-0.18, 0.18]) {
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(dx * s, 0.55 * s, 0.5 * s);
        root.add(eye);
      }
      root.add(body, cap);
      return { root, body, materials, shape: 'slime', bob: 0 };
    }
    case 'beast': {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34 * s, 0.7 * s, 4, 10), skin);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.66 * s;
      body.castShadow = true;
      const head = new THREE.Group();
      head.position.set(0, 0.82 * s, 0.62 * s);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 12, 10), skin);
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 0.4 * s, 8), skin);
      snout.rotation.x = Math.PI / 2;
      snout.position.z = 0.28 * s;
      const earGeo = new THREE.ConeGeometry(0.1 * s, 0.26 * s, 5);
      for (const dx of [-0.16, 0.16]) {
        const ear = new THREE.Mesh(earGeo, accent);
        ear.position.set(dx * s, 0.28 * s, -0.02);
        head.add(ear);
      }
      head.add(skull, snout);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11 * s, 0.7 * s, 6), accent);
      tail.position.set(0, 0.8 * s, -0.7 * s);
      tail.rotation.x = -0.9;
      const legGeo = new THREE.CylinderGeometry(0.08 * s, 0.07 * s, 0.62 * s, 6);
      const legs: THREE.Object3D[] = [];
      for (const [dx, dz] of [
        [-0.22, 0.36],
        [0.22, 0.36],
        [-0.22, -0.36],
        [0.22, -0.36],
      ]) {
        const pivot = new THREE.Group();
        pivot.position.set(dx * s, 0.62 * s, dz * s);
        const leg = new THREE.Mesh(legGeo, accent);
        leg.position.y = -0.3 * s;
        leg.castShadow = true;
        pivot.add(leg);
        root.add(pivot);
        legs.push(pivot);
      }
      root.add(body, head, tail);
      return { root, body, head, legL: legs[0], legR: legs[1], armL: legs[2], armR: legs[3], materials, shape: 'beast', bob: 0 };
    }
    case 'spirit': {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.5 * s, 1.5 * s, 12, 1, true), skin);
      body.position.y = 0.9 * s;
      body.rotation.x = Math.PI;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 14, 10), skin);
      head.position.y = 1.6 * s;
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.42 * s, 0.05 * s, 6, 20),
        new THREE.MeshBasicMaterial({ color: def.accent, transparent: true, opacity: 0.8 }),
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 2.05 * s;
      const eyeMat = new THREE.MeshBasicMaterial({ color: def.accent });
      for (const dx of [-0.11, 0.11]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 8, 6), eyeMat);
        eye.position.set(dx * s, 1.62 * s, 0.26 * s);
        root.add(eye);
      }
      root.add(body, head, halo);
      return { root, body, head, materials, shape: 'spirit', bob: 0 };
    }
    case 'boss': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.9 * s, 1.3 * s, 3.4 * s, 8), skin);
      trunk.position.y = 1.7 * s;
      trunk.castShadow = true;
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 0), mat(0x3d6b34, { flatShading: true }));
      crown.position.y = 3.9 * s;
      crown.castShadow = true;
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 12, 10), mat(0x2f4a26));
      face.position.set(0, 2.2 * s, 0.85 * s);
      const eyeMat = new THREE.MeshBasicMaterial({ color: def.accent });
      for (const dx of [-0.24, 0.24]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 8, 6), eyeMat);
        eye.position.set(dx * s, 2.3 * s, 1.2 * s);
        root.add(eye);
      }
      const armGeo = new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 2.2 * s, 6);
      const arms: THREE.Object3D[] = [];
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 1.1 * s, 2.8 * s, 0);
        const arm = new THREE.Mesh(armGeo, skin);
        arm.position.y = -1 * s;
        arm.rotation.z = side * 0.35;
        arm.castShadow = true;
        pivot.add(arm);
        root.add(pivot);
        arms.push(pivot);
      }
      root.add(trunk, crown, face);
      return { root, body: trunk, head: crown, armL: arms[0], armR: arms[1], materials, shape: 'boss', bob: 0 };
    }
    case 'humanoid':
    default: {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3 * s, 0.6 * s, 4, 10), skin);
      body.position.y = 1.0 * s;
      body.castShadow = true;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.26 * s, 12, 10), skin);
      head.position.y = 1.6 * s;
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 0.36 * s, 6), accent);
      horn.position.set(0, 1.85 * s, 0);
      const legGeo = new THREE.CapsuleGeometry(0.11 * s, 0.4 * s, 3, 8);
      const legs: THREE.Object3D[] = [];
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.16 * s, 0.66 * s, 0);
        const leg = new THREE.Mesh(legGeo, accent);
        leg.position.y = -0.3 * s;
        leg.castShadow = true;
        pivot.add(leg);
        root.add(pivot);
        legs.push(pivot);
      }
      const armGeo = new THREE.CapsuleGeometry(0.09 * s, 0.42 * s, 3, 8);
      const arms: THREE.Object3D[] = [];
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.36 * s, 1.32 * s, 0);
        const arm = new THREE.Mesh(armGeo, skin);
        arm.position.y = -0.26 * s;
        arm.castShadow = true;
        pivot.add(arm);
        root.add(pivot);
        arms.push(pivot);
      }
      root.add(body, head, horn);
      return { root, body, head, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1], materials, shape: 'humanoid', bob: 0 };
    }
  }
}

/** Drives the walk cycle / attack swing / death tilt for a rig. */
export function animateRig(rig: ActorRig, entity: Entity, time: number, dt: number) {
  const moving = entity.state === 'move';
  const swinging = entity.state === 'attack' || entity.state === 'cast';
  const phase = time * (moving ? 9 : 2.2);

  if (entity.state === 'dead') {
    rig.root.rotation.x = THREE.MathUtils.lerp(rig.root.rotation.x, Math.PI / 2.2, Math.min(1, dt * 6));
    rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, rig.root.position.y - 0.2, Math.min(1, dt * 3));
    return;
  }
  rig.root.rotation.x = THREE.MathUtils.lerp(rig.root.rotation.x, 0, Math.min(1, dt * 8));

  const swing = moving ? Math.sin(phase) * 0.7 : Math.sin(phase) * 0.06;
  if (rig.legL) rig.legL.rotation.x = swing;
  if (rig.legR) rig.legR.rotation.x = -swing;

  if (rig.shape === 'slime') {
    // Slimes hop instead of walking.
    const hop = Math.abs(Math.sin(phase * 0.5)) * (moving ? 0.45 : 0.12);
    rig.bob = hop;
    if (rig.body) {
      rig.body.scale.y = 0.8 - hop * 0.25;
      rig.body.scale.x = 1 + hop * 0.12;
      rig.body.scale.z = 1 + hop * 0.12;
    }
    return;
  }

  if (rig.shape === 'spirit') {
    rig.bob = Math.sin(time * 1.8) * 0.18 + 0.35;
    if (rig.head) rig.head.rotation.y = Math.sin(time * 0.9) * 0.3;
    return;
  }

  if (swinging) {
    const t = Math.min(1, entity.actionTimer / 0.35);
    const arc = Math.sin((1 - t) * Math.PI) * -1.9;
    if (rig.armR) rig.armR.rotation.x = arc;
    if (rig.armL) rig.armL.rotation.x = arc * 0.3;
  } else {
    if (rig.armR) rig.armR.rotation.x = THREE.MathUtils.lerp(rig.armR.rotation.x, -swing * 0.8, Math.min(1, dt * 10));
    if (rig.armL) rig.armL.rotation.x = THREE.MathUtils.lerp(rig.armL.rotation.x, swing * 0.8, Math.min(1, dt * 10));
  }
  rig.bob = moving ? Math.abs(Math.sin(phase)) * 0.06 : Math.sin(time * 1.6) * 0.02;
}

export function disposeRig(rig: ActorRig) {
  rig.root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(m)) m.forEach((x) => x.dispose());
    else m?.dispose();
  });
  rig.root.removeFromParent();
}
