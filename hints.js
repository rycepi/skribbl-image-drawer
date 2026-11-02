/* Match only the hint displayed on screen; no hidden game state or chat actions. */
(function(root){
  'use strict';
  function parseHint(letters,lengthText){
    if(!/^\d+(?:\s+\d+)*$/.test(lengthText.trim()))return null;
    const lengths=lengthText.trim().split(/\s+/).map(Number);
    if(lengths.some(n=>n<1||n>100))return null;
    const size=lengths.reduce((a,b)=>a+b,0)+lengths.length-1;
    if(letters.length!==size||letters.some(c=>c.length!==1||c==='?'))return null;
    const pattern=letters.slice();let pos=0;
    for(let i=0;i<lengths.length-1;i++){pos+=lengths[i];if(pattern[pos]!=='_'&&pattern[pos]!==' '&&pattern[pos]!=='\u00a0')return null;pattern[pos++]=' ';}
    return {pattern:pattern.join('').toLowerCase(),lengths};
  }
  function matchWords(words,hint){
    if(!hint)return [];
    return words.filter(word=>{
      const candidate=word.toLowerCase();
      if(candidate.length!==hint.pattern.length)return false;
      for(let i=0;i<candidate.length;i++){
        const expected=hint.pattern[i];
        if(expected==='_'?candidate[i]===' ':candidate[i]!==expected)return false;
      }
      return true;
    });
  }
  function mount(ui){
    const $=id=>ui.getElementById(id),words=root.SkribblEnglishWords||[];
    let lastKey='',observed=null;
    const observer=new MutationObserver(update);
    function update(){
      const bar=document.querySelector('#game-word');
      if(bar!==observed){observer.disconnect();observed=bar;if(bar)observer.observe(bar,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','class']});}
      const container=bar?.querySelector('.hints .container');
      const enabled=$('hint-enabled').checked;
      const visible=container&&container.getClientRects().length>0&&getComputedStyle(container).visibility!=='hidden';
      const letters=visible?[...container.querySelectorAll('.hint')].map(el=>el.textContent):[];
      const lengths=visible?container.querySelector('.word-length')?.textContent||'':'';
      const key=JSON.stringify([enabled,visible,letters,lengths]);if(key===lastKey)return;lastKey=key;
      $('hint-results').replaceChildren();$('hint-pattern').textContent='';
      if(!enabled){$('hint-count').textContent='Hint suggestions are off.';return;}
      if(!visible||!letters.length){$('hint-count').textContent='Waiting for a visible guessing hint…';return;}
      const hint=parseHint(letters,lengths);
      if(!hint){$('hint-count').textContent='Word length is hidden or the hint format is unavailable.';return;}
      $('hint-pattern').textContent=hint.pattern;
      const matches=matchWords(words,hint);
      $('hint-count').textContent=matches.length?`${matches.length} possible ${matches.length===1?'word':'words'} in the English list`:'No matches. This may be a custom, newer, or non-English word.';
      const fragment=document.createDocumentFragment();
      for(const word of matches){const item=document.createElement('li');item.textContent=word;fragment.appendChild(item);}
      $('hint-results').appendChild(fragment);
    }
    $('hint-enabled').onchange=update;
    update();
    // Also detects lobby visibility changes and replacement of the hint bar.
    const timer=setInterval(update,500);
    window.addEventListener('pagehide',()=>{observer.disconnect();clearInterval(timer);},{once:true});
  }
  const api={parseHint,matchWords,mount};
  if(typeof module!=='undefined')module.exports=api;else root.SkribblHints=api;
})(globalThis);
