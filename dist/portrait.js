import {isStopPalm} from './stop-gesture.js?v=bounded-15';
import { FilesetResolver, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';

const canvas = document.querySelector('#art');
const ctx = canvas.getContext('2d');
const video = document.querySelector('#cam');
const status = document.querySelector('#status');
const sample = document.createElement('canvas');
sample.width = 512;
sample.height = 384;
const sc = sample.getContext('2d', { willReadFrequently: true });
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const cells = new Map();
let tiles = [], mask, luminance, previousLuma, model, segment, stream;
let sourceCenter={x:0,y:0},transferSource={x:0,y:0},phraseTime=0,handConfirmations=0,transferAxis=null,transferGeometry=null,bodyBounds=null,transferBounds=null;
let transferCells=[],transferTargets=[],transferRoutes=new Map(),transferTargetKey='',contourBusy=false,lastContour=0;
const contourWorker=new Worker(new URL('./contour-worker.js?v=bounded-15',import.meta.url),{type:'module'});
let buildStarted=0,artBuild=0,outlineBuild=0,exitingAt=0;let contourPaths=[],contourLength=0,contourDirty=true,lastContourReveal=-1;let previouslyRaised=false;const messageFonts=['Georgia','"Palatino Linotype",Georgia','"Times New Roman"','"Baskerville",Georgia','"Book Antiqua",Georgia'];let messageFont=messageFonts[0];
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
const outlineTint=document.createElement("canvas"),ot=outlineTint.getContext("2d");
const outline=document.createElement("canvas"),oc=outline.getContext("2d");outline.width=512;outline.height=384;
let gridOffsetX=0,gridOffsetY=0,gridStep=0;let width, height, tileSize, quoteWidth, quoteHeight, hand = null, handAt = 0;
let calm = 0, anchor = { x: 0, y: 0 }, alive = true, raf, captureTimer;
let lastDraw=0;
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
  width=innerWidth; height=innerHeight; tileSize=gridStep||(width<600?12:15);gridOffsetX=-1;gridOffsetY=-1;
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
  canvas.style.width=width+'px'; canvas.style.height=height+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  buildQuote(); cells.clear(); tiles=[];
  for(let y=tileSize/2;y<height;y+=tileSize)for(let x=tileSize/2;x<width;x+=tileSize){const cell={x,y,col:Math.floor(x/tileSize),row:Math.floor(y/tileSize),l:1,n:.5,seed:hash(x,y),opacity:0,bodyAlpha:0,quoteAlpha:0,energy:0};cells.set(x+","+y,cell);tiles.push(cell)}
  outline.width=canvas.width;outline.height=canvas.height;outlineTint.width=canvas.width;outlineTint.height=canvas.height;bodyLayer.width=canvas.width;bodyLayer.height=canvas.height;bc.setTransform(dpr,0,0,dpr,0,0);
  anchor={x:width/2,y:height/2};
}
resize(); addEventListener('resize',resize);
function syncViewportGrid(){try{const frame=window.frameElement,style=parent.getComputedStyle(parent.document.documentElement),step=Number(style.getPropertyValue('--site-gridSpacing'))||15;if(step!==tileSize){gridStep=step;resize()}const rect=frame.getBoundingClientRect(),dx=((-rect.left%step)+step)%step,dy=((-rect.top%step)+step)%step;if(Math.abs(dx-gridOffsetX)>.01||Math.abs(dy-gridOffsetY)>.01){gridOffsetX=dx;gridOffsetY=dy;for(const cell of tiles){cell.x=(cell.col+.5)*step+dx;cell.y=(cell.row+.5)*step+dy}lastLayout=-Infinity}}catch{}}

addEventListener('keydown',e=>{if(e.code==='BracketRight'&&!e.repeat){e.preventDefault();parent.postMessage('toggle-adjustments',location.origin)}if(e.code==='Digit2'&&!e.repeat)parent.postMessage('switch-mode',location.origin)});

