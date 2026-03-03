// Scene setup: renderer, scene, camera, lights, arena geometry, pillars, background particles
const THREE = window.THREE;

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040410);
scene.fog = new THREE.FogExp2(0x040410, 0.026);

export const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 10, 20);
camera.lookAt(0, 1.5, 0);

window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// Lights
scene.add(new THREE.AmbientLight(0x0a0a1a, 1));
const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
sunLight.position.set(5, 15, 5); sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5; sunLight.shadow.camera.far = 50;
sunLight.shadow.camera.left = -15; sunLight.shadow.camera.right = 15;
sunLight.shadow.camera.top = 15; sunLight.shadow.camera.bottom = -15;
scene.add(sunLight);
const spotTop = new THREE.SpotLight(0xffffff, 3, 35, Math.PI / 5, 0.6);
spotTop.position.set(0, 20, 0); spotTop.castShadow = true; scene.add(spotTop);
export const blueLight = new THREE.PointLight(0x00e5ff, 3, 18); blueLight.position.set(-9, 5, 0); scene.add(blueLight);
export const redLight  = new THREE.PointLight(0xff3d71, 3, 18); redLight.position.set(9, 5, 0);   scene.add(redLight);
export const underGlow = new THREE.PointLight(0x4400ff, 1, 12); underGlow.position.set(0, 0.1, 0); scene.add(underGlow);

// Arena floor
const floorShape = new THREE.Shape();
const FR = 10, FS = 8;
for (let i = 0; i < FS; i++) {
  const a = (i / FS) * Math.PI * 2 - Math.PI / 8;
  i === 0 ? floorShape.moveTo(Math.cos(a)*FR, Math.sin(a)*FR) : floorShape.lineTo(Math.cos(a)*FR, Math.sin(a)*FR);
}
floorShape.closePath();
const floorGeo = new THREE.ExtrudeGeometry(floorShape, { depth:0.5, bevelEnabled:true, bevelThickness:0.1, bevelSize:0.1, bevelSegments:2 });
floorGeo.rotateX(-Math.PI/2); floorGeo.translate(0,-0.5,0);
const floorMesh = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({color:0x0d0d1a,roughness:0.85,metalness:0.3}));
floorMesh.receiveShadow = true; scene.add(floorMesh);
for (let x=-9;x<=9;x+=2) for (let z=-9;z<=9;z+=2) {
  if (Math.sqrt(x*x+z*z)>9) continue;
  const odd = (Math.floor((x+9)/2)+Math.floor((z+9)/2))%2===0;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9), new THREE.MeshStandardMaterial({color:odd?0x0a0a16:0x0f0f22,roughness:0.9,metalness:0.1}));
  m.rotation.x=-Math.PI/2; m.position.set(x,0.01,z); m.receiveShadow=true; scene.add(m);
}

// Rings & emblem
function makeRing(r,col,op){const m=new THREE.Mesh(new THREE.TorusGeometry(r,0.05,8,80),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op}));m.rotation.x=Math.PI/2;m.position.y=0.05;scene.add(m);return m;}
export const ring1=makeRing(9.8,0x00e5ff,0.6), ring2=makeRing(8,0x00e5ff,0.25);
export const emblem=new THREE.Mesh(new THREE.CircleGeometry(1.5,6),new THREE.MeshBasicMaterial({color:0xffd600,transparent:true,opacity:0.08}));
emblem.rotation.x=-Math.PI/2; emblem.position.y=0.02; scene.add(emblem);

// Pillars
export const pillarObjs=[];
for(let i=0;i<8;i++){
  if(i===2||i===3) continue;
  const a=(i/8)*Math.PI*2, px=Math.cos(a)*9.6, pz=Math.sin(a)*9.6, col=i%2===0?0x00e5ff:0xff3d71;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.45,0.6,8),new THREE.MeshStandardMaterial({color:0x111122,roughness:0.7}));
  base.position.set(px,0.3,pz); base.castShadow=true; scene.add(base);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,7,8),new THREE.MeshStandardMaterial({color:0x0e0e24,roughness:0.6}));
  shaft.position.set(px,4,pz); shaft.castShadow=true; scene.add(shaft);
  const band=new THREE.Mesh(new THREE.TorusGeometry(0.25,0.04,6,24),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.9}));
  band.rotation.x=Math.PI/2; band.position.set(px,2.5,pz); scene.add(band);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,12),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.95}));
  cap.position.set(px,7.6,pz); scene.add(cap);
  const capLight=new THREE.PointLight(col,1.5,8); capLight.position.set(px,7.6,pz); scene.add(capLight);
  pillarObjs.push({band,cap,capLight});
}

// Background particles
const bgGeo=new THREE.BufferGeometry();
const bgPos=new Float32Array(200*3);
for(let i=0;i<200;i++){const a=Math.random()*Math.PI*2,r=10+Math.random()*8;bgPos[i*3]=Math.cos(a)*r;bgPos[i*3+1]=Math.random()*12;bgPos[i*3+2]=Math.sin(a)*r;}
bgGeo.setAttribute('position',new THREE.BufferAttribute(bgPos,3));
scene.add(new THREE.Points(bgGeo,new THREE.PointsMaterial({color:0x00e5ff,size:0.06,transparent:true,opacity:0.4})));