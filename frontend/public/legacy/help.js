/* NSH: shared help + scope engine.
   - Any element with data-help="key" (or an id listed in NSH.ids) gets a small "?" that opens a plain-language explanation.
   - A "Show me" bar per lab lets the learner choose: what I have learnt / pick topics / everything. Controls that need
     lessons outside the chosen scope are tucked away (they keep their default values). */
(function(){
var W=window,H=W.NSH={reg:{},ids:{},intro:{},roots:{},names:{
 'what-ai':'What is AI?','ai-ml-dl':'AI, ML and deep learning','kinds':'Kinds of machine learning','data-features':'Data and features','train-infer':'Training vs using a model',
 vectors:'Numbers, vectors and dot products',calculus:'Slopes and change',loss:'Loss: scoring mistakes',gd:'Gradient descent',overfit:'Overfitting',split:'Train, validation and test',
 linreg:'Linear regression',knn:'K-nearest neighbours',tree:'Decision trees',kmeans:'K-means clustering',weight:'Weights',bias:'Bias',neuron:'The neuron',activation:'Activation functions',
 layers:'Layers and depth',backprop:'Backpropagation',optim:'Optimizers',hyper:'Hyperparameters',batches:'Batches, epochs and steps',regular:'Regularisation (L2)',
 'img-numbers':'Images are numbers',conv:'Convolution and filters',cnn:'Convolutional networks',detect:'Object detection','seq-data':'Sequence data',rnn:'Recurrent networks',lstm:'LSTM',
 tokens:'Tokens',attention:'Attention',transformer:'Transformers',llm:'Large language models',metrics:'Accuracy, precision and recall'}};
var mem={};
function sGet(k,d){try{var v=localStorage.getItem('ns3_'+k);if(v!==null)return JSON.parse(v);}catch(e){}return k in mem?mem[k]:d;}
function sSet(k,v){mem[k]=v;try{localStorage.setItem('ns3_'+k,JSON.stringify(v));}catch(e){}}
function lessons(){try{if(W.NS&&W.NS.course&&W.NS.store)return W.NS.store.get('lessons',{});}catch(e){}
 try{if(W.parent!==W&&W.parent.NS&&W.parent.NS.store)return W.parent.NS.store.get('lessons',{});}catch(e){}return sGet('lessons',{});}
function scope(){var s=sGet('scope',null);return s&&s.mode?s:{mode:'all',topics:[]};}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
H.hooks=[];H.sels={};H.lbls={};H.addSel=function(lab,o){H.sels[lab]=Object.assign(H.sels[lab]||{},o);};H.addLbl=function(lab,o){H.lbls[lab]=Object.assign(H.lbls[lab]||{},o);};H.add=function(o){for(var k in o)H.reg[k]=o[k];};
H.addIds=function(o){for(var k in o)H.ids[k]=o[k];};
H.addIntro=function(lab,o){H.intro[lab]=o;};
H.openTopic=function(id){try{if(W.NS&&W.NS.acad&&W.NS.acad.open){W.NS.go('academy');W.NS.acad.open(id);return;}}catch(e){}
 try{if(W.parent!==W&&W.parent.NS&&W.parent.NS.acad){W.parent.NS.go('academy');W.parent.NS.acad.open(id);}}catch(e){}};
/* ---------- visibility ---------- */
H.visible=function(e){if(!e||e.core||e.keep||!e.tp||!e.tp.length)return true;var s=scope();if(s.mode==='all')return true;
 if(s.mode==='learned'){var d=lessons();return e.tp.every(function(t){return d[t];});}
 return e.tp.some(function(t){return s.topics.indexOf(t)>=0;});};
function labOf(key){return key.split('.')[0];}
function labTopics(lab){var seen={},out=[];Object.keys(H.reg).forEach(function(k){if(labOf(k)!==lab)return;(H.reg[k].tp||[]).forEach(function(t){if(!seen[t]){seen[t]=1;out.push(t);}});});
 var ord=Object.keys(H.names);out.sort(function(a,b){return ord.indexOf(a)-ord.indexOf(b);});return out;}
/* ---------- decorate ---------- */
function mkq(key,wide,title){var s=document.createElement('span');s.className='hq'+(wide?' wide':'');s.setAttribute('role','button');s.tabIndex=0;s.setAttribute('data-hq',key);
 s.setAttribute('aria-label','Explain: '+((H.reg[key]&&H.reg[key].t)||key));s.title='What is this?';s.textContent=wide?'? '+(title||'What am I looking at?'):'?';return s;}
function attach(n){n.setAttribute('data-hd','1');var key=n.getAttribute('data-help');if(!H.reg[key]||H.reg[key].nohq)return;if(H.reg[key].once){var pr=n.closest('.panel,.card')||n.ownerDocument;if(pr.querySelector('[data-hq="'+key+'"]'))return;}var tag=n.tagName,q;
 if(tag==='CANVAS'||tag==='SVG'){q=mkq(key,true,H.reg[key].btn);n.insertAdjacentElement('afterend',q);return;}
 if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'){var lab=n.id&&n.ownerDocument.querySelector('label[for="'+n.id+'"]');if(lab){lab.appendChild(mkq(key));return;}n.insertAdjacentElement('afterend',mkq(key));return;}
 if(tag==='BUTTON'){var wr=n.ownerDocument.createElement('span');wr.className='hqw';n.parentNode.insertBefore(wr,n);wr.appendChild(n);wr.appendChild(mkq(key));return;}
 n.appendChild(mkq(key));}
function container(n){var c=n.closest('.ctl,.range,form');if(c)return c;var t=n.tagName;if(t==='BUTTON'||t==='CANVAS'||t==='SELECT'||t==='INPUT')return n;return n;}
H.apply=function(root){if(!root)return;
 var rl=root.getAttribute('data-nshlab');Object.keys(H.ids).forEach(function(id){if(H.ids[id].split('.')[0]!==rl)return;var n=root.querySelector('#'+id);if(n&&!n.hasAttribute('data-help'))n.setAttribute('data-help',H.ids[id]);});
 var ss=H.sels[rl];if(ss)Object.keys(ss).forEach(function(sel){Array.prototype.forEach.call(root.querySelectorAll(sel),function(n){if(!n.hasAttribute('data-help'))n.setAttribute('data-help',ss[sel]);});});
 var ll=H.lbls[rl];if(ll){var lk=Object.keys(ll);Array.prototype.forEach.call(root.querySelectorAll('.lbl,summary'),function(n){if(n.hasAttribute('data-help'))return;var t=(n.firstChild&&n.firstChild.nodeType===3?n.firstChild.nodeValue:n.textContent).trim();for(var q=0;q<lk.length;q++)if(t.indexOf(lk[q])===0){n.setAttribute('data-help',ll[lk[q]]);break;}});}
 var list=root.querySelectorAll('[data-help]'),i;
 for(i=0;i<list.length;i++)if(!list[i].hasAttribute('data-hd'))attach(list[i]);
 var hidden={};
 for(i=0;i<list.length;i++){var n=list[i],e=H.reg[n.getAttribute('data-help')];if(!e||e.keep||!e.tp||!e.tp.length)continue;var off=!H.visible(e),c=container(n);
  c.classList.toggle('sc-off',off);if((n.tagName==='BUTTON'||n.tagName==='CANVAS')&&n.nextElementSibling&&n.nextElementSibling.classList.contains('hq'))n.nextElementSibling.classList.toggle('sc-off',off);
  if(off)hidden[n.getAttribute('data-help')]=1;}
 var lab=root.getAttribute('data-nshlab');if(lab)summary(lab,hidden);};
function summary(lab,hidden){var box=document.getElementById('scsum-'+lab);if(!box)return;var keys=Object.keys(hidden),s=scope();
 if(!keys.length){box.innerHTML=s.mode==='all'?'':'<span class="muted small">Nothing is hidden here: every control on this page is covered by what you chose.</span>';return;}
 var need={};keys.forEach(function(k){H.reg[k].tp.forEach(function(t){need[t]=1;});});
 box.innerHTML='<span class="small muted">Tucked away for now ('+keys.length+'; they keep their default values): '+keys.map(function(k){return esc(H.reg[k].t);}).join(', ')+'.</span> <span class="small muted">Learn: '+Object.keys(need).map(function(t){return '<button type="button" class="term" data-hopen="'+t+'">'+esc(H.names[t]||t)+'</button>';}).join(' ')+'</span>';}
/* ---------- the "Show me" bar and intro card ---------- */
function bar(lab){var s=scope(),d=lessons(),nd=Object.keys(d).filter(function(k){return d[k];}).length,tl=labTopics(lab);
 var h='<div class="scope" role="group" aria-label="Choose what this page shows"><span class="lbl">Show me</span><div class="seg2">'+
  [['learned','What I have learnt'],['topics','Pick topics'],['all','Everything']].map(function(m){return '<button type="button" data-sc="'+m[0]+'" aria-pressed="'+(s.mode===m[0])+'">'+m[1]+'</button>';}).join('')+'</div>'+
  '<span class="small muted">'+(s.mode==='learned'?'Showing the controls that match the '+nd+' lesson'+(nd===1?'':'s')+' you marked as learned in the Academy (basics are always shown).':s.mode==='topics'?'Showing basics plus the topics you tick below.':'Showing every control.')+'</span></div>';
 if(s.mode==='topics')h+='<div class="scopepick">'+tl.map(function(t){var on=s.topics.indexOf(t)>=0;return '<label class="chip'+(on?' on':'')+'"><input type="checkbox" data-sctopic="'+t+'"'+(on?' checked':'')+'> '+esc(H.names[t]||t)+'</label>';}).join('')+'</div>';
 return h+'<div id="scsum-'+lab+'" class="scsum"></div>';}
function introHTML(lab){var o=H.intro[lab];if(!o)return '';var open=sGet('intro_'+lab,true);
 return '<details class="introcard" data-introlab="'+lab+'"'+(open?' open':'')+'><summary>'+esc(o.t)+'</summary><div class="introbody">'+o.html+'</div></details>';}
H.mount=function(root,lab,hostEl){if(!root||root.getAttribute('data-nshlab'))return;root.setAttribute('data-nshlab',lab);H.roots[lab]=root;
 var host=document.createElement('div');host.className='nshhost';host.setAttribute('data-host',lab);host.innerHTML='<div class="scopehost">'+bar(lab)+'</div>'+introHTML(lab);
 var h1=root.querySelector('h1'),after=h1;if(hostEl)hostEl.appendChild(host);else if(h1){while(after.nextElementSibling&&(after.nextElementSibling.tagName==='P'||after.nextElementSibling.classList.contains('cycle')))after=after.nextElementSibling;after.insertAdjacentElement('afterend',host);}else root.insertBefore(host,root.firstChild);
 var pend=false,run=function(){pend=false;H.apply(root);};
 new MutationObserver(function(){if(!pend){pend=true;(W.requestAnimationFrame||setTimeout)(run);}}).observe(root,{childList:true,subtree:true});
 H.apply(root);};
H.refresh=function(){Object.keys(H.roots).forEach(function(lab){var r=H.roots[lab],hh=r.querySelector('[data-host="'+lab+'"] .scopehost');if(hh)hh.innerHTML=bar(lab);H.apply(r);});H.hooks.forEach(function(f){try{f();}catch(e){}});};
/* ---------- popover ---------- */
var pop=null,cur=null;
function ensure(){if(pop)return pop;pop=document.createElement('div');pop.id='hpop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Explanation');pop.style.display='none';document.body.appendChild(pop);return pop;}
function sec(t,x){return x?'<div class="hs"><div class="hl">'+t+'</div><div>'+x+'</div></div>':'';}
function show(key,anchor){var e=H.reg[key];if(!e)return;var p=ensure(),d=lessons();
 var learn=(e.tp&&e.tp.length)?'<div class="hs"><div class="hl">Learn it properly in the Academy</div><div>'+e.tp.map(function(t){return '<button type="button" class="term" data-hopen="'+t+'">'+(d[t]?'✓ ':'')+esc(H.names[t]||t)+'</button>';}).join(' ')+'</div></div>':'';
 p.innerHTML='<button type="button" class="hx" data-hx aria-label="Close">×</button><h4>'+e.t+'</h4>'+sec('What it is',e.w)+sec('What changing it does',e.c)+sec('Try this',e.x)+learn;
 p.style.display='block';cur=anchor;var r=anchor.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,w=Math.min(400,vw-20);
 p.style.width=w+'px';var left=Math.max(10,Math.min(r.left,vw-w-10)),top=r.bottom+8;p.style.left=left+'px';p.style.maxHeight=Math.round(vh*0.7)+'px';
 var ph=p.offsetHeight;if(top+ph>vh-10)top=Math.max(10,r.top-ph-8);p.style.top=top+'px';}
function hide(){if(pop)pop.style.display='none';cur=null;}
document.addEventListener('click',function(ev){var t=ev.target,b;
 if((b=t.closest&&t.closest('[data-hq]'))){ev.preventDefault();ev.stopPropagation();if(cur===b&&pop&&pop.style.display==='block')hide();else show(b.getAttribute('data-hq'),b);return;}
 if((b=t.closest&&t.closest('[data-hopen]'))){hide();H.openTopic(b.getAttribute('data-hopen'));return;}
 if(t.closest&&t.closest('[data-hx]')){hide();return;}
 if((b=t.closest&&t.closest('[data-sc]'))){var s=scope();s.mode=b.getAttribute('data-sc');if(s.mode==='topics'&&!s.topics.length){var lab=b.closest('[data-host]');var L=lab&&lab.getAttribute('data-host');s.topics=L?labTopics(L).slice(0,3):[];}sSet('scope',s);H.refresh();return;}
 if(pop&&pop.style.display==='block'&&!(t.closest&&t.closest('#hpop')))hide();},true);
document.addEventListener('change',function(ev){var t=ev.target;if(t.hasAttribute&&t.hasAttribute('data-sctopic')){var s=scope(),id=t.getAttribute('data-sctopic'),i=s.topics.indexOf(id);if(t.checked&&i<0)s.topics.push(id);if(!t.checked&&i>=0)s.topics.splice(i,1);s.mode='topics';sSet('scope',s);H.refresh();}});
document.addEventListener('toggle',function(ev){var t=ev.target;if(t.getAttribute&&t.getAttribute('data-introlab'))sSet('intro_'+t.getAttribute('data-introlab'),t.open);},true);
document.addEventListener('keydown',function(ev){if(ev.key==='Escape')hide();if((ev.key==='Enter'||ev.key===' ')&&ev.target.getAttribute&&ev.target.getAttribute('data-hq')){ev.preventDefault();ev.target.click();}});
})();
