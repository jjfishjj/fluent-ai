import * as THREE from 'three';
import type { CastFx } from '../core/world';

/** Canvas-backed text sprites, cached so repeated numbers reuse one texture. */
const textureCache = new Map<string, THREE.Texture>();

function textTexture(text: string, color: string, bold: boolean, outline: string): THREE.Texture {
  const key = `${text}|${color}|${bold}|${outline}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const fontSize = 72;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${bold ? '800' : '600'} ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const width = Math.ceil(ctx.measureText(text).width) + 28;
  canvas.width = Math.max(32, width);
  canvas.height = fontSize + 28;

  const c = canvas.getContext('2d')!;
  c.font = `${bold ? '800' : '600'} ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = 8;
  c.strokeStyle = outline;
  c.strokeText(text, canvas.width / 2, canvas.height / 2);
  c.fillStyle = color;
  c.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  // Bound the cache; damage numbers are unbounded in principle.
  if (textureCache.size > 400) {
    const oldest = textureCache.keys().next().value as string | undefined;
    if (oldest) {
      textureCache.get(oldest)?.dispose();
      textureCache.delete(oldest);
    }
  }
  textureCache.set(key, tex);
  return tex;
}

export function makeTextSprite(
  text: string,
  color = '#ffffff',
  scale = 1,
  bold = false,
  outline = 'rgba(12,14,20,0.92)',
): THREE.Sprite {
  const tex = textTexture(text, color, bold, outline);
  const image = tex.image as HTMLCanvasElement;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }),
  );
  const aspect = image.width / image.height;
  sprite.scale.set(0.9 * scale * aspect, 0.9 * scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}

interface FloatingText {
  sprite: THREE.Sprite;
  born: number;
  ttl: number;
  velocity: THREE.Vector3;
}

/** Damage / heal / loot numbers that rise and fade above their source. */
export class FloatingTextPool {
  private items: FloatingText[] = [];

  constructor(private scene: THREE.Scene) {}

  spawn(at: THREE.Vector3, text: string, color: string, opts: { crit?: boolean; scale?: number } = {}) {
    if (this.items.length > 70) this.retire(this.items[0]);
    const sprite = makeTextSprite(text, color, (opts.scale ?? 1) * (opts.crit ? 1.5 : 1), !!opts.crit);
    sprite.position.copy(at);
    sprite.position.x += (Math.random() - 0.5) * 0.6;
    this.scene.add(sprite);
    this.items.push({
      sprite,
      born: performance.now() / 1000,
      ttl: opts.crit ? 1.5 : 1.15,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, 2.4, (Math.random() - 0.5) * 0.6),
    });
  }

  update(dt: number) {
    const now = performance.now() / 1000;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const age = now - it.born;
      if (age > it.ttl) {
        this.retire(it);
        this.items.splice(i, 1);
        continue;
      }
      it.velocity.y -= 2.6 * dt;
      it.sprite.position.addScaledVector(it.velocity, dt);
      const mat = it.sprite.material as THREE.SpriteMaterial;
      mat.opacity = age < it.ttl * 0.6 ? 1 : 1 - (age - it.ttl * 0.6) / (it.ttl * 0.4);
    }
  }

  private retire(it: FloatingText) {
    this.scene.remove(it.sprite);
    (it.sprite.material as THREE.SpriteMaterial).dispose();
  }

  dispose() {
    for (const it of this.items) this.retire(it);
    this.items = [];
  }
}

interface ActiveFx {
  id: string;
  object: THREE.Object3D;
  born: number;
  ttl: number;
  kind: CastFx['kind'];
  materials: THREE.MeshBasicMaterial[];
  /** Opacity each material started at, so fading stays proportional. */
  baseOpacity: number[];
  geometries: THREE.BufferGeometry[];
}

/** Builds and animates the visuals for skill casts. */
export class SkillFxPool {
  private active = new Map<string, ActiveFx>();

  constructor(private scene: THREE.Scene) {}

  /** Adds visuals for any cast not yet represented, and drops finished ones. */
  sync(casts: CastFx[], time: number, heightAt: (x: number, z: number) => number) {
    const seen = new Set<string>();
    for (const cast of casts) {
      seen.add(cast.id);
      if (this.active.has(cast.id)) continue;
      this.active.set(cast.id, this.build(cast, heightAt));
    }
    for (const [id, fx] of [...this.active]) {
      const age = time - fx.born;
      if (!seen.has(id) || age > fx.ttl) {
        this.retire(fx);
        this.active.delete(id);
        continue;
      }
      this.animate(fx, age / fx.ttl);
    }
  }

