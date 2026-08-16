import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/** Blender assets can be enabled one at a time without changing the game scene. */
const morphAsset = (file: string) => `${import.meta.env.BASE_URL}models/number-morph/${file}`;

export const GLB_MORPH_ASSETS: Partial<Record<string, string>> = {
  '04': morphAsset('04.glb'),
  '18': morphAsset('18.glb'),
  '23': morphAsset('23.glb'),
  '31': morphAsset('31.glb'),
  '43': morphAsset('43.glb'),
  '51': morphAsset('51.glb'),
  '64': morphAsset('64.glb'),
  '77': morphAsset('77.glb'),
  '80': morphAsset('80.glb'),
  '94': morphAsset('94.glb'),
};

export function GLBMorphModel({ path, active, speed = 1, animationEnabled = true }: { path: string; active: boolean; speed?: number; animationEnabled?: boolean }) {
  const { scene } = useGLTF(path);
  const clone = useMemo(() => {
    const value = scene.clone(true);
    value.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry = object.geometry.clone();
      const target = object.geometry.morphAttributes.position?.[0];
      if (target) object.userData.baseMorph = new Float32Array(target.array as ArrayLike<number>);
      object.material = Array.isArray(object.material) ? object.material.map((material) => material.clone()) : object.material.clone();
    });
    return value;
  }, [scene]);
  const group = useRef<THREE.Group>(null);

  useEffect(() => () => clone.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material?.dispose());
  }), [clone]);

  useFrame(({ clock }, delta) => {
    delta *= speed;
    if (!group.current) return;
    const elapsed = animationEnabled ? clock.elapsedTime * speed : 0;
    const code = path.match(/(\d{2})\.glb/)?.[1];
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.morphTargetInfluences?.length) return;
      const influence = THREE.MathUtils.damp(object.morphTargetInfluences[0] || 0, active ? 1 : 0, 4.2, delta);
      object.morphTargetInfluences[0] = influence;
      const target = object.geometry.morphAttributes.position?.[0] as THREE.BufferAttribute | undefined;
      const source = object.userData.baseMorph as Float32Array | undefined;
      if (active && animationEnabled && target && source && (code === '18' || code === '23')) {
        for (let index = 0; index < target.count; index += 1) {
          const offset = index * 3;
          const x = source[offset]; const y = source[offset + 1]; const z = source[offset + 2];
          if (code === '18') {
            const wave = Math.sin(elapsed * 2.8 + x * 5 + z * 4) * .055 * influence;
            target.setXYZ(index, x + Math.sin(elapsed + z * 3) * .025 * influence, y + wave, z);
          } else {
            const robe = THREE.MathUtils.smoothstep(-y, -.1, 1.2);
            const sway = Math.sin(elapsed * 2.1 + (-y) * 2.4) * .075 * robe * influence;
            const haloPulse = y > .45 ? 1 + Math.sin(elapsed * 3.2) * .055 * influence : 1;
            target.setXYZ(index, x * haloPulse + sway, y, z * haloPulse);
          }
        }
        target.needsUpdate = true;
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        if (code === '23' && active) material.emissiveIntensity = .45 + (Math.sin(elapsed * 3.2) + 1) * .55;
        if (code === '18' && active) material.roughness = .76 + Math.sin(elapsed * 2.2) * .1;
      });
    });
    if (animationEnabled) group.current.rotation.y += delta * .18;
  });

  return <group ref={group}><primitive object={clone} /></group>;
}

Object.values(GLB_MORPH_ASSETS).forEach((path) => path && useGLTF.preload(path));
