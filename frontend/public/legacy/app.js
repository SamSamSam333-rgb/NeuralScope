/* App shell: router, safe storage, shared helpers (sliders, charts, experiment log). */
(function(){
var NS=window.NS=window.NS||{};NS.mods={};
var mem={};
NS.store={get:function(k,d){try{var v=localStorage.getItem('ns3_'+k);return v===null?(k in mem?mem[k]:d):JSON.parse(v);}catch(e){return k in mem?mem[k]:d;}},
 set:function(k,v){mem[k]=v;try{localStorage.setItem('ns3_'+k,JSON.stringify(v));}catch(e){}}};
NS.$=function(s,r){return (r||document).querySelector(s);};
NS.esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
/* slider factory: {id,label,min,max,step,value,fmt,why} -> html */
NS.ctl=function(o){var f=o.fmt||function(v){return v;};return '<div class="ctl"><label for="'+o.id+'">'+o.label+'</label><output id="'+o.id+'_o" for="'+o.id+'">'+f(o.value)+'</output><input type="range" id="'+o.id+'" min="'+o.min+'" max="'+o.max+'" step="'+o.step+'" value="'+o.value+'">'+(o.why?'<span class="why">'+o.why+'</span>':'')+'</div>';};
NS.sel=function(o){return '<div class="ctl"><label for="'+o.id+'">'+o.label+'</label><span></span><select id="'+o.id+'">'+o.opts.map(function(p){return '<option value="'+p[0]+'"'+(p[0]===o.value?' selected':'')+'>'+p[1]+'</option>';}).join('')+'</select>'+(o.why?'<span class="why">'+o.why+'</span>':'')+'</div>';};
NS.cycle=function(on){return '<div class="cycle">'+['LEARN','EXPERIMENT','VISUALIZE','COMPARE','UNDERSTAND'].map(function(s){return '<span>'+(on.indexOf(s)>=0?'<b>'+s+'</b>':s)+'</span>';}).join('')+'</div>';};
/* experiment history (real, recorded when the user finishes a run) */
NS.logExp=function(name,summary){var h=NS.store.get('exps',[]);h.unshift({t:new Date().toISOString().slice(0,16).replace('T',' '),name:name,summary:summary});NS.store.set('exps',h.slice(0,30));if(NS.mods.dashboard&&NS.mods.dashboard.refresh)NS.mods.dashboard.refresh();};
/* line chart: series=[{v:[..],c:'#..',n:'name'}] */
NS.lineChart=function(cv,series,opt){opt=opt||{};var g=cv.getContext('2d'),W=cv.width,H=cv.height,pl=44,pb=22,pt=8,pr=8,mx=0,n=0,mn=0;g.clearRect(0,0,W,H);
 series.forEach(function(s){n=Math.max(n,s.v.length);s.v.forEach(function(x){if(isFinite(x))mx=Math.max(mx,x);});});if(opt.max)mx=opt.max;if(mx<=0)mx=1;
 g.strokeStyle='#1a3550';g.fillStyle='#93acc0';g.font='11px "JetBrains Mono",monospace';
 for(var i=0;i<=4;i++){var y=pt+(H-pt-pb)*i/4;g.beginPath();g.moveTo(pl,y);g.lineTo(W-pr,y);g.stroke();g.fillText((mx*(1-i/4)).toFixed(2),4,y+4);}
 g.fillText(opt.xl||'step',W-60,H-6);
 series.forEach(function(s){g.strokeStyle=s.c;g.lineWidth=2;g.beginPath();s.v.forEach(function(x,i){var px=pl+(W-pl-pr)*(n>1?i/(n-1):0),py=pt+(H-pt-pb)*(1-Math.min(Math.max(x,0),mx)/mx);i?g.lineTo(px,py):g.moveTo(px,py);});g.stroke();});
 series.forEach(function(s,i){g.fillStyle=s.c;g.fillText(s.n,pl+8+i*110,pt+14);});};
/* router: the React shell owns navigation. NS.go just tells it where to go. */
NS.go=function(id){window.dispatchEvent(new CustomEvent('ns-go',{detail:id}));};
document.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(b)NS.go(b.getAttribute('data-go'));});
})();
