import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

class NodeFileReader { result=null; onloadend=null; async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();} async readAsDataURL(blob){this.result=`data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;this.onloadend?.();} }
globalThis.FileReader ??= NodeFileReader;

const rings = 120;
const sides = 12;
const curves = {
  1: (t) => new THREE.Vector3(0, 1.05 - t * 2.1, 0),
  3: (t) => { const a = -Math.PI / 2 + t * Math.PI * 4; return new THREE.Vector3(Math.cos(a) * .48 - .08, (t < .5 ? .52 : -.52) + Math.sin(a) * .49, 0); },
  4: (t) => { const q=[[-.5,.2],[.2,1.05],[.2,-1.05],[.2,.2],[-.5,.2],[.2,1.05]],s=t*(q.length-1),i=Math.min(q.length-2,Math.floor(s));return new THREE.Vector3(q[i][0],q[i][1],0).lerp(new THREE.Vector3(q[i+1][0],q[i+1][1],0),s-i); },
};

function shark(part, t, angle) {
  const tube = .08;
  if (part === 0) {
    const x = -1.25 + t * 2.25;
    const profile = Math.sin(t * Math.PI);
    return new THREE.Vector3(x, Math.sin(t * Math.PI * 2) * .06 + Math.cos(angle) * profile * .48, Math.sin(angle) * profile * .34);
  }
  if (t < .55) {
    const u = t / .55;
    return new THREE.Vector3(1 - u * .45, (u - .5) * 1.25, Math.sin(angle) * tube);
  }
  const u = (t - .55) / .45;
  return new THREE.Vector3(-.05 + u * .45, .18 + Math.sin(u * Math.PI) * .72, Math.sin(angle) * tube);
}

function mountain(part, t, angle) {
  const ridge = part === 0 ? [[-1.2,-.85],[-.62,.35],[-.2,-.2],[.2,1.1],[.62,-.12],[1.15,-.85]] : [[-1.05,-.45],[-.55,.05],[-.1,-.55],[.52,.55],[1.08,-.5]];
  const s = t * (ridge.length - 1);
  const i = Math.min(ridge.length - 2, Math.floor(s));
  const u = s - i;
  const x = THREE.MathUtils.lerp(ridge[i][0], ridge[i + 1][0], u);
  const y = THREE.MathUtils.lerp(ridge[i][1], ridge[i + 1][1], u);
  const depth = part === 0 ? .18 : -.28;
  return new THREE.Vector3(x, y, depth + Math.sin(angle) * .105);
}

function geometry(code, target) {
  const positions=[]; const morph=[]; const indices=[];
  [...code].forEach((digit, part) => {
    const base=positions.length/3; const offset=part ? .68 : -.68;
    for(let ring=0; ring<rings; ring++) {
      const t=ring/(rings-1); const point=curves[digit](t).add(new THREE.Vector3(offset,0,0));
      const tangent=curves[digit](Math.min(1,t+1/rings)).sub(curves[digit](t)).normalize();
      const normal=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();
      for(let side=0; side<sides; side++) { const angle=side/sides*Math.PI*2; positions.push(point.x+normal.x*Math.cos(angle)*.105,point.y+normal.y*Math.cos(angle)*.105,Math.sin(angle)*.105); morph.push(...target(part,t,angle).toArray()); }
    }
    for(let ring=0; ring<rings-1; ring++) for(let side=0; side<sides; side++) { const next=(side+1)%sides,a=base+ring*sides+side,b=base+(ring+1)*sides+side,c=base+(ring+1)*sides+next,d=base+ring*sides+next; indices.push(a,b,d,b,c,d); }
  });
  const value=new THREE.BufferGeometry(); value.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); value.setIndex(indices); value.morphAttributes.position=[new THREE.Float32BufferAttribute(morph,3)]; value.morphAttributes.position[0].name='Object'; value.computeVertexNormals();
  if(positions.length!==morph.length) throw new Error(`${code} topology mismatch`);
  return value;
}

const assets=[
  {code:'31',name:'Shark',target:shark,color:'#38bdf8',emissive:'#075985',roughness:.22,metalness:.38},
  {code:'43',name:'StoneMountain',target:mountain,color:'#a8a29e',emissive:'#292524',roughness:.92,metalness:.05},
];

for (const asset of assets) {
  const value=geometry(asset.code,asset.target);
  const mesh=new THREE.Mesh(value,new THREE.MeshPhysicalMaterial({color:asset.color,emissive:asset.emissive,emissiveIntensity:.42,roughness:asset.roughness,metalness:asset.metalness,clearcoat:.18}));
  mesh.name='MorphMesh'; mesh.updateMorphTargets(); mesh.morphTargetDictionary={Object:0};
  const scene=new THREE.Scene(); scene.name=`${asset.code}_to_${asset.name}`; scene.add(mesh);
  const glb=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true});
  const output=path.resolve(`public/models/number-morph/${asset.code}.glb`); await fs.mkdir(path.dirname(output),{recursive:true}); await fs.writeFile(output,Buffer.from(glb));
  console.log(`Wrote ${output} (${glb.byteLength} bytes, ${value.attributes.position.count} vertices)`);
}
