import {useContext,useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Locale,Note,useText} from './ui';
import type {Point} from './api';
import {ExportTools} from './ExportFigure';
import {frameCanvas,imageSize} from './imageExport';

const colors={safe:0xe8e4d7,exposed:0x929087,trapped:0x46453f,injured:0x161616};
type Props={settlement:string;count:number;point:Point;camera:string;streets:boolean;selected:number|null;onSelect:(i:number)=>void};
export default function TwinModel({settlement,count,point,camera,streets,selected,onSelect}:Props){
 const host=useRef<HTMLDivElement>(null);const live=useRef<{render:()=>void;capture:(width:number)=>HTMLCanvasElement;meshes:THREE.Mesh[];camera:THREE.PerspectiveCamera;controls:OrbitControls;marker:THREE.Mesh}|null>(null);
 const callback=useRef(onSelect);callback.current=onSelect;
 const {dark}=useContext(Locale);const t=useText();const [error,setError]=useState(false);
 useEffect(()=>{
  const el=host.current;if(!el)return;setError(false);
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{setError(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.setClearColor(dark?0x171916:0xefeee6);el.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label',t('Maqueta 3D. Arrastra para girar; selecciona un hogar con el control de arriba.','3D model. Drag to rotate; select a household using the control above.'));
  const scene=new THREE.Scene();const view=new THREE.PerspectiveCamera(38,1,.1,1000);
  const controls=new OrbitControls(view,renderer.domElement);controls.target.set(0,12,0);controls.maxPolarAngle=Math.PI/2-.03;controls.minDistance=35;controls.maxDistance=300;
  const draw=()=>renderer.render(scene,view);controls.addEventListener('change',draw);
  scene.add(new THREE.HemisphereLight(0xffffff,0x6b6a60,2.2));const sun=new THREE.DirectionalLight(0xfff9ea,3);sun.position.set(-60,120,70);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-85;sun.shadow.camera.right=85;sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;sun.shadow.camera.far=350;sun.shadow.bias=-.001;scene.add(sun);
  const slope=settlement==='cartagena-cienaga'?.035:settlement==='lapaz-cotahuma'?.3:.25;
  const ground=(x:number,z:number)=>(z+50)*slope+Math.sin((x+50)/20)*1.8;
  const terrain=new THREE.PlaneGeometry(104,104,40,40);terrain.rotateX(-Math.PI/2);
  const positions=terrain.attributes.position;for(let i=0;i<positions.count;i++)positions.setY(i,ground(positions.getX(i),positions.getZ(i)));terrain.computeVertexNormals();
  const surface=new THREE.Mesh(terrain,new THREE.MeshStandardMaterial({color:dark?0x606456:0xcfcdbf,roughness:1}));surface.receiveShadow=true;scene.add(surface);
  const base=new THREE.Mesh(new THREE.BoxGeometry(104,4,104),new THREE.MeshStandardMaterial({color:dark?0x35372e:0xb5b2a1}));base.position.y=-3;scene.add(base);
  const sideVertices:number[]=[];
  for(const [ax,az,bx,bz] of [[-52,-52,52,-52],[52,-52,52,52],[52,52,-52,52],[-52,52,-52,-52]]){
   for(let i=0;i<40;i++){
    const x=ax+(bx-ax)*i/40,z=az+(bz-az)*i/40,nx=ax+(bx-ax)*(i+1)/40,nz=az+(bz-az)*(i+1)/40;
    sideVertices.push(x,-5,z,nx,-5,nz,nx,ground(nx,nz),nz,x,-5,z,nx,ground(nx,nz),nz,x,ground(x,z),z);
   }
  }
  const sideGeometry=new THREE.BufferGeometry();sideGeometry.setAttribute('position',new THREE.Float32BufferAttribute(sideVertices,3));sideGeometry.computeVertexNormals();
  scene.add(new THREE.Mesh(sideGeometry,new THREE.MeshStandardMaterial({color:dark?0x35372e:0xb5b2a1,side:THREE.DoubleSide,roughness:1})));
  for(const [axis,fixed] of [...Array.from({length:8},(_,i)=>['x',-44+i*12] as const),...[-45,-1,44].map(x=>['z',x] as const)]){
   if(!streets)break;
   const points=Array.from({length:60},(_,i)=>{const v=-50+i*100/59;const x=axis==='x'?v:fixed,z=axis==='x'?fixed:v;return new THREE.Vector3(x,ground(x,z)+.16,z);});
   const road=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),60,.65,4,false),new THREE.MeshStandardMaterial({color:dark?0x9b9b8e:0xf4f1e7,roughness:1}));scene.add(road);
  }
  const meshes:THREE.Mesh[]=[];let seed=Array.from(settlement).reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,42)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count;i++){
   const x=-40+(i%8)*11+(random()-.5)*2,z=-40+Math.floor(i/8)*12+(random()-.5)*2,h=4+random()*5,y=ground(x,z);
   const material=new THREE.MeshStandardMaterial({color:colors.exposed,roughness:.9});const house=new THREE.Mesh(new THREE.BoxGeometry(6,h,6),material);house.position.set(x,y+h/2,z);house.castShadow=true;house.receiveShadow=true;house.userData.index=i;scene.add(house);meshes.push(house);
   const roof=new THREE.Mesh(new THREE.ConeGeometry(4.7,2,4),material);roof.rotation.y=Math.PI/4;roof.position.set(x,y+h+1,z);roof.castShadow=true;roof.userData.index=i;scene.add(roof);
   for(const dx of [-1.6,1.6]){const window=new THREE.Mesh(new THREE.PlaneGeometry(.85,1.15),new THREE.MeshStandardMaterial({color:0xe7debd,roughness:.6}));window.position.set(x+dx,y+h*.6,z+3.02);scene.add(window);}
  }
  const marker=new THREE.Mesh(new THREE.TorusGeometry(5,.25,8,48),new THREE.MeshBasicMaterial({color:dark?0xffffff:0x101010}));marker.rotation.x=Math.PI/2;marker.visible=false;scene.add(marker);
  const resize=new ResizeObserver(()=>{const {width,height}=el.getBoundingClientRect();renderer.setSize(width,height,false);view.aspect=width/height;view.updateProjectionMatrix();draw();});resize.observe(el);
  const ray=new THREE.Raycaster();let start={x:0,y:0};
  const down=(event:PointerEvent)=>{start={x:event.clientX,y:event.clientY};};
  const click=(event:PointerEvent)=>{if(Math.hypot(event.clientX-start.x,event.clientY-start.y)>6)return;const r=el.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1),view);const hit=ray.intersectObjects(meshes)[0];if(hit)callback.current(hit.object.userData.index);};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',click);
  const capture=(requested:number)=>{
   const gl=renderer.getContext();if(gl.isContextLost())throw new Error('WebGL context lost');
   const maxSide=Math.min(renderer.capabilities.maxTextureSize,gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
   const size=imageSize(requested,16/9,maxSide),previous=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),aspect=view.aspect;
   const canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
   try{
    renderer.setPixelRatio(1);renderer.setSize(size.width,size.height,false);view.aspect=size.width/size.height;view.updateProjectionMatrix();renderer.render(scene,view);
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.drawImage(renderer.domElement,0,0);
   }finally{renderer.setPixelRatio(ratio);renderer.setSize(previous.x,previous.y,false);view.aspect=aspect;view.updateProjectionMatrix();draw();}
   return canvas;
  };
  live.current={render:draw,capture,meshes,camera:view,controls,marker};
  return()=>{resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',click);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();live.current=null;};
 },[settlement,count,dark,streets]);
 useEffect(()=>{const v=live.current;if(!v)return;v.meshes.forEach((mesh,i)=>{const material=mesh.material as THREE.MeshStandardMaterial;material.color.setHex(colors[point.household_states[i]??'exposed']);material.emissive.setHex(i===selected?(dark?0x555544:0x38382b):0);});v.marker.visible=selected!==null;if(selected!==null&&v.meshes[selected]){const m=v.meshes[selected];v.marker.position.set(m.position.x,m.position.y+(m.geometry as THREE.BoxGeometry).parameters.height/2+3,m.position.z);}v.render();},[point,selected,settlement,count,dark,streets]);
 useEffect(()=>{const v=live.current;if(!v)return;v.camera.position.set(...(camera==='top'?[0,185,.1]:camera==='street'?[125,55,150]:[125,130,150]) as [number,number,number]);v.controls.update();v.render();},[camera,settlement,count,dark,streets]);
 const labels={safe:t('A salvo','Safe'),exposed:t('Expuesto','Exposed'),trapped:t('Atrapado','Trapped'),injured:t('Lesionado','Injured')};
 return <>{error?<Note error>{t('WebGL no está disponible. Usa la tabla de hogares debajo.','WebGL is unavailable. Use the household table below.')}</Note>:null}
 <div className="figure-download-bar"><div><strong>{t('Exportar la vista 3D','Export the 3D view')}</strong><small>{t('Renderizado real hasta 3840 px, con la cámara y el instante actuales.','Native rendering up to 3840 px, using the current camera and time.')}</small></div>{!error?<ExportTools name={`twin-${settlement}-step-${point.step}`} render={async(width)=>{
  if(!live.current)throw new Error('3D model not ready');
  return frameCanvas(live.current.capture(width),{
   title:t('Gemelo poblacional · vista 3D','Population twin · 3D view'),
   caption:`${settlement} · ${point.time_min.toFixed(1)} min · ${count} ${t('hogares','households')} · ${t('Maqueta sintética. Calles esquemáticas, no rutas calculadas.','Synthetic model. Schematic streets, not computed routes.')}`,
   background:dark?'#171916':'#efeee6',foreground:dark?'#f0f1e9':'#171917'
  },Object.entries(labels).map(([id,label])=>({label,color:'#'+colors[id as keyof typeof colors].toString(16).padStart(6,'0')})));
 }}/>:null}</div><div ref={host} className="twin-model"/></>;
}
