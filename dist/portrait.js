import { FilesetResolver, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';

const canvas = document.querySelector('#art');
const ctx = canvas.getContext('2d');
const video = document.querySelector('#cam');
const status = document.querySelector('#status');
const sample = document.createElement('canvas');
sample.width = 256;
sample.height = 192;
const sc = sample.getContext('2d', { willReadFrequently: true });
const stencil = document.createElement('canvas');
const st = stencil.getContext('2d', { willReadFrequently: true });
const sky = document.createElement('canvas');
sky.width = 180;
sky.height = 120;
const skyCtx = sky.getContext('2d');
const thermal = document.createElement('canvas'); thermal.width=160;thermal.height=120;
const heatCtx=thermal.getContext('2d');
const heatPalette=[[27,23,100],[67,51,184],[37,143,193],[66,207,165],[246,220,105],[255,119,97],[255,232,183]];
function heatColor(value){const k=clamp(value,0,.999)*6,i=Math.floor(k);return heatPalette[i].map((c,j)=>Math.round(mix(c,heatPalette[i+1][j],k-i)))}
function bodyHeat(u,v,n){const x=Math.floor((1-(u-.09)/.82)*256),y=Math.floor((v-.09)/.82*192);if(!mask||x<0||x>255||y<0||y>191)return {strength:0,heat:0};const id=x+y*256;return {strength:mask[id*4]/255,heat:clamp(.18+(luminance?.[id]??.4)*.45+n*.45,0,1)}}
function renderThermal(t){const im=heatCtx.createImageData(160,120);for(let y=0;y<120;y++)for(let x=0;x<160;x++){let u=x/160,v=y/120,n=field(u,v,t*1.8),h=bodyHeat(u,v,n),c=heatColor(h.heat),i=(x+y*160)*4;im.data[i]=c[0];im.data[i+1]=c[1];im.data[i+2]=c[2];im.data[i+3]=h.strength*220}heatCtx.putImageData(im,0,0)}
const rainbow = [[255,114,145],[255,167,123],[251,220,143],[188,218,152],[85,193,171],[123,178,205],[190,155,215]];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const cells = new Map();
let tiles = [], drops = [], quote = [], mask, luminance, previousLuma, model, segment, stream;
const outline=document.createElement("canvas"),oc=outline.getContext("2d");outline.width=256;outline.height=192;
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
function colorAt(x,y,n) {
  const k=clamp((y*.72+x*.1+(n-.5)*1.5)*6,0,5.999), i=Math.floor(k);
  return rainbow[i].map((c,j)=>Math.round(mix(c,rainbow[i+1][j],k-i)));
}
function buildQuote() {
  quoteWidth=Math.min(width*.86,1050);
  const fontSize=Math.min(92,quoteWidth/12.7);
  quoteHeight=fontSize*3.2;
  stencil.width=Math.ceil(quoteWidth); stencil.height=Math.ceil(quoteHeight);
  st.fillStyle='white'; st.textAlign='center'; st.textBaseline='middle';
  st.font=`700 ${fontSize}px Arial`;
  ['No woman in the room?','Pause the decision.'].forEach((line,i)=>st.fillText(line,quoteWidth/2,quoteHeight/2+(i-.5)*fontSize*1.45));
  const data=st.getImageData(0,0,stencil.width,stencil.height).data;
  quote=[];
  const step=width<600?3:4;
  for(let y=0;y<stencil.height;y+=step) for(let x=0;x<stencil.width;x+=step) {
    if(data[(x+y*stencil.width)*4+3]>150) quote.push({x:x-quoteWidth/2,y:y-quoteHeight/2});
  }
}
function resize() {
  width=innerWidth; height=innerHeight; tileSize=width<600?14:18;
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
  canvas.style.width=width+'px'; canvas.style.height=height+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  buildQuote(); cells.clear(); tiles=[]; drops=[];
  anchor={x:width/2,y:height/2};
}
resize(); addEventListener('resize',resize);
addEventListener('keydown',e=>{if(e.code==='Digit2'&&!e.repeat)parent.postMessage('switch-mode',location.origin)});

// Spatial cell keys preserve every separate foreground silhouette: no random target reassignment.
function layout(now) {
  if(!mask) return;
  const scale=.82, vw=width*scale, vh=height*scale, ox=(width-vw)/2, oy=(height-vh)/2;
  const seen=new Set();
  for(let y=oy;y<oy+vh;y+=tileSize) for(let x=ox;x<ox+vw;x+=tileSize) {
    const sx=clamp(Math.floor((1-(x+tileSize/2-ox)/vw)*256),0,255);
    const sy=clamp(Math.floor((y+tileSize/2-oy)/vh*192),0,191), i=sx+sy*256;
    if(mask[i*4]<150)continue;
    const key=Math.round(x/tileSize)+','+Math.round(y/tileSize); seen.add(key);
    let cell=cells.get(key);
    if(!cell){cell={key,x:x+tileSize/2,y:y+tileSize/2,px:x+tileSize/2,py:y+tileSize/2,opacity:0,n:.5,l:.5,seed:hash(x,y),born:now};cells.set(key,cell)}
    cell.x=x+tileSize/2; cell.y=y+tileSize/2; cell.l=luminance?.[i]??.5;
    const motion=Math.abs(cell.l-(previousLuma?.[i]??cell.l));
    cell.energy=Math.max((cell.energy??0)*.84,Math.min(1,motion*10));
    cell.opacity=clamp((.7-cell.l)*1.1+(cell.energy||0)*.65,.03,.9);
    cell.seen=now;
  }
  for(const [key,cell] of cells) if(!seen.has(key)&&now-cell.seen>300)cells.delete(key);
  tiles=Array.from(cells.values()).sort((a,b)=>a.y-b.y||a.x-b.x);
}
function renderSky(t) {
  const image=skyCtx.createImageData(sky.width,sky.height);
  for(let y=0;y<sky.height;y++)for(let x=0;x<sky.width;x++) {
    const u=x/sky.width,v=y/sky.height,n=field(u,v,t),h=bodyHeat(u,v,n),c=colorAt(u,v,clamp(n+(h.heat-.4)*h.strength*.25,0,1)),i=(x+y*sky.width)*4;
    image.data[i]=c[0];image.data[i+1]=c[1];image.data[i+2]=c[2];image.data[i+3]=255;
  }
  skyCtx.putImageData(image,0,0);
}
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
  if(now-lastNoise>65){for(const q of tiles)q.n=field(q.x/width,q.y/height,t*.5);lastNoise=now}
  ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
  ctx.drawImage(outline,width*.09,height*.09,width*.82,height*.82);
  // Only a small minority shed. The fixed cell beneath replenishes immediately.
  if(!raised&&tiles.length&&now-lastDrop>430&&drops.length<14){
    const q=tiles[Math.floor(Math.random()*tiles.length)];
    drops.push({x:q.x,y:q.y,vx:0,vy:12+Math.random()*18,ch:alphabet[Math.floor(q.n*51)],life:0});lastDrop=now;
  }
  const total=Math.max(tiles.length,Math.ceil(quote.length/2));
  for(let i=0;i<total;i++) {
    const body=tiles[i%Math.max(1,tiles.length)];if(!body)continue;
    const dest=quote[Math.floor(i/total*quote.length)];
    const tx=dest?anchor.x+dest.x:body.x,ty=dest?anchor.y+dest.y:body.y;
    const progress=clamp((calm-body.seed*.12)/.88,0,1),ease=progress*progress*(3-2*progress);
    const x=mix(body.x,tx,ease),y=mix(body.y,ty,ease);
    // Settled cells stay exactly on their grid. Only contents and tone animate.
    const n=body.n,shade=Math.round(32+clamp((n-.22)*1.8,0,1)*205);
    const bodyAlpha=i<tiles.length?(body.opacity??.5):0;
    ctx.globalAlpha=mix(bodyAlpha,.95,calm);
    ctx.font=`400 ${mix(tileSize*.68,4.8,calm)}px monospace`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#171717';
    const animatedIndex=(Math.floor(n*30)+Math.floor(t*2)+Math.floor(body.seed*52))%52;
    if(!raised||body.frozenIndex===undefined)body.frozenIndex=animatedIndex;
    const index=raised?body.frozenIndex:animatedIndex;
    ctx.fillText(alphabet[index],x,y);
  }
  ctx.font=`600 ${tileSize*.8}px monospace`;ctx.textAlign='center';ctx.fillStyle='#222';
  for(let i=drops.length-1;i>=0;i--){let q=drops[i];q.life+=dt*(1-calm);q.vy+=dt*65*(1-calm);q.y+=q.vy*dt*(1-calm);ctx.globalAlpha=(1-calm)*Math.min(1,(5-q.life)*.8);ctx.fillText(q.ch,q.x,q.y);if(q.y>height+30||q.life>5)drops.splice(i,1)}
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
      sc.clearRect(0,0,256,192);sc.drawImage(r.segmentationMask,0,0,256,192);mask=sc.getImageData(0,0,256,192).data;
      sc.drawImage(video,0,0,256,192);const data=sc.getImageData(0,0,256,192).data;
      previousLuma=luminance;luminance=new Float32Array(256*192);for(let i=0;i<luminance.length;i++)luminance[i]=(data[i*4]+data[i*4+1]+data[i*4+2])/765;
      // Continuous contour paths from foreground and camera tonal levels, not skeleton joints.
      oc.clearRect(0,0,256,192);oc.strokeStyle='#161616';oc.lineWidth=.48;oc.lineJoin='round';
      const levels=[.25,.43,.62];
      function contour(value,level){oc.beginPath();for(let y=1;y<190;y+=2)for(let x=1;x<254;x+=2){const corners=[[x,y],[x+2,y],[x+2,y+2],[x,y+2]],v=corners.map(([a,b])=>value(a+b*256));const hits=[];for(let e=0;e<4;e++){let j=(e+1)%4;if((v[e]>=level)!==(v[j]>=level)){const f=(level-v[e])/(v[j]-v[e]);hits.push([corners[e][0]+(corners[j][0]-corners[e][0])*f,corners[e][1]+(corners[j][1]-corners[e][1])*f])}}for(let e=0;e+1<hits.length;e+=2){oc.moveTo(256-hits[e][0],hits[e][1]);oc.lineTo(256-hits[e+1][0],hits[e+1][1])}}oc.stroke()}
      contour(i=>mask[i*4]/255,.55);for(const level of levels)contour(i=>mask[i*4]>150?luminance[i]:1,level);

    });
    status.textContent='Loading palm tracking…';
    const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    if(alive){model=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:2});status.textContent='';capture()}
  }
}catch(error){status.textContent=error.name==='NotAllowedError'?'Allow camera access, then press 2 to leave and reopen.':'Camera tracking could not load. Check your connection; press 2 to leave.';stream?.getTracks().forEach(t=>t.stop())}
