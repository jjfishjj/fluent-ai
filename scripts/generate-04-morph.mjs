import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

class NodeFileReader {
  result = null;
  onloadend = null;
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob) {
    const bytes = Buffer.from(await blob.arrayBuffer());
    this.result = `data:${blob.type};base64,${bytes.toString('base64')}`;
    this.onloadend?.();
  }
}
globalThis.FileReader ??= NodeFileReader;

const rings = 96;
const sides = 10;
const positions = [];
const targets = [];
const indices = [];

function digitPoint(digit, t) {
  if (digit === 0) {
    const angle = t * Math.PI * 2;
    return new THREE.Vector3(-.72 + Math.cos(angle) * .58, Math.sin(angle) * 1.05, 0);
  }
  const points = [
    new THREE.Vector3(.25, .2, 0), new THREE.Vector3(.92, 1.08, 0),
    new THREE.Vector3(.92, -1.05, 0), new THREE.Vector3(.92, .18, 0),
    new THREE.Vector3(.18, .18, 0), new THREE.Vector3(.92, 1.08, 0),
  ];
  const scaled = t * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  return points[index].clone().lerp(points[index + 1], scaled - index);
}

for (let digit = 0; digit < 2; digit += 1) {
  const offset = positions.length / 3;
  for (let ring = 0; ring < rings; ring += 1) {
    const t = ring / rings;
    const center = digitPoint(digit, t);
    const next = digitPoint(digit, (t + 1 / rings) % 1);
    const tangent = next.clone().sub(center).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    for (let side = 0; side < sides; side += 1) {
      const angle = side / sides * Math.PI * 2;
      const radius = .115;
      positions.push(center.x + normal.x * Math.cos(angle) * radius, center.y + normal.y * Math.cos(angle) * radius, Math.sin(angle) * radius);

      if (digit === 0) {
        const azimuth = t * Math.PI * 2;
        const latitude = (side / (sides - 1)) * Math.PI * .54;
        const domeRadius = 1.28 * Math.sin(latitude);
        targets.push(Math.cos(azimuth) * domeRadius, .42 + Math.cos(latitude) * 1.05, Math.sin(azimuth) * domeRadius);
      } else {
        const tentacleCount = 6;
        const ringsPerTentacle = rings / tentacleCount;
        const tentacle = Math.min(tentacleCount - 1, Math.floor(ring / ringsPerTentacle));
        const local = (ring % ringsPerTentacle) / (ringsPerTentacle - 1);
        const tentacleAngle = tentacle / tentacleCount * Math.PI * 2;
        const anchorRadius = .58 + (tentacle % 2) * .18;
        const wave = Math.sin(local * Math.PI * 3 + tentacle) * .13;
        const tubeRadius = .07;
        targets.push(
          Math.cos(tentacleAngle) * anchorRadius + wave + Math.cos(angle) * tubeRadius,
          .42 - local * (1.7 + (tentacle % 2) * .38),
          Math.sin(tentacleAngle) * anchorRadius + Math.sin(angle) * tubeRadius,
        );
      }
    }
  }
  for (let ring = 0; ring < rings; ring += 1) {
    if (digit === 1 && (ring + 1) % (rings / 6) === 0) continue;
    const nextRing = digit === 0 ? (ring + 1) % rings : ring + 1;
    if (nextRing >= rings) continue;
    for (let side = 0; side < sides; side += 1) {
      const nextSide = (side + 1) % sides;
      const a = offset + ring * sides + side;
      const b = offset + nextRing * sides + side;
      const c = offset + nextRing * sides + nextSide;
      const d = offset + ring * sides + nextSide;
      indices.push(a, b, d, b, c, d);
    }
  }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setIndex(indices);
geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(targets, 3)];
geometry.morphAttributes.position[0].name = 'Object';
geometry.computeVertexNormals();
geometry.computeBoundingSphere();

const material = new THREE.MeshPhysicalMaterial({ color: '#67e8f9', emissive: '#164e63', emissiveIntensity: .9, metalness: .08, roughness: .12, transmission: .45, transparent: true, opacity: .92 });
const mesh = new THREE.Mesh(geometry, material);
mesh.name = 'MorphMesh';
mesh.updateMorphTargets();
mesh.morphTargetDictionary = { Object: 0 };

const scene = new THREE.Scene();
scene.name = '04_to_Jellyfish';
scene.add(mesh);
const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(scene, { binary: true, onlyVisible: true });
const output = path.resolve('public/models/number-morph/04.glb');
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, Buffer.from(glb));
console.log(`Wrote ${output} (${glb.byteLength} bytes)`);
