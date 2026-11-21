/* Shared state, helpers, and the REAL maths: pixels -> tiles -> filter responses -> network. */
(function(){
var NS=window.NS=window.NS||{},C=NS.content,sim=NS.sim;
var KW=C.KW,KH=C.KH,TC=C.TC,TR=C.TR;
function $(s,r){return (r||document).querySelector(s);}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function f2(v){return v.toFixed(2);}
function rich(s){return esc(s).replace(/\{([a-z]+)\}/g,function(m,k){var g=C.GL[k];
  return g?'<button type="button" class="term" data-term="'+k+'">'+esc(g.label.split(' (')[0])+'</button>':k;});}
var S=NS.S={mode:'simple',motion:!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),
  thr:0.30,sel:null,hl:{},scan:1,hover:null,probe:{x:58,y:57},cell:{cx:4,cy:3},log:[]};
NS.u={$:$,esc:esc,clamp:clamp,f2:f2,rich:rich};

/* picture -> numbers */
var bc=NS.bc=document.createElement('canvas');bc.width=C.IMG_W;bc.height=C.IMG_H;
var bg=bc.getContext('2d');NS.drawIllustration(bg);
var rgb=S.rgb=bg.getImageData(0,0,C.IMG_W,C.IMG_H).data;
var G=S.G=new Float32Array(KW*KH);
for(var y=0;y<KH;y++)for(var x=0;x<KW;x++){var s=0;
  for(var dy=0;dy<4;dy++)for(var dx=0;dx<4;dx++){var p=((y*4+dy)*C.IMG_W+(x*4+dx))*4;s+=0.299*rgb[p]+0.587*rgb[p+1]+0.114*rgb[p+2];}
  G[y*KW+x]=s/16;}
function tileOfPx(x,y){return Math.min(TR-1,Math.floor(y*TR/KH))*TC+Math.min(TC-1,Math.floor(x*TC/KW));}
S.bright=[];(function(){var sum=new Array(TC*TR).fill(0),n=new Array(TC*TR).fill(0);
  for(var y=0;y<KH;y++)for(var x=0;x<KW;x++){var t=tileOfPx(x,y);sum[t]+=G[y*KW+x]/255;n[t]++;}
  for(var t=0;t<TC*TR;t++)S.bright.push(sum[t]/n[t]);})();

/* a filter slid over the picture (zero padding). Signed response per pixel. */
function convSigned(k){var out=new Float32Array(KW*KH);
  for(var y=0;y<KH;y++)for(var x=0;x<KW;x++){var s=0;
    for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var xx=x+dx,yy=y+dy;
      if(xx>=0&&xx<KW&&yy>=0&&yy<KH)s+=G[yy*KW+xx]*k[(dy+1)*3+dx+1];}
    out[y*KW+x]=s;}
  return out;}
function tileMeans(resp){var sum=new Array(TC*TR).fill(0),n=new Array(TC*TR).fill(0);
  for(var y=0;y<KH;y++)for(var x=0;x<KW;x++){var t=tileOfPx(x,y);sum[t]+=Math.abs(resp[y*KW+x]);n[t]++;}
  return sum.map(function(v,i){return v/n[i];});}
S.kern=C.KDEF.map(function(d){return d[1].slice();});
S.resp=[];S.contrib=[];
function computeFilter(k){S.resp[k]=convSigned(S.kern[k]);S.contrib[k]=tileMeans(S.resp[k]);}
C.KDEF.forEach(function(d,k){computeFilter(k);});
var top=S.contrib.map(function(c){return c.map(function(v,i){return [v,i];}).sort(function(a,b){return b[0]-a[0];}).slice(0,5).map(function(p){return p[1];});});
S.scale=1/Math.max.apply(null,S.contrib.map(function(c,k){return top[k].reduce(function(a,t){return a+c[t];},0);}));

/* the network: contribution wires carry (filter response inside a tile), others carry value x weight */
var net=S.net=sim.buildNet(top,11);
function setContrib(k){net.threads.forEach(function(t){if(t.kind==='contrib'&&t.b.idx===k)t.w=S.contrib[k][t.a.tile]*S.scale;});}
NS.setContrib=setContrib;NS.computeFilter=computeFilter;
C.KDEF.forEach(function(d,k){setContrib(k);});
var tg={};net.rng2=sim.mulberry32(23);
S.ideal=sim.forward(net,S.bright,function(n){if(!(n.i in tg))tg[n.i]=n.layer===4?C.DETS[n.idx].base:0.3+net.rng2()*0.5;return tg[n.i];}).val.slice();
S.resNodes=net.layerNodes[4];S.resNodes.forEach(function(n,i){n.det=i;n.label='OUT-'+(i+1);});
S.maxCarry=[0,0,0,0,0];

NS.recompute=function(){
  var r=sim.forward(net,S.bright);S.val=r.val;S.carry=r.carry;
  S.conf=C.DETS.map(function(d,i){return S.val[S.resNodes[i].i];});
  S.maxCarry=[1e-6,1e-6,1e-6,1e-6,1e-6];
  net.threads.forEach(function(t){S.maxCarry[t.a.layer]=Math.max(S.maxCarry[t.a.layer],Math.abs(S.carry[t.id]));});
};
NS.resetAll=function(){
  net.nodes.forEach(function(n){n.active=true;n.b=n.b0;});
  S.kern=C.KDEF.map(function(d){return d[1].slice();});
  C.KDEF.forEach(function(d,k){computeFilter(k);setContrib(k);});
  net.threads.forEach(function(t){t.cut=false;if(t.kind==='weight')t.w=t.w0;});
};
NS.recompute();S.prevConf=S.conf.slice();
})();
