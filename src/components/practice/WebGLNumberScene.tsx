import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, OrbitControls, Sparkles, Stars, Text3D } from '@react-three/drei';
import * as THREE from 'three';
import helvetiker from 'three/examples/fonts/helvetiker_bold.typeface.json';
import { GLBMorphModel, GLB_MORPH_ASSETS } from './GLBMorphModel';

type SceneRound = {
  code: string;
  word: string;
  palette: string;
};

type Props = {
  round: SceneRound;
  submitted: boolean;
  combo: number;
  quality: 'low' | 'high';
  recallMode?: boolean;
  morphSpeed?: number;
  animationEnabled?: boolean;
};

const MORPH_GEOMETRY_CACHE = new Map<string, THREE.BufferGeometry>();

function cachedMorphGeometry(code: string) {
  const cached = MORPH_GEOMETRY_CACHE.get(code);
  if (cached) return cached;
  const geometry = new THREE.IcosahedronGeometry(1.08, 4);
  const source = geometry.attributes.position.array as Float32Array;
  const target = new Float32Array(source.length);
  const seed = Number(code) * .017 + 1;
  for (let index = 0; index < source.length; index += 3) {
    const vector = new THREE.Vector3(source[index], source[index + 1], source[index + 2]);
    const radius = 1 + Math.sin((vector.x * 4 + vector.y * 5 + vector.z * 3 + seed) * Math.PI) * .34;
    vector.normalize().multiplyScalar(radius);
    target[index] = vector.x * (1 + Number(code[0]) * .025);
    target[index + 1] = vector.y * (1 + Number(code[1]) * .025);
    target[index + 2] = vector.z;
  }
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(target, 3)];
  geometry.computeVertexNormals();
  MORPH_GEOMETRY_CACHE.set(code, geometry);
  return geometry;
}

function CameraRig({ submitted, combo, speed }: { submitted: boolean; combo: number; speed: number }) {
  const { camera } = useThree();
  const impulse = useRef(0);

  useEffect(() => {
    if (submitted) impulse.current = combo > 1 ? .55 : .35;
  }, [submitted, combo]);

  useFrame((state, delta) => {
    delta *= speed;
    const targetZ = submitted ? 7.1 : 8.4;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 3.8, delta);
    if (impulse.current > .002) {
      camera.position.x = Math.sin(state.clock.elapsedTime * 52) * impulse.current;
      camera.position.y = Math.cos(state.clock.elapsedTime * 43) * impulse.current * .45;
      impulse.current = THREE.MathUtils.damp(impulse.current, 0, 8, delta);
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 6, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, .15, 6, delta);
    }
  });
  return null;
}

function NumberSculpture({ round, submitted, speed }: { round: SceneRound; submitted: boolean; speed: number }) {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: round.palette,
    emissive: round.palette,
    emissiveIntensity: .28,
    metalness: .35,
    roughness: .12,
    transmission: .28,
    thickness: .8,
    clearcoat: 1,
    clearcoatRoughness: .12,
  }), [round.palette]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    delta *= speed;
    if (!group.current) return;
    const target = submitted ? .001 : 1;
    const next = THREE.MathUtils.damp(group.current.scale.x, target, submitted ? 8 : 5, delta);
    group.current.scale.setScalar(next);
    group.current.rotation.y += delta * .32;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * .65) * .08;
  });

  return (
    <group ref={group} position={[-1.35, -.92, 0]}>
      <Float speed={1.8} rotationIntensity={.18} floatIntensity={.32}>
        <Text3D font={helvetiker} size={2.45} height={.65} curveSegments={12} bevelEnabled bevelThickness={.055} bevelSize={.035} bevelSegments={5} material={material}>
          {round.code}
        </Text3D>
      </Float>
    </group>
  );
}

