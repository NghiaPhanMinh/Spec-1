// Independent reversible systems: water feeds the garden; both together turn it purple.
(()=>{
  const panel=document.getElementById('info-panel'),canvas=document.createElement('canvas');
  canvas.id='info-garden';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d'),BLUE='#004bff',PINK='#ff00d4',PURPLE='#9457eb';
  const CONFIG={fillTime:7000,drainTime:1400,growTime:2300,retractTime:900,purpleDelay:5000,tick:500};
  let w=0,h=0,step=15,water=0,garden=0,waterOn=false,gardenOn=false,purple=0,togetherAt=0,plants=[],last=0,raf=0;
  const clamp=n=>Math.max(0,Math.min(1,n)),approach=(n,target,delta)=>target>n?Math.min(target,n+delta):Math.max(target,n-delta);
  const poolRows=()=>Math.max(1,Math.round(Math.max(4,Math.min(11,Math.floor(h/step*.19)))/3));
  function resize(){w=innerWidth;h=innerHeight;step=Number(getComputedStyle(document.documentElement).getPropertyValue('--site-gridSpacing'))||15;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);plants=[];
    // Each flower owns a lane; its endpoint moves by exactly one site-grid cell.
    for(let col=4;col<Math.floor(w/step)-3;col+=6){plants.push({col,rows:poolRows()+5+Math.floor(Math.random()*5),delay:Math.random()*.28,phase:Math.floor(Math.random()*4)})}
    last=0;schedule();
  }
  function sync(){for(const b of panel.querySelectorAll('[data-info-effect]')){const kind=b.dataset.infoEffect,on=kind==='water'?waterOn:kind==='flowers'?gardenOn:waterOn&&gardenOn;b.setAttribute('aria-pressed',String(on))}panel.dataset.water=String(waterOn);panel.dataset.flowers=String(gardenOn)}
  panel.addEventListener('click',e=>{const button=e.target.closest('[data-info-effect]');if(!button)return;const kind=button.dataset.infoEffect;if(kind==='water')waterOn=!waterOn;else if(kind==='flowers')gardenOn=!gardenOn;else{const target=!(waterOn&&gardenOn);waterOn=gardenOn=target}togetherAt=0;if(!raf)last=performance.now();sync();schedule()});
  function color(t,source=PINK){const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),a=rgb(source),b=rgb(PURPLE);return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`}
  function drawWater(now){if(water<=0)return;const cols=Math.ceil(w/step),base=Math.ceil(h/step),tick=Math.floor(now/CONFIG.tick),spread=clamp((water-.14)/.6),depth=clamp((water-.14)/.86)*poolRows(),middle=Math.floor(cols/2),reach=spread*(cols/2+1),level=base-Math.max(1,Math.floor(depth));
    ctx.fillStyle=color(purple,BLUE);
    if(spread>0)for(let col=0;col<cols;col++){const distance=Math.abs(col-middle);if(distance>reach)continue;const edge=Math.min(col,cols-1-col),bounce=spread===1?Math.round(Math.sin(clamp((water-.74)/.26)*Math.PI)*3*Math.max(0,1-edge/5)):0,wave=Math.floor(depth)>0&&Math.sin(col*.42+tick*.6)>.55?1:0,y=Math.max(5,level-wave-bounce);ctx.fillRect(col*step,y*step,step,Math.max(0,h-y*step))}
    // The stream enters at the top of the folder, hits the center, then spreads outward.
    if(waterOn&&water<1){const top=Math.floor(64/step),fallTick=Math.floor(now/85),bottom=water<.14?Math.min(level,top+Math.floor((level-top)*water/.14)):level;for(let row=top;row<bottom;row++){const packet=((row-fallTick)%7+7)%7;if(packet>3)continue;ctx.globalAlpha=packet===3?.66:1;ctx.fillRect(middle*step,row*step,step,step);if(packet<2)ctx.fillRect((middle-1)*step,row*step,step,step)}ctx.globalAlpha=1}
    canvas.dataset.poolRows=String(poolRows());canvas.dataset.spread=spread.toFixed(3);
  }
  function drawFlowers(now){if(garden<=0)return;const tick=Math.floor(now/CONFIG.tick),base=Math.ceil(h/step)*step;ctx.strokeStyle=color(purple);ctx.fillStyle=color(purple);ctx.lineWidth=1.4;ctx.lineJoin='miter';
    for(const p of plants){const grow=clamp((garden-p.delay)/(1-p.delay)),shift=[0,1,0,-1][(tick+p.phase)%4],x=(p.col+.5+shift)*step,top=base-Math.floor(p.rows*grow)*step;if(grow<=0)continue;ctx.beginPath();ctx.moveTo((p.col+.5)*step,base);ctx.lineTo((p.col+.5)*step,base-3*step);ctx.lineTo(x,base-3*step);ctx.lineTo(x,top);ctx.stroke();
      // Petals are conditional: pink stems can exist dry, flowers need blue water.
      const bloom=clamp((grow-.74)/.26)*clamp(water*4);if(bloom<=0)continue;const offsets=[[0,-1],[1,0],[0,1],[-1,0]];for(let i=0;i<Math.ceil(bloom*4);i++){const [dx,dy]=offsets[i];ctx.globalAlpha=clamp(bloom*4-i);ctx.fillRect(Math.floor(x/step+dx)*step,top+dy*step,step,step)}ctx.globalAlpha=1;
    }
  }
  function draw(now){raf=0;if(panel.hidden||document.hidden){last=0;return}const dt=Math.max(0,now-last||16);last=now;water=approach(water,waterOn?1:0,dt/(waterOn?CONFIG.fillTime:CONFIG.drainTime));garden=approach(garden,gardenOn?1:0,dt/(gardenOn?CONFIG.growTime:CONFIG.retractTime));if(waterOn&&gardenOn){if(!togetherAt)togetherAt=now}else togetherAt=0;const purpleOn=water===1&&garden===1&&togetherAt>0&&now-togetherAt>=CONFIG.purpleDelay;purple=approach(purple,purpleOn?1:0,dt/500);
    ctx.clearRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.rect(3,64,w-6,h-67);ctx.clip();drawWater(now);drawFlowers(now);ctx.restore();canvas.dataset.waterLevel=water.toFixed(3);canvas.dataset.growth=garden.toFixed(3);canvas.dataset.purple=purple.toFixed(3);if(water>0||garden>0||waterOn||gardenOn||purple>0)schedule();
  }
  function schedule(){if(!raf&&!panel.hidden&&!document.hidden)raf=requestAnimationFrame(draw)}
  new MutationObserver(()=>{if(panel.hidden){cancelAnimationFrame(raf);raf=0;last=0;waterOn=gardenOn=false;water=garden=purple=togetherAt=0;ctx.clearRect(0,0,w,h);sync()}else schedule()}).observe(panel,{attributes:true,attributeFilter:['hidden']});
  addEventListener('resize',resize);document.addEventListener('site-style-change',resize);document.addEventListener('visibilitychange',()=>{last=0;schedule()});sync();resize();
})();
