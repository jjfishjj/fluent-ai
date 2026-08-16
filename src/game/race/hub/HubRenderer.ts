import * as THREE from 'three';
import { makeTextSprite } from '@/game/render/effects';
import { birdDef } from '../data/birds';
import { nation } from '../data/nations';
import { BirdRig, animateBird, buildBirdRig, disposeBirdRig } from '../render/birdRig';
import { buildSky } from '../render/trackScene';
import type { TrackPalette } from '../core/types';
import { PLAZA_RADIUS, RING_RADIUS, TALK_RANGE, type HubAvatar, type HubWorld, type Pavilion } from './hubWorld';

/** Daylight over a stone plaza; deliberately calmer than any of the courses. */
const HUB_PALETTE: TrackPalette = {
  road: 0xb9b3a6,
  roadEdge: 0xe8e2d4,
  ground: 0x8fae72,
  groundAlt: 0xc9c2b0,
  rock: 0x9a958c,
  foliage: 0x3f7a46,
  foliageAlt: 0xf0d9a0,
  skyTop: 0x3f8fdc,
  skyBottom: 0xdfe9f2,
  fog: 0xd6e2ec,
  light: 0xfff4e0,
  ambient: 0xa8bcd0,
};

function bannerTexture(flag: string, name: string, subtitle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(18,22,32,0.94)';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 248);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '96px "Noto Color Emoji", system-ui, sans-serif';
  ctx.fillText(flag, 110, 128);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 76px "Microsoft JhengHei", system-ui, sans-serif';
  ctx.fillText(name, 300, 104);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '600 40px "Microsoft JhengHei", system-ui, sans-serif';
  ctx.fillText(subtitle, 300, 176);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface AvatarView {
  rig: BirdRig;
  plate: THREE.Sprite;
  /** Sprite scale at unit distance, so plates can be kept a constant size. */
  plateSize: { x: number; y: number };
}

/**
 * Sprites shrink with distance, which means a nameplate right next to the
 * camera covers half the screen. Scaling by distance keeps every plate at
 * roughly the same readable size, clamped so the far ones stay legible.
 */
function fixPlateSize(
  plate: THREE.Sprite,
  base: { x: number; y: number },
  camera: THREE.Camera,
): void {
  const distance = camera.position.distanceTo(plate.position);
  const k = Math.max(0.6, Math.min(1.9, distance / 15));
  plate.scale.set(base.x * k, base.y * k, 1);
}

/**
 * Draws 使節廣場: eight embassy pavilions, their representatives, and every
 * diplomat currently walking the plaza. Reads `HubWorld`, never writes to it.
 */
export class HubRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private hub: HubWorld;
  private sky: THREE.Mesh;
  private sun: THREE.DirectionalLight;
  private playerRig: BirdRig;
  private repRigs = new Map<string, BirdRig>();
  private repPlates: { sprite: THREE.Sprite; base: { x: number; y: number } }[] = [];
  private avatars = new Map<string, AvatarView>();
  private highlight: THREE.Mesh;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];
  private cameraPos = new THREE.Vector3();
  private booted = false;

  constructor(canvas: HTMLCanvasElement, hub: HubWorld) {
    this.hub = hub;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.2, 900);
    this.scene.add(this.camera);
    this.scene.fog = new THREE.Fog(HUB_PALETTE.fog, 110, 460);
    this.scene.background = new THREE.Color(HUB_PALETTE.fog);

    this.scene.add(new THREE.HemisphereLight(HUB_PALETTE.light, HUB_PALETTE.ambient, 1.1));
    this.sun = new THREE.DirectionalLight(HUB_PALETTE.light, 1.35);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.far = 220;
    const shadowCam = this.sun.shadow.camera as THREE.OrthographicCamera;
    shadowCam.left = -70;
    shadowCam.right = 70;
    shadowCam.top = 70;
    shadowCam.bottom = -70;
    this.sun.position.set(50, 90, 30);
    this.scene.add(this.sun, this.sun.target);

    this.sky = buildSky(HUB_PALETTE);
    this.scene.add(this.sky);

    this.buildPlaza();
    for (const pavilion of hub.pavilions) this.buildPavilion(pavilion);

    this.playerRig = buildBirdRig(birdDef(hub.player.birdId), 0x2f3a56);
    this.scene.add(this.playerRig.root);

    this.highlight = new THREE.Mesh(
      this.keepGeo(new THREE.RingGeometry(TALK_RANGE - 0.5, TALK_RANGE, 40)),
      this.keepMat(
        new THREE.MeshBasicMaterial({
          color: 0xffd166,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      ),
    );
    this.highlight.rotation.x = -Math.PI / 2;
    this.highlight.position.y = 0.06;
    this.highlight.visible = false;
    this.scene.add(this.highlight);
  }

  private keepGeo<T extends THREE.BufferGeometry>(geo: T): T {
    this.geometries.push(geo);
    return geo;
  }

  private keepMat<T extends THREE.Material>(material: T): T {
    this.materials.push(material);
    return material;
  }

  // ── scenery ──────────────────────────────────────────────────────────────

  private buildPlaza(): void {
    const ground = new THREE.Mesh(
      this.keepGeo(new THREE.CircleGeometry(420, 48)),
      this.keepMat(new THREE.MeshLambertMaterial({ color: HUB_PALETTE.ground })),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const plaza = new THREE.Mesh(
      this.keepGeo(new THREE.CircleGeometry(PLAZA_RADIUS, 56)),
      this.keepMat(new THREE.MeshLambertMaterial({ color: HUB_PALETTE.road })),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // The ring the pavilions stand on, as a paved path.
    const path = new THREE.Mesh(
      this.keepGeo(new THREE.RingGeometry(RING_RADIUS - 6, RING_RADIUS - 2, 64)),
      this.keepMat(new THREE.MeshLambertMaterial({ color: HUB_PALETTE.roadEdge })),
    );
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.02;
    path.receiveShadow = true;
    this.scene.add(path);

    // Centrepiece: a globe on a plinth, the circuit's trophy.
    const plinth = new THREE.Mesh(
      this.keepGeo(new THREE.CylinderGeometry(3.2, 4, 2.4, 12)),
      this.keepMat(new THREE.MeshLambertMaterial({ color: HUB_PALETTE.roadEdge })),
    );
    plinth.position.y = 1.2;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    this.scene.add(plinth);

    const globe = new THREE.Mesh(
      this.keepGeo(new THREE.SphereGeometry(2.4, 20, 16)),
      this.keepMat(new THREE.MeshLambertMaterial({ color: 0x4a8fd0, emissive: 0x102840 })),
    );
    globe.position.y = 4.6;
    globe.castShadow = true;
    this.scene.add(globe);

    const title = makeTextSprite('使節廣場', '#ffffff', 2.6, true);
    title.position.set(0, 8.4, 0);
    this.scene.add(title);
  }

  private buildPavilion(pavilion: Pavilion): void {
    const def = nation(pavilion.nationId);
    const group = new THREE.Group();
    group.position.set(pavilion.pos.x, 0, pavilion.pos.z);
    group.rotation.y = pavilion.yaw;

    const wall = this.keepMat(new THREE.MeshLambertMaterial({ color: def.palette.roadEdge }));
    const trim = this.keepMat(new THREE.MeshLambertMaterial({ color: def.palette.rock }));
    const roofMat = this.keepMat(new THREE.MeshLambertMaterial({ color: def.palette.foliage }));

    const hall = new THREE.Mesh(this.keepGeo(new THREE.BoxGeometry(12, 6, 9)), wall);
    hall.position.y = 3;
    hall.castShadow = true;
    hall.receiveShadow = true;
    group.add(hall);

    const roof = new THREE.Mesh(this.keepGeo(new THREE.ConeGeometry(9.5, 4.2, 4)), roofMat);
    roof.position.y = 8;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Columns along the front, facing the plaza.
    const columnGeo = this.keepGeo(new THREE.CylinderGeometry(0.42, 0.48, 5.4, 10));
    for (const x of [-4.4, -1.5, 1.5, 4.4]) {
      const column = new THREE.Mesh(columnGeo, trim);
      column.position.set(x, 2.7, 5.2);
      column.castShadow = true;
      group.add(column);
    }
    const lintel = new THREE.Mesh(this.keepGeo(new THREE.BoxGeometry(11, 0.7, 1.2)), trim);
    lintel.position.set(0, 5.7, 5.2);
    group.add(lintel);

    const texture = bannerTexture(def.flag, def.name, def.rep.title);
    this.textures.push(texture);
    // Sits between the lintel and the eaves; any higher and the roof clips it.
    const banner = new THREE.Mesh(
      this.keepGeo(new THREE.PlaneGeometry(7.2, 3.6)),
      this.keepMat(new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })),
    );
    banner.position.set(0, 4, 5.7);
    group.add(banner);

    this.scene.add(group);

    // The representative, on their own mount, waiting outside the doors.
    const rig = buildBirdRig(birdDef(def.rep.birdId), def.palette.rock);
    rig.root.position.set(pavilion.repPos.x, 0, pavilion.repPos.z);
    rig.root.rotation.y = pavilion.yaw + Math.PI;
    this.scene.add(rig.root);
    this.repRigs.set(pavilion.nationId, rig);

    const plate = makeTextSprite(`${def.flag} ${def.rep.displayName}`, '#ffe9a8', 0.95, true);
    // Below the banner, so the two never overlap from the plaza.
    plate.position.set(pavilion.repPos.x, 2.8, pavilion.repPos.z);
    this.scene.add(plate);
    this.repPlates.push({ sprite: plate, base: { x: plate.scale.x, y: plate.scale.y } });
  }

  // ── frame ────────────────────────────────────────────────────────────────

  /** Swaps the mount the player is riding around the plaza. */
  setPlayerBird(birdId: string): void {
    disposeBirdRig(this.playerRig);
    this.playerRig = buildBirdRig(birdDef(birdId), 0x2f3a56);
    this.scene.add(this.playerRig.root);
  }

  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  frame(dt: number): void {
    const player = this.hub.player;
    this.playerRig.root.position.set(player.pos.x, 0, player.pos.z);
    this.playerRig.root.rotation.y = player.yaw;
    animateBird(this.playerRig, dt, {
      speed: player.moving ? 8 : 0,
      topSpeed: 30,
      slip: 0,
      boosting: false,
      drifting: false,
      steer: 0,
    });

    for (const rig of this.repRigs.values()) {
      // Representatives idle in place — enough motion to look alive.
      animateBird(rig, dt, { speed: 0.6, topSpeed: 30, slip: 0, boosting: false, drifting: false, steer: 0 });
    }

    this.syncAvatars(dt);

    const near = this.hub.nearestRep();
    this.highlight.visible = !!near;
    if (near) this.highlight.position.set(near.pavilion.repPos.x, 0.06, near.pavilion.repPos.z);

    this.updateCamera(dt);
    for (const plate of this.repPlates) fixPlateSize(plate.sprite, plate.base, this.camera);
    this.sky.position.set(this.camera.position.x, 0, this.camera.position.z);
    this.sun.target.position.set(player.pos.x, 0, player.pos.z);
    this.sun.target.updateMatrixWorld();
    this.sun.position.set(player.pos.x + 50, 90, player.pos.z + 30);

    this.renderer.render(this.scene, this.camera);
  }

  private syncAvatars(dt: number): void {
    for (const [id, avatar] of this.hub.others) {
      let view = this.avatars.get(id);
      if (!view) {
        const rig = buildBirdRig(birdDef(avatar.birdId), 0x4a4458);
        this.scene.add(rig.root);
        const plate = makeTextSprite(`${avatar.name}｜${avatar.rank}`, '#dbeafe', 0.85, false);
        this.scene.add(plate);
        view = { rig, plate, plateSize: { x: plate.scale.x, y: plate.scale.y } };
        this.avatars.set(id, view);
      }
      // Ease towards the reported position: hub packets are only 5 Hz.
      const follow = 1 - Math.exp(-7 * dt);
      view.rig.root.position.x += (avatar.pos.x - view.rig.root.position.x) * follow;
      view.rig.root.position.z += (avatar.pos.z - view.rig.root.position.z) * follow;
      view.rig.root.rotation.y = avatar.yaw;
      view.plate.position.set(view.rig.root.position.x, 3.1, view.rig.root.position.z);
      fixPlateSize(view.plate, view.plateSize, this.camera);
      animateBird(view.rig, dt, {
        speed: avatar.moving ? 7 : 0,
        topSpeed: 30,
        slip: 0,
        boosting: false,
        drifting: false,
        steer: 0,
      });
    }

    for (const [id, view] of this.avatars) {
      if (this.hub.others.has(id)) continue;
      disposeBirdRig(view.rig);
      view.plate.removeFromParent();
      view.plate.material.dispose();
      this.avatars.delete(id);
    }
  }

  private updateCamera(dt: number): void {
    const player = this.hub.player;
    const target = new THREE.Vector3(
      player.pos.x - Math.sin(player.yaw) * 13,
      8.5,
      player.pos.z - Math.cos(player.yaw) * 13,
    );
    if (!this.booted) {
      this.cameraPos.copy(target);
      this.booted = true;
    }
    this.cameraPos.lerp(target, 1 - Math.exp(-4.5 * dt));
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(player.pos.x, 2.2, player.pos.z);
  }

  dispose(): void {
    disposeBirdRig(this.playerRig);
    for (const rig of this.repRigs.values()) disposeBirdRig(rig);
    this.repRigs.clear();
    for (const view of this.avatars.values()) {
      disposeBirdRig(view.rig);
      view.plate.removeFromParent();
      view.plate.material.dispose();
    }
    this.avatars.clear();
    this.sky.removeFromParent();
    (this.sky.material as THREE.Material).dispose();
    this.sky.geometry.dispose();
    for (const geo of this.geometries) geo.dispose();
    for (const material of this.materials) material.dispose();
    for (const texture of this.textures) texture.dispose();
    this.renderer.dispose();
  }
}