function Jellyfish({ color }: { color: string }) {
  return (
    <group>
      <mesh scale={[1.25, .72, 1.25]}>
        <sphereGeometry args={[1.2, 48, 32, 0, Math.PI * 2, 0, Math.PI * .57]} />
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={.42} transmission={.78} thickness={1.5} roughness={.08} transparent opacity={.88} />
      </mesh>
      {[-.72, -.38, 0, .38, .72].map((x, index) => (
        <mesh key={x} position={[x, -1.12, 0]} rotation={[0, 0, (index - 2) * .07]}>
          <capsuleGeometry args={[.075, 1.35 + (index % 2) * .35, 8, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={.65} transparent opacity={.72} />
        </mesh>
      ))}
    </group>
  );
}

function MudForm({ color }: { color: string }) {
  return <group>{[[-.75,0,.1,.82],[.35,.05,0,1.05],[.92,-.22,.15,.58],[-.15,-.62,.2,.7]].map(([x,y,z,s], index) => <mesh key={index} position={[x,y,z]} scale={[s,s*.7,s]}><icosahedronGeometry args={[.9,4]} /><meshStandardMaterial color={color} roughness={.92} metalness={.02} /></mesh>)}</group>;
}

function Monk({ color }: { color: string }) {
  return <group><mesh position={[0,.82,0]}><sphereGeometry args={[.48,32,24]} /><meshStandardMaterial color={color} metalness={.75} roughness={.22} /></mesh><mesh position={[0,-.15,0]} scale={[1,.9,.58]}><sphereGeometry args={[1,32,24]} /><meshStandardMaterial color={color} metalness={.7} roughness={.25} /></mesh><mesh position={[-.75,-.85,0]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.65,.25,16,40,Math.PI]} /><meshStandardMaterial color={color} metalness={.7} roughness={.25} /></mesh><mesh position={[.75,-.85,0]} rotation={[0,0,-Math.PI/2]}><torusGeometry args={[.65,.25,16,40,Math.PI]} /><meshStandardMaterial color={color} metalness={.7} roughness={.25} /></mesh></group>;
}

function Shark({ color }: { color: string }) {
  return <group rotation={[0,0,-.08]}><mesh scale={[1.65,.58,.62]}><sphereGeometry args={[1,40,24]} /><meshStandardMaterial color={color} metalness={.7} roughness={.18} /></mesh><mesh position={[-1.7,0,0]} rotation={[0,0,Math.PI/2]}><coneGeometry args={[.75,1.3,3]} /><meshStandardMaterial color={color} metalness={.7} roughness={.18} /></mesh><mesh position={[0,.72,0]} rotation={[0,0,.15]}><coneGeometry args={[.48,.9,3]} /><meshStandardMaterial color={color} metalness={.7} roughness={.18} /></mesh><mesh position={[1.35,.08,0]} rotation={[0,0,-Math.PI/2]}><coneGeometry args={[.35,.7,24]} /><meshStandardMaterial color="#dbeafe" /></mesh></group>;
}

function Mountains({ color }: { color: string }) {
  return <group position={[0,-.65,0]}>{[[-.75,1.55],[.55,2.15],[1.15,1.2]].map(([x,h],i)=><mesh key={i} position={[x,h/2,0]}><coneGeometry args={[h*.62,h,5]} /><meshStandardMaterial color={color} roughness={.7} metalness={.25} flatShading /></mesh>)}</group>;
}

function Fox({ color }: { color: string }) {
  return <group><mesh scale={[1.25,.65,.62]}><sphereGeometry args={[1,32,20]} /><meshStandardMaterial color={color} roughness={.72} /></mesh><mesh position={[1.18,.35,0]}><sphereGeometry args={[.58,28,18]} /><meshStandardMaterial color={color} roughness={.72} /></mesh>{[-.28,.28].map((z)=><mesh key={z} position={[1.25,.94,z]} rotation={[0,0,z>0?-.18:.18]}><coneGeometry args={[.22,.65,4]} /><meshStandardMaterial color={color} /></mesh>)}<mesh position={[-1.35,.22,0]} rotation={[0,0,-1.05]}><torusGeometry args={[.75,.22,14,36,Math.PI*1.45]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>{[-.72,-.28,.35,.75].map((x)=><mesh key={x} position={[x,-.72,0]}><capsuleGeometry args={[.12,.72,6,12]} /><meshStandardMaterial color={color} /></mesh>)}</group>;
}

function Lawyer({ color }: { color: string }) {
  return <group><mesh position={[0,-.15,0]}><cylinderGeometry args={[.09,.09,3.1,18]} /><meshStandardMaterial color={color} metalness={.8} /></mesh><mesh position={[0,1.38,0]}><boxGeometry args={[2.8,.12,.18]} /><meshStandardMaterial color={color} metalness={.8} /></mesh>{[-1.15,1.15].map((x)=><group key={x} position={[x,.55,0]}><mesh><cylinderGeometry args={[.025,.025,1.6,12]} /><meshStandardMaterial color={color} /></mesh><mesh position={[0,-.86,0]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.52,.18,32]} /><meshStandardMaterial color={color} metalness={.7} /></mesh></group>)}<mesh position={[0,-1.65,0]}><cylinderGeometry args={[.85,1.05,.22,32]} /><meshStandardMaterial color={color} metalness={.65} /></mesh></group>;
}

function Robot({ color }: { color: string }) {
  return <group><mesh position={[0,.95,0]}><boxGeometry args={[1.15,.85,.78]} /><meshStandardMaterial color={color} metalness={.88} roughness={.16} /></mesh><mesh position={[0,-.15,0]}><boxGeometry args={[1.65,1.25,.85]} /><meshStandardMaterial color={color} metalness={.88} roughness={.16} /></mesh>{[-1.12,1.12].map((x)=><mesh key={`a${x}`} position={[x,-.05,0]}><capsuleGeometry args={[.16,1.05,6,12]} /><meshStandardMaterial color={color} metalness={.9} /></mesh>)}{[-.48,.48].map((x)=><mesh key={`l${x}`} position={[x,-1.35,0]}><capsuleGeometry args={[.19,1.05,6,12]} /><meshStandardMaterial color={color} metalness={.9} /></mesh>)}{[-.26,.26].map((x)=><mesh key={`e${x}`} position={[x,1.02,.42]}><sphereGeometry args={[.1,16,12]} /><meshBasicMaterial color="#e0ffff" /></mesh>)}</group>;
}

function EiffelTower({ color }: { color: string }) {
  return <group position={[0,-1.2,0]}>{[0,.7,1.4].map((y,i)=><mesh key={y} position={[0,y,0]}><boxGeometry args={[2.35-i*.62,.08,.72-i*.18]} /><meshStandardMaterial color={color} metalness={.85} wireframe /></mesh>)}{[-1,1].map((side)=><mesh key={side} position={[side*.55,1.05,0]} rotation={[0,0,side*-.24]}><cylinderGeometry args={[.07,.16,3.8,8]} /><meshStandardMaterial color={color} metalness={.9} /></mesh>)}<mesh position={[0,2.35,0]}><coneGeometry args={[.52,2.1,8]} /><meshStandardMaterial color={color} metalness={.9} wireframe /></mesh><pointLight position={[0,3.45,0]} color={color} intensity={12} /></group>;
}

function Teacher({ color }: { color: string }) {
  return <group><mesh position={[0,.75,0]}><sphereGeometry args={[.48,28,20]} /><meshStandardMaterial color={color} roughness={.55} /></mesh><mesh position={[0,-.25,0]}><capsuleGeometry args={[.58,1.25,8,20]} /><meshStandardMaterial color={color} roughness={.55} /></mesh><mesh position={[1.05,.1,0]} rotation={[0,0,-.72]}><cylinderGeometry args={[.035,.035,2.1,12]} /><meshStandardMaterial color="#fef3c7" /></mesh><mesh position={[-1.25,.15,-.35]} rotation={[0,.22,0]}><boxGeometry args={[1.1,1.45,.08]} /><meshStandardMaterial color="#163b36" roughness={.9} /></mesh></group>;
}

function MorphTargetCore({ round, active, speed }: { round: SceneRound; active: boolean; speed: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => cachedMorphGeometry(round.code), [round.code]);
  useLayoutEffect(() => {
    // R3F attaches a reused BufferGeometry after the mesh is constructed, so
    // Three.js does not automatically create morphTargetInfluences for it.
    mesh.current?.updateMorphTargets();
  }, [geometry]);
  useFrame((state, delta) => {
    delta *= speed;
    if (!mesh.current?.morphTargetInfluences) return;
    const target = active ? 1 : 0;
    mesh.current.morphTargetInfluences[0] = THREE.MathUtils.damp(mesh.current.morphTargetInfluences[0] || 0, target, 3.8, delta);
    mesh.current.rotation.x = state.clock.elapsedTime * .35;
    mesh.current.rotation.y = state.clock.elapsedTime * .5;
    const material = mesh.current.material as THREE.MeshPhysicalMaterial;
    material.opacity = active ? Math.max(.08, 1 - (mesh.current.morphTargetInfluences[0] || 0) * .82) : 0;
  });
  return <mesh ref={mesh} geometry={geometry} scale={1.55}><meshPhysicalMaterial color={round.palette} emissive={round.palette} emissiveIntensity={.75} wireframe transparent opacity={0} depthWrite={false} /></mesh>;
}

function ProceduralMorphObject({ round, submitted, speed }: { round: SceneRound; submitted: boolean; speed: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    delta *= speed;
    if (!group.current) return;
    const target = submitted ? 1 : .001;
    const scale = THREE.MathUtils.damp(group.current.scale.x, target, submitted ? 4.8 : 12, delta);
    group.current.scale.setScalar(scale);
    group.current.rotation.y += delta * (round.word === '鯊魚' ? .7 : .22);
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * .16;
  });
  const form = round.word === '水母' ? <Jellyfish color={round.palette} />
    : round.word === '泥巴' ? <MudForm color={round.palette} />
      : round.word === '和尚' ? <Monk color={round.palette} />
        : round.word === '鯊魚' ? <Shark color={round.palette} />
          : round.word === '石山' ? <Mountains color={round.palette} />
            : round.word === '狐狸' ? <Fox color={round.palette} />
              : round.word === '律師' ? <Lawyer color={round.palette} />
                : round.word === '機器人' ? <Robot color={round.palette} />
                  : round.word === '巴黎鐵塔' ? <EiffelTower color={round.palette} />
                    : <Teacher color={round.palette} />;
  return <group ref={group} scale={.001}>{form}</group>;
}

