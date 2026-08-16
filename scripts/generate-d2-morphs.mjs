import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

class NodeFileReader {
  result = null;
  onloadend = null;
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
  async readAsDataURL(blob) { this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`; this.onloadend?.(); }
}
globalThis.FileReader ??= NodeFileReader;

const rings = 120;
const sides = 12;
const digitCurves = {
  1: (t) => new THREE.Vector3(-.18 + .34 * Math.min(1, t * 4), 1.05 - 2.1 * t, 0),
  2: (t) => t < .52
    ? new THREE.Vector3(Math.cos(Math.PI * (1.05 - t / .52)) * .57, .52 + Math.sin(Math.PI * (1.05 - t / .52)) * .55, 0)
    : new THREE.Vector3(.55 - 1.1 * ((t - .52) / .48), .42 - 1.47 * ((t - .52) / .48), 0),
  3: (t) => {
    const upper = t < .5;
    const u = upper ? t * 2 : (t - .5) * 2;
    const a = Math.PI * (.55 - 1.12 * u);
    return new THREE.Vector3(-.12 + Math.cos(a) * .62, (upper ? .52 : -.52) + Math.sin(a) * .53, 0);
  },
  8: (t) => new THREE.Vector3(Math.sin(t * Math.PI * 2) * .54, Math.sin(t * Math.PI * 4) * .56, 0),
};

function basisPoint(digit, t, xOffset) { return digitCurves[digit](t).add(new THREE.Vector3(xOffset, 0, 0)); }

function mudTarget(digitIndex, t, sideAngle) {
  const a = t * Math.PI * 2 + digitIndex * .7;
  const radius = digitIndex === 0 ? .9 : .68;
  const ripple = .12 * Math.sin(a * 5 + digitIndex);
  const tube = .105 + .025 * Math.sin(a * 3);
  return new THREE.Vector3(Math.cos(a) * (radius + ripple) + Math.cos(sideAngle) * tube, -.68 + .13 * Math.sin(a * 2) + Math.sin(sideAngle) * tube * .45, Math.sin(a) * (.55 + digitIndex * .12) + Math.sin(sideAngle) * tube);
}

function monkTarget(digitIndex, t, sideAngle) {
  const tube = .095;
  if (digitIndex === 0) {
    const a = t * Math.PI * 2;
    const width = .35 + t * .72;
    return new THREE.Vector3(Math.cos(a) * width + Math.cos(sideAngle) * tube, .25 - t * 1.45 + Math.sin(a * 2) * .08, Math.sin(a) * .24 + Math.sin(sideAngle) * tube);
  }
  const a = t * Math.PI * 2;
  const halo = t > .62;
  const radius = halo ? .53 : .38;
  return new THREE.Vector3(Math.cos(a) * radius + Math.cos(sideAngle) * tube, .62 + Math.sin(a) * radius + Math.sin(sideAngle) * tube, halo ? -.1 + Math.sin(a) * .08 : .02 + Math.sin(sideAngle) * tube);
}

function createGeometry(code, targetPoint) {
  const positions = [];
  const targets = [];
  const indices = [];
  [...code].forEach((digitText, digitIndex) => {
    const digit = Number(digitText);
    const offset = positions.length / 3;
    const xOffset = digitIndex === 0 ? -.68 : .68;
    for (let ring = 0; ring < rings; ring += 1) {
      const t = ring / (rings - 1);
      const center = basisPoint(digit, t, xOffset);
      const next = basisPoint(digit, Math.min(1, t + 1 / rings), xOffset);
      const tangent = next.clone().sub(center).normalize();
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
      for (let side = 0; side < sides; side += 1) {
        const angle = side / sides * Math.PI * 2;
        const radius = .105;
        positions.push(center.x + normal.x * Math.cos(angle) * radius, center.y + normal.y * Math.cos(angle) * radius, Math.sin(angle) * radius);
        targets.push(...targetPoint(digitIndex, t, angle).toArray());
      }
    }
    for (let ring = 0; ring < rings - 1; ring += 1) {
      for (let side = 0; side < sides; side += 1) {
        const nextSide = (side + 1) % sides;
        const a = offset + ring * sides + side;
        const b = offset + (ring + 1) * sides + side;
        const c = offset + (ring + 1) * sides + nextSide;
        const d = offset + ring * sides + nextSide;
        indices.push(a, b, d, b, c, d);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(targets, 3)];
  geometry.morphAttributes.position[0].name = 'Object';
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  if (positions.length !== targets.length) throw new Error(`${code}: Basis and Object vertex counts differ`);
  return geometry;
}

const assets = [
  { code: '18', name: 'Mud', target: mudTarget, material: { color: '#92400e', emissive: '#451a03', roughness: .92, metalness: 0 } },
  { code: '23', name: 'Monk', target: monkTarget, material: { color: '#f59e0b', emissive: '#7c2d12', roughness: .38, metalness: .08 } },
];

for (const asset of assets) {
  const geometry = createGeometry(asset.code, asset.target);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ ...asset.material, emissiveIntensity: .45, clearcoat: .18 }));
  mesh.name = 'MorphMesh';
  mesh.updateMorphTargets();
  mesh.morphTargetDictionary = { Object: 0 };
  const scene = new THREE.Scene();
  scene.name = `${asset.code}_to_${asset.name}`;
  scene.add(mesh);
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true });
  const output = path.resolve(`public/models/number-morph/${asset.code}.glb`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, Buffer.from(glb));
  console.log(`Wrote ${output} (${glb.byteLength} bytes, ${geometry.attributes.position.count} vertices)`);
}