  private build(cast: CastFx, heightAt: (x: number, z: number) => number): ActiveFx {
    const group = new THREE.Group();
    const materials: THREE.MeshBasicMaterial[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const color = new THREE.Color(cast.color);
    const y = heightAt(cast.to.x, cast.to.z);

    const glow = (geo: THREE.BufferGeometry, opacity = 0.8, blending = THREE.AdditiveBlending) => {
      const m = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      materials.push(m);
      geometries.push(geo);
      return new THREE.Mesh(geo, m);
    };

    switch (cast.kind) {
      case 'aoe': {
        const r = Math.max(1, cast.radius);
        const ring = glow(new THREE.RingGeometry(r * 0.55, r, 40), 0.7);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(cast.to.x, y + 0.15, cast.to.z);
        const column = glow(new THREE.CylinderGeometry(r * 0.85, r * 0.55, 2.6, 24, 1, true), 0.16);
        column.position.set(cast.to.x, y + 1.3, cast.to.z);
        group.add(ring, column);
        break;
      }
      case 'heal':
      case 'buff': {
        const ring = glow(new THREE.TorusGeometry(0.9, 0.09, 8, 28));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(cast.from.x, heightAt(cast.from.x, cast.from.z) + 0.3, cast.from.z);
        const pillar = glow(new THREE.CylinderGeometry(0.8, 0.8, 2.6, 18, 1, true), 0.3);
        pillar.position.set(cast.from.x, heightAt(cast.from.x, cast.from.z) + 1.4, cast.from.z);
        group.add(ring, pillar);
        break;
      }
      case 'melee':
      case 'dash': {
        const arc = glow(new THREE.TorusGeometry(1.5, 0.14, 8, 24, Math.PI * 0.9));
        arc.position.set(cast.to.x, y + 1.1, cast.to.z);
        arc.rotation.set(-Math.PI / 2.4, Math.atan2(cast.to.x - cast.from.x, cast.to.z - cast.from.z), 0);
        const burst = glow(new THREE.SphereGeometry(0.55, 12, 10), 0.7);
        burst.position.set(cast.to.x, y + 1.1, cast.to.z);
        group.add(arc, burst);
        break;
      }
      case 'ranged':
      default: {
        // A bolt stretched between caster and target, plus an impact flash.
        const from = new THREE.Vector3(cast.from.x, heightAt(cast.from.x, cast.from.z) + 1.2, cast.from.z);
        const to = new THREE.Vector3(cast.to.x, y + 1.1, cast.to.z);
        const dir = to.clone().sub(from);
        const len = Math.max(0.2, dir.length());
        const bolt = glow(new THREE.CylinderGeometry(0.09, 0.16, len, 8), 0.85);
        bolt.position.copy(from).addScaledVector(dir, 0.5);
        bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        const impact = glow(new THREE.SphereGeometry(0.5, 12, 10), 0.9);
        impact.position.copy(to);
        group.add(bolt, impact);
        break;
      }
    }

    this.scene.add(group);
    return {
      id: cast.id,
      object: group,
      born: cast.bornAt,
      ttl: cast.ttl,
      kind: cast.kind,
      materials,
      baseOpacity: materials.map((m) => m.opacity),
      geometries,
    };
  }

  private animate(fx: ActiveFx, t: number) {
    // Hold full strength for the first third, then fade out.
    const fade = t < 0.33 ? 1 : 1 - (t - 0.33) / 0.67;
    fx.materials.forEach((m, i) => {
      m.opacity = fx.baseOpacity[i] * Math.max(0, fade);
    });
    if (fx.kind === 'aoe') {
      fx.object.scale.setScalar(0.7 + t * 0.5);
      fx.object.rotation.y += 0.05;
    } else if (fx.kind === 'buff' || fx.kind === 'heal') {
      fx.object.position.y = t * 1.2;
      fx.object.rotation.y += 0.08;
    } else {
      fx.object.scale.setScalar(1 + t * 0.6);
    }
  }

  private retire(fx: ActiveFx) {
    this.scene.remove(fx.object);
    for (const m of fx.materials) m.dispose();
    for (const g of fx.geometries) g.dispose();
  }

  dispose() {
    for (const fx of this.active.values()) this.retire(fx);
    this.active.clear();
  }
}

/** The rotating ring drawn under the currently selected target. */
export function buildTargetRing(): THREE.Mesh {
  const geo = new THREE.RingGeometry(0.7, 0.9, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 10;
  mesh.visible = false;
  return mesh;
}

/** Marker shown where a click-to-move order landed. */
export function buildMoveMarker(): THREE.Mesh {
  const geo = new THREE.RingGeometry(0.25, 0.45, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.9, depthTest: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 10;
  mesh.visible = false;
  return mesh;
}

/** Nameplate + health bar floating above an entity. */
export class Nameplate {
  root = new THREE.Group();
  private fill: THREE.Mesh;
  private label: THREE.Sprite;
  private barWidth = 1.2;

  constructor(name: string, color: string, barColor = 0xe05555) {
    this.label = makeTextSprite(name, color, 0.34);
    this.label.position.y = 0.3;
    const bgGeo = new THREE.PlaneGeometry(this.barWidth, 0.13);
    const bg = new THREE.Mesh(
      bgGeo,
      new THREE.MeshBasicMaterial({ color: 0x14161f, transparent: true, opacity: 0.75, depthTest: false }),
    );
    const fillGeo = new THREE.PlaneGeometry(this.barWidth, 0.1);
    // Anchor the fill on its left edge so scaling shrinks it rightwards.
    fillGeo.translate(this.barWidth / 2, 0, 0);
    this.fill = new THREE.Mesh(
      fillGeo,
      new THREE.MeshBasicMaterial({ color: barColor, depthTest: false }),
    );
    this.fill.position.x = -this.barWidth / 2;
    this.fill.position.z = 0.001;
    bg.renderOrder = 18;
    this.fill.renderOrder = 19;
    this.root.add(bg, this.fill, this.label);
    this.root.renderOrder = 18;
  }

  setRatio(ratio: number) {
    this.fill.scale.x = Math.max(0.001, Math.min(1, ratio));
  }

  faceCamera(camera: THREE.Camera) {
    this.root.quaternion.copy(camera.quaternion);
  }

  dispose() {
    this.root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const m = mesh.material as THREE.Material | undefined;
      m?.dispose();
    });
    this.root.removeFromParent();
  }
}