function MorphObject({ round, submitted, speed, animationEnabled }: { round: SceneRound; submitted: boolean; speed: number; animationEnabled: boolean }) {
  const glbPath = GLB_MORPH_ASSETS[round.code];
  return glbPath ? <GLBMorphModel path={glbPath} active={submitted} speed={speed} animationEnabled={animationEnabled} /> : <ProceduralMorphObject round={round} submitted={submitted} speed={animationEnabled ? speed : 0} />;
}

function ParticleBurst({ color, active, speed }: { color: string; active: boolean; speed: number }) {
  const points = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const positions = new Float32Array(360 * 3);
    const directions = new Float32Array(360 * 3);
    for (let i = 0; i < 360; i += 1) {
      const direction = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize();
      directions.set([direction.x, direction.y, direction.z], i * 3);
    }
    return { positions, directions };
  }, []);
  const progress = useRef(0);
  useEffect(() => { if (active) progress.current = .001; }, [active]);
  useFrame((_, delta) => {
    delta *= speed;
    if (!points.current || progress.current <= 0) return;
    progress.current = Math.min(1.5, progress.current + delta * 1.35);
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 360; i += 1) {
      const distance = Math.sin(Math.min(1, progress.current) * Math.PI / 2) * (2.4 + (i % 9) * .12);
      positions[i * 3] = data.directions[i * 3] * distance;
      positions[i * 3 + 1] = data.directions[i * 3 + 1] * distance;
      positions[i * 3 + 2] = data.directions[i * 3 + 2] * distance;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    (points.current.material as THREE.PointsMaterial).opacity = Math.max(0, 1.25 - progress.current);
  });
  return <points ref={points} visible={active}><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.positions, 3]} /></bufferGeometry><pointsMaterial color={color} size={.055} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

