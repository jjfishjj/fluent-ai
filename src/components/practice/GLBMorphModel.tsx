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
  const code = path.match(/(\d{2})\.glb/)?.[1];
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
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.morphTargetInfluences?.length) return;
      const influence = THREE.MathUtils.damp(object.morphTargetInfluences[0] || 0, active ? 1 : 0, 4.2, delta);
      object.morphTargetInfluences[0] = influence;
      const target = object.geometry.morphAttributes.position?.[0] as THREE.BufferAttribute | undefined;
      const source = object.userData.baseMorph as Float32Array | undefined;
      if (active && animationEnabled && target && source && ['18', '23', '31', '43'].includes(code || '')) {
        for (let index = 0; index < target.count; index += 1) {
          const offset = index * 3;
          const x = source[offset]; const y = source[offset + 1]; const z = source[offset + 2];
          if (code === '18') {
            const wave = Math.sin(elapsed * 2.8 + x * 5 + z * 4) * .055 * influence;
            target.setXYZ(index, x + Math.sin(elapsed + z * 3) * .025 * influence, y + wave, z);
          } else if (code === '23') {
            const robe = THREE.MathUtils.smoothstep(-y, -.1, 1.2);
            const sway = Math.sin(elapsed * 2.1 + (-y) * 2.4) * .075 * robe * influence;
            const haloPulse = y > .45 ? 1 + Math.sin(elapsed * 3.2) * .055 * influence : 1;
            target.setXYZ(index, x * haloPulse + sway, y, z * haloPulse);
          } else if (code === '31') {
            const tailWeight = THREE.MathUtils.smoothstep(x, .15, 1.1);
            const swim = Math.sin(elapsed * 5.2 + x * 2.4) * .18 * tailWeight * influence;
            target.setXYZ(index, x, y + swim, z + Math.cos(elapsed * 5.2 + x * 2.4) * .06 * tailWeight * influence);
          } else {
            const crumble = Math.max(0, Math.sin(elapsed * 1.8 + x * 5 + y * 2)) * .045 * influence;
            target.setXYZ(index, x + Math.sin(x * 11) * crumble, y + crumble, z + Math.cos(z * 9) * crumble);
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
    if (animationEnabled) group.current.rotation.y += delta * (code === '31' ? .34 : .18);
    if (code === '31' && active && animationEnabled) {
      const charge = (Math.sin(elapsed * .95) + 1) / 2;
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, charge > .86 ? 1.15 : 0, 5, delta);
      group.current.position.y = Math.sin(elapsed * 1.8) * .1;
    } else {
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, 0, 5, delta);
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, 0, 5, delta);
    }
  });

  return <group ref={group}><primitive object={clone} />{code === '31' && <SharkEffects active={active} animationEnabled={animationEnabled} />}{code === '43' && <MountainEffects active={active} animationEnabled={animationEnabled} />}</group>;
}

function SharkEffects({ active, animationEnabled }: { active: boolean; animationEnabled: boolean }) {
  const water = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!water.current) return;
    const pulse = active && animationEnabled ? (clock.elapsedTime * .75) % 1 : 0;
    water.current.scale.setScalar(.65 + pulse * 1.25);
    water.current.rotation.z = clock.elapsedTime * .35;
    water.current.children.forEach((child) => { const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial; material.opacity = active ? Math.max(.05, .48 * (1 - pulse)) : 0; });
  });
  return <group ref={water} rotation={[Math.PI / 2, 0, 0]} position={[0, -.15, -.15]}><mesh><torusGeometry args={[1.05, .025, 8, 56]} /><meshBasicMaterial color="#67e8f9" transparent opacity={0} /></mesh><mesh scale={.72}><torusGeometry args={[1.05, .018, 8, 56]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0} /></mesh></group>;
}

const DEBRIS = [[-.82,.05,.2],[.7,-.22,.1],[-.25,.72,-.1],[.36,.42,.25],[.95,.3,-.2],[-.62,-.48,-.1]] as const;
function MountainEffects({ active, animationEnabled }: { active: boolean; animationEnabled: boolean }) {
  const debris = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!debris.current) return;
    const elapsed = clock.elapsedTime;
    debris.current.children.forEach((piece, index) => {
      const burst = active && animationEnabled ? (elapsed * .52 + index * .13) % 1 : 0;
      piece.position.y = DEBRIS[index][1] + burst * .7;
      piece.position.x = DEBRIS[index][0] + Math.sin(elapsed * 2 + index) * burst * .18;
      piece.rotation.x = elapsed * (index + 1) * .32;
      piece.rotation.z = elapsed * .45;
      piece.scale.setScalar(active ? Math.max(.15, 1 - burst * .72) : 0);
    });
  });
  return <group ref={debris}>{DEBRIS.map((position, index) => <mesh key={index} position={position}><dodecahedronGeometry args={[.075 + index * .008, 0]} /><meshStandardMaterial color="#78716c" roughness={.95} emissive="#292524" emissiveIntensity={.25} /></mesh>)}</group>;
}

Object.values(GLB_MORPH_ASSETS).forEach((path) => path && useGLTF.preload(path));
