import {contours,smoothPath,peopleBounds} from './portrait-geometry.js?v=orbits-9';
import { FilesetResolver, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';

const canvas = document.querySelector('#art');
const ctx = canvas.getContext('2d');
const video = document.querySelector('#cam');
const status = document.querySelector('#status');
const sample = document.createElement('canvas');
sample.width = 512;
sample.height = 384;
const sc = sample.getContext('2d', { willReadFrequently: true });
const stencil = document.createElement('canvas');
const st = stencil.getContext('2d', { willReadFrequently: true });
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const cells = new Map();
let tiles = [], quote = [], mask, luminance, previousLuma, model, segment, stream;
let ripple=null, wasRaised=false,people=[],lastOrbit=0,orbitPaths=[];
const outline=document.createElement("canvas"),oc=outline.getContext("2d");outline.width=512;outline.height=384;
let width, height, tileSize, quoteWidth, quoteHeight, hand = null, handAt = 0;
let calm = 0, anchor = { x: 0, y: 0 }, alive = true, raf, captureTimer;
let prev = performance.now(), lastLayout = 0, lastNoise = 0, lastHand = 0, lastDrop = 0;
const mix = (a,b,t) => a+(b-a)*t;
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const hash = (x,y) => { const a=Math.sin(x*127.1+y*311.7)*43758.5453; return a-Math.floor(a); };
function noise(x,y) {
  const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy;
  const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v);
}
function field(x,y,t) {
  const a=noise(x*2.2+t*.23,y*2.2-t*.17);
  const b=noise(x*2.2-t*.19+8,y*2.2+t*.21);
  return noise(x*3+a*2.5,y*3+b*2.5+t*.18);
}
function buildQuote() {
 quoteWidth=Math.min(width*.9,1250);const fontSize=Math.min(110,quoteWidth/12.2);quoteHeight=fontSize*3.2;
 stencil.width=Math.ceil(quoteWidth);stencil.height=Math.ceil(quoteHeight);
 st.fillStyle='white';st.textAlign='center';st.textBaseline='middle';st.font=`700 ${fontSize}px Arial`;
 ['No woman in the room?','Pause the decision.'].forEach((line,i)=>st.fillText(line,quoteWidth/2,quoteHeight/2+(i-.5)*fontSize*1.45));
 quote=st.getImageData(0,0,stencil.width,stencil.height).data;
}
function quoteCoverage(x,y){const sx=Math.round(x-anchor.x+quoteWidth/2),sy=Math.round(y-anchor.y+quoteHeight/2);if(sx<0||sy<0||sx>=stencil.width||sy>=stencil.height)return 0;return quote[(sx+sy*stencil.width)*4+3]/255}
function resize() {
  width=innerWidth; height=innerHeight; tileSize=width<600?9:11;
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
  canvas.style.width=width+'px'; canvas.style.height=height+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  buildQuote(); cells.clear(); tiles=[];
  for(let y=tileSize/2;y<height;y+=tileSize)for(let x=tileSize/2;x<width;x+=tileSize){const cell={x,y,l:1,n:.5,seed:hash(x,y),opacity:0,bodyAlpha:0,quoteAlpha:0,energy:0};cells.set(x+","+y,cell);tiles.push(cell)}
  outline.width=canvas.width;outline.height=canvas.height;
  anchor={x:width/2,y:height/2};
}
resize(); addEventListener('resize',resize);
addEventListener('keydown',e=>{if(e.code==='Digit2'&&!e.repeat)parent.postMessage('switch-mode',location.origin)});

