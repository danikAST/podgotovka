/* AETHER v3 — NEON SENTINEL: bloom, детальные модели, мышь, уровни */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a);
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

const LEVELS=[
 {name:'АНГАР 01',sub:'Очисти зону от дронов',grid:0x2bd4ff,sky:0x061426,accent:0x22d3ee,
  scouts:6,guards:1,wisps:0},
 {name:'РЕАКТОР',sub:'Уровень 2 · Повышенная угроза',grid:0xff5e8a,sky:0x1a0718,accent:0xf43f5e,
  scouts:6,guards:3,wisps:2},
 {name:'ЯДРО СИСТЕМЫ',sub:'Уровень 3 · Финальный рубеж',grid:0xa855f7,sky:0x0d0620,accent:0xa855f7,
  scouts:8,guards:4,wisps:4,boss:1}
];
const ETYPE={
 scout:{hp:2,speed:4.2,dmg:10,score:120,r:1.1,color:0xf87171,emit:0xdc2626},
 guard:{hp:5,speed:2.4,dmg:20,score:300,r:1.6,color:0xfb923c,emit:0xea580c},
 wisp: {hp:2,speed:6.0,dmg:8, score:180,r:0.9,color:0xc084fc,emit:0x9333ea},
 boss: {hp:18,speed:1.7,dmg:30,score:1000,r:2.8,color:0xf43f5e,emit:0xbe123c}
};

/* --- рендер с bloom --- */
const canvas=$('scene');
const renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x061426);
scene.fog=new THREE.FogExp2(0x061426,0.011);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.1,600);
const composer=new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene,camera));
const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth*0.7,innerHeight*0.7),1.0,0.4,0.55);
composer.addPass(bloom);
scene.add(new THREE.HemisphereLight(0x6a9fd8,0x0a1020,0.75));
const sun=new THREE.DirectionalLight(0xdfefff,1.35);
sun.position.set(30,70,20);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;
sun.shadow.camera.far=200;sun.shadow.bias=-0.0006;scene.add(sun);scene.add(sun.target);

/* --- процедурные текстуры --- */
function gridTexture(){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
 g.fillStyle='#08111e';g.fillRect(0,0,512,512);
 g.strokeStyle='#143044';g.lineWidth=2;
 for(let i=0;i<=512;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.stroke();
  g.beginPath();g.moveTo(0,i);g.lineTo(512,i);g.stroke();}
 g.strokeStyle='#3ae0ff';g.lineWidth=3;
 for(let i=0;i<=512;i+=128){g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.stroke();
  g.beginPath();g.moveTo(0,i);g.lineTo(512,i);g.stroke();}
 g.fillStyle='#3ae0ff';for(let x=64;x<512;x+=128)for(let y=64;y<512;y+=128)g.fillRect(x-3,y-3,6,6);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(14,14);return t;
}
const gridTex=gridTexture();
function glowTex(){
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
 const gr=g.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.2,'rgba(255,255,255,0.5)');gr.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
const GT=glowTex();
function glow(color,size,op){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GT,color:color,transparent:true,opacity:op===undefined?0.7:op,blending:THREE.AdditiveBlending,depthWrite:false}));s.scale.set(size,size,1);return s;}
function textSprite(text,color){const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');
 g.font='bold 40px sans-serif';g.textAlign='center';g.fillStyle=color||'#fff';g.fillText(text,64,44);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));s.scale.set(1.5,0.75,1);return s;}

