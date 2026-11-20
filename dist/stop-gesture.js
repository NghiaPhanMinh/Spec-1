export function isStopPalm(h){
 if(!h||h.length!==21||h.some(p=>![p.x,p.y,p.z??0].every(Number.isFinite)))return false;
 const d=(a,b)=>Math.hypot(h[a].x-h[b].x,h[a].y-h[b].y),w=d(5,17),length=d(0,9);
 if(w<.045||length<.045||w/length<.48||w/length>1.9)return false;
 const ax=(h[9].x-h[0].x)/length,ay=(h[9].y-h[0].y)/length;
 for(const [base,pip,dip,tip] of [[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]]){
  if(d(tip,base)<w*.55||d(tip,0)<d(pip,0)*1.16)return false;
  const ux=h[pip].x-h[base].x,uy=h[pip].y-h[base].y,vx=h[tip].x-h[dip].x,vy=h[tip].y-h[dip].y;
  if((ux*vx+uy*vy)/(Math.hypot(ux,uy)*Math.hypot(vx,vy)||1)<.8)return false;
  if(((h[tip].x-h[pip].x)*ax+(h[tip].y-h[pip].y)*ay)<w*.2)return false;
 }
 return d(8,20)>w*.35&&d(8,20)<w*2.1&&d(4,17)>w*.8&&d(4,0)>d(3,0)*1.03;
}
