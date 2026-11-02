// Isolated-world bridge: extension APIs are not available in the game's MAIN world.
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(sender.id!==chrome.runtime.id||message?.type!=='sid-visibility')return;
  const host=document.getElementById('sid-host');
  if(!host){reply({available:false});return;}
  if(typeof message.visible==='boolean'){
    host.style.display=message.visible?'':'none';
    if(message.visible)window.dispatchEvent(new Event('resize'));
  }
  reply({available:true,visible:host.style.display!=='none'});
});