/* --- арена --- */
const arena=new THREE.Group();scene.add(arena);
const floorMat=new THREE.MeshStandardMaterial({color:0x31465c,map:gridTex,emissive:0x0e2d42,emissiveMap:gridTex,emissiveIntensity:1.2,metalness:0.15,roughness:0.85});
const floor=new THREE.Mesh(new THREE.CylinderGeometry(88,88,1.2,72),floorMat);floor.position.y=-0.6;floor.receiveShadow=true;arena.add(floor);
const under=new THREE.Mesh(new THREE.CircleGeometry(320,64),new THREE.MeshStandardMaterial({color:0x070e1b,roughness:1}));
under.rotation.x=-Math.PI/2;under.position.y=-1.5;arena.add(under);
const gridMat=new THREE.LineBasicMaterial({color:0x2bd4ff,transparent:true,opacity:0.45});
const gp=[];for(let i=-80;i<=80;i+=8){gp.push(i,0.04,-80,i,0.04,80,-80,0.04,i,80,0.04,i);}
const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));
arena.add(new THREE.LineSegments(gg,gridMat));
const edgeMat=new THREE.MeshStandardMaterial({color:0x0b1828,metalness:0.7,roughness:0.4,emissive:0x0a2f45});
const neonMats=[gridMat];
for(let i=0;i<16;i++){
 const a=i*Math.PI/8,x=Math.cos(a)*85,z=Math.sin(a)*85;
 const p=new THREE.Mesh(new THREE.CylinderGeometry(0.9,1.3,7,8),edgeMat);p.position.set(x,3.5,z);p.castShadow=true;arena.add(p);
 const m=new THREE.MeshStandardMaterial({color:0x22d3ee,emissive:0x22d3ee,emissiveIntensity:2.2});neonMats.push(m);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(0.75,12,10),m);cap.position.set(x,7.3,z);arena.add(cap);
 if(i%4===0){const l=new THREE.PointLight(0x22d3ee,1.6,40);l.position.set(x,7,z);arena.add(l);}
}
for(let i=0;i<3;i++){
 const m=new THREE.MeshStandardMaterial({color:0x22d3ee,emissive:0x22d3ee,emissiveIntensity:1.6,transparent:true,opacity:0.55});neonMats.push(m);
 const r=new THREE.Mesh(new THREE.TorusGeometry(30+i*20,0.12,6,80),m);r.rotation.x=Math.PI/2;r.position.y=16+i*7;arena.add(r);
}
const starGeo=new THREE.BufferGeometry(),sp=[];
for(let i=0;i<500;i++){const a=rand(0,6.283),y=rand(8,160),d=rand(60,280);sp.push(Math.cos(a)*d,y,Math.sin(a)*d);}
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
arena.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xbfe6ff,size:0.7,transparent:true,opacity:0.8})));
const dustGeo=new THREE.BufferGeometry(),dp=[];
for(let i=0;i<120;i++)dp.push(rand(-80,80),rand(0.5,22),rand(-80,80));
dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dp,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x22d3ee,size:0.35,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}));arena.add(dust);
const extraction=new THREE.Group();
extraction.add(new THREE.Mesh(new THREE.CylinderGeometry(4,4,0.15,40),new THREE.MeshStandardMaterial({color:0x22d3ee,emissive:0x22d3ee,emissiveIntensity:2,transparent:true,opacity:0.5})),
 new THREE.Mesh(new THREE.TorusGeometry(4,0.14,8,48),new THREE.MeshBasicMaterial({color:0xa5f3fc})),
 glow(0x22d3ee,10,0.6));
extraction.position.set(0,0.1,0);extraction.visible=false;scene.add(extraction);

let enemies=[],bolts=[],fx=[],nums=[],props=[],pickups=[],levelIndex=0,time=0;
/* --- модель игрока --- */
const player=new THREE.Group();scene.add(player);const PX={};
(function(){
 const armor=new THREE.MeshStandardMaterial({color:0x263b57,metalness:0.6,roughness:0.35});
 const dark=new THREE.MeshStandardMaterial({color:0x0d1728,metalness:0.5,roughness:0.5});
 const light=new THREE.MeshStandardMaterial({color:0x67e8f9,emissive:0x22d3ee,emissiveIntensity:2.2});
 const trim=new THREE.MeshStandardMaterial({color:0xf59e0b,emissive:0xb45309,emissiveIntensity:1});
 const body=new THREE.Group();player.add(body);PX.body=body;
 const torso=new THREE.Mesh(new THREE.BoxGeometry(0.78,0.92,0.46),armor);torso.position.y=1.35;torso.castShadow=true;body.add(torso);
 const chest=new THREE.Mesh(new THREE.BoxGeometry(0.68,0.5,0.1),dark);chest.position.set(0,1.42,0.25);body.add(chest);
 const core=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.24,0.06),light);core.position.set(0,1.45,0.31);body.add(core);
 const belt=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.16,0.5),dark);belt.position.y=0.9;body.add(belt);
 const head=new THREE.Mesh(new THREE.SphereGeometry(0.29,16,12),armor);head.position.y=2.02;head.castShadow=true;body.add(head);PX.head=head;
 const visor=new THREE.Mesh(new THREE.BoxGeometry(0.48,0.14,0.12),light);visor.position.set(0,2.04,0.24);body.add(visor);
 const crest=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.26,0.36),trim);crest.position.set(0,2.25,0);body.add(crest);
 const pack=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.62,0.3),dark);pack.position.set(0,1.4,-0.36);body.add(pack);
 for(let s=-1;s<=1;s+=2){
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.54,8),light);tank.position.set(s*0.17,1.4,-0.55);body.add(tank);
  const sh=new THREE.Mesh(new THREE.SphereGeometry(0.24,12,8),trim);sh.position.set(s*0.5,1.7,0);body.add(sh);
 }
 function limb(x,y,w,h,d,mat){const p=new THREE.Group();p.position.set(x,y,0);const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.y=-h/2;m.castShadow=true;p.add(m);return p;}
 const al=limb(-0.52,1.65,0.2,0.82,0.22,armor),ar=limb(0.52,1.65,0.2,0.82,0.22,armor);
 body.add(al,ar);PX.armL=al;PX.armR=ar;
 for(const a of [al,ar]){const hand=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.18,0.22),dark);hand.position.y=-0.86;a.add(hand);}
 const ll=limb(-0.21,0.9,0.24,0.9,0.26,dark),lr=limb(0.21,0.9,0.24,0.9,0.26,dark);
 player.add(ll,lr);PX.legL=ll;PX.legR=lr;
 for(const l of [ll,lr]){const boot=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.18,0.38),trim);boot.position.set(0,-0.94,0.07);l.add(boot);}
 const gun=new THREE.Group();gun.position.set(0.36,1.18,0.28);body.add(gun);PX.gun=gun;
 const gb=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.22,1.0),dark);gb.position.z=0.25;gun.add(gb);
 const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.8,8),armor);barrel.rotation.x=Math.PI/2;barrel.position.z=0.95;gun.add(barrel);
 const cell=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.26,0.3),light);cell.position.set(0,0.16,0.3);gun.add(cell);
 PX.muzzle=glow(0xa5f3fc,1.3,0);PX.muzzle.position.z=1.35;gun.add(PX.muzzle);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(0.78,0.035,6,32),new THREE.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:0.6}));ring.rotation.x=Math.PI/2;ring.position.y=0.06;player.add(ring);
 PX.shadow=glow(0x22d3ee,2.4,0.25);PX.shadow.position.y=0.05;player.add(PX.shadow);
})();

