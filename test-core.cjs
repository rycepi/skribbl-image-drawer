const assert=require('node:assert/strict');
const core=require('./core.js');
for(const [w,h,g] of [[3,3,[1,1,1,1,0,1,1,1,1]],[2,2,[1,0,0,1]],[1,1,[2]],[3,2,[1,2,2,1,1,2]]]){
 const p=core.plan(g,w,h,w*10,h*10);
 assert.equal(p.islands.reduce((s,i)=>s+i.area,0),g.length);
 let perimeter=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(x+dx<0||x+dx>=w||y+dy<0||y+dy>=h||g[y*w+x]!==g[(y+dy)*w+x+dx])perimeter+=10;
 let actual=0;
 for(const island of p.islands)for(const c of island.contours){assert.deepEqual(c[0],c.at(-1));for(let n=1;n<c.length;n++){assert(c[n][0]===c[n-1][0]||c[n][1]===c[n-1][1]);actual+=Math.abs(c[n][0]-c[n-1][0])+Math.abs(c[n][1]-c[n-1][1]);}}
 assert.equal(actual,perimeter);
}
assert.equal(core.quantize([230,230,230,255])[0],2);
assert.equal(core.quantize([0,0,0,0])[0],0);
console.log('Passed: closed contours, holes, diagonal islands, perimeter coverage, pale gray and transparency.');
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function paintPlan(grid,w,h){const p=core.plan(grid,w,h,w*10,h*10),out=Array(w*h).fill(0);for(const step of p.steps)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(step.contours.some(c=>inside(x*10+5,y*10+5,c)))out[y*w+x]=step.color;assert.deepEqual(out,grid);return p;}
const nested=Array(81).fill(0);
for(let y=1;y<8;y++)for(let x=1;x<8;x++)nested[y*9+x]=22;
for(let y=3;y<6;y++)for(let x=3;x<6;x++)nested[y*9+x]=0;
nested[40]=1;
const layered=paintPlan(nested,9,9);
assert.deepEqual(layered.steps.map(s=>s.color),[22,0,1]);
assert.equal(core.plan(Array(100).fill(0),10,10,100,100).steps.length,0);
let seed=12345;
for(let n=0;n<200;n++){const g=Array.from({length:64},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>16)%4;});paintPlan(g,8,8);}
console.log('Passed: background omission, enclosed white details, parent-before-child order, and 200 raster reconstruction cases.');
