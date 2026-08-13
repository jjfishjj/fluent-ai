import * as THREE from 'three';
import type { Gate, GateQuestion } from '../core/gates';
import { laneBoundaries, laneCenter } from '../core/gates';
import { pointAt } from '../core/track';
import type { Track, TrackPalette } from '../core/types';

/**
 * A language gate as it stands on the track: an arch with one signboard per
 * lane. The boards are canvas textures redrawn whenever the question changes,
 * which is how a lap's worth of vocabulary gets onto the road itself.
 */
export interface GateArch {
  gate: Gate;
  root: THREE.Group;
  boards: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial }[];
  /** Which lap's question is currently painted on the boards. */
  lap: number;
  dispose(): void;
}

/**
 * Draws one lane board. Every board looks identical on purpose — nothing about
 * the sign may hint at which lane is the right answer.
 */
function boardTexture(text: string, sub: string | undefined): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(14,18,28,0.92)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, width - 10, height - 10);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';

  // Shrink to fit rather than clip: some answers are long phrases.
  let size = sub ? 92 : 104;
  const font = (px: number) => `800 ${px}px "Noto Sans", "Hiragino Sans", "Microsoft JhengHei", system-ui, sans-serif`;
  ctx.font = font(size);
  while (ctx.measureText(text).width > width - 60 && size > 34) {
    size -= 6;
    ctx.font = font(size);
  }
  ctx.fillText(text, width / 2, sub ? height / 2 - 26 : height / 2);

  if (sub) {
    ctx.font = `600 44px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    let subSize = 44;
    while (ctx.measureText(sub).width > width - 80 && subSize > 20) {
      subSize -= 4;
      ctx.font = `600 ${subSize}px system-ui, sans-serif`;
    }
    ctx.fillText(sub, width / 2, height / 2 + 62);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildGateArch(track: Track, gate: Gate, palette: TrackPalette): GateArch {
  const point = pointAt(track, gate.s);
  const half = point.halfWidth;

  const root = new THREE.Group();
  root.position.set(point.pos.x, point.y, point.pos.z);
  root.rotation.y = point.yaw;

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const keep = <T extends THREE.BufferGeometry>(g: T): T => (geometries.push(g), g);

  const postMat = new THREE.MeshLambertMaterial({ color: 0x2c3444 });
  const barMat = new THREE.MeshLambertMaterial({ color: palette.roadEdge });
  materials.push(postMat, barMat);

  const postGeo = keep(new THREE.CylinderGeometry(0.32, 0.4, 6.4, 8));
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(side * (half + 1.2), 3.2, 0);
    post.castShadow = true;
    root.add(post);
  }
  const bar = new THREE.Mesh(keep(new THREE.BoxGeometry((half + 1.4) * 2, 0.45, 0.4)), barMat);
  bar.position.y = 6.3;
  root.add(bar);

  // Lane dividers, standing exactly on the boundaries the sim grades against.
  // Local +X is the driver's left, so lateral offsets are negated here.
  const dividerGeo = keep(new THREE.BoxGeometry(0.16, 4.6, 0.16));
  for (const at of laneBoundaries(half)) {
    const divider = new THREE.Mesh(dividerGeo, postMat);
    divider.position.set(-at, 2.3, 0);
    root.add(divider);
  }

  const boardWidth = (half * 2) / 3 - 0.5;
  const boardGeo = keep(new THREE.PlaneGeometry(boardWidth, boardWidth * 0.5));
  const boards = [0, 1, 2].map((lane) => {
    const material = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
    materials.push(material);
    const mesh = new THREE.Mesh(boardGeo, material);
    mesh.position.set(-laneCenter(half, lane), 4.5, 0);
    // Face oncoming traffic, or the labels read back to front.
    mesh.rotation.y = Math.PI;
    root.add(mesh);
    return { mesh, material };
  });

  return {
    gate,
    root,
    boards,
    lap: -1,
    dispose() {
      root.removeFromParent();
      for (const geo of geometries) geo.dispose();
      for (const material of materials) {
        const map = (material as THREE.MeshBasicMaterial).map;
        map?.dispose();
        material.dispose();
      }
    },
  };
}

/** Repaints an arch for a new question; disposes the textures it replaces. */
export function setGateQuestion(arch: GateArch, question: GateQuestion, lap: number): void {
  arch.lap = lap;
  arch.boards.forEach((board, index) => {
    const lane = question.lanes[index];
    board.material.map?.dispose();
    board.material.map = lane ? boardTexture(lane.text, lane.sub) : null;
    board.material.needsUpdate = true;
    board.mesh.visible = !!lane;
  });
}