/* --- модели врагов --- */
function makeEnemy(type,x,z){
 const cfg=ETYPE[type],g=new THREE.Group();
 const mat=new THREE.MeshStandardMaterial({color:0x2a3345,metalness:0.7,roughness:0.4});
 const em=new THREE.MeshStandardMaterial({color:cfg.color,emissive:cfg.emit,emissiveIntensity:2.4});
 const dark=new THREE.MeshStandardMaterial({color:0x0d1422,metalness:0.6,roughness:0.5});
 const parts={};
 if(type==='scout'){
  const body=new THREE.Mesh(new THREE.OctahedronGeometry(0.8,0),mat);body.scale.set(1.3,0.75,1.3);body.castShadow=true;g.add(body);parts.body=body;
  const eye=new THREE.Mesh(new THREE.SphereGeometry(0.28,12,10),em);eye.position.z=0.7;g.add(eye);parts.eye=eye;
  for(let i=0;i<4;i++){const a=i*Math.PI/2+0.4;
   const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.04,1.1,6),dark);
   leg.position.set(Math.cos(a)*0.7,-0.55,Math.sin(a)*0.7);leg.rotation.z=Math.cos(a)*0.5;leg.rotation.x=Math.sin(a)*0.5;g.add(leg);}
  g.add(glow(cfg.color,2.6,0.45));
 }else if(type==='guard'||type==='boss'){
  const torso=new THREE.Mesh(new THREE.BoxGeometry(1.15,1.3,0.8),mat);torso.position.y=1.5;torso.castShadow=true;g.add(torso);parts.body=torso;
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.5,0.55),dark);head.position.y=2.35;g.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.14,0.08),em);visor.position.set(0,2.38,0.3);g.add(visor);parts.eye=visor;
  for(let s=-1;s<=1;s+=2){
   const arm=new THREE.Mesh(new THREE.BoxGeometry(0.32,1.15,0.36),mat);arm.position.set(s*0.78,1.45,0);arm.castShadow=true;g.add(arm);
   const claw=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.55,6),em);claw.position.set(s*0.78,0.75,0.2);claw.rotation.x=Math.PI/2;g.add(claw);
   const leg=new THREE.Mesh(new THREE.BoxGeometry(0.36,1.0,0.4),dark);leg.position.set(s*0.3,0.55,0);leg.castShadow=true;g.add(leg);
  }
  const core=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,10),em);core.position.set(0,1.55,0.45);g.add(core);
  g.add(glow(cfg.color,3.2,0.4));
  if(type==='boss'){g.scale.setScalar(1.9);
   for(let i=0;i<3;i++){const sp=new THREE.Mesh(new THREE.ConeGeometry(0.25,0.9,5),em);
    sp.position.set((i-1)*0.6,2.7,0);sp.rotation.x=0.4;g.add(sp);}}
 }else{
  const body=new THREE.Mesh(new THREE.TetrahedronGeometry(0.7,0),em);body.castShadow=true;g.add(body);parts.body=body;
  for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.0,0.3),mat);b.rotation.z=i*2.094;b.position.y=0.1;g.add(b);}
  g.add(glow(cfg.color,2.4,0.55));
 }
 const bar=new THREE.Group();
 const bg=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.16),new THREE.MeshBasicMaterial({color:0x050a14,transparent:true,opacity:0.85,depthTest:false}));
 const fill=new THREE.Mesh(new THREE.PlaneGeometry(1.36,0.12),new THREE.MeshBasicMaterial({color:cfg.color,depthTest:false}));
 fill.position.z=0.01;bar.add(bg,fill);bar.position.y=cfg.r+1.3;bar.renderOrder=999;g.add(bar);
 const y=(type==='guard'||type==='boss'?0:1.8);
 g.position.set(x,y,z);scene.add(g);
 return {g:g,type:type,cfg:cfg,mat:mat,em:em,parts:parts,bar:bar,fill:fill,
  hp:cfg.hp,maxHp:cfg.hp,alive:true,phase:rand(0,6.28),flash:0,knock:V(0,0,0),home:V(x,y,z),dashT:rand(0.5,2),mode:0};
}
function buildLevel(n){
 levelIndex=n;const L=LEVELS[n];
 scene.background.setHex(L.sky);scene.fog.color.setHex(L.sky);
 floorMat.emissive.setHex(L.grid);neonMats.forEach(m=>{if(m&&m.color&&m.emissive){m.color.setHex(L.grid);m.emissive.setHex(L.grid);}});
 extraction.visible=false;
 enemies.forEach(e=>scene.remove(e.g));enemies=[];bolts.forEach(b=>scene.remove(b.m));bolts=[];
 fx.forEach(f=>scene.remove(f.m));fx=[];nums.forEach(n=>scene.remove(n.s));nums=[];
 props.forEach(p=>scene.remove(p));props=[];pickups.forEach(p=>scene.remove(p.g));pickups=[];
 for(let i=0;i<L.scouts;i++){const a=rand(0,6.283),d=rand(16,34);enemies.push(makeEnemy('scout',Math.cos(a)*d,Math.sin(a)*d));}
 for(let i=0;i<L.guards;i++){const a=rand(0,6.283),d=rand(20,36);enemies.push(makeEnemy('guard',Math.cos(a)*d,Math.sin(a)*d));}
 for(let i=0;i<L.wisps;i++){const a=rand(0,6.283),d=rand(22,38);enemies.push(makeEnemy('wisp',Math.cos(a)*d,Math.sin(a)*d));}
 if(L.boss)enemies.push(makeEnemy('boss',0,-30));
 /* укрытия и ящики на карте */
 const crateMat=new THREE.MeshStandardMaterial({color:0x22344b,metalness:0.55,roughness:0.45});
 const crateTrim=new THREE.MeshStandardMaterial({color:L.grid,emissive:L.grid,emissiveIntensity:2});
 for(let i=0;i<14;i++){
  const a=rand(0,6.283),d=rand(12,72),g=new THREE.Group();
  const box=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.7,2.2),crateMat);box.position.y=0.85;box.castShadow=true;box.receiveShadow=true;g.add(box);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(2.25,0.1,2.25),crateTrim);strip.position.y=1.5;g.add(strip);
  const strip2=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.7,2.25),crateTrim);strip2.position.x=1.12;g.add(strip2);
  g.position.set(Math.cos(a)*d,0,Math.sin(a)*d);g.rotation.y=rand(0,6.283);scene.add(g);props.push(g);
 }
 /* аптечки и энергия */
 for(let i=0;i<4;i++){
  const heal=i%2===0,a=rand(0,6.283),d=rand(10,50),g=new THREE.Group();
  const col=heal?0x4ade80:0x22d3ee;
  const box=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.5,0.8),new THREE.MeshStandardMaterial({color:0x0d1728,metalness:0.6,roughness:0.4}));
  const cross=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.14),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:2.5}));
  cross.position.y=0.28;g.add(box,cross,glow(col,2.2,0.5));
  g.position.set(Math.cos(a)*d,0.7,Math.sin(a)*d);scene.add(g);
  pickups.push({g:g,heal:heal,ready:true,timer:0,phase:rand(0,6.28)});
 }
 player.position.set(0,0,0);vel.set(0,0,0);vy=0;grounded=true;player.rotation.y=0;
 hp=clamp(hp+30,0,100);energy=100;
 const bn=$('levelBanner');bn.innerHTML=L.name+'<small>'+L.sub+'</small>';bn.classList.remove('hidden');
 clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>bn.classList.add('hidden'),2600);
 $('objective').textContent='Уничтожь всех сторожевых дронов';updateHud();
}
/* --- состояние --- */
let started=false,over=false,transition=0,hp=100,energy=100,score=0,kills=0;
let attackCd=0,hitCd=0,walkPhase=0,recoil=0,lastHit=-100,pulseCd=0,pulseT=0,combo=0,comboT=0;
let vy=0,grounded=true,coyote=0,jumpBuf=0,camYaw=0,camPitch=0.45,camDist=8;
const vel=V(0,0,0),camTarget=V(0,0,0);
const PGEO=new THREE.SphereGeometry(0.1,6,5);
const pulseRing=new THREE.Mesh(new THREE.TorusGeometry(1,0.12,8,64),new THREE.MeshBasicMaterial({color:0x67e8f9,transparent:true,opacity:0}));
pulseRing.rotation.x=Math.PI/2;scene.add(pulseRing);
let audio=null;
function initAudio(){try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function beep(f,d,t,g){if(!audio)return;const o=audio.createOscillator(),a=audio.createGain();o.type=t||'sine';o.frequency.value=f;
 a.gain.setValueAtTime(g||0.05,audio.currentTime);a.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+d);
 o.connect(a);a.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
const shotSound=()=>{beep(180,0.09,'square',0.05);beep(900,0.06,'sine',0.03);};
const hitSound=()=>beep(120,0.25,'sawtooth',0.07);
function burst(pos,color,count,power){const m=new THREE.MeshBasicMaterial({color:color});
 for(let i=0;i<count;i++){const s=new THREE.Mesh(PGEO,m);s.position.copy(pos);scene.add(s);
  fx.push({m:s,v:V(rand(-1,1),rand(0.1,1.5),rand(-1,1)).multiplyScalar(power),life:rand(0.4,0.9),max:0.9});}}
function damage(e,d,dir){
 if(!e.alive)return;e.hp-=d;e.flash=0.12;e.em.color.setHex(0xffffff);e.em.emissive.setHex(0xffffff);e.em.emissiveIntensity=4;
 const f=clamp(e.hp/e.maxHp,0,1);e.fill.scale.x=f;e.fill.position.x=-(1-f)*0.68;
 if(dir)e.knock.addScaledVector(dir,8/e.cfg.r);
 const n=textSprite('-'+d,'#fff');n.position.copy(e.g.position).add(V(0,2,0));scene.add(n);nums.push({s:n,life:0.9});
 if(e.hp<=0){e.alive=false;e.g.visible=false;comboT=3;combo++;const mult=Math.min(combo,5);score+=e.cfg.score*mult;kills++;
  if(mult>1){const cx=textSprite('x'+mult,'#fde047');cx.position.copy(e.g.position).add(V(0,2.8,0));scene.add(cx);nums.push({s:cx,life:1.1});}
  burst(e.g.position,e.cfg.color,20,4);beep(90,0.3,'square',0.06);
  if(enemies.every(x=>!x.alive)){extraction.visible=true;$('objective').textContent='Зона эвакуации открыта — зайди в неё';beep(700,0.4,'sine',0.07);}}}
function fire(){
 if(attackCd>0||energy<15)return;attackCd=0.22;energy-=15;recoil=1;PX.muzzle.material.opacity=1;shotSound();
 const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);const dir=V(fx,0,fz);
 const m=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6),new THREE.MeshBasicMaterial({color:0xa5f3fc}));
 m.add(glow(0x22d3ee,1.6,0.9));
 m.position.copy(player.position).addScaledVector(dir,1.6).add(V(0,1.45,0));scene.add(m);
 bolts.push({m:m,dir:dir,life:1.4});
}
/* --- ввод --- */
const keys={};let queueAttack=false,queuePulse=false,joyVecX=0,joyVecY=0;
addEventListener('keydown',e=>{keys[e.code]=true;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='KeyE')queueAttack=true;
 if(e.code==='KeyQ')queuePulse=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});