// Only opacity and glyph content change. Coordinates never leave the screen grid.
function layout(now){if(!mask)return;let sumX=0,sumY=0,count=0,minX=width,maxX=0,minY=height,maxY=0;for(const cell of tiles){
 const u=(cell.x-width*.09)/(width*.82),v=(cell.y-height*.09)/(height*.82);
 const sx=clamp(Math.floor((1-u)*512),0,511),sy=clamp(Math.floor(v*384),0,383),inside=u>=0&&u<=1&&v>=0&&v<=1;
 const id=sx+sy*512,foreground=inside&&mask[id*4]>150;
 cell.pixel=id;cell.l=foreground?(luminance?.[id]??1):1;
 const motion=foreground?Math.abs(cell.l-(previousLuma?.[id]??cell.l)):0;
 cell.energy=Math.max(cell.energy*.82,Math.min(1,motion*9));
 // High illumination always clears the shading, even when a region moves.
 const darkness=clamp((.78-cell.l)/.65,0,1);
 if(foreground){sumX+=cell.x;sumY+=cell.y;count++;minX=Math.min(minX,cell.x);maxX=Math.max(maxX,cell.x);minY=Math.min(minY,cell.y);maxY=Math.max(maxY,cell.y)}cell.inside=!!foreground;cell.opacity=foreground?Math.pow(darkness,.65)*(.82+cell.energy*.18):0;
}if(count){sourceCenter={x:sumX/count,y:sumY/count};bodyBounds={minX,maxX,minY,maxY}}}
const messageOutline=document.createElement('canvas'),mo=messageOutline.getContext('2d');const messageReveal=document.createElement('canvas'),mr=messageReveal.getContext('2d');
const messageMask=document.createElement('canvas'),messageCtx=messageMask.getContext('2d',{willReadFrequently:true});let messageData,messageLayout,messageKey='';
function wrapText(text,font,maxWidth){ctx.font='italic 800 '+font+'px '+messageFont;const lines=[];let line='';for(const word of text.split(' ')){const trial=line?line+' '+word:word;if(line&&ctx.measureText(trial).width>maxWidth){lines.push(line);line=word}else line=trial}if(line)lines.push(line);return lines}
function fitMessage(){const pad=24,available=Math.max(width*.46,2*Math.min(anchor.x-pad,width-pad-anchor.x));const maxWidth=Math.min(width*.76,width-pad*2,available);const key=Math.round(maxWidth/12)+','+width+','+height;
 if(key!==messageKey){let font=Math.min(88,width*.075,height*.12),lines;
  do{lines=wrapText('No woman in the room? Pause the decision.',font,maxWidth);if(lines.length*font*1.2<=height-pad*2)break;font*=.94}while(font>24);
  ctx.font='italic 800 '+font+'px '+messageFont;const w=Math.ceil(Math.max(...lines.map(line=>ctx.measureText(line).width))+12),h=Math.ceil(lines.length*font*1.2+12);
  messageMask.width=w;messageMask.height=h;messageCtx.font='italic 800 '+font+'px '+messageFont;messageCtx.textAlign='center';messageCtx.textBaseline='middle';messageCtx.fillStyle='#fff';lines.forEach((line,i)=>messageCtx.fillText(line,w/2,6+(i+.5)*font*1.2));
  messageOutline.width=w;messageOutline.height=h;messageReveal.width=w;messageReveal.height=h;mo.font='italic 800 '+font+'px '+messageFont;mo.textAlign='center';mo.textBaseline='middle';mo.strokeStyle='#fff';mo.lineWidth=.65;mo.lineJoin='round';lines.forEach((line,i)=>mo.strokeText(line,w/2,6+(i+.5)*font*1.2));messageData=messageCtx.getImageData(0,0,w,h).data;messageLayout={w,h,font,lines};messageKey=key;
 }
 const m=messageLayout;m.x=clamp(anchor.x,m.w/2+pad,width-m.w/2-pad);m.y=clamp(anchor.y,m.h/2+pad,height-m.h/2-pad);return m;
}
function drawMessage(now){const reveal=calm>0?1:0;if(reveal<.005)return;const m=fitMessage();ctx.save();ctx.globalAlpha=reveal;ctx.fillStyle=`rgb(${Math.round(calm*255)},${Math.round(calm*20)},${Math.round(255-calm*108)})`;ctx.font=`800 ${tileSize*.76}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
 for(const cell of tiles){const y=Math.floor(cell.y-m.y+m.h/2),x=Math.floor(cell.x-m.x+m.w/2-typeFlow(y,now));if(x<0||y<0||x>=m.w||y>=m.h||messageData[(x+y*m.w)*4+3]<120)continue;ctx.globalAlpha=sentenceVisibility(cell.x,cell.y);ctx.fillText(alphabet[Math.min(25,Math.floor(cell.seed*26))],cell.x,cell.y)}
 mo.globalCompositeOperation='source-in';mo.fillStyle=ctx.fillStyle;mo.fillRect(0,0,m.w,m.h);mo.globalCompositeOperation='source-over';
 mr.globalCompositeOperation='source-over';mr.clearRect(0,0,m.w,m.h);mr.drawImage(messageOutline,0,0);
 const ax=transferGeometry.axis,r=transferGeometry.sentence,cx=m.w/2,cy=m.h/2,mid=m.x*ax.x+m.y*ax.y;
 const gradient=mr.createLinearGradient(cx+ax.x*(r.min-mid),cy+ax.y*(r.min-mid),cx+ax.x*(r.max-mid),cy+ax.y*(r.max-mid));
 for(let i=0;i<=8;i++){const d=i/8;gradient.addColorStop(d,'rgba(0,0,0,'+smooth(.45+d*.3,.7+d*.3,calm)+')')}
 mr.globalCompositeOperation='destination-in';mr.fillStyle=gradient;mr.fillRect(0,0,m.w,m.h);mr.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 for(let y=0;y<m.h;y+=2){const h=Math.min(2,m.h-y);ctx.drawImage(messageReveal,0,y,m.w,h,m.x-m.w/2+typeFlow(y,now),m.y-m.h/2+y,m.w,h)}ctx.restore();
}
function typeFlow(y,now){return Math.sin(y*.035+now*.0009)*2.4+Math.sin(y*.083-now*.0006)*.8}
function smooth(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)}
function range(rect,axis){const v=[[rect.minX,rect.minY],[rect.maxX,rect.minY],[rect.minX,rect.maxY],[rect.maxX,rect.maxY]].map(([x,y])=>x*axis.x+y*axis.y);return {min:Math.min(...v),max:Math.max(...v)}}
function prepareTransfer(){const m=fitMessage(),body=transferBounds||bodyBounds||{minX:width*.2,maxX:width*.8,minY:height*.3,maxY:height*.9};
 if(!transferAxis){const ids=[0,5,9,13,17],targetX=hand?width*(.09+ids.reduce((sum,i)=>sum+1-hand[i].x,0)/5*.82):m.x,targetY=hand?height*(.09+ids.reduce((sum,i)=>sum+hand[i].y,0)/5*.82):m.y;let dx=targetX-transferSource.x,dy=targetY-transferSource.y;if(Math.hypot(dx,dy)<40)dy=-100;const l=Math.hypot(dx,dy);transferAxis={x:dx/l,y:dy/l}}
 const axis=transferAxis,side={x:-axis.y,y:axis.x},sentence={minX:m.x-m.w/2,maxX:m.x+m.w/2,minY:m.y-m.h/2,maxY:m.y+m.h/2};
 transferGeometry={axis,body:range(body,axis),sentence:range(sentence,axis),bodyCross:range(body,side),sentenceCross:range(sentence,side),side,m};
}
function cellProgress(x,y,r){const p=x*transferGeometry.axis.x+y*transferGeometry.axis.y;return clamp((p-r.min)/Math.max(1,r.max-r.min),0,1)}
function bodyVisibility(x,y){if(!transferGeometry)return 1;const d=cellProgress(x,y,transferGeometry.body);return 1-smooth(.05+d*.35,.3+d*.35,calm)}
function sentenceVisibility(x,y){if(!transferGeometry)return 0;const d=cellProgress(x,y,transferGeometry.sentence);return smooth(.45+d*.3,.7+d*.3,calm)}
function snapshotSources(){
 const occupied=new Map();for(const cell of tiles)if(cell.inside)occupied.set(Math.floor(cell.x/tileSize)+','+Math.floor(cell.y/tileSize),cell);
 const seen=new Set(),output=[];let component=0;
 for(const [key,cell] of occupied){if(seen.has(key))continue;const queue=[cell];seen.add(key);const points=[];
 for(let i=0;i<queue.length;i++){const q=queue[i],x=Math.floor(q.x/tileSize),y=Math.floor(q.y/tileSize);if(q.opacity>.035)points.push({x:q.x,y:q.y,seed:q.seed,opacity:q.opacity,component});for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]]){const id=(x+dx)+','+(y+dy),next=occupied.get(id);if(next&&!seen.has(id)){seen.add(id);queue.push(next)}}}
 if(queue.length>=6){output.push(...points);component++}
 }return output;
}
function updateTransferTargets(now){
 const m=transferGeometry.m,key=messageKey+','+Math.round(m.x/tileSize)+','+Math.round(m.y/tileSize);
 if(key===transferTargetKey)return;transferTargetKey=key;transferTargets=[];
 for(const cell of tiles){const y=Math.floor(cell.y-m.y+m.h/2),x=Math.floor(cell.x-m.x+m.w/2-typeFlow(y,now));if(x>=0&&y>=0&&x<m.w&&y<m.h&&messageData[(x+y*m.w)*4+3]>120)transferTargets.push(cell)}
 const axis=transferGeometry.axis;transferTargets.sort((a,b)=>(a.x-b.x)*axis.x+(a.y-b.y)*axis.y);
 if(!transferCells.length)transferCells=tiles.filter(c=>c.inside).map(c=>({x:c.x,y:c.y,seed:c.seed,opacity:c.opacity}));
 // Every source is an actual foreground grid cell, including disconnected people.
 transferCells.sort((a,b)=>a.component-b.component||(a.x-b.x)*axis.x+(a.y-b.y)*axis.y);
 for(let start=0;start<transferCells.length;){let end=start+1;while(end<transferCells.length&&transferCells[end].component===transferCells[start].component)end++;for(let i=start;i<end;i++)transferCells[i].fraction=(i-start)/Math.max(1,end-start-1);start=end}
 buildGridRoutes();
}
// Prepare a stationary sequence of grid addresses once. No glyph has a moving position.
function buildGridRoutes(){
 transferRoutes=new Map();if(!transferTargets.length)return;
 const add=(x,y,phase,weight)=>{const key=x+','+y;let route=transferRoutes.get(key);if(!route){route={phaseSum:0,weight:0};transferRoutes.set(key,route)}route.phaseSum+=phase*weight;route.weight+=weight};
 for(const source of transferCells){const target=transferTargets[Math.min(transferTargets.length-1,Math.floor(source.fraction*transferTargets.length))];
  let x=Math.floor(source.x/tileSize),y=Math.floor(source.y/tileSize);const tx=Math.floor(target.x/tileSize),ty=Math.floor(target.y/tileSize),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,total=Math.max(dx,dy,1);let error=dx-dy,step=0;
  while(true){add(x,y,.1+.8*step/total,Math.max(.15,source.opacity));if(x===tx&&y===ty)break;const e=error*2;if(e> -dy){error-=dy;x+=sx}if(e<dx){error+=dx;y+=sy}step++}
 }
 for(const route of transferRoutes.values())route.phase=route.phaseSum/route.weight;
}
function drawTransfer(now){if(calm<=0||calm>=1||!transferGeometry)return;updateTransferTargets(now);
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${tileSize*.76}px monospace`;ctx.fillStyle=`rgb(${Math.round(calm*255)},${Math.round(calm*20)},${Math.round(255-calm*108)})`;
 for(const cell of tiles){const route=transferRoutes.get(Math.floor(cell.x/tileSize)+','+Math.floor(cell.y/tileSize));if(!route)continue;
  // Adjacent cells light up and fade in order. Each cell always draws its own fixed glyph.
  const opacity=Math.exp(-Math.pow((calm-route.phase)/.13,2))*Math.sin(Math.PI*calm)*.72;
  if(opacity<.012)continue;ctx.globalAlpha=opacity;ctx.fillText(opinionGlyph(cell.x,cell.y,phraseTime),cell.x,cell.y);
 }ctx.restore();
}
function opinionGlyph(x,y,now){const epoch=Math.floor(now/2000),row=Math.floor(y/tileSize),col=Math.floor(x/tileSize),block=Math.floor(col/44);const pick=Math.floor(hash(row+epoch*17,block+epoch*31)*decisions.length),phrase=decisions[pick].toUpperCase()+' ';return phrase[(col%44)%phrase.length]}
function draw(now) {
  if(!alive)return;
  if(now-lastDraw<32){raf=requestAnimationFrame(draw);return}lastDraw=now;
  const elapsed=Math.max(0,(now-prev)/1000),dt=Math.min(elapsed,.05);prev=now;
  if(mask&&!buildStarted)buildStarted=now;const buildT=buildStarted?Math.max(0,(now-buildStarted)/3200):0;artBuild=smooth(0,1,buildT);outlineBuild=smooth(.3,1,buildT);if(exitingAt){const fade=1-smooth(0,1300,now-exitingAt);artBuild*=fade;outlineBuild*=fade}
  const raised=hand&&now-handAt<650;
  calm=clamp(calm+(raised?elapsed:-elapsed)/3,0,1);
  if(raised&&!previouslyRaised){messageFont=messageFonts[Math.floor(Math.random()*messageFonts.length)];messageKey='';transferSource={...sourceCenter};transferBounds=bodyBounds?{...bodyBounds}:null;transferAxis=null;phraseTime=now;transferCells=snapshotSources();transferTargetKey='';}previouslyRaised=!!raised;
  syncViewportGrid();
  if(now-lastLayout>85){layout(now);lastLayout=now}
  if(raised){
    const ids=[0,5,9,13,17];
    const hx=ids.reduce((s,i)=>s+1-hand[i].x,0)/ids.length;
    const hy=ids.reduce((s,i)=>s+hand[i].y,0)/ids.length;
    const tx=clamp(width*(.09+hx*.82),24,width-24);
    const ty=clamp(height*(.09+hy*.82),24,height-24);
    anchor.x=mix(anchor.x,tx,1-Math.exp(-dt*6));anchor.y=mix(anchor.y,ty,1-Math.exp(-dt*6));
  }
  if(calm>0)prepareTransfer();
  const t=now*.001;


  ctx.globalAlpha=1;ctx.clearRect(0,0,width,height);

  bc.clearRect(0,0,width,height);bc.textAlign='center';bc.textBaseline='middle';bc.font=`800 ${tileSize*.76}px monospace`;
  for(const cell of tiles){if(!cell.inside)continue;const birth=smooth(cell.seed*.68,cell.seed*.68+.32,artBuild);if(birth<.005)continue;
   bc.globalAlpha=birth;bc.fillStyle='#f9f9f9';bc.fillRect(cell.x-tileSize/2,cell.y-tileSize/2,tileSize,tileSize);bc.globalAlpha=.18*birth*bodyVisibility(cell.x,cell.y);bc.strokeStyle='#0000ff';bc.lineWidth=.5;bc.strokeRect(cell.x-tileSize/2,cell.y-tileSize/2,tileSize,tileSize);
   const faceFade=cell.y<sourceCenter.y-height*.08 ? .6 : 1;cell.bodyAlpha=birth*cell.opacity*bodyVisibility(cell.x,cell.y)*faceFade;if(cell.bodyAlpha<.005)continue;
   const glyph=artBuild<.99?alphabet[Math.min(25,Math.floor(hash(cell.col+Math.floor(now/90),cell.row)*26))]:opinionGlyph(cell.x,cell.y,calm>0?phraseTime:now);
   bc.globalAlpha=cell.bodyAlpha;bc.fillStyle=calm<.005?'#0000FF':`rgb(${Math.round(calm*255)},${Math.round(calm*20)},${Math.round(255-calm*108)})`;bc.fillText(glyph,cell.x,cell.y);
  }
  bc.save();bc.globalAlpha=1;bc.globalCompositeOperation='destination-in';bc.translate(width*.91,height*.09);bc.scale(-1,1);bc.drawImage(maskLayer,0,0,width*.82,height*.82);bc.restore();
  ctx.drawImage(bodyLayer,0,0,width,height);
  drawContourReveal(now);
  ot.globalCompositeOperation='source-over';ot.clearRect(0,0,outlineTint.width,outlineTint.height);ot.drawImage(outline,0,0);
  ot.globalCompositeOperation='source-in';ot.fillStyle=`rgb(${Math.round(calm*255)},${Math.round(calm*20)},${Math.round(255-calm*108)})`;ot.fillRect(0,0,outlineTint.width,outlineTint.height);
  ctx.drawImage(outlineTint,0,0,width,height);drawTransfer(now);drawMessage(now);
  ctx.globalAlpha=1;raf=requestAnimationFrame(draw);
}
raf=requestAnimationFrame(draw);
async function capture() {
  if(!alive)return;
  try{
    if(video.readyState>=2){
      if(model&&performance.now()-lastHand>140){lastHand=performance.now();const hands=model.detectForVideo(video,lastHand).landmarks;const h=hands.find(isStopPalm);handConfirmations=h?handConfirmations+1:0;if(h&&handConfirmations>=2){hand=h;handAt=performance.now()}else if(!h&&performance.now()-handAt>350)hand=null}
      await segment.send({image:video});
    }
  }catch(error){status.textContent='Tracking interrupted. Press 2 to leave, then reopen.'}
  if(alive)captureTimer=setTimeout(capture,65);
}
// Retain vector lengths and reveal a continuous ink path instead of fading in an outline.
contourWorker.onmessage=({data:paths})=>{contourBusy=false;if(!alive)return;contourLength=0;contourDirty=true;contourPaths=paths.map(path=>{const lengths=[0];let length=0;for(let i=1;i<path.points.length;i++){length+=Math.hypot(path.points[i][0]-path.points[i-1][0],path.points[i][1]-path.points[i-1][1]);lengths.push(length)}if(path.closed&&path.points.length>1)length+=Math.hypot(path.points[0][0]-path.points.at(-1)[0],path.points[0][1]-path.points.at(-1)[1]);const entry={...path,length,lengths,start:contourLength};contourLength+=length;return entry})};
function drawContourReveal(now){if(!contourDirty&&Math.abs(lastContourReveal-outlineBuild)<.002)return;contourDirty=false;lastContourReveal=outlineBuild;oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,outline.width,outline.height);const density=Math.min(devicePixelRatio||1,2);oc.setTransform(width*.82*density/512,0,0,height*.82*density/384,width*.09*density,height*.09*density);oc.strokeStyle='#171717';oc.lineWidth=.52;oc.lineJoin='round';oc.lineCap='round';const budget=contourLength*outlineBuild,t=now*.0001;for(const path of contourPaths){let remaining=budget-path.start;if(remaining<=0)break;oc.beginPath();let previous=null;for(let i=0;i<path.points.length;i++){const p=path.points[i],x=512-p[0]+Math.sin(p[0]*.018+p[1]*.012+t)*.4,y=p[1]+Math.sin(p[1]*.018-p[0]*.012+t)*.4;if(!previous){oc.moveTo(x,y);previous=[x,y];continue}const segment=path.lengths[i]-path.lengths[i-1];if(remaining<segment){const f=remaining/Math.max(segment,.001);oc.lineTo(previous[0]+(x-previous[0])*f,previous[1]+(y-previous[1])*f);break}oc.lineTo(x,y);remaining-=segment;previous=[x,y]}if(path.closed&&budget>=path.start+path.length)oc.closePath();oc.stroke()}}
addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data==='artwork-exit')exitingAt=performance.now()});

contourWorker.onerror=()=>{contourBusy=false;status.textContent='Outline worker failed. Reload to retry.'};
function dispose(){alive=false;contourWorker.terminate();cancelAnimationFrame(raf);clearTimeout(captureTimer);stream?.getTracks().forEach(t=>t.stop());model?.close();segment?.close()}
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
      mc.clearRect(0,0,512,384);const alpha=mc.createImageData(512,384);for(let i=0;i<512*384;i++)alpha.data[i*4+3]=mask[i*4];mc.putImageData(alpha,0,0);
      if(!contourBusy&&performance.now()-lastContour>180){contourBusy=true;lastContour=performance.now();contourWorker.postMessage({mask,luminance})}

    });
    status.textContent='Loading palm tracking…';
    const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    if(alive){model=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.6,minTrackingConfidence:.6});status.textContent='';capture()}
  }
}catch(error){status.textContent=error.name==='NotAllowedError'?'Allow camera access, then press 2 to leave and reopen.':'Camera tracking could not load. Check your connection; press 2 to leave.';stream?.getTracks().forEach(t=>t.stop())}