function FrameLimiter({ quality }: { quality: 'low' | 'high' }) {
  const { invalidate } = useThree();
  useEffect(() => {
    if (quality === 'high') return;
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [invalidate, quality]);
  return null;
}

function Scene({ round, submitted, combo, quality, recallMode, morphSpeed = 1, animationEnabled = true }: Props) {
  const speed = morphSpeed;
  return <>
    <color attach="background" args={['#050a18']} />
    <fog attach="fog" args={['#050a18', 7, 19]} />
    <ambientLight intensity={.35} />
    <hemisphereLight args={['#c4f1ff', '#110822', 1.25]} />
    <spotLight position={[4, 7, 5]} color={round.palette} intensity={55} angle={.48} penumbra={.8} castShadow />
    <pointLight position={[-4, -2, 3]} color="#a855f7" intensity={18} />
    <Stars radius={40} depth={18} count={quality === 'low' ? 450 : 1400} factor={2.2} saturation={.25} fade speed={.35} />
    <Sparkles count={quality === 'low' ? 28 : 90} scale={8} size={2} speed={.35} color={round.palette} opacity={.38} />
    {!recallMode && <NumberSculpture round={round} submitted={submitted} speed={speed} />}
    <MorphTargetCore round={round} active={submitted && !recallMode} speed={speed} />
    <MorphObject round={round} submitted={submitted} speed={speed} animationEnabled={animationEnabled} />
    <ParticleBurst color={round.palette} active={submitted && !recallMode} speed={speed} />
    <mesh position={[0, -2.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 18, 24, 24]} />
      <meshStandardMaterial color="#071225" metalness={.65} roughness={.38} transparent opacity={.78} wireframe />
    </mesh>
    <CameraRig submitted={submitted} combo={combo} speed={animationEnabled ? speed : 0} />
    <FrameLimiter quality={quality} />
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI * .28} maxPolarAngle={Math.PI * .7} rotateSpeed={.65} />
  </>;
}

export function WebGLNumberScene(props: Props) {
  return (
    <Canvas dpr={props.quality === 'low' ? 1 : [1, 1.65]} frameloop={props.quality === 'low' ? 'demand' : 'always'} camera={{ position: [0, .15, 8.4], fov: 42 }} gl={{ antialias: props.quality === 'high', alpha: false, powerPreference: props.quality === 'low' ? 'low-power' : 'high-performance' }} shadows={props.quality === 'high'}>
      <Suspense fallback={null}><Scene {...props} /></Suspense>
    </Canvas>
  );
}