let isTouch=false,drag=false,lx=0,ly=0;
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){isTouch=true;if(e.clientX<innerWidth*0.45)return;drag=true;lx=e.clientX;ly=e.clientY;}
 else if(started&&!over&&document.pointerLockElement!==canvas){canvas.requestPointerLock&&canvas.requestPointerLock();}});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas){camYaw-=e.movementX*0.0025;camPitch=clamp(camPitch+e.movementY*0.002,0.1,1.1);}});
document.addEventListener('mousedown',e=>{if(started&&!over&&document.pointerLockElement===canvas&&e.button===0)queueAttack=true;});
canvas.addEventListener('pointermove',e=>{if(!drag)return;camYaw-=(e.clientX-lx)*0.005;camPitch=clamp(camPitch+(e.clientY-ly)*0.004,0.1,1.1);lx=e.clientX;ly=e.clientY;});
canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);
canvas.addEventListener('wheel',e=>{camDist=clamp(camDist+e.deltaY*0.01,4,16);e.preventDefault();},{passive:false});
const joy=$('joystick'),knob=$('joystickKnob');let joyId=null;
function jm(e){const r=joy.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
 const l=Math.hypot(dx,dy),m=r.width*0.36;if(l>m){dx=dx/l*m;dy=dy/l*m;}knob.style.transform=`translate(${dx}px,${dy}px)`;joyVecX=dx/m;joyVecY=dy/m;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();joyId=e.pointerId;jm(e);});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)jm(e);});
