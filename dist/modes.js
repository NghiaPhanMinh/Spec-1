(()=>{
 const tabs=[...document.querySelectorAll('[role="tab"]')],home=document.getElementById('home-panel'),info=document.getElementById('info-panel'),camera=document.getElementById('camera-page'),host=document.getElementById('artwork-host');
 let frame=null,mode='portrait',active='home',inView=false,homeScroll=0;
 function unload(){frame?.remove();frame=null}
 function sync(){if(active!=='home'||!inView||document.hidden||document.body.dataset.artworkAllowed==='false'){unload();return}if(frame)return;frame=document.createElement('iframe');frame.src=mode+'.html?v=palm-32';frame.title=mode==='portrait'?'Interactive letter portrait':'Interactive star clock';frame.allow='camera';host.append(frame)}
 function activate(name,{focus=false}={}){if(name===active){if(focus)tabs.find(t=>t.dataset.panel===name)?.focus();return}if(active==='home')homeScroll=window.scrollY;active=name;document.body.dataset.folder=name;home.hidden=name!=='home';info.hidden=name!=='info';for(const tab of tabs){const selected=tab.dataset.panel===name;tab.classList.toggle('selected',selected);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;if(selected&&focus)tab.focus()}history.replaceState(null,'',name==='info'?'#info':location.pathname+location.search);window.scrollTo({top:name==='home'?homeScroll:0,behavior:'instant'});sync()}
 for(const [index,tab] of tabs.entries()){tab.addEventListener('click',()=>activate(tab.dataset.panel));tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const target=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activate(tabs[target].dataset.panel,{focus:true})})}
 function toggle(){if(active!=='home'||!inView)return;mode=mode==='portrait'?'clock':'portrait';unload();sync()}
 addEventListener('keydown',e=>{if(e.code==='Digit2'&&!e.repeat){e.preventDefault();toggle()}});
 addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame?.contentWindow&&e.data==='switch-mode')toggle()});
 const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting&&entries[0].intersectionRatio>.12;sync()},{threshold:[0,.12,.25]});observer.observe(camera);
 document.addEventListener('narrative-stage-change',sync);document.addEventListener('visibilitychange',sync);addEventListener('pagehide',unload);
 const now=new Date(),time=document.getElementById('current-date');time.textContent=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(now);time.dateTime=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Ho_Chi_Minh'}).format(now);
 if(location.hash==='#info')activate('info');
})();
