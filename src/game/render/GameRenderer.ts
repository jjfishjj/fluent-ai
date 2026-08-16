import * as THREE from 'three';
import { classDef } from '../data/classes';
import { monsterDef } from '../data/monsters';
import { terrainHeight } from '../core/terrain';
import type { Entity, GameEvent, Vec2, ZoneDef } from '../core/types';
import type { World } from '../core/world';
import { ActorRig, animateRig, buildMonsterRig, buildPlayerRig, disposeRig } from './actors';
import { FloatingTextPool, Nameplate, SkillFxPool, buildMoveMarker, buildTargetRing } from './effects';
import { ZoneScene, buildSky, buildZoneScene } from './scenery';

interface EntityView {
  rig: ActorRig;
  plate?: Nameplate;
  shadow: THREE.Mesh;
}

export interface CameraState {
  yaw: number;
  pitch: number;
  distance: number;
}

const MIN_DISTANCE = 6;
const MAX_DISTANCE = 34;

/**
 * Owns the three.js scene and mirrors the `World` simulation into it every
 * frame. The renderer never mutates gameplay state — it only reads the world
 * and forwards input intents back through the supplied callbacks.
 */
export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private world: World;
  private zoneScene?: ZoneScene;
  private sky?: THREE.Mesh;
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private views = new Map<string, EntityView>();
  private dropViews = new Map<string, THREE.Object3D>();
  private floaters: FloatingTextPool;
  private skillFx: SkillFxPool;
  private targetRing = buildTargetRing();
  private moveMarker = buildMoveMarker();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private cameraTarget = new THREE.Vector3();
  private dropGeo = new THREE.OctahedronGeometry(0.26, 0);
  private coinGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12);
  private dropMat = new THREE.MeshLambertMaterial({ color: 0x9fe8ff, emissive: 0x2a4a66 });
  private coinMat = new THREE.MeshLambertMaterial({ color: 0xffcc55, emissive: 0x5a4410 });
  private shadowGeo = new THREE.CircleGeometry(0.5, 16);
  private shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  });

  camState: CameraState = { yaw: Math.PI, pitch: 0.62, distance: 14 };
  /** Ground point under the cursor, used to aim area skills. */
  aim: Vec2 = { x: 0, z: 0 };
  private currentZoneId = '';

  constructor(canvas: HTMLCanvasElement, world: World) {
    this.world = world;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 800);
    this.scene.add(this.camera);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x404050, 1.0);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    const shadowCam = this.sun.shadow.camera as THREE.OrthographicCamera;
    shadowCam.left = -40;
    shadowCam.right = 40;
    shadowCam.top = 40;
    shadowCam.bottom = -40;
    this.scene.add(this.sun, this.sun.target);

    this.floaters = new FloatingTextPool(this.scene);
    this.skillFx = new SkillFxPool(this.scene);
    this.scene.add(this.targetRing, this.moveMarker);

    this.setZone(world.zone);
  }

  // ── zone ──────────────────────────────────────────────────────────────

  setZone(zone: ZoneDef) {
    if (this.currentZoneId === zone.id) return;
    this.currentZoneId = zone.id;

    this.zoneScene?.root.removeFromParent();
    this.zoneScene?.dispose();
    this.zoneScene = buildZoneScene(zone);
    this.scene.add(this.zoneScene.root);

    if (this.sky) {
      this.sky.removeFromParent();
      (this.sky.material as THREE.Material).dispose();
      this.sky.geometry.dispose();
    }
    this.sky = buildSky(zone);
    this.scene.add(this.sky);

    this.scene.fog = new THREE.Fog(zone.palette.fog, 45, zone.half * 2.4);
    this.scene.background = new THREE.Color(zone.palette.fog);
    this.sun.color.setHex(zone.palette.light);
    this.sun.intensity = zone.id === 'abyss' ? 0.55 : 1.5;
    this.hemi.color.setHex(zone.palette.light);
    this.hemi.groundColor.setHex(zone.palette.ambient);
    this.hemi.intensity = zone.id === 'abyss' ? 0.85 : 1.0;

    // Entity views belong to the old zone; rebuild them lazily next frame.
    for (const [id, view] of this.views) {
      if (id === this.world.playerId) continue;
      this.retireView(view);
      this.views.delete(id);
    }
    for (const [id, obj] of this.dropViews) {
      obj.removeFromParent();
      this.dropViews.delete(id);
    }
  }

  heightAt = (x: number, z: number) => terrainHeight(this.world.zone, x, z);

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  // ── input helpers ─────────────────────────────────────────────────────

  setPointer(nx: number, ny: number) {
    this.pointer.set(nx, ny);
  }

  /** World-space ground point under the cursor, or undefined if off-terrain. */
  pickGround(): Vec2 | undefined {
    if (!this.zoneScene) return undefined;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.zoneScene.ground, false)[0];
    if (!hit) return undefined;
    return { x: hit.point.x, z: hit.point.z };
  }

  /** Entity id under the cursor, walking up from the hit mesh to its rig root. */
  pickEntity(): string | undefined {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const roots: THREE.Object3D[] = [];
    for (const [id, view] of this.views) {
      if (id === this.world.playerId) continue;
      roots.push(view.rig.root);
    }
    const hits = this.raycaster.intersectObjects(roots, true);
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        const id = obj.userData.entityId as string | undefined;
        if (id) return id;
        obj = obj.parent;
      }
    }
    return undefined;
  }

  orbit(dx: number, dy: number) {
    this.camState.yaw -= dx * 0.005;
    this.camState.pitch = THREE.MathUtils.clamp(this.camState.pitch + dy * 0.004, 0.12, 1.35);
  }

  zoom(delta: number) {
    this.camState.distance = THREE.MathUtils.clamp(
      this.camState.distance + delta * 0.012,
      MIN_DISTANCE,
      MAX_DISTANCE,
    );
  }

  /** Camera yaw, so WASD can move relative to where the player is looking. */
  get yaw() {
    return this.camState.yaw;
  }

  // ── events ────────────────────────────────────────────────────────────

  handleEvents(events: GameEvent[]) {
    for (const ev of events) {
      switch (ev.type) {
        case 'damage': {
          const at = this.floatAnchor(ev.targetId);
          if (!at) break;
          const color = ev.fromPlayer ? (ev.crit ? '#ffd166' : '#ffffff') : '#ff6b6b';
          this.floaters.spawn(at, `${ev.crit ? '爆! ' : ''}${ev.amount}`, color, { crit: ev.crit });
          break;
        }
        case 'miss': {
          const at = this.floatAnchor(ev.targetId);
          if (at) this.floaters.spawn(at, 'MISS', '#b9c2d0', { scale: 0.8 });
          break;
        }
        case 'heal': {
          const at = this.floatAnchor(ev.targetId);
          if (at) this.floaters.spawn(at, `+${ev.amount}`, '#7df58f');
          break;
        }
        case 'levelup': {
          const at = this.floatAnchor(this.world.playerId);
          if (at) this.floaters.spawn(at.clone().setY(at.y + 0.6), `LEVEL ${ev.level}!`, '#ffe066', { crit: true });
          break;
        }
        case 'zone':
          this.setZone(this.world.zone);
          break;
      }
    }
  }

  private floatAnchor(entityId: string): THREE.Vector3 | undefined {
    const e = this.world.entity(entityId);
    if (!e) return undefined;
    const y = this.heightAt(e.pos.x, e.pos.z) + e.radius * 2 + 0.9;
    return new THREE.Vector3(e.pos.x, y, e.pos.z);
  }

  // ── frame ─────────────────────────────────────────────────────────────

  /** Draws one frame. `dt`/`time` come from the caller so the simulation and
   *  the visuals always advance by exactly the same amount. */
  frame(dt: number, time: number) {
    this.syncEntities(time, dt);
    this.syncDrops(time);
    this.skillFx.sync(this.world.casts, this.world.time, this.heightAt);
    this.floaters.update(dt);
    this.updateSelection(time);
    this.updateCamera(dt);

    if (this.zoneScene) {
      for (const child of this.zoneScene.root.children) {
        const spin = child.userData.spin as THREE.Object3D | undefined;
        if (spin) spin.rotation.z += dt * 0.8;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private syncEntities(time: number, dt: number) {
    const seen = new Set<string>();

    for (const e of this.world.entities.values()) {
      seen.add(e.id);
      let view = this.views.get(e.id);
      if (!view) {
        view = this.createView(e);
        this.views.set(e.id, view);
      }

      const ground = this.heightAt(e.pos.x, e.pos.z);
      animateRig(view.rig, e, time, dt);
      view.rig.root.position.set(e.pos.x, ground + view.rig.bob, e.pos.z);
      view.rig.root.rotation.y = e.facing;
      view.rig.root.visible = e.state !== 'dead' || e.kind === 'player';

      // Hit flash tints every material on the rig for a fraction of a second.
      const flash = e.flash ?? 0;
      for (const m of view.rig.materials) {
        m.emissive.setScalar(flash > 0 ? 0.45 : 0);
      }

      view.shadow.position.set(e.pos.x, ground + 0.04, e.pos.z);
      view.shadow.visible = view.rig.root.visible && e.kind !== 'npc';
      view.shadow.scale.setScalar(Math.max(0.7, e.radius * 1.7));

      if (view.plate) {
        const showPlate =
          e.kind !== 'player' &&
          e.state !== 'dead' &&
          this.cameraTarget.distanceTo(new THREE.Vector3(e.pos.x, ground, e.pos.z)) < 34;
        view.plate.root.visible = showPlate;
        if (showPlate) {
          const top = ground + (e.boss ? e.radius * 4.4 : e.radius * 2.4) + 0.9;
          view.plate.root.position.set(e.pos.x, top, e.pos.z);
          view.plate.setRatio(e.maxHp > 0 ? e.hp / e.maxHp : 0);
          view.plate.faceCamera(this.camera);
          // Scale with distance so plates keep a roughly constant screen size.
          const camDist = this.camera.position.distanceTo(view.plate.root.position);
          view.plate.root.scale.setScalar(THREE.MathUtils.clamp(camDist * 0.05, 0.4, 1.5));
        }
      }
    }

    for (const [id, view] of this.views) {
      if (seen.has(id)) continue;
      this.retireView(view);
      this.views.delete(id);
    }
  }

  private createView(e: Entity): EntityView {
    const rig =
      e.kind === 'monster' && e.monsterId
        ? buildMonsterRig(monsterDef(e.monsterId)!)
        : buildPlayerRig(classDef(e.classId ?? 'sword'));

    if (e.kind === 'npc') {
      // NPCs reuse the humanoid rig but wear their own robe colour.
      const npc = this.world.zone.npcs.find((n) => n.id === e.npcId);
      if (npc) rig.materials[0]?.color.setHex(npc.color);
    }

    rig.root.userData.entityId = e.id;
    rig.root.traverse((o) => {
      o.userData.entityId = e.id;
    });
    this.scene.add(rig.root);

    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    this.scene.add(shadow);

    let plate: Nameplate | undefined;
    if (e.kind !== 'player') {
      const npcRole = this.world.zone.npcs.find((n) => n.id === e.npcId)?.role;
      const roleTag = npcRole === 'quest' ? '【任務】' : npcRole === 'shop' ? '【商店】' : npcRole === 'healer' ? '【治療】' : '';
      const label =
        e.kind === 'monster'
          ? `Lv.${e.level} ${e.name}`
          : e.kind === 'npc'
            ? `${roleTag}${e.name}`
            : `${e.name} (Lv.${e.level})`;
      const color = e.kind === 'npc' ? '#ffe9a8' : e.kind === 'remote' ? '#9fe8ff' : e.boss ? '#ff9f6b' : '#ffd7d7';
      plate = new Nameplate(label, color, e.kind === 'monster' ? 0xe05555 : 0x4fb0e0);
      plate.root.visible = false;
      this.scene.add(plate.root);
    }

    return { rig, plate, shadow };
  }

  private retireView(view: EntityView) {
    disposeRig(view.rig);
    view.plate?.dispose();
    view.shadow.removeFromParent();
  }

  private syncDrops(time: number) {
    const seen = new Set<string>();
    for (const drop of this.world.drops) {
      seen.add(drop.id);
      let obj = this.dropViews.get(drop.id);
      if (!obj) {
        obj = new THREE.Mesh(drop.silver ? this.coinGeo : this.dropGeo, drop.silver ? this.coinMat : this.dropMat);
        obj.castShadow = true;
        obj.userData.dropId = drop.id;
        this.scene.add(obj);
        this.dropViews.set(drop.id, obj);
      }
      obj.position.set(drop.pos.x, drop.y + 0.45 + Math.sin(time * 3 + drop.pos.x) * 0.12, drop.pos.z);
      obj.rotation.y += 0.03;
      // Blink out over the last few seconds of the drop's life.
      const left = drop.until - this.world.time;
      obj.visible = left > 4 || Math.floor(time * 6) % 2 === 0;
    }
    for (const [id, obj] of this.dropViews) {
      if (seen.has(id)) continue;
      obj.removeFromParent();
      this.dropViews.delete(id);
    }
  }

  private updateSelection(time: number) {
    const t = this.world.target;
    if (t && t.state !== 'dead') {
      const y = this.heightAt(t.pos.x, t.pos.z);
      this.targetRing.visible = true;
      this.targetRing.position.set(t.pos.x, y + 0.08, t.pos.z);
      this.targetRing.scale.setScalar(Math.max(1, t.radius * 1.6));
      this.targetRing.rotation.y = time * 1.2;
    } else {
      this.targetRing.visible = false;
    }

    const mt = this.world.player.moveTarget;
    if (mt) {
      this.moveMarker.visible = true;
      this.moveMarker.position.set(mt.x, this.heightAt(mt.x, mt.z) + 0.06, mt.z);
      this.moveMarker.scale.setScalar(1 + Math.sin(time * 6) * 0.12);
    } else {
      this.moveMarker.visible = false;
    }
  }

  private updateCamera(dt: number) {
    const p = this.world.player;
    const focusY = this.heightAt(p.pos.x, p.pos.z) + 1.5;
    const desired = new THREE.Vector3(p.pos.x, focusY, p.pos.z);
    this.cameraTarget.lerp(desired, Math.min(1, dt * 9));

    const { yaw, pitch, distance } = this.camState;
    const offset = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch) * distance,
      Math.sin(pitch) * distance,
      Math.cos(yaw) * Math.cos(pitch) * distance,
    );
    const wanted = this.cameraTarget.clone().add(offset);
    // Keep the camera above the terrain so it never clips underground.
    const groundAtCam = this.heightAt(wanted.x, wanted.z) + 1.6;
    wanted.y = Math.max(wanted.y, groundAtCam);
    this.camera.position.lerp(wanted, Math.min(1, dt * 10));
    this.camera.lookAt(this.cameraTarget);

    this.sun.position.set(p.pos.x + 30, 55, p.pos.z + 20);
    this.sun.target.position.set(p.pos.x, 0, p.pos.z);
    this.sun.target.updateMatrixWorld();
    this.sky?.position.set(p.pos.x, 0, p.pos.z);
  }

  dispose() {
    for (const view of this.views.values()) this.retireView(view);
    this.views.clear();
    for (const obj of this.dropViews.values()) obj.removeFromParent();
    this.dropViews.clear();
    this.floaters.dispose();
    this.skillFx.dispose();
    this.zoneScene?.dispose();
    if (this.sky) {
      (this.sky.material as THREE.Material).dispose();
      this.sky.geometry.dispose();
    }
    this.dropGeo.dispose();
    this.coinGeo.dispose();
    this.dropMat.dispose();
    this.coinMat.dispose();
    this.shadowGeo.dispose();
    this.shadowMat.dispose();
    (this.targetRing.material as THREE.Material).dispose();
    this.targetRing.geometry.dispose();
    (this.moveMarker.material as THREE.Material).dispose();
    this.moveMarker.geometry.dispose();
    this.renderer.dispose();
  }
}
