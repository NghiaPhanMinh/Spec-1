const room=window.room={running:false,calm:0,time:45000};
new p5(p=>{
 let field,letters,starSprite,phase=Math.random()*90,t=0,lastLetters=-1,cols,rows,values,colors,fw,fh;
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
 const palette=[[255,105,126],[255,155,117],[250,211,130],[213,218,143],[91,186,165],[111,175,183],[175,150,191]];
 function setupLayers(){cols=Math.ceil(p.width/10);rows=Math.ceil(p.height/12);fw=Math.min(360,Math.ceil(p.width/4));fh=Math.ceil(fw*p.height/p.width);values=new Float32Array(fw*fh);colors=new Float32Array(fw*fh*3);field=p.createImage(fw,fh);letters=p.createGraphics(p.width,p.height);letters.pixelDensity(Math.min(devicePixelRatio||1,2));letters.textFont('monospace');letters.textSize(7);letters.noStroke();}
 p.setup=()=>{p.createCanvas(innerWidth,innerHeight).parent('art');p.pixelDensity(Math.min(devicePixelRatio||1,2));p.frameRate(30);p.noiseDetail(2,.5);setupLayers();buildStar();addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Space'){e.preventDefault();room.running=!room.running}if(e.code==='Digit1'||e.code==='Numpad1'){e.preventDefault();window.toggleCamera?.()}})};
 addEventListener('portrait-enter',()=>p.noLoop());addEventListener('portrait-exit',()=>p.loop());p.windowResized=()=>{p.resizeCanvas(innerWidth,innerHeight);setupLayers()};
 function renderField(){let c=room.calm;field.loadPixels();for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){let u=x/fw,v=y/fh,a=p.noise(u*2+t*.12+phase,v*2-t*.1),b=p.noise(u*2+7-t*.09,v*2+t*.08),n=p.noise(u*2.6+a*2,v*2.6+b*2,t*.16);
 let gray=p.constrain((n-.32)*2.6,0,1);
 let k=p.constrain((v*.75+u*.12+(n-.5)*1.4)*6,0,5.999),lo=Math.floor(k),f=k-lo,id=x+y*fw;values[id]=p.lerp(gray,n,c);let i=id*4;for(let ch=0;ch<3;ch++){let color=p.lerp(10+gray*238,p.lerp(palette[lo][ch],palette[lo+1][ch],f),c);field.pixels[i+ch]=color;colors[id*3+ch]=color}field.pixels[i+3]=255}field.updatePixels();}
 function renderLetters(){letters.clear();let c=room.calm,step=Math.floor(t*7);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let sx=Math.min(fw-1,Math.floor(x/cols*fw)),sy=Math.min(fh-1,Math.floor(y/rows*fh)),id=sx+sy*fw,n=values[id],dx=values[Math.min(fw*fh-1,id+1)]-n,dy=values[Math.min(fw*fh-1,id+fw)]-n,idx=(Math.floor(n*230)+step)%alphabet.length;
 // Glyph identity, position, brightness and rotation all follow the noise itself.
 let offset=p.lerp(24,12,c)*(n-.5);letters.fill(p.constrain(colors[id*3]+offset,0,255),p.constrain(colors[id*3+1]+offset,0,255),p.constrain(colors[id*3+2]+offset,0,255));letters.push();letters.translate(x*10+dx*9,y*12+8+dy*9);letters.rotate(Math.atan2(dy,dx)*.15*(1-c));letters.text(alphabet[idx],0,0);letters.pop()}}
 // Pre-render a white optical bloom: broad Gaussian halo and four feathered rays.
 // All clock elements reuse this raster sprite; no stroked dial or hand geometry.
 function buildStar(){
  starSprite=p.createImage(256,256);starSprite.loadPixels();
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const u=(x-127.5)/128,v=(y-127.5)/128,r=Math.hypot(u,v),a=Math.atan2(v,u);
   const ray=.19+.35*Math.pow(Math.abs(Math.cos(a*2)),10);
   const core=Math.exp(-Math.pow(r/ray,3)*1.7);
   const halo=.3*Math.exp(-r*r/ .24);
   const bloom=.35*Math.exp(-r*r/ .018);
   const opacity=Math.min(1,core+halo+bloom)*Math.pow(Math.max(0,1-r*r),2);
   const i=(x+y*256)*4;starSprite.pixels[i]=255;starSprite.pixels[i+1]=255;starSprite.pixels[i+2]=255;starSprite.pixels[i+3]=Math.round(opacity*255);
  }starSprite.updatePixels();
 }
 function star(x,y,size,rotation,alpha=1){
  p.push();p.translate(x,y);p.rotate(rotation);p.imageMode(p.CENTER);p.tint(255,alpha*255);p.image(starSprite,0,0,size,size);p.pop();
 }
 function clock(){
  const r=Math.min(p.width*.33,p.height*.32),dc=p.drawingContext;
  p.push();p.translate(p.width/2,p.height/2);p.blendMode(p.BLEND);
  // A feathered shadow provides local contrast without a visible disk boundary.
  const shade=dc.createRadialGradient(0,0,r*.12,0,0,r*1.35);
  shade.addColorStop(0,'rgba(0,0,0,.15)');shade.addColorStop(.7,'rgba(0,0,0,.11)');shade.addColorStop(1,'rgba(0,0,0,0)');
  dc.fillStyle=shade;dc.fillRect(-r*1.4,-r*1.4,r*2.8,r*2.8);
  for(let i=0;i<12;i++){
   const a=i*p.TWO_PI/12-p.HALF_PI;
   star(Math.cos(a)*r,Math.sin(a)*r,r*(i%3===0?.48:.34),a,.9);
  }
  // The hands are stars. Time is encoded by their angle and orbit radius.
  const hour=room.time/43200*p.TWO_PI-p.HALF_PI;
  const minute=room.time/3600*p.TWO_PI-p.HALF_PI;
  const second=Math.floor(room.time)/60*p.TWO_PI-p.HALF_PI;
  star(Math.cos(hour)*r*.4,Math.sin(hour)*r*.4,r*.69,hour,1);
  star(Math.cos(minute)*r*.73,Math.sin(minute)*r*.73,r*.57,minute,1);
  star(Math.cos(second)*r,Math.sin(second)*r,r*.44,second,1);
  p.pop();
 }
 p.draw=()=>{let dt=Math.min(p.deltaTime/1000,.1);room.calm=p.lerp(room.calm,room.running?1:0,1-Math.exp(-dt*1.7));if(room.running)room.time+=dt;t+=dt*p.lerp(.9,1.05,room.calm);renderField();p.image(field,0,0,p.width,p.height);if(p.frameCount%3===0||lastLetters<0){renderLetters();lastLetters=p.frameCount}p.image(letters,0,0);clock()};
});
