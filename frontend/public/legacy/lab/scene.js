/* Left column: sample scene, detection list, live bars, prompt box, change log. */
(function(){
var NS=window.NS,C=NS.content,S=NS.S,u=NS.u,$=u.$,esc=u.esc,f2=u.f2,clamp=u.clamp;
var W=C.IMG_W,H=C.IMG_H,sc=$('#scene'),sg=sc.getContext('2d');
function visible(){var o=[];C.DETS.forEach(function(d,i){if(S.conf[i]>=S.thr)o.push(i);});return o;}
function area(i){var b=C.DETS[i].box;return (b[2]-b[0])*(b[3]-b[1]);}
function pct(i){return (area(i)/(W*H)*100).toFixed(1)+'%';}
function selTile(){var s=S.sel;if(!s)return -1;
  if(s.type==='node'&&s.ref.layer===0)return s.ref.tile;
  if(s.type==='thread'&&s.ref.a.layer===0)return s.ref.a.tile;return -1;}
NS.visible=visible;NS.area=area;NS.pct=pct;
NS.drawScene=function(){
  sg.drawImage(NS.bc,0,0);
  S.net.layerNodes[0].forEach(function(n){if(!n.active){sg.fillStyle='rgba(2,6,12,.82)';sg.fillRect(n.tc*W/C.TC,n.tr*H/C.TR,W/C.TC,H/C.TR);}});
  var t=selTile();if(t>=0){var tc=t%C.TC,tr=Math.floor(t/C.TC);sg.strokeStyle='#ffb224';sg.lineWidth=3;sg.setLineDash([8,5]);
    sg.strokeRect(tc*W/C.TC+2,tr*H/C.TR+2,W/C.TC-4,H/C.TR-4);sg.setLineDash([]);}
  var vis=visible();
  C.DETS.forEach(function(d,i){
    if(vis.indexOf(i)<0||d.box[2]>S.scan*W)return;
    var on=S.sel&&S.sel.type==='node'&&S.sel.ref.det===i,col=on?'#ffb224':(S.hl[i]?'#ffcf70':'#22e4ff');
    sg.lineWidth=on?4:2;sg.strokeStyle=col;sg.strokeRect(d.box[0],d.box[1],d.box[2]-d.box[0],d.box[3]-d.box[1]);
    var label=d.name+' '+f2(S.conf[i]);sg.font='600 15px "JetBrains Mono",monospace';
    var w=sg.measureText(label).width+10,y=d.box[1]-22<0?d.box[1]:d.box[1]-22;
    sg.fillStyle=col;sg.fillRect(d.box[0],y,w,22);sg.fillStyle='#021018';sg.fillText(label,d.box[0]+5,y+16);
  });
  if(S.scan<1){var x=S.scan*W,gr=sg.createLinearGradient(x-60,0,x,0);gr.addColorStop(0,'rgba(34,228,255,0)');gr.addColorStop(1,'rgba(34,228,255,.45)');
    sg.fillStyle=gr;sg.fillRect(x-60,0,60,H);sg.fillStyle='#22e4ff';sg.fillRect(x-1,0,2,H);}
};
var raf=0;
NS.rescan=function(){cancelAnimationFrame(raf);if(!S.motion){S.scan=1;NS.drawScene();return;}
  var t0=performance.now();S.scan=0;(function step(now){S.scan=clamp((now-t0)/1700,0,1);NS.drawScene();if(S.scan<1)raf=requestAnimationFrame(step);})(t0);};
sc.addEventListener('click',function(e){
  var r=sc.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H,best=-1;
  visible().forEach(function(i){var b=C.DETS[i].box;if(x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3]&&(best<0||area(i)<area(best)))best=i;});
  if(best>=0)NS.select({type:'node',ref:S.resNodes[best]});
  else{var tc=Math.floor(x/(W/C.TC)),tr=Math.floor(y/(H/C.TR));NS.select({type:'node',ref:S.net.tileNode[tr*C.TC+tc]});}
});
NS.renderList=function(){var el=$('#dlist');el.innerHTML='';
  C.DETS.forEach(function(d,i){var on=S.conf[i]>=S.thr,b=document.createElement('button');
    b.type='button';b.className='drow'+(on?'':' off');
    b.setAttribute('aria-pressed',S.sel&&S.sel.type==='node'&&S.sel.ref===S.resNodes[i]?'true':'false');
    b.innerHTML='<span class="dot"></span><span>'+esc(d.name)+'</span><span class="mono">'+f2(S.conf[i])+'</span><span class="tag">'+(on?'shown':'hidden')+'</span>';
    b.addEventListener('click',function(){NS.select({type:'node',ref:S.resNodes[i]});});el.appendChild(b);});var cn=$('#cutnote');if(cn){var sh=C.DETS.filter(function(d,i){return S.conf[i]>=S.thr;}).length,hid=C.DETS.map(function(d,i){return S.conf[i]<S.thr?d.name+' '+f2(S.conf[i]):null;}).filter(Boolean);cn.textContent='Cutoff '+f2(S.thr)+': showing '+sh+' of '+C.DETS.length+' objects'+(hid.length?'. Hidden because their score is below the cutoff: '+hid.join(', ')+'.':'. Nothing is hidden. Raise the cutoff to hide the least sure ones.');}};
NS.renderHud=function(){$('#hud').innerHTML=C.DETS.map(function(d,i){
  return '<button type="button" class="hbar" data-det="'+i+'"><span>'+esc(d.name)+'</span><span class="t"><i style="width:'+Math.round(S.conf[i]*100)+'%"></i></span><span>'+f2(S.conf[i])+'</span></button>';}).join('');};
$('#hud').addEventListener('click',function(e){var b=e.target.closest('[data-det]');if(b)NS.select({type:'node',ref:S.resNodes[+b.getAttribute('data-det')]});});

/* prompt: answers come from the detections above the cutoff */
var ALIAS={person:/\b(people|person|persons|pedestrians?|humans?)\b/,car:/\b(cars?|vehicles?)\b/,dog:/\b(dogs?)\b/,'traffic light':/\b(traffic lights?|lights?)\b/};
function plural(n,c){return n===1?c:(c==='person'?'people':c+'s');}
function row(i){return C.DETS[i].name+' ('+f2(S.conf[i])+')';}
NS.ask=function(q){
  var s=q.toLowerCase(),vis=visible(),cut=f2(S.thr),o;S.hl={};
  if(!vis.length)o={m:'Nothing is above the '+cut+' cutoff right now.',o:'0 detections shown.',e:'Lower the cutoff or restore muted parts.'};
  else if(/how many|count|number of/.test(s)){var cls=null;Object.keys(ALIAS).forEach(function(k){if(ALIAS[k].test(s))cls=k;});
    var set=cls?vis.filter(function(i){return C.DETS[i].name===cls;}):vis;set.forEach(function(i){S.hl[i]=1;});
    o={m:'I count '+set.length+' '+(cls?plural(set.length,cls):(set.length===1?'object':'objects'))+' above the '+cut+' cutoff.',
       o:set.length?set.map(row).join(', '):'none',e:set.length?set.map(function(i){return C.DETS[i].name+' covers '+pct(i);}).join('; '):'nothing to measure'};}
  else if(/biggest|largest|smallest|closest|nearest|farthest/.test(s)){var sm=/smallest|farthest/.test(s);
    var p=vis.slice().sort(function(a,b){return sm?area(a)-area(b):area(b)-area(a);})[0];S.hl[p]=1;
    o={m:'The '+(sm?'smallest':'biggest')+' detected object is the '+C.DETS[p].name+'.',o:row(p),e:'its box covers '+pct(p)+' of the image'};}
  else if(/left|right/.test(s)){var L=/left/.test(s);
    var p2=vis.slice().sort(function(a,b){return L?C.DETS[a].box[0]-C.DETS[b].box[0]:C.DETS[b].box[2]-C.DETS[a].box[2];})[0];S.hl[p2]=1;
    o={m:'The '+(L?'left':'right')+'most detected object is the '+C.DETS[p2].name+'.',o:row(p2),e:'box centre at x = '+Math.round((C.DETS[p2].box[0]+C.DETS[p2].box[2])/2)+' of '+W+' px'};}
  else if(/list|what|everything|see|there|scene|describe/.test(s)){vis.forEach(function(i){S.hl[i]=1;});
    o={m:'I found '+vis.length+' object'+(vis.length===1?'':'s')+' above the '+cut+' cutoff.',o:vis.map(row).join(', '),e:vis.length+' boxes on a '+W+' x '+H+' px image'};}
  else o={m:'I can answer from the detections only.',o:'try: how many people, biggest object, what is on the left, list everything',e:'-'};
  $('#answer').innerHTML='<div class="ans-main">'+esc(o.m)+'</div><div class="kv"><b>OBSERVED</b><span>'+esc(o.o)+'</span><b>MEASURED</b><span>'+esc(o.e)+
    '</span><b class="i">CAUTION</b><span>The model can miss or mislabel things. These are its outputs, not verified facts.</span></div>';
  NS.refresh();};
$('#askform').addEventListener('submit',function(e){e.preventDefault();var q=$('#q').value.trim();if(q)NS.ask(q);});
Array.prototype.forEach.call(document.querySelectorAll('#chips .chip'),function(c){c.addEventListener('click',function(){$('#q').value=c.textContent;NS.ask(c.textContent);});});

/* what changed */
NS.change=function(title){
  NS.recompute();var rows=[];
  C.DETS.forEach(function(d,i){var dv=S.conf[i]-S.prevConf[i];
    if(Math.abs(dv)>=0.005)rows.push({i:i,from:S.prevConf[i],to:S.conf[i],drop:dv<0,cross:(S.prevConf[i]>=S.thr)!==(S.conf[i]>=S.thr)});});
  S.log.unshift({title:title,rows:rows});if(S.log.length>6)S.log.pop();S.prevConf=S.conf.slice();NS.refresh();};
function sentence(e){var m=S.mode;
  if(!e.rows.length)return m==='simple'?'Nothing visible changed. Other wires carried enough signal, so the answer stayed the same.':'No result moved by 0.005 or more: other paths compensated.';
  var top=e.rows.slice().sort(function(a,b){return Math.abs(b.to-b.from)-Math.abs(a.to-a.from);})[0],d=C.DETS[top.i];
  var base=top.drop?(m==='simple'?'Less signal reached the end, so the network became less sure about the '+d.name+'.':'The sum feeding OUT-'+(top.i+1)+' fell, so '+d.name+' moved from '+f2(top.from)+' to '+f2(top.to)+'.')
    :(m==='simple'?'More signal reached the end, so the network is more sure about the '+d.name+'.':'The sum feeding OUT-'+(top.i+1)+' rose, so '+d.name+' moved from '+f2(top.from)+' to '+f2(top.to)+'.');
  var cr=e.rows.filter(function(r){return r.cross;}).map(function(r){return C.DETS[r.i].name+(r.to>=S.thr?' is back in':' dropped out of')+' the results at the '+f2(S.thr)+' cutoff';});
  return base+(cr.length?' Also: '+cr.join('; ')+'.':'');}
NS.renderChg=function(){var el=$('#chg');
  if(!S.log.length){el.innerHTML='<p class="muted">Nothing changed yet. Mute a dot, cut a wire, or drag a weight and the effect is listed here.</p>';return;}
  el.innerHTML=S.log.map(function(e){return '<div class="entry"><div class="t">'+esc(e.title)+'</div><p>'+esc(sentence(e))+'</p>'+
    (e.rows.length?'<ul>'+e.rows.map(function(r){var d=r.to-r.from;return '<li class="'+(r.drop?'dn':'up')+'">'+esc(C.DETS[r.i].name)+' '+f2(r.from)+' → '+f2(r.to)+' ('+(d>0?'+':'−')+Math.abs(d).toFixed(2)+')</li>';}).join('')+'</ul>':'')+'</div>';}).join('');};
})();
