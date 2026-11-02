(() => {
  const checkbox=document.getElementById('visible'),status=document.getElementById('status');
  let tabId;
  async function send(visible){
    const result=await chrome.tabs.sendMessage(tabId,{type:'sid-visibility',visible});
    if(!result?.available)throw Error('Drawer unavailable');
    checkbox.checked=result.visible;
    status.textContent='Drag the Image Drawer heading to move it. Hiding the panel does not stop an active drawing; Escape still stops it.';
  }
  function unavailable(){checkbox.disabled=true;status.textContent='Open skribbl.io and refresh the game tab after reloading the extension.';}
  checkbox.addEventListener('change',async()=>{
    checkbox.disabled=true;
    try{await send(checkbox.checked);checkbox.disabled=false;}catch{unavailable();}
  });
  (async()=>{try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});tabId=tab?.id;await send();checkbox.disabled=false;}catch{unavailable();}})();
})();