// Only opacity and glyph content change. Coordinates never leave the screen grid.
function layout(now){if(!mask)return;for(const cell of tiles){
 const u=(cell.x-width*.09)/(width*.82),v=(cell.y-height*.09)/(height*.82);
 const sx=Math.floor((1-u)*512),sy=Math.floor(v*384),inside=u>=0&&u<=1&&v>=0&&v<=1;
 const id=sx+sy*512,foreground=inside&&mask[id*4]>150;
 cell.l=foreground?(luminance?.[id]??1):1;
 const motion=foreground?Math.abs(cell.l-(previousLuma?.[id]??cell.l)):0;
 cell.energy=Math.max(cell.energy*.82,Math.min(1,motion*9));
 // High illumination always clears the shading, even when a region moves.
 const darkness=clamp((.78-cell.l)/.65,0,1);
 cell.inside=!!foreground;cell.opacity=foreground?Math.pow(darkness,.65)*(.82+cell.energy*.18):0;
}}
function updateOrbits(t){
 orbitPaths=[];for(const cell of tiles)cell.ringAlpha=0;
 for(const person of people){const cx=width*(.09+person.x*.82),cy=height*(.09+person.y*.82),rx=Math.max(60,person.w*width*.44),ry=Math.max(85,person.h*height*.43);
 for(let ring=0;ring<5;ring++){let points=[];const scale=1.04+ring*.13;
 for(let i=0;i<96;i++){const a=i/96*Math.PI*2,n=field(Math.cos(a)*.5+person.x+ring*.08,Math.sin(a)*.5+person.y,t*.25),warp=(n-.5)*(.14+ring*.035);points.push([cx+Math.cos(a)*(rx*scale+rx*warp),cy+Math.sin(a)*(ry*scale+ry*warp)])}
 points=smoothPath(points,true,2);orbitPaths.push(points);
 for(const [x,y] of points){const gx=Math.floor(x/tileSize),gy=Math.floor(y/tileSize);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const px=(gx+dx+.5)*tileSize,py=(gy+dy+.5)*tileSize,cell=cells.get(px+','+py);if(cell){const strength=Math.max(0,1-Math.hypot(cell.x-x,cell.y-y)/(tileSize*1.5));cell.ringAlpha=Math.max(cell.ringAlpha,strength*.95)}}}
 }}
}
function drawOrbits(){ctx.save();ctx.globalAlpha=(1-calm)*.55;ctx.strokeStyle='#333';ctx.lineWidth=.65;for(const points of orbitPaths){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke()}ctx.restore()}
function palmOpen(h) {
  const d=(a,b)=>Math.hypot(h[a].x-h[b].x,h[a].y-h[b].y);
  return [8,12,16,20].every(i=>d(i,0)>d(i-2,0)*1.1);
}
function draw(now) {
  if(!alive)return;
  const dt=Math.min((now-prev)/1000,.05);prev=now;
  const raised=hand&&now-handAt<650;
  calm=mix(calm,raised?1:0,1-Math.exp(-dt*3));
  if(now-lastLayout>85){layout(now);lastLayout=now}
  if(raised){
    const ids=[0,5,9,13,17];
    const hx=ids.reduce((s,i)=>s+1-hand[i].x,0)/ids.length;
    const hy=ids.reduce((s,i)=>s+hand[i].y,0)/ids.length;
    const tx=clamp(width/2+(hx-.5)*width*.6,quoteWidth/2+12,width-quoteWidth/2-12);
    const ty=clamp(height/2+(hy-.5)*height*.65,quoteHeight/2+20,height-quoteHeight/2-20);
    anchor.x=mix(anchor.x,tx,1-Math.exp(-dt*6));anchor.y=mix(anchor.y,ty,1-Math.exp(-dt*6));
  }
  const t=now*.001;
  if(raised&&!wasRaised)ripple={x:anchor.x,y:anchor.y,start:now};wasRaised=!!raised;
  if(now-lastNoise>110){if(!raised)for(const cell of tiles)cell.n=field(cell.x/width,cell.y/height,t*.5);lastNoise=now}
  ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
  ctx.drawImage(outline,0,0,width,height);
  if(now-lastOrbit>100){updateOrbits(t);lastOrbit=now}drawOrbits();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${tileSize*.94}px monospace`;ctx.fillStyle='#000';
  const fade=1-Math.exp(-dt*2.8),freeze=clamp(calm*1.35,0,1);
  const radius=ripple?(now-ripple.start)*.55:0,maxRadius=Math.hypot(width,height);
  if(radius>maxRadius+tileSize*3)ripple=null;
  for(const cell of tiles){
   // A portrait letter fades where it is; sentence cells appear at these same addresses.
   cell.bodyAlpha=cell.inside?mix(cell.bodyAlpha,cell.opacity*(1-freeze),fade):0;
   cell.quoteAlpha=mix(cell.quoteAlpha,(quoteCoverage(cell.x,cell.y)>.25?1:0)*calm,fade);
   const alpha=Math.max(cell.bodyAlpha,cell.quoteAlpha,(cell.ringAlpha||0)*(1-calm));
   if(alpha>.006){ctx.globalAlpha=alpha;const index=(Math.floor(cell.n*30)+Math.floor(cell.seed*52)+(!raised?Math.floor(t*2):0))%52;ctx.fillText(alphabet[index],cell.x,cell.y)}
   if(ripple){const distance=Math.hypot(cell.x-ripple.x,cell.y-ripple.y),band=Math.abs(distance-radius);if(band<tileSize*.85){ctx.globalAlpha=(1-band/(tileSize*.85))*.5*(1-radius/(maxRadius+tileSize*3));
    if(cell.seed>.55)ctx.fillText(alphabet[Math.floor(cell.seed*51)],cell.x,cell.y);
    else ctx.fillRect(cell.x-tileSize*.3,cell.y-.6,tileSize*.6,1.2);
   }}
  }
  ctx.globalAlpha=1;raf=requestAnimationFrame(draw);
}
raf=requestAnimationFrame(draw);
async function capture() {
  if(!alive)return;
  try{
    if(video.readyState>=2){
      if(model&&performance.now()-lastHand>140){lastHand=performance.now();const hands=model.detectForVideo(video,lastHand).landmarks;const h=hands.find(palmOpen);if(h){hand=h;handAt=performance.now()}else hand=null}
      await segment.send({image:video});
    }
  }catch(error){status.textContent='Tracking interrupted. Press 2 to leave, then reopen.'}
  if(alive)captureTimer=setTimeout(capture,65);
}
function dispose(){alive=false;cancelAnimationFrame(raf);clearTimeout(captureTimer);stream?.getTracks().forEach(t=>t.stop());model?.close();segment?.close()}
addEventListener('pagehide',dispose);
try {
  stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user',frameRate:{ideal:20,max:24}},audio:false});
  if(!alive){stream.getTracks().forEach(t=>t.stop())}else{
    video.srcObject=stream;await video.play();
    segment=new SelfieSegmentation({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/'+f});
    segment.setOptions({modelSelection:1});
    segment.onResults(r=>{
      if(!alive)return;
      sc.clearRect(0,0,512,384);sc.filter='blur(2px)';sc.drawImage(r.segmentationMask,0,0,512,384);sc.filter='none';mask=sc.getImageData(0,0,512,384).data;
      sc.filter='blur(1.4px)';sc.drawImage(video,0,0,512,384);sc.filter='none';const data=sc.getImageData(0,0,512,384).data;
      previousLuma=luminance;luminance=new Float32Array(512*384);for(let i=0;i<luminance.length;i++)luminance[i]=(data[i*4]+data[i*4+1]+data[i*4+2])/765;
      people=peopleBounds(mask,512,384);
      oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,outline.width,outline.height);
      const density=Math.min(devicePixelRatio||1,2);oc.setTransform(width*.82*density/512,0,0,height*.82*density/384,width*.09*density,height*.09*density);oc.strokeStyle='#171717';oc.lineWidth=.52;oc.lineJoin='round';oc.lineCap='round';
      const paths=[...contours(i=>mask[i*4]/255,512,384,.55),...contours(i=>mask[i*4]>210?luminance[i]:NaN,512,384,.43)];
      for(const path of paths){oc.beginPath();path.points.forEach(([x,y],i)=>{if(i===0)oc.moveTo(512-x,y);else oc.lineTo(512-x,y)});if(path.closed)oc.closePath();oc.stroke()}

    });
    status.textContent='Loading palm tracking…';
    const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    if(alive){model=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:2});status.textContent='';capture()}
  }
}catch(error){status.textContent=error.name==='NotAllowedError'?'Allow camera access, then press 2 to leave and reopen.':'Camera tracking could not load. Check your connection; press 2 to leave.';stream?.getTracks().forEach(t=>t.stop())}
