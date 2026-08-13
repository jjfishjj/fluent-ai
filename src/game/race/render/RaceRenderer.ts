import * as THREE from 'three';
import type { RaceSim } from '../core/race';
import { birdDef } from '../data/birds';
import type { Racer } from '../core/types';
import { questionFor } from '../core/gates';
import { BirdRig, animateBird, buildBirdRig, disposeBirdRig } from './birdRig';
import { GateArch, buildGateArch, setGateQuestion } from './gateProps';
import { TrackScene, buildSky, buildTrackScene } from './trackScene';

export type CameraMode = 'chase' | 'wide' | 'first';

const RIDER_COLORS = [0x2f3a56, 0x6b3550, 0x2f5a44, 0x63512c, 0x503a6b, 0x2b4f6b, 0x6b3a2f, 0x3a3a3a];
const DUST_MAX = 260;

function dustTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Owns the three.js side of a race: one rig per racer, the chase camera, and
 * the dust kicked up by drifting. It reads `RaceSim` and never writes to it.
 */
export class RaceRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  cameraMode: CameraMode = 'chase';

  private sim: RaceSim;
  private trackScene: TrackScene;
  private sky: THREE.Mesh;
  private sun: THREE.DirectionalLight;
  private rigs = new Map<string, BirdRig>();
  private dust: THREE.Points;
  private dustGeo = new THREE.BufferGeometry();
  private dustTex = dustTexture();
  private dustMat: THREE.PointsMaterial;
  /** Ring buffer of live dust puffs. */
  private puffs: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[] = [];
  private nextPuff = 0;
  private arches: GateArch[] = [];
  private cameraPos = new THREE.Vector3();
  private cameraLook = new THREE.Vector3();
  private booted = false;

  constructor(canvas: HTMLCanvasElement, sim: RaceSim) {
    this.sim = sim;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const palette = sim.track.def.palette;
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.2, 900);
    this.scene.add(this.camera);
    this.scene.fog = new THREE.Fog(palette.fog, 90, 420);
    this.scene.background = new THREE.Color(palette.fog);

    const hemi = new THREE.HemisphereLight(palette.light, palette.ambient, 1.05);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(palette.light, 1.45);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 180;
    const shadowCam = this.sun.shadow.camera as THREE.OrthographicCamera;
    shadowCam.left = -45;
    shadowCam.right = 45;
    shadowCam.top = 45;
    shadowCam.bottom = -45;
    this.scene.add(this.sun, this.sun.target);

    this.trackScene = buildTrackScene(sim.track);
    this.scene.add(this.trackScene.root);
    this.sky = buildSky(palette);
    this.scene.add(this.sky);

    // Language gates, if this race has them.
    if (sim.gateSet) {
      for (const gate of sim.gateSet.gates) {
        const arch = buildGateArch(sim.track, gate, palette);
        this.scene.add(arch.root);
        this.arches.push(arch);
      }
    }

    sim.racers.forEach((racer, index) => {
      const rig = buildBirdRig(birdDef(racer.birdId), RIDER_COLORS[index % RIDER_COLORS.length]);
      this.scene.add(rig.root);
      this.rigs.set(racer.id, rig);
    });

    this.dustMat = new THREE.PointsMaterial({
      size: 1.5,
      map: this.dustTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
      color: palette.groundAlt,
      sizeAttenuation: true,
    });
    const positions = new Float32Array(DUST_MAX * 3);
    // Park unused puffs far below the course rather than at the origin.
    positions.fill(-9999);
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dust = new THREE.Points(this.dustGeo, this.dustMat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
    for (let i = 0; i < DUST_MAX; i += 1) {
      this.puffs.push({ x: -9999, y: -9999, z: -9999, vx: 0, vy: 0, vz: 0, life: 0 });
    }
  }

  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  cycleCamera(): CameraMode {
    this.cameraMode = this.cameraMode === 'chase' ? 'wide' : this.cameraMode === 'wide' ? 'first' : 'chase';
    return this.cameraMode;
  }

  /** Advances every visual system and draws one frame. */
  frame(dt: number): void {
    for (const racer of this.sim.racers) {
      const rig = this.rigs.get(racer.id);
      if (!rig) continue;
      const bird = birdDef(racer.birdId);
      rig.root.position.set(racer.pos.x, racer.y, racer.pos.z);
      rig.root.rotation.y = racer.yaw;
      animateBird(rig, dt, {
        speed: racer.speed,
        topSpeed: bird.topSpeed,
        slip: racer.slip,
        boosting: racer.boost > 0,
        drifting: racer.drifting,
        steer: racer.input.steer,
      });
      this.emitDust(racer, dt);
    }

    this.updateGates();
    this.updateDust(dt);
    this.updateCamera(dt);

    const pulse = 0.65 + Math.sin(performance.now() * 0.006) * 0.25;
    for (const mat of this.trackScene.padMaterials) mat.opacity = pulse;

    const player = this.sim.player;
    this.sun.position.set(player.pos.x + 40, player.y + 70, player.pos.z + 26);
    this.sun.target.position.set(player.pos.x, player.y, player.pos.z);
    this.sun.target.updateMatrixWorld();
    this.sky.position.set(this.camera.position.x, 0, this.camera.position.z);

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Boards always show the question the human is on, so a lapped rival never
   * changes what you are reading as you approach.
   */
  private updateGates(): void {
    const set = this.sim.gateSet;
    if (!set) return;
    const lap = this.sim.player.lap;
    for (const arch of this.arches) {
      if (arch.lap === lap) continue;
      const question = questionFor(set, lap, arch.gate.index);
      if (question) setGateQuestion(arch, question, lap);
    }
  }

  // ── camera ───────────────────────────────────────────────────────────────

  private updateCamera(dt: number): void {
    const player = this.sim.player;
    const bird = birdDef(player.birdId);
    const ratio = Math.min(1.3, player.speed / bird.topSpeed);

    // Frame the bird from behind its travel direction, not its facing, so a
    // drift shows the slide instead of pointing the camera into the wall.
    const behind = player.yaw * 0.65 + player.moveYaw * 0.35;
    let distance = 8.4 + ratio * 3.2;
    let height = 3.9 + ratio * 0.7;
    let lookAhead = 5 + ratio * 5;

    if (this.cameraMode === 'wide') {
      distance = 15 + ratio * 4;
      height = 8.5;
      lookAhead = 6;
    } else if (this.cameraMode === 'first') {
      distance = -0.4;
      height = 2.5;
      lookAhead = 14;
    }

    const target = new THREE.Vector3(
      player.pos.x - Math.sin(behind) * distance,
      player.y + height,
      player.pos.z - Math.cos(behind) * distance,
    );
    const look = new THREE.Vector3(
      player.pos.x + Math.sin(player.yaw) * lookAhead,
      player.y + 1.5,
      player.pos.z + Math.cos(player.yaw) * lookAhead,
    );

    if (!this.booted) {
      this.cameraPos.copy(target);
      this.cameraLook.copy(look);
      this.booted = true;
    }
    // Critically damped follow: snappy at speed, calm on the grid.
    const posLerp = 1 - Math.exp(-(this.cameraMode === 'first' ? 18 : 7.5) * dt);
    const lookLerp = 1 - Math.exp(-9 * dt);
    this.cameraPos.lerp(target, posLerp);
    this.cameraLook.lerp(look, lookLerp);
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraLook);

    // A touch of roll and extra FOV sells speed better than any particle.
    const targetFov = 62 + ratio * 8 + (player.boost > 0 ? 7 : 0);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 4);
    this.camera.rotation.z += player.slip * 0.12;
    this.camera.updateProjectionMatrix();
  }

  // ── dust ─────────────────────────────────────────────────────────────────

  private emitDust(racer: Racer, dt: number): void {
    const sliding = racer.drifting || Math.abs(racer.slip) > 0.18;
    const rate = (racer.offTrack ? 45 : sliding ? 30 : racer.boost > 0 ? 18 : 0) * dt;
    let count = Math.floor(rate);
    if (Math.random() < rate - count) count += 1;

    for (let i = 0; i < count; i += 1) {
      const puff = this.puffs[this.nextPuff];
      this.nextPuff = (this.nextPuff + 1) % DUST_MAX;
      const side = (Math.random() - 0.5) * 1.2;
      puff.x = racer.pos.x - Math.sin(racer.moveYaw) * 0.8 + Math.cos(racer.moveYaw) * side;
      puff.y = racer.y + 0.25;
      puff.z = racer.pos.z - Math.cos(racer.moveYaw) * 0.8 - Math.sin(racer.moveYaw) * side;
      puff.vx = -Math.sin(racer.moveYaw) * racer.speed * 0.14 + (Math.random() - 0.5) * 2.2;
      puff.vy = 1.2 + Math.random() * 1.6;
      puff.vz = -Math.cos(racer.moveYaw) * racer.speed * 0.14 + (Math.random() - 0.5) * 2.2;
      puff.life = 0.55 + Math.random() * 0.35;
    }
  }

  private updateDust(dt: number): void {
    const positions = this.dustGeo.getAttribute('position') as THREE.BufferAttribute;
    const array = positions.array as Float32Array;
    for (let i = 0; i < DUST_MAX; i += 1) {
      const puff = this.puffs[i];
      if (puff.life > 0) {
        puff.life -= dt;
        puff.x += puff.vx * dt;
        puff.y += puff.vy * dt;
        puff.z += puff.vz * dt;
        puff.vy -= 2.4 * dt;
        array[i * 3] = puff.x;
        array[i * 3 + 1] = puff.y;
        array[i * 3 + 2] = puff.z;
      } else {
        array[i * 3] = -9999;
        array[i * 3 + 1] = -9999;
        array[i * 3 + 2] = -9999;
      }
    }
    positions.needsUpdate = true;
  }

  dispose(): void {
    for (const arch of this.arches) arch.dispose();
    this.arches = [];
    for (const rig of this.rigs.values()) disposeBirdRig(rig);
    this.rigs.clear();
    this.trackScene.dispose();
    this.sky.removeFromParent();
    (this.sky.material as THREE.Material).dispose();
    this.sky.geometry.dispose();
    this.dust.removeFromParent();
    this.dustGeo.dispose();
    this.dustMat.dispose();
    this.dustTex.dispose();
    this.renderer.dispose();
  }
}
