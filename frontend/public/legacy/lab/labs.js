/* Hands-on labs inside the inspector, plus click/slider handling for the whole page. */
(function(){
var NS=window.NS,C=NS.content,S=NS.S,u=NS.u,$=u.$,esc=u.esc,f2=u.f2,clamp=u.clamp,net=S.net,KW=C.KW,KH=C.KH,TC=C.TC,TR=C.TR;
function tp(x,y){return Math.min(TR-1,Math.floor(y*TR/KH))*TC+Math.min(TC-1,Math.floor(x*TC/KW));}
function sel(){return S.sel&&S.sel.type==='node'?S.sel.ref:null;}
/* ---- tile lab: the actual pixels ---- */
function block(n,cx,cy){var x0=n.tc*(C.IMG_W/TC),y0=Math.floor(n.tr*C.IMG_H/TR),th=Math.round(C.IMG_H/TR);
  var xa=x0+cx*16,xb=xa+16,ya=y0+Math.floor(cy*th/8),yb=y0+Math.floor((cy+1)*th/8),r=0,g=0,b=0,k=0;
  for(var y=ya;y<yb;y++)for(var x=xa;x<xb;x++){var p=(y*C.IMG_W+x)*4;r+=S.rgb[p];g+=S.rgb[p+1];b+=S.rgb[p+2];k++;}
  return {r:Math.round(r/k),g:Math.round(g/k),b:Math.round(b/k),xa:xa,xb:xb-1,ya:ya,yb:yb-1};}
function drawTile(n){var cv=$('#tilecv');if(!cv)return;var g=cv.getContext('2d');g.font='600 13px "JetBrains Mono",monospace';g.textAlign='center';g.textBaseline='middle';
  for(var cy=0;cy<8;cy++)for(var cx=0;cx<10;cx++){var b=block(n,cx,cy),gray=Math.round(0.299*b.r+0.587*b.g+0.114*b.b);
    g.fillStyle=n.active?'rgb('+b.r+','+b.g+','+b.b+')':'#05090f';g.fillRect(cx*40,cy*40,40,40);
    g.fillStyle=gray>110?'#021018':'#e8f4ff';g.fillText(n.active?gray:0,cx*40+20,cy*40+20);}
  g.strokeStyle='rgba(2,16,24,.55)';g.lineWidth=1;for(var i=0;i<=10;i++){g.beginPath();g.moveTo(i*40+.5,0);g.lineTo(i*40+.5,320);g.stroke();}
  for(var j=0;j<=8;j++){g.beginPath();g.moveTo(0,j*40+.5);g.lineTo(400,j*40+.5);g.stroke();}
  g.strokeStyle='#ffb224';g.lineWidth=3;g.strokeRect(S.cell.cx*40+1.5,S.cell.cy*40+1.5,37,37);
  var c=block(n,S.cell.cx,S.cell.cy);$('#cellinfo').textContent='Block x '+c.xa+'-'+c.xb+', y '+c.ya+'-'+c.yb+': red '+c.r+', green '+c.g+', blue '+c.b+'. Number shown = brightness 0-255.';}
/* ---- filter lab: the real convolution ---- */
function drawFeature(k){var cv=$('#fmcv');if(!cv)return;var g=cv.getContext('2d'),img=g.createImageData(KW,KH),r=S.resp[k],mx=1e-6,i;
  for(i=0;i<KW*KH;i++){var t=tp(i%KW,Math.floor(i/KW));if(net.tileNode[t].active)mx=Math.max(mx,Math.abs(r[i]));}
  for(i=0;i<KW*KH;i++){var t2=tp(i%KW,Math.floor(i/KW)),v=net.tileNode[t2].active?Math.sqrt(Math.abs(r[i])/mx):0;
    img.data[i*4]=10*v;img.data[i*4+1]=228*v;img.data[i*4+2]=255*v;img.data[i*4+3]=255;}
  g.putImageData(img,0,0);var sc=$('#srccv');if(sc){var sg=sc.getContext('2d'),im2=sg.createImageData(KW,KH);for(i=0;i<KW*KH;i++){var gv=S.G[i];im2.data[i*4]=gv;im2.data[i*4+1]=gv;im2.data[i*4+2]=gv;im2.data[i*4+3]=255;}sg.putImageData(im2,0,0);sg.strokeStyle='#ffb224';sg.lineWidth=1;sg.strokeRect(S.probe.x-1.5,S.probe.y-1.5,4,4);}g.strokeStyle='#ffb224';g.lineWidth=1;g.strokeRect(S.probe.x-1.5,S.probe.y-1.5,4,4);}
function probe(k){var x=S.probe.x,y=S.probe.y,cells='',sum=0;
  for(var dy=-1;dy<=1;dy++){for(var dx=-1;dx<=1;dx++){var xx=x+dx,yy=y+dy,gv=(xx>=0&&xx<KW&&yy>=0&&yy<KH)?S.G[yy*KW+xx]:0,w=S.kern[k][(dy+1)*3+dx+1];sum+=gv*w;
    cells+='<span'+(dx===0&&dy===0?' class="mid"':'')+'>'+Math.round(gv)+' × '+Number(w.toFixed(2))+'</span>';}}
  $('#probe').innerHTML='<p class="small">Spot ('+x+', '+y+'): the 9 pixels under the filter, each × its filter number:</p><div class="pgrid">'+cells+'</div><p class="mono small">Add them up: <b>'+sum.toFixed(1)+'</b>. That one number is this spot on the map (bright = big).</p>';}
function fillFilter(n){var k=n.idx;drawFeature(k);probe(k);
  $('#fval').textContent=f2(S.val[n.i])+' ('+Math.round(clamp(S.val[n.i]/Math.max(S.ideal[n.i],1e-6),0,9.99)*100)+'% of start)';
  $('#fwires').innerHTML=n.inT.map(function(t){return '<button type="button" class="unit" data-thread="'+t.id+'">'+t.a.label+' carries '+f2(S.carry[t.id])+(t.cut?' (cut)':'')+'</button>';}).join('');}
/* ---- neuron lab ---- */
function drawSig(n){var cv=$('#sigcv');if(!cv)return;var g=cv.getContext('2d'),W=400,H=110,x;g.clearRect(0,0,W,H);
  g.strokeStyle='#1a3550';g.lineWidth=1;g.beginPath();g.moveTo(0,H/2);g.lineTo(W,H/2);g.moveTo(W/2,0);g.lineTo(W/2,H);g.stroke();
  g.strokeStyle='#22e4ff';g.lineWidth=2;g.beginPath();for(x=0;x<=W;x++){var z=(x/W-0.5)*12,y=H-6-NS.sim.sigmoid(z)*(H-12);x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
  var zz=clamp(n.z,-6,6),mx=(zz/12+0.5)*W,my=H-6-(n.active?NS.sim.sigmoid(n.z):0)*(H-12);
  g.fillStyle='#ffb224';g.beginPath();g.arc(mx,my,6,0,7);g.fill();g.fillStyle='#93acc0';g.font='11px "JetBrains Mono",monospace';g.fillText('z = -6',4,H-14);g.fillText('+6',W-24,H-14);}
function updateNeuron(n){n.inT.forEach(function(t){var x=S.val[t.a.i],e;
  if(e=$('#x'+t.id))e.textContent=f2(x);if(e=$('#w'+t.id))e.textContent=t.w.toFixed(1);if(e=$('#p'+t.id))e.textContent=(S.carry[t.id]>=0?'+':'−')+Math.abs(S.carry[t.id]).toFixed(2);
  var b=document.querySelector('[data-cut="'+t.id+'"]');if(b)b.setAttribute('aria-pressed',t.cut);});
  $('#bv').textContent=n.b.toFixed(1);$('#zv').textContent=n.z.toFixed(2);$('#ov').textContent=f2(S.val[n.i]);drawSig(n);}
function updateThread(t){var e;if(e=$('#wa'))e.textContent=f2(S.val[t.a.i]);if(e=$('#ww'))e.textContent=t.w.toFixed(1);if(e=$('#wd'))e.textContent=(S.carry[t.id]>=0?'':'−')+Math.abs(S.carry[t.id]).toFixed(2);if(e=$('#tv'))e.textContent=f2(S.val[t.a.i]);if(e=$('#tw'))e.textContent=t.w.toFixed(1);if(e=$('#tc'))e.textContent=S.carry[t.id].toFixed(2);}
NS.afterRender=function(){var s=S.sel;if(!s)return;
  if(s.type==='node'){var n=s.ref;if(n.layer===0)drawTile(n);else if(n.layer===1)fillFilter(n);else updateNeuron(n);}
  else if(s.type==='thread')updateThread(s.ref);};
/* ---- selection + refresh ---- */
NS.light=function(){NS.drawScene();NS.renderList();NS.renderHud();if(NS.view)NS.view.paint();};
NS.select=function(sl){stopSlide();S.sel=sl;NS.refresh();};
NS.refresh=function(){NS.drawScene();NS.renderList();NS.renderHud();NS.renderInsp();NS.renderChg();navState();if(NS.view)NS.view.paint();};
function navState(){Array.prototype.forEach.call($('#stagenav').children,function(b,i){var s=S.sel,on=s&&((s.type==='layer'&&s.ref===i)||(s.type==='node'&&s.ref.layer===i)||(s.type==='thread'&&s.ref.b.layer===i));b.setAttribute('aria-pressed',on?'true':'false');});}
/* ---- sliding window animation ---- */
var slideT=null;
function stopSlide(){if(slideT){clearInterval(slideT);slideT=null;}var b=$('#slidebtn');if(b)b.textContent='Play sliding';}
function slide(btn){if(slideT){stopSlide();return;}var n=sel();if(!n||n.layer!==1)return;btn.textContent='Stop';S.probe.x=1;
  slideT=setInterval(function(){var m=sel();if(!m||m.layer!==1){stopSlide();return;}S.probe.x+=2;if(S.probe.x>=KW-1){stopSlide();return;}fillFilter(m);},110);}
NS.stopSlide=stopSlide;
/* ---- events ---- */
var olds={};
document.addEventListener('click',function(e){var t=e.target,b;
  if((b=t.closest('[data-term]'))){var k=b.getAttribute('data-term');if(k in C.STAGEKEYS)NS.select({type:'layer',ref:C.STAGEKEYS[k]});else NS.select({type:'term',ref:k});return;}
  if((b=t.closest('[data-node]'))){NS.select({type:'node',ref:net.nodes[+b.getAttribute('data-node')]});return;}
  if((b=t.closest('[data-thread]'))){NS.select({type:'thread',ref:net.threads[+b.getAttribute('data-thread')]});return;}
  if((b=t.closest('[data-stage]'))){NS.select({type:'layer',ref:+b.getAttribute('data-stage')});return;}
  if((b=t.closest('[data-preset]'))){var n=sel();if(!n)return;var nm=b.getAttribute('data-preset');S.kern[n.idx]=C.PRESETS[nm].slice();NS.computeFilter(n.idx);NS.setContrib(n.idx);NS.change('Filter '+n.label+' set to "'+nm+'"');return;}
  if((b=t.closest('[data-cut]'))){var th=net.threads[+b.getAttribute('data-cut')];th.cut=!th.cut;NS.change((th.cut?'Cut wire ':'Restored wire ')+th.a.label+' → '+th.b.label);return;}
  if((b=t.closest('[data-act="slide"]'))){slide(b);return;}
  if((b=t.closest('[data-act]'))){var a=b.getAttribute('data-act');
    if(a==='node'){var nn=sel();nn.active=!nn.active;NS.change((nn.active?'Unmuted ':'Muted ')+nn.label);}
    else if(S.sel&&S.sel.type==='thread'){var t2=S.sel.ref;t2.cut=!t2.cut;NS.change((t2.cut?'Cut wire ':'Restored wire ')+t2.a.label+' → '+t2.b.label);}return;}
  if(t.id==='tilecv'){var r=t.getBoundingClientRect();S.cell={cx:clamp(Math.floor((e.clientX-r.left)/r.width*10),0,9),cy:clamp(Math.floor((e.clientY-r.top)/r.height*8),0,7)};drawTile(sel());return;}
  if(t.id==='fmcv'){var r2=t.getBoundingClientRect();S.probe={x:clamp(Math.floor((e.clientX-r2.left)/r2.width*KW),0,KW-1),y:clamp(Math.floor((e.clientY-r2.top)/r2.height*KH),0,KH-1)};fillFilter(sel());}
});
document.addEventListener('input',function(e){var t=e.target,n;
  if(t.hasAttribute('data-wid')||t.hasAttribute('data-twid')){var th=net.threads[+(t.getAttribute('data-wid')||t.getAttribute('data-twid'))];
    if(!(th.id in olds))olds[th.id]=th.w;th.w=+t.value;NS.recompute();NS.light();if(S.sel.type==='thread')updateThread(th);else updateNeuron(S.sel.ref);}
  else if(t.hasAttribute('data-bias')){n=sel();if(!('b'+n.i in olds))olds['b'+n.i]=n.b;n.b=+t.value;NS.recompute();NS.light();updateNeuron(n);}
  else if(t.hasAttribute('data-kc')){n=sel();if(!('k'+n.i in olds))olds['k'+n.i]=1;S.kern[n.idx][+t.getAttribute('data-kc')]=+t.value||0;NS.computeFilter(n.idx);NS.setContrib(n.idx);NS.recompute();NS.light();fillFilter(n);}
});
document.addEventListener('change',function(e){var t=e.target,n;
  if(t.hasAttribute('data-wid')||t.hasAttribute('data-twid')){var th=net.threads[+(t.getAttribute('data-wid')||t.getAttribute('data-twid'))],o=olds[th.id];delete olds[th.id];NS.change('Weight '+th.a.label+' → '+th.b.label+': '+(o===undefined?'?':o.toFixed(1))+' → '+th.w.toFixed(1));}
  else if(t.hasAttribute('data-bias')){n=sel();var ob=olds['b'+n.i];delete olds['b'+n.i];NS.change('Bias of '+n.label+': '+(ob===undefined?'?':ob.toFixed(1))+' → '+n.b.toFixed(1));}
  else if(t.hasAttribute('data-kc')){n=sel();delete olds['k'+n.i];NS.change('Edited filter '+n.label+' ('+C.KDEF[n.idx][0]+')');}
});
})();