function je(e){if(e.pointerId!==joyId)return;joyId=null;joyVecX=0;joyVecY=0;knob.style.transform='';}
joy.addEventListener('pointerup',je);joy.addEventListener('pointercancel',je);
const mobile={jump:false,run:false};
function hold(el,k){el.addEventListener('pointerdown',e=>{e.preventDefault();mobile[k]=true;});
 ['pointerup','pointercancel','pointerleave'].forEach(t=>el.addEventListener(t,()=>mobile[k]=false));}
hold($('btnJump'),'jump');hold($('btnRun'),'run');
$('btnAttack').addEventListener('pointerdown',e=>{e.preventDefault();queueAttack=true;});
$('btnPulse').addEventListener('pointerdown',e=>{e.preventDefault();queuePulse=true;});

/* --- обновление --- */
function update(dt){
 if(over)return;
 if(transition>0){transition-=dt;if(transition<=0){if(levelIndex+1>=LEVELS.length)finish(true);else buildLevel(levelIndex+1);}return;}
 attackCd=Math.max(0,attackCd-dt);hitCd=Math.max(0,hitCd-dt);energy=clamp(energy+dt*7,0,100);
 const ix=((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0)-joyVecY,iz=((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0)+joyVecX;
 const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
 let mx=fx*ix+rx*iz,mz=fz*ix+rz*iz;const ml=Math.hypot(mx,mz);
 const sprint=keys.ShiftLeft||keys.ShiftRight||mobile.run,sp=sprint?13:8;
 if(ml>0.01){mx/=ml;mz/=ml;const k=1-Math.exp(-(grounded?11:4)*dt);
  vel.x=lerp(vel.x,mx*sp,k);vel.z=lerp(vel.z,mz*sp,k);walkPhase+=dt*(sprint?15:10);
  const want=Math.atan2(mx,mz);let df=((want-player.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;
  player.rotation.y+=df*Math.min(1,dt*12);
 }else{const f=Math.exp(-(grounded?9:1.5)*dt);vel.x*=f;vel.z*=f;}
 player.position.x+=vel.x*dt;player.position.z+=vel.z*dt;
 const rad=Math.hypot(player.position.x,player.position.z);
 if(rad>84){player.position.x=player.position.x/rad*84;player.position.z=player.position.z/rad*84;}
 coyote=grounded?0.12:Math.max(0,coyote-dt);
 const jp=keys.Space||mobile.jump;if(jp&&!jumpPrev)jumpBuf=0.15;jumpPrev=jp;jumpBuf=Math.max(0,jumpBuf-dt);
 if(jumpBuf>0&&coyote>0){vy=11;grounded=false;coyote=0;jumpBuf=0;beep(330,0.1,'sine',0.04);}
 vy-=28*dt;player.position.y+=vy*dt;
 if(player.position.y<=0){if(!grounded)land=1;player.position.y=0;vy=0;grounded=true;}
 land=Math.max(0,land-dt*4);
 if(queueAttack){queueAttack=false;fire();}
  pulseCd=Math.max(0,pulseCd-dt);comboT=Math.max(0,comboT-dt);if(comboT<=0)combo=0;
  if(queuePulse){queuePulse=false;
   if(pulseCd<=0){pulseCd=6;pulseT=1;beep(140,0.35,'sawtooth',0.07);
    enemies.forEach(e=>{if(!e.alive)return;
     if(e.g.position.distanceTo(player.position)<11){
      damage(e,2,V(e.g.position.x-player.position.x,0,e.g.position.z-player.position.z).normalize());
      burst(e.g.position,0x67e8f9,10,3);}});}}
  if(pulseT>0){pulseT=Math.max(0,pulseT-dt*1.2);const p=1-pulseT;
   pulseRing.position.copy(player.position).setY(1);pulseRing.scale.setScalar(0.5+p*11);
   pulseRing.material.opacity=pulseT*0.85;}else pulseRing.material.opacity=0;
 recoil=Math.max(0,recoil-dt*6);PX.muzzle.material.opacity=Math.max(0,PX.muzzle.material.opacity-dt*5);
 const sw=ml>0.01?0.65:0;
 PX.armL.rotation.x=lerp(PX.armL.rotation.x,Math.sin(walkPhase)*sw,0.25);
 PX.armR.rotation.x=lerp(PX.armR.rotation.x,-Math.sin(walkPhase)*sw*0.3,0.25);
 PX.legL.rotation.x=lerp(PX.legL.rotation.x,-Math.sin(walkPhase)*sw,0.25);
 PX.legR.rotation.x=lerp(PX.legR.rotation.x,Math.sin(walkPhase)*sw,0.25);
 PX.body.position.y=Math.abs(Math.sin(walkPhase))*0.05*sw+Math.sin(time*2)*0.015-land*0.15;
 PX.body.scale.set(1+land*0.1,1-land*0.16,1+land*0.1);
  const aim=camYaw+Math.PI,ad=((aim-player.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;
  PX.body.rotation.y=lerp(PX.body.rotation.y,ad,0.25);
 PX.gun.position.z=0.28-recoil*0.28;PX.gun.rotation.x=recoil*0.18;
 for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];let best=null,bd=18;
   for(const e of enemies){if(!e.alive)continue;const d=b.m.position.distanceTo(e.g.position);if(d<bd){bd=d;best=e;}}
   if(best&&bd>1){const w=V(best.g.position.x-b.m.position.x,0,best.g.position.z-b.m.position.z).normalize();b.dir.lerp(w,Math.min(1,dt*5)).normalize();}
   b.m.position.addScaledVector(b.dir,48*dt);b.life-=dt;let dead=b.life<=0;
  for(const e of enemies){if(!e.alive)continue;if(b.m.position.distanceTo(e.g.position)<e.cfg.r+0.7){
   damage(e,1,b.dir);burst(b.m.position,0x67e8f9,8,2);dead=true;break;}}
  if(dead){scene.remove(b.m);bolts.splice(i,1);}}
 enemies.forEach(e=>{if(!e.alive)return;e.phase+=dt*3;
  let d=e.g.position.distanceTo(player.position);
   e.dashT-=dt;
  if(e.dashT<=0){
   const dv=V(player.position.x-e.g.position.x,0,player.position.z-e.g.position.z).normalize();
   if(e.type==='scout'&&d>2.5){e.dashT=rand(1.4,2.4);e.knock.addScaledVector(dv,11);}
   else if(e.type==='guard'&&d<11&&d>3){e.dashT=rand(2.6,3.8);e.knock.addScaledVector(dv,9);}
   else if(e.type==='wisp'&&d>4){e.dashT=rand(1.0,2.0);e.g.position.set(player.position.x+rand(-6,6),e.g.position.y,player.position.z+rand(-6,6));burst(e.g.position,e.cfg.color,8,2);}
   else e.dashT=rand(0.6,1.4);
  }

  if(e.flash>0){e.flash-=dt;if(e.flash<=0){e.em.color.setHex(e.cfg.color);e.em.emissive.setHex(e.cfg.emit);e.em.emissiveIntensity=2.4;}}
  d=e.g.position.distanceTo(player.position);
  if(d>2){const dir=V(player.position.x-e.g.position.x,0,player.position.z-e.g.position.z).normalize();
   e.g.position.addScaledVector(dir,e.cfg.speed*dt);
   if(e.type==='wisp'){e.g.position.x+=Math.cos(e.phase*2)*dt*2.5;e.g.position.z+=Math.sin(e.phase*2)*dt*2.5;}}
  e.g.rotation.y=Math.atan2(player.position.x-e.g.position.x,player.position.z-e.g.position.z);
  const base=(e.type==='guard'||e.type==='boss')?0:e.type==='wisp'?2.3:1.8;
  e.g.position.y=lerp(e.g.position.y,base+Math.sin(e.phase)*0.22,0.1);
  if(e.parts.body)e.parts.body.rotation.z=Math.sin(e.phase)*0.12;
  if(e.knock.lengthSq()>0.01){e.g.position.addScaledVector(e.knock,dt);e.knock.multiplyScalar(Math.exp(-6*dt));}
  e.bar.quaternion.copy(camera.quaternion);
  if(d<e.cfg.r+1.1&&hitCd<=0){hp-=e.cfg.dmg;hitCd=1.1;lastHit=time;hitSound();shake=0.5;
   const kd=V(player.position.x-e.g.position.x,0,player.position.z-e.g.position.z).normalize();
   vel.addScaledVector(kd,10);vy=5;grounded=false;
   burst(player.position.clone().setY(1.3),0xf43f5e,10,3);
   if(hp<=0){hp=0;finish(false);}}
 });
 if(time-lastHit>5)hp=clamp(hp+dt*4,0,100);
 pickups.forEach(p=>{p.phase+=dt*2;p.g.position.y=0.7+Math.sin(p.phase)*0.2;p.g.rotation.y+=dt;
  if(!p.ready){p.timer-=dt;if(p.timer<=0){p.ready=true;p.g.visible=true;}return;}
  if(p.g.position.distanceTo(player.position.clone().setY(1))<1.8){
   p.ready=false;p.timer=20;p.g.visible=false;
   if(p.heal){hp=clamp(hp+30,0,100);beep(660,0.2,'sine',0.06);}else{energy=100;beep(880,0.2,'sine',0.06);}
   burst(p.g.position,p.heal?0x4ade80:0x22d3ee,10,2);}});
 if(extraction.visible){extraction.rotation.y+=dt*1.5;
  if(Math.hypot(player.position.x,player.position.z)<4&&player.position.y<2){
   score+=500;transition=2.2;beep(880,0.4,'sine',0.07);
   const bn=$('levelBanner');bn.innerHTML='ПЕРЕХОД...<small>Эвакуация</small>';bn.classList.remove('hidden');}}
 updateHud();
}
let jumpPrev=false,land=0,shake=0,bannerTimer=null;
function finish(win){over=true;$('endScreen').classList.remove('hidden');
 $('endTitle').textContent=win?'ПОБЕДА':'ПОРАЖЕНИЕ';
 $('endSubtitle').textContent=win?'СИСТЕМА ОЧИЩЕНА':'СИГНАЛ ПОТЕРЯН';
 $('endText').textContent=win?'Все три зоны зачищены. Ты завершил миссию!':'Стражевые дроны neutralize противник. Попробуй снова.';
 $('endStats').innerHTML=`<div>ОЧКИ<b>${score}</b></div><div>УНИЧТОЖЕНО<b>${kills}</b></div><div>УРОВЕНЬ<b>${levelIndex+1}/${LEVELS.length}</b></div>`;
 win?[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.5),i*130)):beep(90,0.4,'square',0.07);}
function updateHud(){
 $('hpFill').style.width=hp+'%';$('hpText').textContent=Math.round(hp);
 $('enFill').style.width=energy+'%';$('enText').textContent=Math.round(energy);
 $('scoreText').textContent=score;$('crystalText').textContent=kills;$('killText').textContent=enemies.filter(e=>e.alive).length;
 $('levelText').textContent=(levelIndex+1)+' / '+LEVELS.length;}
const mm=$('minimap'),mc=mm.getContext('2d');
function drawRadar(){const S=mm.width,k=S/180,c=S/2;mc.clearRect(0,0,S,S);mc.fillStyle='rgba(4,12,24,.85)';mc.fillRect(0,0,S,S);
 mc.strokeStyle='rgba(103,232,249,.25)';mc.beginPath();mc.arc(c,c,84*k,0,6.283);mc.stroke();
 mc.beginPath();mc.arc(c,c,42*k,0,6.283);mc.stroke();
 enemies.forEach(e=>{if(!e.alive)return;const x=c+e.g.position.x*k,y=c+e.g.position.z*k;
  mc.beginPath();mc.arc(x,y,e.type==='guard'?3.5:2.5,0,6.283);mc.fillStyle=e.type==='guard'?'#fb923c':e.type==='wisp'?'#c084fc':'#f87171';mc.fill();});
 if(extraction.visible){mc.beginPath();mc.arc(c,c,4*k,0,6.283);mc.fillStyle='#a5f3fc';mc.fill();}
 mc.save();mc.translate(c+player.position.x*k,c+player.position.z*k);mc.rotate(-player.rotation.y);
 mc.beginPath();mc.moveTo(0,-6);mc.lineTo(4,5);mc.lineTo(-4,5);mc.closePath();mc.fillStyle='#4ade80';mc.fill();mc.restore();}
function visuals(dt){time+=dt;
 dust.rotation.y+=dt*0.02;arena.children.forEach(o=>{if(o.geometry&&o.geometry.type==='TorusGeometry')o.rotation.z+=dt*0.03;});
 for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.life-=dt;p.v.y-=7*dt;p.m.position.addScaledVector(p.v,dt);
  p.m.scale.setScalar(Math.max(0.01,p.life/p.max));if(p.life<=0){scene.remove(p.m);fx.splice(i,1);}}
 for(let i=nums.length-1;i>=0;i--){const n=nums[i];n.life-=dt;n.s.position.y+=dt*1.6;n.s.material.opacity=Math.max(0,n.life);
  if(n.life<=0){scene.remove(n.s);nums.splice(i,1);}}
 camTarget.set(player.position.x,player.position.y+1.7,player.position.z);
 const cp=Math.cos(camPitch),d=V(camTarget.x+Math.sin(camYaw)*cp*camDist,camTarget.y+Math.sin(camPitch)*camDist,camTarget.z+Math.cos(camYaw)*cp*camDist);
 camera.position.lerp(d,0.12);
 if(shake>0){shake=Math.max(0,shake-dt*2);camera.position.x+=rand(-shake,shake)*0.3;camera.position.y+=rand(-shake,shake)*0.3;}
 camera.lookAt(camTarget);
 drawRadar();}
let last=performance.now();
let accDt=0,qFrames=0,lowQ=false,useComposer=true;
function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,0.05);last=now;visuals(dt);if(started)update(dt);
 if(useComposer)composer.render();else renderer.render(scene,camera);
 accDt+=dt;qFrames++;
 if(qFrames>=90){const avg=accDt/qFrames;
  if(!lowQ&&avg>0.035){lowQ=true;useComposer=false;renderer.shadowMap.enabled=false;sun.castShadow=false;renderer.setPixelRatio(1);console.log('[AQ] turbo mode');}
  else if(lowQ&&avg<0.017){lowQ=false;useComposer=true;renderer.shadowMap.enabled=true;sun.castShadow=true;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));console.log('[AQ] high quality');}
  accDt=0;qFrames=0;}}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
function resetGame(){hp=100;energy=100;score=0;kills=0;over=false;transition=0;lastHit=time;buildLevel(0);}
$('startBtn').addEventListener('click',()=>{initAudio();$('startScreen').classList.add('hidden');
 $('loading').classList.add('hidden');$('hud').classList.remove('hidden');started=true;beep(440,0.15);});
$('restartBtn').addEventListener('click',()=>{$('endScreen').classList.add('hidden');resetGame();});
setTimeout(()=>$('loading').classList.add('hidden'),600);
resetGame();requestAnimationFrame(loop);
setTimeout(()=>composer.render(),60);
window.__dbg=()=>({x:player.position.x,z:player.position.z,y:player.position.y,vx:vel.x,vz:vel.z,keys:JSON.stringify(keys),started:started,over:over,transition:transition,time:time,last:last,camYaw:camYaw,joy:[joyVecX,joyVecY],ml:Math.hypot(vel.x,vel.z)});
setTimeout(()=>composer.render(),160);
})();
