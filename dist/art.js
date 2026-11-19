const room=window.room={running:false,calm:0,time:45000};
new p5(p=>{
 let field,letters,kind=Math.floor(Math.random()*3),phase=Math.random()*90,t=0,lastLetters=-1,cols,rows,values,colors,fw,fh;
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
 const palette=[[255,105,126],[255,155,117],[250,211,130],[213,218,143],[91,186,165],[111,175,183],[175,150,191]];
 function setupLayers(){cols=Math.ceil(p.width/10);rows=Math.ceil(p.height/12);fw=Math.min(360,Math.ceil(p.width/4));fh=Math.ceil(fw*p.height/p.width);values=new Float32Array(fw*fh);colors=new Float32Array(fw*fh*3);field=p.createImage(fw,fh);letters=p.createGraphics(p.width,p.height);letters.pixelDensity(Math.min(devicePixelRatio||1,2));letters.textFont('monospace');letters.textSize(7);letters.noStroke();}
 p.setup=()=>{p.createCanvas(innerWidth,innerHeight).parent('art');p.pixelDensity(Math.min(devicePixelRatio||1,2));p.frameRate(30);p.noiseDetail(2,.5);setupLayers();addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Space'){e.preventDefault();room.running=!room.running}if(e.code==='Digit1'||e.code==='Numpad1'){e.preventDefault();window.toggleCamera?.()}})};
 addEventListener('portrait-enter',()=>p.noLoop());addEventListener('portrait-exit',()=>p.loop());p.windowResized=()=>{p.resizeCanvas(innerWidth,innerHeight);setupLayers()};
 function renderField(){let c=room.calm;field.loadPixels();for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){let u=x/fw,v=y/fh,a=p.noise(u*2+t*.12+phase,v*2-t*.1),b=p.noise(u*2+7-t*.09,v*2+t*.08),n=p.noise(u*2.6+a*2,v*2.6+b*2,t*.16);
 let gray=p.constrain((n-.32)*2.6,0,1);
 let k=p.constrain((v*.75+u*.12+(n-.5)*1.4)*6,0,5.999),lo=Math.floor(k),f=k-lo,id=x+y*fw;values[id]=p.lerp(gray,n,c);let i=id*4;for(let ch=0;ch<3;ch++){let color=p.lerp(10+gray*238,p.lerp(palette[lo][ch],palette[lo+1][ch],f),c);field.pixels[i+ch]=color;colors[id*3+ch]=color}field.pixels[i+3]=255}field.updatePixels();}
 function renderLetters(){letters.clear();let c=room.calm,step=Math.floor(t*7);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let sx=Math.min(fw-1,Math.floor(x/cols*fw)),sy=Math.min(fh-1,Math.floor(y/rows*fh)),id=sx+sy*fw,n=values[id],dx=values[Math.min(fw*fh-1,id+1)]-n,dy=values[Math.min(fw*fh-1,id+fw)]-n,idx=(Math.floor(n*230)+step)%alphabet.length;
 // Glyph identity, position, brightness and rotation all follow the noise itself.
 let offset=p.lerp(24,12,c)*(n-.5);letters.fill(p.constrain(colors[id*3]+offset,0,255),p.constrain(colors[id*3+1]+offset,0,255),p.constrain(colors[id*3+2]+offset,0,255));letters.push();letters.translate(x*10+dx*9,y*12+8+dy*9);letters.rotate(Math.atan2(dy,dx)*.15*(1-c));letters.text(alphabet[idx],0,0);letters.pop()}}
 function clock(){
  const r=Math.min(p.width*.33,p.height*.32),dc=p.drawingContext;
  p.push();p.translate(p.width/2,p.height/2);p.blendMode(p.BLEND);
  // A quiet glass dial and a single blue luminous edge preserve the background.
  p.noStroke();p.fill(10,25,55,30);p.circle(0,0,r*2);
  p.noFill();p.stroke(115,183,255,220);p.strokeWeight(2);
  dc.shadowColor='#368cff';dc.shadowBlur=kind===0?20:28;p.circle(0,0,r*2);
  dc.shadowBlur=kind===2?12:5;
  for(let i=0;i<12;i++){
    const a=i*p.TWO_PI/12-p.HALF_PI,x=Math.cos(a),y=Math.sin(a);
    if(kind===0){p.strokeWeight(3);p.stroke(175,216,255);p.line(x*r*.87,y*r*.87,x*r*.94,y*r*.94)}
    else{p.noStroke();p.fill(166,209,255,kind===1?225:160);p.circle(x*r*.9,y*r*.9,kind===1?7:10);p.noFill()}
  }
  p.stroke(202,229,255);p.strokeCap(p.ROUND);dc.shadowBlur=10;
  const hour=room.time/43200*p.TWO_PI-p.HALF_PI,min=room.time/3600*p.TWO_PI-p.HALF_PI;
  p.strokeWeight(5);p.line(0,0,Math.cos(hour)*r*.47,Math.sin(hour)*r*.47);
  p.strokeWeight(3);p.line(0,0,Math.cos(min)*r*.72,Math.sin(min)*r*.72);
  const sec=Math.floor(room.time)/60*p.TWO_PI-p.HALF_PI;
  p.noStroke();p.fill(100,175,255);dc.shadowBlur=16;p.circle(Math.cos(sec)*r*.9,Math.sin(sec)*r*.9,8);
  p.fill(222,239,255);p.circle(0,0,8);dc.shadowBlur=0;p.pop();
 }
 p.draw=()=>{let dt=Math.min(p.deltaTime/1000,.1);room.calm=p.lerp(room.calm,room.running?1:0,1-Math.exp(-dt*1.7));if(room.running)room.time+=dt;t+=dt*p.lerp(.9,1.05,room.calm);renderField();p.image(field,0,0,p.width,p.height);if(p.frameCount%3===0||lastLetters<0){renderLetters();lastLetters=p.frameCount}p.image(letters,0,0);clock()};
});
