import {contours} from './portrait-geometry.js?v=aura-10';
import { FilesetResolver, HandLandmarker, PoseLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';

const canvas = document.querySelector('#art');
const ctx = canvas.getContext('2d');
const video = document.querySelector('#cam');
const status = document.querySelector('#status');
const sample = document.createElement('canvas');
sample.width = 512;
sample.height = 384;
const sc = sample.getContext('2d', { willReadFrequently: true });
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const cells = new Map();
let tiles = [], mask, luminance, previousLuma, model, segment, stream;
let people=[],poseModel,lastPose=0,colorProgress=0,cameraColors;
const bodyLayer=document.createElement('canvas'),bc=bodyLayer.getContext('2d');
const maskLayer=document.createElement('canvas'),mc=maskLayer.getContext('2d');maskLayer.width=512;maskLayer.height=384;
const halo=document.createElement('canvas'),hc=halo.getContext('2d',{willReadFrequently:true});halo.width=128;halo.height=96;
const aura=document.createElement('canvas'),ac=aura.getContext('2d');aura.width=128;aura.height=96;let haloPixels;
const decisions=[
'We already have enough perspectives.','The men can make this call.','She can take the meeting notes.',
'Ask her to organize the refreshments.','We know what women want.','No need to ask the women.',
'We can invite her after the decision.','He looks more like a leader.','Give him the technical presentation.',
'She might not want the responsibility.','The boys discussed it over drinks.','We chose the team at golf.',
'The equipment fits us well enough.','That schedule works for all of us.',"She probably cannot travel anyway.",
'Let the men handle negotiations.','She can make the slides look nice.','We need someone more assertive.',
'We need someone less assertive.','Her concerns can wait until later.','The product is already designed.',
'We do not need another consultation.','He has the confidence for the job.','She should smile during the pitch.',
'The safety gear is one size fits all.','We can speak on her behalf.','Promotion is about being available.',
'He has a family to support.','We will discuss pay without her.','The decision has already been made.'
];
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
function buildQuote(){quoteWidth=Math.min(width*.9,1250);quoteHeight=Math.min(110,quoteWidth/12.2)*3.2}
function resize() {
  width=innerWidth; height=innerHeight; tileSize=width<600?9:11;
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
  canvas.style.width=width+'px'; canvas.style.height=height+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  buildQuote(); cells.clear(); tiles=[];
  for(let y=tileSize/2;y<height;y+=tileSize)for(let x=tileSize/2;x<width;x+=tileSize){const cell={x,y,l:1,n:.5,seed:hash(x,y),opacity:0,bodyAlpha:0,quoteAlpha:0,energy:0};cells.set(x+","+y,cell);tiles.push(cell)}
  outline.width=canvas.width;outline.height=canvas.height;bodyLayer.width=canvas.width;bodyLayer.height=canvas.height;bc.setTransform(dpr,0,0,dpr,0,0);
  anchor={x:width/2,y:height/2};
}
resize(); addEventListener('resize',resize);
addEventListener('keydown',e=>{if(e.code==='Digit2'&&!e.repeat)parent.postMessage('switch-mode',location.origin)});

// Only opacity and glyph content change. Coordinates never leave the screen grid.
function layout(now){if(!mask)return;for(const cell of tiles){
 const u=(cell.x-width*.09)/(width*.82),v=(cell.y-height*.09)/(height*.82);
 const sx=Math.floor((1-u)*512),sy=Math.floor(v*384),inside=u>=0&&u<=1&&v>=0&&v<=1;
 const id=sx+sy*512,foreground=inside&&mask[id*4]>150;
 cell.pixel=id;cell.l=foreground?(luminance?.[id]??1):1;
 const motion=foreground?Math.abs(cell.l-(previousLuma?.[id]??cell.l)):0;
 cell.energy=Math.max(cell.energy*.82,Math.min(1,motion*9));
 // High illumination always clears the shading, even when a region moves.
 const darkness=clamp((.78-cell.l)/.65,0,1);
 cell.inside=!!foreground;cell.opacity=foreground?Math.pow(darkness,.65)*(.82+cell.energy*.18):0;
}}
function renderAura(t){if(!haloPixels)return;const im=ac.createImageData(128,96);for(let y=0;y<96;y++)for(let x=0;x<128;x++){const i=(x+y*128)*4,n=field(x/128,y/96,t*1.4),sx=Math.min(511,x*4),sy=Math.min(383,y*4);const edge=Math.max(0,haloPixels[i+3]/255-(mask?.[(sx+sy*512)*4]??0)/255);const value=Math.round(35+n*110);im.data[i]=value;im.data[i+1]=value;im.data[i+2]=value;im.data[i+3]=edge*(.25+.75*n)*175}ac.putImageData(im,0,0)}
function drawMessage(){if(calm<.005)return;const size=Math.min(110,quoteWidth/12.2);ctx.save();ctx.font=`700 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=1.8;ctx.strokeStyle='#000';ctx.fillStyle='#fff';
 const lines=['No woman in the room?','Pause the decision.'];for(let i=0;i<2;i++){const y=anchor.y+(i-.5)*size*1.45,progress=clamp(calm*1.3-i*.15,0,1);ctx.save();ctx.beginPath();ctx.rect(anchor.x-quoteWidth/2,y+size*.7-progress*size*1.4,quoteWidth,size*1.4*progress);ctx.clip();ctx.fillText(lines[i],anchor.x,y);ctx.strokeText(lines[i],anchor.x,y);ctx.restore()}ctx.restore()}
function palmOpen(h) {
  const d=(a,b)=>Math.hypot(h[a].x-h[b].x,h[a].y-h[b].y);
  return [8,12,16,20].every(i=>d(i,0)>d(i-2,0)*1.1);
}
function draw(now) {
  if(!alive)return;
  const dt=Math.min((now-prev)/1000,.05);prev=now;
  const raised=hand&&now-handAt<650;
  calm=mix(calm,raised?1:0,1-Math.exp(-dt*1.8));colorProgress=clamp(colorProgress+(raised?dt/5:-dt/5),0,1);
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
  

  ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
  if(now-lastNoise>75){renderAura(t);lastNoise=now}ctx.save();ctx.globalAlpha=1-calm;ctx.drawImage(aura,width*.09,height*.09,width*.82,height*.82);ctx.restore();
  bc.clearRect(0,0,width,height);bc.textAlign='center';bc.textBaseline='middle';bc.font=`500 ${tileSize*.92}px monospace`;
  for(const cell of tiles){if(!cell.inside)continue;
   const person=people.find(p=>cell.x/width>.09+(1-p.maxX)*.82&&cell.x/width<.09+(1-p.minX)*.82&&cell.y/height>.09+p.minY*.82&&cell.y/height<.09+p.maxY*.82);
   let radius=1;if(person){const cx=width*(.09+(1-(person.minX+person.maxX)/2)*.82),cy=height*(.09+(person.minY+person.maxY)/2*.82);radius=Math.max(Math.abs(cell.x-cx)/(width*(person.maxX-person.minX)*.41),Math.abs(cell.y-cy)/(height*(person.maxY-person.minY)*.41))}
   const reveal=clamp((colorProgress*1.25-radius)/.2,0,1);
   if(reveal>0&&cameraColors){const i=cell.pixel*4;bc.globalAlpha=reveal;bc.fillStyle=`rgb(${cameraColors[i]},${cameraColors[i+1]},${cameraColors[i+2]})`;bc.fillRect(cell.x-tileSize/2,cell.y-tileSize/2,tileSize,tileSize)}
   let faceFade=1;if(person){const nx=width*(.09+(1-person.nose.x)*.82),ny=height*(.09+person.nose.y*.82);if(Math.hypot(cell.x-nx,cell.y-ny)<width*person.shoulder*.38)faceFade=.45}
   cell.bodyAlpha=mix(cell.bodyAlpha,cell.opacity*(1-calm)*faceFade,1-Math.exp(-dt*2.8));if(cell.bodyAlpha<.005)continue;
   const row=Math.floor(cell.y/tileSize),col=Math.floor(cell.x/tileSize),phrase=decisions[(row+Math.floor(now/5000))%decisions.length]+'   ';
   bc.globalAlpha=cell.bodyAlpha;bc.fillStyle='#111';bc.fillText(phrase[col%phrase.length],cell.x,cell.y);
  }
  bc.save();bc.globalAlpha=1;bc.globalCompositeOperation='destination-in';bc.translate(width*.91,height*.09);bc.scale(-1,1);bc.drawImage(maskLayer,0,0,width*.82,height*.82);bc.restore();
  ctx.drawImage(bodyLayer,0,0,width,height);ctx.drawImage(outline,0,0,width,height);drawMessage();
  ctx.globalAlpha=1;raf=requestAnimationFrame(draw);
}
raf=requestAnimationFrame(draw);
async function capture() {
  if(!alive)return;
  try{
    if(video.readyState>=2){
      if(model&&performance.now()-lastHand>140){lastHand=performance.now();const hands=model.detectForVideo(video,lastHand).landmarks;const h=hands.find(palmOpen);if(h){hand=h;handAt=performance.now()}else hand=null}
      if(poseModel&&performance.now()-lastPose>320){lastPose=performance.now();const result=poseModel.detectForVideo(video,lastPose);people=result.landmarks.filter(p=>(p[11].visibility??0)>.65&&(p[12].visibility??0)>.65&&Math.abs(p[11].x-p[12].x)>.14&&Math.abs(p[11].y-p[0].y)>.06).map(p=>{const visible=p.filter(q=>(q.visibility??0)>.5);return {minX:clamp(Math.min(...visible.map(q=>q.x))-.09,0,1),maxX:clamp(Math.max(...visible.map(q=>q.x))+.09,0,1),minY:clamp(Math.min(...visible.map(q=>q.y))-.1,0,1),maxY:clamp(Math.max(...visible.map(q=>q.y))+.12,0,1),nose:p[0],shoulder:Math.abs(p[11].x-p[12].x)}})}
      await segment.send({image:video});
    }
  }catch(error){status.textContent='Tracking interrupted. Press 2 to leave, then reopen.'}
  if(alive)captureTimer=setTimeout(capture,65);
}
function dispose(){alive=false;cancelAnimationFrame(raf);clearTimeout(captureTimer);stream?.getTracks().forEach(t=>t.stop());model?.close();poseModel?.close();segment?.close()}
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
      cameraColors=data;
      const alpha=mc.createImageData(512,384);for(let y=0;y<384;y++)for(let x=0;x<512;x++){const i=(x+y*512)*4,valid=people.some(p=>x/512>=p.minX&&x/512<=p.maxX&&y/384>=p.minY&&y/384<=p.maxY);if(!valid)mask[i]=0;alpha.data[i+3]=mask[i]}mc.putImageData(alpha,0,0);hc.clearRect(0,0,128,96);hc.filter='blur(5px)';hc.drawImage(maskLayer,0,0,128,96);hc.filter='none';haloPixels=hc.getImageData(0,0,128,96).data;
      oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,outline.width,outline.height);
      const density=Math.min(devicePixelRatio||1,2);oc.setTransform(width*.82*density/512,0,0,height*.82*density/384,width*.09*density,height*.09*density);oc.strokeStyle='#171717';oc.lineWidth=.52;oc.lineJoin='round';oc.lineCap='round';
      const paths=[...contours(i=>mask[i*4]/255,512,384,.55),...contours(i=>mask[i*4]>210?luminance[i]:NaN,512,384,.43)];
      for(const path of paths){oc.beginPath();path.points.forEach(([x,y],i)=>{if(i===0)oc.moveTo(512-x,y);else oc.lineTo(512-x,y)});if(path.closed)oc.closePath();oc.stroke()}

    });
    status.textContent='Loading palm tracking…';
    const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    if(alive){model=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:2});poseModel=await PoseLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:3,minPoseDetectionConfidence:.65,minPosePresenceConfidence:.65});status.textContent='';capture()}
  }
}catch(error){status.textContent=error.name==='NotAllowedError'?'Allow camera access, then press 2 to leave and reopen.':'Camera tracking could not load. Check your connection; press 2 to leave.';stream?.getTracks().forEach(t=>t.stop())}
