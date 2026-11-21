/* Wires the header, stage buttons and glossary, then starts everything. */
(function(){
var NS=window.NS,C=NS.content,S=NS.S,u=NS.u,$=u.$;
function setMode(m){S.mode=m;$('#m-simple').setAttribute('aria-pressed',m==='simple');$('#m-tech').setAttribute('aria-pressed',m==='tech');NS.renderInsp();NS.renderChg();}
$('#m-simple').addEventListener('click',function(){setMode('simple');});
$('#m-tech').addEventListener('click',function(){setMode('tech');});
function setMotion(on){S.motion=on;document.body.classList.toggle('still',!on);$('#mo-on').setAttribute('aria-pressed',on);$('#mo-off').setAttribute('aria-pressed',!on);if(!on){S.scan=1;NS.drawScene();}}
$('#mo-on').addEventListener('click',function(){setMotion(true);});$('#mo-off').addEventListener('click',function(){setMotion(false);});
$('#thr').addEventListener('input',function(e){S.thr=e.target.value/100;$('#throut').textContent=u.f2(S.thr);NS.refresh();});
$('#rescan').addEventListener('click',NS.rescan);
$('#reset').addEventListener('click',function(){NS.resetAll();NS.change('Restored every dot, wire, weight and filter');});
NS.sim.LAYERS.forEach(function(L,i){var b=document.createElement('button');b.type='button';b.className='btn';b.setAttribute('data-stage',i);b.textContent=(i+1)+' '+L.name;$('#stagenav').appendChild(b);});
Object.keys(C.GL).filter(function(k){return !(k in C.STAGEKEYS);}).forEach(function(k){var b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('data-term',k);b.textContent=C.GL[k].label.split(' (')[0];$('#gloss').appendChild(b);});
try{NS.view=NS.init3D();}catch(err){NS.view=null;$('#nogl').style.display='flex';$('#gl').style.display='none';}
setMotion(S.motion);NS.refresh();NS.rescan();
})();
