(function(root){
  'use strict';
  function clampPosition(x,y,width,height,viewportWidth,viewportHeight){
    return {x:Math.max(8,Math.min(x,viewportWidth-width-8)),y:Math.max(8,Math.min(y,viewportHeight-Math.min(height,80)-8))};
  }
  function mount(host,ui){
    const panel=ui.getElementById('drawer-panel'),handle=ui.getElementById('drawer-handle');
    let drag=null,suppressClick=false;
    function move(x,y){
      const r=host.getBoundingClientRect();
      const p=clampPosition(x,y,r.width||Math.min(310,innerWidth-16),r.height||80,innerWidth,innerHeight);
      host.style.right='auto';host.style.left=p.x+'px';host.style.top=p.y+'px';
      panel.style.maxHeight=Math.max(60,innerHeight-p.y-8)+'px';
    }
    handle.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('button'))return;
      const r=host.getBoundingClientRect();
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left,top:r.top,moved:false};
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.moved&&Math.hypot(dx,dy)<4)return;
      drag.moved=true;event.preventDefault();move(drag.left+dx,drag.top+dy);
    });
    const finish=event=>{
      if(!drag||event.pointerId!==drag.id)return;
      suppressClick=drag.moved;drag=null;
      if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
      setTimeout(()=>{suppressClick=false;},0);
    };
    handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
    handle.addEventListener('click',event=>{if(suppressClick){event.preventDefault();suppressClick=false;}});
    ui.getElementById('drawer-hide').addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();host.style.display='none';
    });
    window.addEventListener('resize',()=>{
      // Hidden hosts have no useful bounding box; use their saved position.
      const r=host.getBoundingClientRect();
      move(parseFloat(host.style.left)||r.left,parseFloat(host.style.top)||r.top);
    });
    move(host.getBoundingClientRect().left,14);
  }
  const api={mount,clampPosition};
  if(typeof module!=='undefined')module.exports=api;else root.SkribblPanel=api;
})(globalThis);
