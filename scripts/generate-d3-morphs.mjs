import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

class NodeFileReader { result = null; onloadend = null; async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); } async readAsDataURL(blob) { this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`; this.onloadend?.(); } }
globalThis.FileReader ??= NodeFileReader;
const rings = 120; const sides = 12;

const curves = {
  1: (t) => new THREE.Vector3(.05, 1.05 - 2.1 * t, 0),
  4: (t) => { const points = [[-.5,.2],[.2,1.05],[.2,-1.05],[.2,.2],[-.5,.2],[.2,1.05]]; const s=t*(points.length-1); const i=Math.min(points.length-2,Math.floor(s)); return new THREE.Vector3(points[i][0],points[i][1],0).lerp(new THREE.Vector3(points[i+1][0],points[i+1][1],0),s-i); },
  5: (t) => { const points = [[.5,1.05],[-.5,1.05],[-.5,.15],[.25,.15],[.55,-.25],[.35,-.9],[-.5,-1.05]]; const s=t*(points.length-1); const i=Math.min(points.length-2,Math.floor(s)); return new THREE.Vector3(points[i][0],points[i][1],0).lerp(new THREE.Vector3(points[i+1][0],points[i+1][1],0),s-i); },
  6: (t) => { const a=t*Math.PI*2; return new THREE.Vector3(Math.cos(a)*.52-.05,.1+Math.sin(a)*.73+(1-t)*.25,0); },
};

function foxTarget(part,t,a) {
  const tube=.085;
  if (part===0) { const arc=(t*1.65-.25)*Math.PI; const radius=.55+.35*t; return new THREE.Vector3(-.2+Math.cos(arc)*radius,.05+Math.sin(arc)*.48,Math.sin(a)*tube); }
  if (t<.35) { const u=t/.35; const ear=u<.5?-1:1; return new THREE.Vector3(ear*(.28+(u%0.5)*.4),.55+(u%0.5)*.9,Math.sin(a)*tube); }
  const u=(t-.35)/.65; return new THREE.Vector3(Math.cos(u*Math.PI*2)*(.34-.12*u),.5-u*1.25,Math.sin(u*Math.PI*2)*.2+Math.sin(a)*tube);
}

function lawyerTarget(part,t,a) {
  const tube=.09;
  if (part===0) { const u=t; return new THREE.Vector3(Math.sin(u*Math.PI*2)*(.34+.4*u),.15-u*1.3,Math.cos(u*Math.PI*2)*.18+Math.sin(a)*tube); }
  if (t<.5) { const u=t*2; return new THREE.Vector3(-.78+u*1.56,.58+Math.sin(u*Math.PI)*.06,Math.sin(a)*tube); }
  const u=(t-.5)*2; const side=u<.5?-1:1; const local=(u%0.5)*2; return new THREE.Vector3(side*.62,.55-local*.7,Math.sin(a)*tube);
}

function geometryFor(code,targetFn) {
  const p=[]; const m=[]; const idx=[];
  [...code].forEach((dText,part)=>{ const digit=Number(dText); const base=p.length/3; const xOff=part? .68:-.68;
    for(let r=0;r<rings;r++){ const t=r/(rings-1); const c=curves[digit](t).add(new THREE.Vector3(xOff,0,0)); const n=curves[digit](Math.min(1,t+1/rings)).sub(curves[digit](t)).normalize(); const normal=new THREE.Vector3(-n.y,n.x,0).normalize();
      for(let s=0;s<sides;s++){ const a=s/sides*Math.PI*2; p.push(c.x+normal.x*Math.cos(a)*.105,c.y+normal.y*Math.cos(a)*.105,Math.sin(a)*.105); m.push(...targetFn(part,t,a).toArray()); }}
    for(let r=0;r<rings-1;r++)for(let s=0;s<sides;s++){const ns=(s+1)%sides;const a=base+r*sides+s,b=base+(r+1)*sides+s,c=base+(r+1)*sides+ns,d=base+r*sides+ns;idx.push(a,b,d,b,c,d);}
  });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(p,3)); g.setIndex(idx); g.morphAttributes.position=[new THREE.Float32BufferAttribute(m,3)]; g.morphAttributes.position[0].name='Object'; g.computeVertexNormals(); if(p.length!==m.length)throw new Error(`${code} topology mismatch`); return g;
}

for(const asset of [{code:'51',name:'Fox',target:foxTarget,color:'#f97316',emissive:'#7c2d12',roughness:.55},{code:'64',name:'Lawyer',target:lawyerTarget,color:'#1d4ed8',emissive:'#082f49',roughness:.3}]){
  const geometry=geometryFor(asset.code,asset.target); const mesh=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({color:asset.color,emissive:asset.emissive,emissiveIntensity:.5,roughness:asset.roughness,metalness:.12,clearcoat:.28})); mesh.name='MorphMesh'; mesh.updateMorphTargets(); mesh.morphTargetDictionary={Object:0}; const scene=new THREE.Scene(); scene.name=`${asset.code}_to_${asset.name}`; scene.add(mesh); const glb=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true}); const output=path.resolve(`public/models/number-morph/${asset.code}.glb`); await fs.mkdir(path.dirname(output),{recursive:true}); await fs.writeFile(output,Buffer.from(glb)); console.log(`Wrote ${output} (${glb.byteLength} bytes, ${geometry.attributes.position.count} vertices)`);
}
