// Clock mode uses the same VIDEO hand model and open-palm rule as portrait mode.
(()=>{
 const video=document.getElementById('video'),notice=document.getElementById('notice');
 let isStopPalm,confirmations=0,model,stream,version=0,loading=false,enabled=true,callback=null,callbackKind='',lastInference=0,lastFrame=-1;
 const say=(text,error=false)=>{notice.textContent=text;notice.classList.toggle('error',error)};
 function stop(){
  version++;if(callback!==null){if(callbackKind==='video')video.cancelVideoFrameCallback?.(callback);else cancelAnimationFrame(callback)}
  callback=null;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;document.body.classList.remove('camera-on');loading=false;room.running=false;
 }
 function schedule(id){
  if(id!==version||!enabled||document.hidden)return;
  const tick=(now)=>{
   if(id!==version)return;
   if(video.readyState>=2&&video.currentTime!==lastFrame&&now-lastInference>=85){
    lastFrame=video.currentTime;lastInference=now;
    try{const result=model.detectForVideo(video,now);const open=result.landmarks.some(isStopPalm);confirmations=open?confirmations+1:0;room.running=open&&confirmations>=2}
    catch{room.running=false;say('Hand tracking interrupted. Reload to retry.',true);stop();return}
   }
   schedule(id);
  };
  if(video.requestVideoFrameCallback){callbackKind='video';callback=video.requestVideoFrameCallback(tick)}
  else{callbackKind='raf';callback=requestAnimationFrame(tick)}
 }
 async function start(){
  if(loading||stream||!enabled||document.hidden)return;
  loading=true;const id=++version;say('Starting hand camera…',true);
  try{
   const capture=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:480},height:{ideal:360},frameRate:{ideal:24,max:30},facingMode:'user'},audio:false});
   if(id!==version){capture.getTracks().forEach(t=>t.stop());return}
   stream=capture;video.srcObject=stream;await video.play();document.body.classList.add('camera-on');say('Loading hand tracking…',true);
   if(!model){
    ({isStopPalm}=await import('./stop-gesture.js?v=bounded-15'));const vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
    const files=await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    if(id!==version)return;
    const created=await vision.HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.6,minTrackingConfidence:.6});
    if(id!==version){created.close();return}model=created;
   }
   if(id!==version)return;
   loading=false;lastInference=0;lastFrame=-1;say('');schedule(id);
  }catch(e){if(id!==version)return;stop();say(e.name==='NotAllowedError'?'Allow camera access in browser settings and reload. Space still toggles time.':'Camera tracking could not start. Check your connection and reload.',true)}
 }
 addEventListener('portrait-enter',()=>{enabled=false;stop();say('')});
 addEventListener('portrait-exit',()=>{enabled=true;start()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start()});
 addEventListener('pagehide',()=>{enabled=false;stop();model?.close();model=null});
 start();
})();
