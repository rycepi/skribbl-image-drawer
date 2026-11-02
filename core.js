/* Pure image planning functions; no browser, network, or game dependencies. */
(function(root) {
  'use strict';
  const PALETTE = [[255,255,255],[0,0,0],[193,193,193],[80,80,80],[239,19,11],[116,11,7],[255,113,0],[194,56,0],[255,228,0],[232,162,0],[0,204,0],[0,70,25],[0,255,145],[0,120,93],[0,178,255],[0,86,158],[35,31,211],[14,8,101],[163,0,186],[85,0,105],[223,105,167],[135,53,84],[255,172,142],[204,119,77],[160,82,45],[99,48,13]];
  function quantize(rgba, palette = PALETTE) {
    const out = new Uint8Array(rgba.length / 4);
    for (let i=0;i<out.length;i++) {
      const a=rgba[i*4+3]/255, rgb=[0,1,2].map(k=>rgba[i*4+k]*a+255*(1-a));
      let best=Infinity, index=0;
      palette.forEach((p,j)=>{
        // Reserve white for genuinely white pixels, preserving pale hair/clothing shading.
        if(p.every(v=>v===255)&&Math.min(...rgb)<245)return;
        const d=rgb.reduce((sum,v,k)=>sum+(v-p[k])**2*[.3,.59,.11][k],0);if(d<best){best=d;index=j;}
      });
      out[i]=index;
    }
    return out;
  }
  function smooth(grid,w,h,passes=1) {
    let src=Uint8Array.from(grid);
    for(let p=0;p<passes;p++) {
      const dst=src.slice();
      for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
        const counts=new Map();
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h){const c=src[(y+dy)*w+x+dx];counts.set(c,(counts.get(c)||0)+1);}
        let chosen=src[y*w+x], count=counts.get(chosen)||0;
        for(const [c,n] of counts)if(n>count){chosen=c;count=n;}
        dst[y*w+x]=chosen;
      }
      src=dst;
    }
    return src;
  }
  function islandPlan(grid,w,h,width,height) {
    if(grid.length!==w*h||w<1||h<1)throw Error('Invalid image grid');
    const sx=width/w,sy=height/h,seen=new Uint8Array(grid.length),islands=[];
    for(let seed=0;seed<grid.length;seed++)if(!seen[seed]) {
      const color=grid[seed],cells=[seed];seen[seed]=1;
      for(let q=0;q<cells.length;q++) {
        const n=cells[q],x=n%w,y=Math.floor(n/w);
        for(const k of [x? n-1:-1,x+1<w?n+1:-1,y?n-w:-1,y+1<h?n+w:-1])
          if(k>=0&&!seen[k]&&grid[k]===color){seen[k]=1;cells.push(k);}
      }
      const edges=[],outgoing=new Map();
      const add=(x,y,xx,yy,d)=>{const e={a:[x,y],b:[xx,yy],d,used:false};edges.push(e);const key=x+','+y;if(!outgoing.has(key))outgoing.set(key,[]);outgoing.get(key).push(e);};
      for(const n of cells){const x=n%w,y=Math.floor(n/w);
        if(!y||grid[n-w]!==color)add(x,y,x+1,y,0);
        if(x===w-1||grid[n+1]!==color)add(x+1,y,x+1,y+1,1);
        if(y===h-1||grid[n+w]!==color)add(x+1,y+1,x,y+1,2);
        if(!x||grid[n-1]!==color)add(x,y+1,x,y,3);
      }
      const contours=[];
      for(const first of edges)if(!first.used){
        const points=[first.a];let e=first;
        while(e){e.used=true;points.push(e.b);
          if(e.b[0]===first.a[0]&&e.b[1]===first.a[1])break;
          const candidates=(outgoing.get(e.b.join(','))||[]).filter(v=>!v.used);
          // Keep the island on the right at diagonal corner contacts.
          const order=[1,0,3,2];candidates.sort((a,b)=>order.indexOf((a.d-e.d+4)%4)-order.indexOf((b.d-e.d+4)%4));e=candidates[0];
          if(!e)throw Error('Open island contour');
        }
        const simple=points.filter((p,i)=>i===0||i===points.length-1||
          (p[0]-points[i-1][0])*(points[i+1][1]-p[1])!==(p[1]-points[i-1][1])*(points[i+1][0]-p[0]));
        contours.push(simple.map(([x,y])=>[x*sx,y*sy]));
      }
      // Prefer the center of a thick part, away from the outline brush.
      let best=cells[0],score=-1;
      for(const n of cells){const x=n%w,y=Math.floor(n/w);let s=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&grid[(y+dy)*w+x+dx]===color)s++;
        if(s>score){score=s;best=n;}
      }
      const signedArea=c=>c.slice(1).reduce((sum,p,i)=>sum+c[i][0]*p[1]-p[0]*c[i][1],0)/2;
      const outerContours=contours.filter(c=>signedArea(c)>0);
      const background=color===0&&cells.some(n=>n%w===0||n%w===w-1||n<w||n>=w*(h-1));
      islands.push({color,contours,outerContours,background,enclosedArea:outerContours.reduce((sum,c)=>sum+signedArea(c),0),area:cells.length,x:(best%w+.5)*sx,y:(Math.floor(best/w)+.5)*sy});
    }
    // Outer silhouettes cover their holes first. Smaller enclosed regions restore
    // those details afterward, including white highlights inside colored shapes.
    islands.sort((a,b)=>b.enclosedArea-a.enclosedArea);
    const steps=islands.filter(i=>!i.background).map(i=>({...i,contours:i.outerContours}));
    const segments=steps.reduce((n,i)=>n+i.contours.reduce((m,c)=>m+c.length-1,0),0);
    return {width,height,w,h,grid:Array.from(grid),islands,steps,fills:steps,segments};
  }
  const api={PALETTE,quantize,smooth,plan:islandPlan};
  if(typeof module!=='undefined')module.exports=api;
  else root.SkribblImageCore=api;
})(globalThis);
