/* Right column: turns whatever you click into an explanation plus a hands-on lab. */
(function(){
var NS=window.NS,C=NS.content,S=NS.S,u=NS.u,$=u.$,esc=u.esc,f2=u.f2,rich=u.rich,clamp=u.clamp,net=S.net;
function M(){return S.mode==='simple'?'s':'t';}
function fact(k,v){return '<div><dt>'+k+'</dt><dd>'+v+'</dd></div>';}
function termBtn(k,label){return '<button type="button" class="term" data-term="'+k+'">'+esc(label||C.GL[k].label.split(' (')[0])+'</button>';}
function chips(keys){return '<div class="chiprow">'+keys.map(function(k){return '<button type="button" class="chip" data-term="'+k+'">'+esc(C.GL[k].label.split(' (')[0])+'</button>';}).join('')+'</div>';}
function nodeBtn(n,extra){return '<button type="button" class="unit" data-node="'+n.i+'">'+n.label+(extra||'')+'</button>';}
function state(on,a,b){return on?'<span class="state-on">'+a+'</span>':'<span class="state-off">'+b+'</span>';}
function sig(n){return Math.round(clamp(S.val[n.i]/Math.max(S.ideal[n.i],1e-6),0,9.99)*100)+'%';}

function primer(){return '<h3>Start here: how an AI looks at a picture</h3><p>This is a lab for seeing how an AI model turns a picture into an answer. <b>Everything is clickable</b>, and every slider has a help box. Blue dashed words open their meaning here.</p>'+
  '<p class="lbl" style="margin-top:12px">Guided tour (in order)</p>'+chips(['dot','wire','weight','bias','sum','activation','filter','featuremap','confidence','cutoff','shown'])+
  '<p class="lbl" style="margin-top:12px">Also</p>'+chips(['value','plane','spark','decor','schematic'])+
  '<p class="muted" style="margin-top:12px">Then click a dot, a wire or a stage in the 3D view, move a slider, mute something, and watch what changes.</p>';}
function termHTML(k){var g=C.GL[k],m=M();return '<h3>'+esc(g.label)+'</h3><p>'+rich(g[m])+'</p>'+(g.lab?'<p class="lab"><b>Lab picture:</b> '+rich(g.lab)+'</p>':'')+(g.see.length?'<p class="lbl" style="margin-top:10px">Related</p>'+chips(g.see):'');}
function layerHTML(li){var L=NS.sim.LAYERS[li],m=M(),st=C.STAGE[li];
  return '<h3>Stage '+(li+1)+' of 5: '+L.name+'</h3><p>'+rich(st[m])+'</p><p class="real"><b>Sketch vs real:</b> '+esc(st.real)+'</p><dl class="facts">'+
   fact('Dots in this stage',net.layerNodes[li].length)+fact('Wires coming in',net.layerNodes[li].reduce(function(a,n){return a+n.inT.length;},0))+
   fact('Dots muted',net.layerNodes[li].filter(function(n){return !n.active;}).length)+'</dl><p class="lbl">Dots (click one)</p><div class="units">'+
   net.layerNodes[li].map(function(n){return nodeBtn(n,li===4?' '+C.DETS[n.det].name:'');}).join('')+'</div>'+
   '<div class="row" style="margin-top:10px"><button class="btn" type="button" data-stage="'+(li-1)+'"'+(li===0?' disabled':'')+'>Previous stage</button><button class="btn" type="button" data-stage="'+(li+1)+'"'+(li===4?' disabled':'')+'>Next stage</button></div>';}

function nodeHead(n){var L=NS.sim.LAYERS[n.layer];
  return '<h3>'+(n.layer===4?esc(C.DETS[n.det].name)+' ('+n.label+')':(n.layer===1?'Filter '+n.label+': '+esc(C.KDEF[n.idx][0]):n.layer===0?'Tile '+n.label:'Unit '+n.label))+'</h3>'+
   '<p class="tag">'+L.name+' · STAGE '+(n.layer+1)+' OF 5 · '+termBtn('dot','dot')+'</p><p>'+rich(C.NODE[n.layer][M()])+'</p>';}
function muteBtn(n){return '<button class="btn '+(n.active?'warn':'primary')+'" type="button" data-act="node">'+(n.active?'Mute this dot':'Unmute this dot')+'</button>';}

function tileHTML(n){return nodeHead(n)+'<p class="lbl">The real pixels behind this dot (click a block)</p><canvas class="cv" id="tilecv" width="400" height="320" aria-label="Pixel blocks of this tile with brightness numbers"></canvas><p class="mono small" id="cellinfo"></p><dl class="facts">'+
  fact('Column, row of tile',(n.tc+1)+', '+(n.tr+1))+fact('Average brightness',Math.round(S.bright[n.tile]*255)+' of 255 ('+f2(S.bright[n.tile])+')')+
  fact('State',state(n.active,'ACTIVE','MUTED (sees black)'))+'</dl>'+muteBtn(n)+
  '<p class="lbl" style="margin-top:10px">Filters that read this tile</p><div class="units">'+(n.outT.length?n.outT.map(function(t){return '<button type="button" class="unit" data-thread="'+t.id+'">'+t.a.label+' → '+t.b.label+'</button>';}).join(''):'<span class="muted">none of the 5-tile wires</span>')+'</div>';}
function filterHTML(n){var k=n.idx;
  return nodeHead(n)+'<p class="lbl">The filter: 9 numbers (edit them)</p><div class="kgrid">'+S.kern[k].map(function(v,i){return '<input type="number" class="kc" step="0.5" data-kc="'+i+'" value="'+Number(v.toFixed(2))+'" aria-label="Filter number '+(i+1)+'">';}).join('')+'</div>'+
  '<div class="row" style="margin:6px 0">'+Object.keys(C.PRESETS).map(function(p){return '<button type="button" class="chip" data-preset="'+esc(p)+'">'+esc(p)+'</button>';}).join('')+'</div>'+
  '<p class="lbl">Source picture (grayscale). The orange box is where the filter sits now.</p><canvas class="cv" id="srccv" width="160" height="100" aria-label="Grayscale source picture with filter position"></canvas><p class="lbl">What it found (feature map). Click a spot to move the filter there.</p><canvas class="cv" id="fmcv" width="160" height="100" aria-label="Feature map for this filter"></canvas><div id="probe" class="probe"></div>'+
  '<dl class="facts"><div><dt>Value (how much pattern found)</dt><dd id="fval"></dd></div>'+fact('State',state(n.active,'ACTIVE','MUTED'))+'</dl>'+muteBtn(n)+
  '<p class="lbl" style="margin-top:10px">Wires in: tiles it reads (value carried)</p><div class="units" id="fwires"></div>'+NS.learn.filterLesson(n,M())+NS.learn.ctrl('kernel',M());}
function neuronHTML(n){var m=M();
  var rows=n.inT.map(function(t){return '<div class="nrow"><button type="button" class="unit" data-node="'+t.a.i+'">'+t.a.label+'</button><span class="mono" id="x'+t.id+'"></span><input type="range" min="-3" max="3" step="0.1" value="'+t.w.toFixed(1)+'" data-wid="'+t.id+'" aria-label="Weight of wire '+t.a.label+' to '+n.label+'"><span class="mono" id="w'+t.id+'"></span><span class="mono" id="p'+t.id+'"></span><button type="button" class="mini" data-cut="'+t.id+'" aria-pressed="'+t.cut+'">cut</button></div>';}).join('');
  var out=nodeHead(n)+'<p class="lbl">How this dot decides</p><p class="small">'+rich(m==='s'?'Each row is one wire arriving here. Its number (value) is multiplied by that wire\'s weight dial, giving the product. The dot adds all products, adds its own {bias} (starting push), and squashes the total with the {activation}. Drag a weight or the bias and watch the total and output change. Details: {sum}.':'Rows: upstream value x weight = product. z = sum of products + bias; output = sigmoid(z). See {sum}.')+'</p><div class="neuron"><div class="nrow nh"><span>from</span><span>value</span><span>weight</span><span></span><span>product</span><span></span></div>'+rows+
   '<div class="nrow"><span>bias</span><span></span><input type="range" min="-4" max="4" step="0.1" value="'+n.b.toFixed(1)+'" data-bias="1" aria-label="Bias of '+n.label+'"><span class="mono" id="bv"></span><span></span><span></span></div></div>'+
   '<dl class="facts">'+fact('Total (z)','<span id="zv"></span>')+fact('Output = sigmoid(z)','<span id="ov"></span>')+fact('State',state(n.active,'ACTIVE','MUTED'))+'</dl>'+
   '<canvas class="cv" id="sigcv" width="400" height="110" aria-label="Sigmoid curve with this unit marked"></canvas><p class="muted small">'+rich(m==='s'?'The curve is the {activation}: any total becomes a number between 0 and 1. The dot shows where this unit is.':'Sigmoid activation. The marker is the current pre-activation z.')+'</p>';
  if(n.layer===4){var d=C.DETS[n.det],b=d.box;out+='<dl class="facts">'+fact('Class',esc(d.name))+fact('Confidence',f2(S.conf[n.det])+' (started '+f2(d.base)+')')+fact('Box x1,y1,x2,y2',b.join(', '))+
    fact('Centre',Math.round((b[0]+b[2])/2)+', '+Math.round((b[1]+b[3])/2))+fact('Area',NS.area(n.det)+' px · '+NS.pct(n.det))+fact('Shown at cutoff',S.conf[n.det]>=S.thr?'yes':'no')+'</dl>';}
  return out+muteBtn(n)+NS.learn.ctrl('both',m);}
function nodeHTML(n){return n.layer===0?tileHTML(n):n.layer===1?filterHTML(n):neuronHTML(n);}
function threadHTML(t){var m=M(),c=t.kind==='contrib',txt;
  if(c)txt=m==='s'?rich('Filter '+t.b.label+' looks at 5 tiles of the picture. This wire is the link to tile '+t.a.label+'. It carries <A>: how strongly the filter reacted inside that tile (more edges that match its pattern = bigger number). Filter '+t.b.label+' adds up its 5 wires to get its own number. Cut this wire and the filter ignores that tile. See {wire} and {filter}.').replace('&lt;A&gt;','the number shown below'):rich('Carries the mean absolute filter response inside tile '+t.a.label+', scaled. The filter unit value is the sum over its 5 wires.');
  else txt=m==='s'?rich('Dot '+t.a.label+' currently holds ')+'<b id="wa"></b>'+rich('. This wire has a {weight} (a dial for how much it matters) of ')+'<b id="ww"></b>'+rich('. So it delivers ')+'<b id="wd"></b>'+rich(' to dot '+t.b.label+'. Dot '+t.b.label+' then adds up everything all its wires deliver, adds its own {bias} (a starting push), and squashes the total to a number between 0 and 1. A negative delivery pushes the next dot down. Full steps: {sum}.'):rich('Delivered = weight x upstream value = ')+'<b id="wd"></b>'+rich('. Downstream z = sum of delivered values + bias; output = sigmoid(z).');
  return '<h3>Wire '+t.a.label+' → '+t.b.label+'</h3><p class="tag">'+NS.sim.LAYERS[t.a.layer].name+' → '+NS.sim.LAYERS[t.b.layer].name+' · '+termBtn('wire','wire')+'</p><p>'+txt+'</p><dl class="facts">'+
   (c?'':fact('Value in ('+t.a.label+')','<span id="tv"></span>')+fact('Weight','<span id="tw"></span>'))+fact('Delivers','<span id="tc"></span>')+fact('State',state(!t.cut,'CARRYING','CUT'))+'</dl>'+
   (c?'':'<input class="wide" type="range" min="-3" max="3" step="0.1" value="'+t.w.toFixed(1)+'" data-twid="'+t.id+'" aria-label="Weight of this wire">')+
   '<div class="row" style="margin-top:8px"><button class="btn '+(t.cut?'primary':'warn')+'" type="button" data-act="thread">'+(t.cut?'Restore this wire':'Cut this wire')+'</button>'+
   '<button type="button" class="unit" data-node="'+t.a.i+'">go to '+t.a.label+'</button><button type="button" class="unit" data-node="'+t.b.i+'">go to '+t.b.label+'</button></div>'+(c?'':NS.learn.ctrl('wire',m));}

NS.renderInsp=function(){var el=$('#insp'),s=S.sel,h;
  if(!s)h=primer();else if(s.type==='term')h=termHTML(s.ref);else if(s.type==='layer')h=layerHTML(s.ref);else if(s.type==='node')h=nodeHTML(s.ref);else h=threadHTML(s.ref);
  el.innerHTML=h;NS.afterRender();};
NS.html={fact:fact,termBtn:termBtn};
})();
