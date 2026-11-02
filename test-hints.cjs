const assert=require('node:assert/strict');
const {parseHint,matchWords,mount}=require('./hints.js');
const words=require('./words-en.js');
assert.equal(words.length,3686);
assert.deepEqual(matchWords(['cat','car','cap','dog','cats'],parseHint(['c','a','_'],'3')),['cat','car','cap']);
assert.deepEqual(matchWords(['ice cream','ice chest','icecream!'],parseHint(Array(9).fill('_'),'3 5')),['ice cream','ice chest']);
assert.deepEqual(matchWords(['ice cream','ice chest'],parseHint(['i','_','_','_','c','r','_','_','_'],'3 5')),['ice cream']);
assert.deepEqual(matchWords(['T-Rex','T Rex'],parseHint(['_','-','_','_','_'],'5')),['T-Rex']);
assert.equal(parseHint(['?','?','?'],''),null);
assert.equal(parseHint(['_','_'],'3'),null);
assert.equal(parseHint(['_'],'0'),null);
assert.deepEqual(matchWords(words,parseHint(['z','z','z','z','z'],'5')),[]);
// Every packaged entry must survive both concealed and fully revealed game hints.
for(const word of words){
  const lengths=word.split(' ').map(w=>w.length).join(' ');
  assert(matchWords([word],parseHint(Array(word.length).fill('_'),lengths)).includes(word),word);
  assert(matchWords([word],parseHint(word.split(''),lengths)).includes(word),word);
}
// Exercise UI updates without any network or game connection.
function element(){return {textContent:'',children:[],checked:true,replaceChildren(){this.children=[];},appendChild(child){if(child.fragment)this.children.push(...child.children);else this.children.push(child);}};}
const controls=Object.fromEntries(['hint-enabled','hint-results','hint-pattern','hint-count'].map(id=>[id,element()]));
let letters=['c','a','_'],length='3',visible=true,onMutation,poll,cleanup;
const container={getClientRects:()=>visible?[{}]:[],querySelectorAll:()=>letters.map(textContent=>({textContent})),querySelector:()=>({textContent:length})};
const bar={querySelector:()=>container};
global.SkribblEnglishWords=['cat','car','dog'];
global.document={querySelector:()=>bar,createElement:element,createDocumentFragment:()=>({...element(),fragment:true})};
global.getComputedStyle=()=>({visibility:'visible'});
global.MutationObserver=class{constructor(cb){onMutation=cb;}observe(){}disconnect(){}};
global.window={addEventListener:(event,cb)=>cleanup=cb};
const saved=global.setInterval;global.setInterval=cb=>{poll=cb;return 0;};
mount({getElementById:id=>controls[id]});
assert.deepEqual(controls['hint-results'].children.map(n=>n.textContent),['cat','car']);
letters=['c','a','t'];onMutation();assert.equal(controls['hint-results'].children.length,1);
visible=false;poll();assert.equal(controls['hint-results'].children.length,0);
visible=true;letters=['_','_','_'];onMutation();assert.equal(controls['hint-results'].children.length,3);
controls['hint-enabled'].checked=false;controls['hint-enabled'].onchange();assert.equal(controls['hint-results'].children.length,0);
cleanup();global.setInterval=saved;
console.log('Passed: 3,686 dictionary entries, letter positions, multiword spacing, punctuation, hidden hints, UI refresh, round reset, and disabling suggestions.');
