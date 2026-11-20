import {contours} from './portrait-geometry.js?v=suit-11';
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
let people=[],poseModel,lastPose=0,cameraColors;
const bodyLayer=document.createElement('canvas'),bc=bodyLayer.getContext('2d');
const maskLayer=document.createElement('canvas'),mc=maskLayer.getContext('2d');maskLayer.width=512;maskLayer.height=384;
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
 const sx=clamp(Math.floor((1-u)*512),0,511),sy=clamp(Math.floor(v*384),0,383),inside=u>=0&&u<=1&&v>=0&&v<=1;
 const id=sx+sy*512,foreground=inside&&mask[id*4]>150;
 cell.pixel=id;cell.l=foreground?(luminance?.[id]??1):1;
 const motion=foreground?Math.abs(cell.l-(previousLuma?.[id]??cell.l)):0;
 cell.energy=Math.max(cell.energy*.82,Math.min(1,motion*9));
 // High illumination always clears the shading, even when a region moves.
 const darkness=clamp((.78-cell.l)/.65,0,1);
 cell.inside=!!foreground;cell.opacity=foreground?Math.pow(darkness,.65)*(.82+cell.energy*.18):0;
}}
const skinPalette=[[246,207,175],[204,151,113],[132,85,63]];
const hairPalette=[[17,17,22],[37,34,38],[63,56,58]];
const otherPalette=[[242,241,236],[166,166,168],[85,85,91],[35,37,44],[108,135,166],[160,78,76]];
function nearest(rgb,palette){let best=palette[0],distance=Infinity;for(const c of palette){const d=c.reduce((sum,v,i)=>sum+(v-rgb[i])**2,0);if(d<distance){distance=d;best=c}}return best}
function cameraPalette(i,head){const rgb=[cameraColors[i],cameraColors[i+1],cameraColors[i+2]],brightness=(rgb[0]+rgb[1]+rgb[2])/765;
 if(brightness<.29)return nearest(rgb,hairPalette);
 const skin=rgb[0]>rgb[2]*1.12&&rgb[0]>=rgb[1]*.96&&rgb[1]>rgb[2]*.95;
 return nearest(rgb,skin&&head?skinPalette:otherPalette);
}
function outfit(cell,person){const u=(1-(cell.x/width-.09)/.82),v=(cell.y/height-.09)/.82;
 const nose=person.nose,shoulder=person.shoulder,cx=(person.left.x+person.right.x)/2,neck=person.neck;
 const isHead=v<neck&&Math.abs(u-nose.x)<shoulder*.57;
 if(v<=neck||Math.abs(u-cx)>shoulder*.72)return {head:isHead,color:null};
 const down=(v-neck)/(shoulder*1.33),across=Math.abs((u-cx)/shoulder);
 if(down<.26&&across<.32-down*.3)return {head:false,color:[250,249,244]};
 if(down>=.2&&down<1.38&&across<.115*(1-(down-.2)/1.18))return {head:false,color:[204,24,43]};
 if(down<1.45&&across<Math.max(.08,.3-down*.19))return {head:false,color:[250,249,244]};
 return {head:false,color:[18,20,27]};
}
const messageMask=document.createElement('canvas'),messageCtx=messageMask.getContext('2d',{willReadFrequently:true});let messageData,messageLayout,messageKey='';
function wrapText(text,font,maxWidth){ctx.font='800 '+font+'px Arial';const lines=[];let line='';for(const word of text.split(' ')){const trial=line?line+' '+word:word;if(line&&ctx.measureText(trial).width>maxWidth){lines.push(line);line=word}else line=trial}if(line)lines.push(line);return lines}
function fitMessage(){const pad=24,available=Math.max(width*.46,2*Math.min(anchor.x-pad,width-pad-anchor.x));const maxWidth=Math.min(width-pad*2,available);const key=Math.round(maxWidth/12)+','+width+','+height;
 if(key!==messageKey){let font=Math.min(180,width*.13,height*.2),lines;
  do{lines=wrapText('No woman in the room? Pause the decision.',font,maxWidth);if(lines.length*font*1.2<=height-pad*2)break;font*=.94}while(font>24);
  ctx.font='800 '+font+'px Arial';const w=Math.ceil(Math.max(...lines.map(line=>ctx.measureText(line).width))+12),h=Math.ceil(lines.length*font*1.2+12);
  messageMask.width=w;messageMask.height=h;messageCtx.font='800 '+font+'px Arial';messageCtx.textAlign='center';messageCtx.textBaseline='middle';messageCtx.fillStyle='#fff';lines.forEach((line,i)=>messageCtx.fillText(line,w/2,6+(i+.5)*font*1.2));
  messageData=messageCtx.getImageData(0,0,w,h).data;messageLayout={w,h,font,lines};messageKey=key;
 }
 const m=messageLayout;m.x=clamp(anchor.x,m.w/2+pad,width-m.w/2-pad);m.y=clamp(anchor.y,m.h/2+pad,height-m.h/2-pad);return m;
}
function drawMessage(){if(calm<.005)return;const m=fitMessage();ctx.save();ctx.globalAlpha=calm;ctx.fillStyle='#FF1493';ctx.font=`800 ${tileSize*.95}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
 for(const cell of tiles){const x=Math.floor(cell.x-m.x+m.w/2),y=Math.floor(cell.y-m.y+m.h/2);if(x<0||y<0||x>=m.w||y>=m.h||messageData[(x+y*m.w)*4+3]<120)continue;ctx.fillText(alphabet[Math.floor(cell.seed*51)],cell.x,cell.y)}
 ctx.font='800 '+m.font+'px Arial';ctx.lineWidth=1.3;ctx.strokeStyle='#FF1493';ctx.lineJoin='round';m.lines.forEach((line,i)=>ctx.strokeText(line,m.x,m.y-m.h/2+6+(i+.5)*m.font*1.2));ctx.restore();
}
function personEnvelope(x,y,p){
 const w=p.shoulder,n=p.nose;
 if(((x-n.x)/(w*.5))**2+((y-n.y)/(w*.65))**2<1)return true;
 const top=(p.left.y+p.right.y)/2-w*.1,bottom=Math.max(top+w*1.5,p.pose[23].y,p.pose[24].y),cx=(p.left.x+p.right.x)/2;
 if(y>=top&&y<=bottom&&Math.abs(x-cx)<w*(.64-.13*clamp((y-top)/(bottom-top),0,1)))return true;
 for(const [a,b] of [[11,13],[13,15],[12,14],[14,16]]){const A=p.pose[a],B=p.pose[b];if((A.visibility??0)<.55||(B.visibility??0)<.55)continue;const dx=B.x-A.x,dy=B.y-A.y,t=clamp(((x-A.x)*dx+(y-A.y)*dy)/(dx*dx+dy*dy||1),0,1);if(Math.hypot(x-A.x-t*dx,y-A.y-t*dy)<w*.22)return true}
 return false;
}
function palmOpen(h) {
  const d=(a,b)=>Math.hypot(h[a].x-h[b].x,h[a].y-h[b].y);
  return [8,12,16,20].every(i=>d(i,0)>d(i-2,0)*1.1);
}
function draw(now) {
  if(!alive)return;
  const dt=Math.min((now-prev)/1000,.05);prev=now;
  const raised=hand&&now-handAt<650;
  calm=mix(calm,raised?1:0,1-Math.exp(-dt*1.8));
  if(now-lastLayout>85){layout(now);lastLayout=now}
  if(raised){
    const ids=[0,5,9,13,17];
    const hx=ids.reduce((s,i)=>s+1-hand[i].x,0)/ids.length;
    const hy=ids.reduce((s,i)=>s+hand[i].y,0)/ids.length;
    const tx=clamp(width*(.09+hx*.82),24,width-24);
    const ty=clamp(height*(.09+hy*.82),24,height-24);
    anchor.x=mix(anchor.x,tx,1-Math.exp(-dt*6));anchor.y=mix(anchor.y,ty,1-Math.exp(-dt*6));
  }
  const t=now*.001;


  ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);

  bc.clearRect(0,0,width,height);bc.textAlign='center';bc.textBaseline='middle';bc.font=`800 ${tileSize*.96}px monospace`;
  for(const cell of tiles){if(!cell.inside)continue;
   const person=people.find(p=>cell.x/width>.09+(1-p.maxX)*.82&&cell.x/width<.09+(1-p.minX)*.82&&cell.y/height>.09+p.minY*.82&&cell.y/height<.09+p.maxY*.82);
   if(!person||!cameraColors)continue;
   const clothing=outfit(cell,person),color=clothing.color||cameraPalette(cell.pixel*4,clothing.head);
   bc.globalAlpha=1;bc.fillStyle='rgb('+color.join(',')+')';bc.fillRect(cell.x-tileSize/2,cell.y-tileSize/2,tileSize,tileSize);
   const faceFade=clothing.head ? .46 : 1;cell.bodyAlpha=mix(cell.bodyAlpha,cell.opacity*(1-calm)*faceFade,1-Math.exp(-dt*2.8));if(cell.bodyAlpha<.005)continue;
   const row=Math.floor(cell.y/tileSize),col=Math.floor(cell.x/tileSize),phrase=decisions[(row+Math.floor(now/5000))%decisions.length]+'   ';
   bc.globalAlpha=cell.bodyAlpha;bc.fillStyle=calm<.005?'#0000FF':`rgb(${Math.round(calm*255)},${Math.round(calm*20)},${Math.round(255-calm*108)})`;bc.fillText(phrase[col%phrase.length],cell.x,cell.y);
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
      if(poseModel&&performance.now()-lastPose>320){lastPose=performance.now();const result=poseModel.detectForVideo(video,lastPose);people=result.landmarks.filter(p=>(p[0].visibility??0)>.75&&(p[11].visibility??0)>.75&&(p[12].visibility??0)>.75&&Math.abs(p[11].x-p[12].x)>.18&&Math.abs(p[11].x-p[12].x)<.86&&Math.abs(p[11].y-p[0].y)>.06).map(p=>{const visible=p.filter(q=>(q.visibility??0)>.5);return {minX:clamp(Math.min(...visible.map(q=>q.x))-.09,0,1),maxX:clamp(Math.max(...visible.map(q=>q.x))+.09,0,1),minY:clamp(Math.min(...visible.map(q=>q.y))-.1,0,1),maxY:clamp(Math.max(...visible.map(q=>q.y))+.12,0,1),pose:p,left:p[11],right:p[12],neck:mix(p[0].y,(p[11].y+p[12].y)/2,.8),nose:p[0],shoulder:Math.abs(p[11].x-p[12].x)}})}
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
      const alpha=mc.createImageData(512,384);for(let y=0;y<384;y++)for(let x=0;x<512;x++){const i=(x+y*512)*4,valid=people.some(p=>x/512>=p.minX&&x/512<=p.maxX&&y/384>=p.minY&&y/384<=p.maxY&&personEnvelope(x/512,y/384,p));if(!valid)mask[i]=0;alpha.data[i+3]=mask[i]}mc.putImageData(alpha,0,0);
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
