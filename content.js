(() => {
  'use strict';
  if(document.getElementById('sid-host'))return;
  const core=globalThis.SkribblImageCore;
  const host=document.createElement('div');host.id='sid-host';
  host.style.cssText='position:fixed;right:14px;top:14px;z-index:2147483646';
  const ui=host.attachShadow({mode:'closed'});
  ui.innerHTML=`<style>
    :host{font:14px system-ui;color:#edf1ff} *{box-sizing:border-box} details{max-height:calc(100vh - 28px);overflow-y:auto;width:310px;border:1px solid #495375;border-radius:14px;background:#171d30;box-shadow:0 10px 40px #0007;} summary{cursor:pointer;padding:14px 16px;font-weight:700;background:#242e49} main{padding:14px;display:grid;gap:10px} label{display:grid;gap:5px;color:#ccd3e8} input,select,button{font:inherit;border-radius:7px;padding:8px;max-width:100%} select{background:#2b3551;color:white;border:1px solid #526080} button{border:0;cursor:pointer;background:#789bff;color:#10172a;font-weight:700} button:disabled{opacity:.45;cursor:default} .row{display:flex;gap:8px}.row>*{flex:1} canvas{width:100%;height:auto;background:white;border-radius:7px;image-rendering:pixelated} small{color:#b9c4df;line-height:1.4} #status{font-size:12px;overflow-wrap:anywhere;white-space:pre-wrap;line-height:1.5} progress{width:100%;accent-color:#89a8ff} .check{display:flex;align-items:center;font-size:12px} input[type=file]{font-size:12px;padding:0} .secondary{background:#3b4767;color:white}
    .hint-panel{width:100%;border:1px solid #495375;border-radius:8px;box-shadow:none;overflow:visible;max-height:none}.hint-panel summary{padding:9px;font-size:13px}.hint-body{padding:10px;display:grid;gap:8px} #hint-pattern{font:700 16px monospace;white-space:pre-wrap;overflow-wrap:anywhere} #hint-results{max-height:190px;overflow:auto;list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:5px} #hint-results li{padding:4px 6px;border-radius:4px;background:#2b3551;overflow-wrap:anywhere;font-size:12px} #hint-count{font-size:12px}
    #drawer-panel{max-width:calc(100vw - 16px)} #drawer-handle{cursor:grab;touch-action:none;user-select:none;position:sticky;top:0;z-index:1} #drawer-handle:active{cursor:grabbing} #drawer-hide{float:right;padding:2px 7px;margin-left:8px;font-size:12px;background:#3b4767;color:white}
    </style><details id="drawer-panel" open><summary id="drawer-handle" title="Drag to move; click to collapse">✎ Image Drawer<button id="drawer-hide" type="button" title="Hide panel; reopen from the extension toolbar icon">Hide</button></summary><main>
    <details class="hint-panel" open><summary>Word hints · English</summary><div class="hint-body">
    <label class="check"><input id="hint-enabled" type="checkbox" checked>Show possible words</label>
    <div id="hint-pattern" aria-label="Current hint"></div><div id="hint-count" role="status"></div>
    <ul id="hint-results" aria-label="Matching words"></ul>
    <small>3,686 community words · July 2025. Newer and custom words may be missing.</small>
    </div></details>
    <small>Upload → palette → large shapes → outline + fill → small details. Keep this tab visible while drawing.</small>
    <label>Local image<input id="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"></label>
    <div class="row"><label>Detail<select id="detail"><option value="80">Low · faster</option><option value="120" selected>Medium</option><option value="160">High · slower</option></select></label><label>Smoothing<select id="smooth"><option value="0" selected>None</option><option value="1">Light</option><option value="3">Strong</option></select></label></div>
    <div class="row"><label>Drawing delay (ms)<input id="speed" type="number" min="20" max="500" value="20"></label><label>Color change (ms)<input id="colorDelay" type="number" min="50" max="2000" value="80"></label></div>
    <small>Lower delays draw faster. Minimums: 20 ms per move, 50 ms per color change. Outlines are checked before filling. White background is skipped.</small>
    <canvas id="preview" width="800" height="600" aria-label="Drawing preview"></canvas>
    <label class="check"><input id="clear" type="checkbox">Clear the existing drawing when starting</label>
    <div class="row"><button id="start" disabled>Draw image</button><button id="pause" class="secondary" disabled>Pause</button><button id="stop" class="secondary" disabled>Stop</button></div>
    <progress id="progress" max="1" value="0"></progress><div id="status" role="status">Choose an image. Only works during your drawing turn.</div>
    <small>Images stay on this device. Drawing commands go through the game’s normal tools. Use where other players agree.</small>
    </main></details>`;
  document.documentElement.appendChild(host);
  const $=id=>ui.getElementById(id), status=t=>{$('status').textContent=t;};
  globalThis.SkribblPanel.mount(host,ui);
  globalThis.SkribblHints.mount(ui);
  let bitmap=null, drawing=null, busy=false, paused=false, stopped=false, imageVersion=0;
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const canvas=()=>document.querySelector('#game-canvas canvas');
  function paletteElements(){return [...document.querySelectorAll('#game-toolbar .colors .color')];}
  function palette(){
    const elements=paletteElements();
    if(elements.length!==26)throw Error('The game palette is unavailable. Wait for skribbl.io to finish loading.');
    return core.PALETTE.map(rgb=>{
      const element=elements.find(el=>{const c=getComputedStyle(el).backgroundColor.match(/\d+/g)?.slice(0,3).map(Number);return c&&c.every((n,k)=>n===rgb[k]);});
      if(!element)throw Error('The game palette has changed. Drawing stopped.');
      return element;
    });
  }
  function prepare(){
    if(!bitmap||busy)return;
    const c=canvas(),width=c?.width||800,height=c?.height||600;
    const w=Number($('detail').value),h=Math.max(1,Math.round(w*height/width));
    const sample=document.createElement('canvas');sample.width=w;sample.height=h;
    const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,w,h);
    const scale=Math.min(w/bitmap.width,h/bitmap.height),iw=bitmap.width*scale,ih=bitmap.height*scale;
    ctx.drawImage(bitmap,(w-iw)/2,(h-ih)/2,iw,ih);
    const grid=core.smooth(core.quantize(ctx.getImageData(0,0,w,h).data),w,h,Number($('smooth').value));
    drawing=core.plan(grid,w,h,width,height);
    const preview=$('preview');preview.width=width;preview.height=height;
    const p=preview.getContext('2d');
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){p.fillStyle='rgb('+core.PALETTE[grid[y*w+x]].join(',')+')';p.fillRect(x*width/w,y*height/h,Math.ceil(width/w),Math.ceil(height/h));}
    updateEstimate();
  }
  function timing(id,min,max){const n=Number($(id).value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;}
  function updateEstimate(){
    if(!drawing||busy)return;
    $('start').disabled=drawing.fills.length>1800;
    const seconds=Math.ceil((drawing.segments*(Math.max(20,timing('speed',5,500))+17)+drawing.steps.length*(Math.max(50,timing('colorDelay',0,2000))+350))/1000);
    status(`${drawing.steps.length} color islands · ${drawing.segments} contour segments\nApprox. ${seconds}s. ${drawing.fills.length>1800?'Too complex: lower detail or increase smoothing.':'Ready when it is your turn.'}`);

  }
  $('file').onchange=async()=>{
    const version=++imageVersion,file=$('file').files[0];if(!file)return;
    if(file.size>20*1024*1024){status('Choose an image under 20 MB.');return;}
    $('start').disabled=true;
    try{const next=await createImageBitmap(file);if(version!==imageVersion){next.close();return;}bitmap?.close();bitmap=next;prepare();}
    catch{bitmap?.close();bitmap=null;drawing=null;status('Could not open that image. Try PNG, JPEG, or WebP.');}
  };
  $('detail').onchange=prepare;$('smooth').onchange=prepare;
  $('speed').oninput=updateEstimate;$('colorDelay').oninput=updateEstimate;
  function setBusy(value){busy=value;for(const id of ['file','detail','smooth','clear'])$(id).disabled=value;$('start').disabled=value||!drawing||drawing.fills.length>1800;$('pause').disabled=!value;$('stop').disabled=!value;}
  function ready(c){
    if(!c?.isConnected)throw Error('Game canvas disappeared.');
    const r=c.getBoundingClientRect();
    if(r.width<10||r.height<10||getComputedStyle(c).cursor==='default')throw Error('It is not your drawing turn, or the game tools are unavailable.');
    if(c.width!==drawing.width||c.height!==drawing.height)throw Error('Canvas size changed. Prepare the image again.');
    if(document.hidden)throw Error('Tab was hidden. Keep the game visible and start again.');
  }
  async function checkpoint(c){while(paused&&!stopped){await delay(100);}if(stopped)throw Error('Stopped. The partial drawing remains.');ready(c);}
  function pointer(el,type,x,y){
    const r=el.getBoundingClientRect();
    const event=new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:987654,pointerType:'mouse',isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:r.left+x/canvas().width*r.width,clientY:r.top+y/canvas().height*r.height});
    // Synthetic pointers have no OS capture. Override only for this synchronous dispatch.
    const saved=['setPointerCapture','releasePointerCapture'].map(k=>Object.getOwnPropertyDescriptor(el,k));
    try{el.setPointerCapture=()=>{};el.releasePointerCapture=()=>{};el.dispatchEvent(event);}
    finally{['setPointerCapture','releasePointerCapture'].forEach((k,i)=>{if(saved[i])Object.defineProperty(el,k,saved[i]);else delete el[k];});}
  }
  function chooseColor(index,elements){elements[index].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,buttons:1,pointerType:'mouse'}));}
  async function stroke(c,points,minimum=20){
    const coords=points.map(([x,y])=>[Math.max(0,Math.min(c.width-1,Math.round(x))),Math.max(0,Math.min(c.height-1,Math.round(y)))]);
    let last=coords[0];
    pointer(c,'pointerdown',...last);
    try{for(let i=1;i<coords.length;i++){await delay(Math.max(minimum,timing('speed',5,500)));await checkpoint(c);last=coords[i];pointer(c,'pointermove',...last);await frame(c);}}
    finally{pointer(c,'pointerup',...last);}
    await settle(c,30);
  }
  async function frame(c){await new Promise(resolve=>{const timer=setTimeout(resolve,100);requestAnimationFrame(()=>{clearTimeout(timer);resolve();});});await checkpoint(c);}
  async function settle(c,ms){await delay(ms);await frame(c);await frame(c);}
  function outlineAccepted(c,ctx,contours,color){
    const pixels=ctx.getImageData(0,0,c.width,c.height).data,rgb=core.PALETTE[color];
    for(const points of contours)for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],length=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));
      for(let n=0;n<=Math.ceil(length);n++){
        const t=length?n/Math.ceil(length):0;
        const x=Math.max(0,Math.min(c.width-1,Math.round(a[0]+(b[0]-a[0])*t))),y=Math.max(0,Math.min(c.height-1,Math.round(a[1]+(b[1]-a[1])*t)));
        const k=(y*c.width+x)*4;
        if(!rgb.every((v,j)=>Math.abs(v-pixels[k+j])<=12))return false;
      }
    }
    return true;
  }
  function tool(index){const t=document.querySelectorAll('#game-toolbar .toolbar-group-tools .tool')[index];if(!t)throw Error('Game tools have changed.');t.click();}
  $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';};
  $('stop').onclick=()=>{stopped=true;paused=false;};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&busy){stopped=true;paused=false;}},true);
  $('start').onclick=async()=>{
    if(busy||!drawing)return;
    const c=canvas();stopped=false;paused=false;let completed=false;
    try{
      ready(c);const elements=palette();
      const ctx=c.getContext('2d');
      setBusy(true);$('progress').value=0;
      if($('clear').checked){const clear=document.querySelectorAll('#game-toolbar .toolbar-group-actions .tool')[1];if(!clear)throw Error('Clear tool unavailable.');clear.click();await delay(200);}
      tool(0);document.querySelector('#game-toolbar .sizes .size')?.click();
      let done=0,total=drawing.segments+drawing.fills.length,currentColor=-1;
      const selectColor=async color=>{if(color!==currentColor){chooseColor(color,elements);currentColor=color;await settle(c,Math.max(50,timing('colorDelay',0,2000)));}};
      for(let i=0;i<drawing.steps.length;i++){
        const island=drawing.steps[i];await checkpoint(c);await selectColor(island.color);
        tool(0);await settle(c,30);
        status(`Outlining shape ${i+1}/${drawing.steps.length} · Esc to stop`);
        for(const contour of island.contours){await stroke(c,contour);done+=contour.length-1;$('progress').value=done/total;}
        // Never flood a contour whose events have been dropped or not rendered.
        if(!outlineAccepted(c,ctx,island.contours,island.color)){
          status(`Repairing outline ${i+1} at a safer speed…`);
          for(const contour of island.contours)await stroke(c,contour,60);
          if(!outlineAccepted(c,ctx,island.contours,island.color))throw Error('Outline was not fully accepted. Stopped before filling; increase drawing delay.');
        }
        tool(1);await settle(c,50);
        status(`Filling shape ${i+1}/${drawing.steps.length} · Esc to stop`);
        const x=Math.floor(island.x),y=Math.floor(island.y);
        pointer(c,'pointerdown',x,y);await delay(20);pointer(c,'pointerup',x,y);
        await settle(c,Math.max(80,timing('speed',5,500)));
        const actual=ctx.getImageData(x,y,1,1).data;
        if(!core.PALETTE[island.color].every((v,k)=>v===actual[k]))throw Error('A bucket fill was not accepted. Drawing stopped.');
        $('progress').value=++done/total;
      }
      completed=true;status('Drawing complete.');
    }catch(error){status(error.message||String(error));}
    finally{setBusy(false);$('pause').textContent='Pause';if(c?.isConnected){pointer(c,'pointerup',0,0);if(completed)tool(0);}}
  };
})();
