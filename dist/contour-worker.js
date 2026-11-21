import {contours} from './portrait-geometry.js?v=bounded-15';
self.onmessage=({data:{mask,luminance}})=>{
 const paths=[...contours(i=>mask[i*4]/255,512,384,.55),...contours(i=>mask[i*4]>210?luminance[i]:NaN,512,384,.34)];
 self.postMessage(paths);
};
