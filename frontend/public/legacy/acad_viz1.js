/* Inline "see it visually" widgets for lessons. Every number is computed live. */
(function(){var NS=window.NS,V=NS.viz={};
function sl(id,l,min,max,step,val){return '<div class="ctl"><label for="'+id+'">'+l+'</label><output id="'+id+'_o">'+val+'</output><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"></div>';}
function g(r,id){return r.querySelector('#'+id);}
function val(r,id){return +g(r,id).value;}
function wire(r,fn){r.addEventListener('input',function(e){var o=g(r,e.target.id+'_o');if(o)o.textContent=e.target.value;fn();});}
function cv(w,h){return '<canvas class="cv" width="'+w+'" height="'+h+'"></canvas>';}
V.h={sl:sl,g:g,val:val,wire:wire,cv:cv};
V.vec=function(r){r.innerHTML='<div class="grid g2"><div>'+sl('ax','a: x',-3,3,0.5,2)+sl('ay','a: y',-3,3,0.5,1)+sl('bx','b: x',-3,3,0.5,1)+sl('by','b: y',-3,3,0.5,2)+'<div class="kv" id="o"></div></div>'+cv(320,320)+'</div><p class="small muted">Arrows a (cyan) and b (pink). The dot product is large when they point the same way, 0 at right angles and negative when opposite.</p>';
 function d(){var ax=val(r,'ax'),ay=val(r,'ay'),bx=val(r,'bx'),by=val(r,'by'),dot=ax*bx+ay*by,la=Math.hypot(ax,ay),lb=Math.hypot(bx,by),c=la&&lb?dot/(la*lb):0,k=r.querySelector('canvas'),x=k.getContext('2d'),S=40,O=160;
  x.clearRect(0,0,320,320);x.strokeStyle='#1a3550';x.beginPath();x.moveTo(0,O);x.lineTo(320,O);x.moveTo(O,0);x.lineTo(O,320);x.stroke();
  function arr(vx,vy,c2){x.strokeStyle=c2;x.fillStyle=c2;x.lineWidth=3;x.beginPath();x.moveTo(O,O);x.lineTo(O+vx*S,O-vy*S);x.stroke();x.beginPath();x.arc(O+vx*S,O-vy*S,5,0,7);x.fill();}
  arr(ax,ay,'#22e4ff');arr(bx,by,'#ff5fd2');
  g(r,'o').innerHTML='<b>a · b</b><span>'+ax+'×'+bx+' + '+ay+'×'+by+' = '+dot+'</span><b>cosine similarity</b><span>'+c.toFixed(3)+'</span><b>angle</b><span>'+(Math.acos(Math.max(-1,Math.min(1,c)))*180/Math.PI).toFixed(0)+'°</span>';}
 wire(r,d);d();};
V.slope=function(r){r.innerHTML='<div class="grid g2"><div>'+sl('x0','Point x',-3,3,0.1,1.5)+sl('h','Nudge size h',0.01,2,0.01,0.5)+'<div class="kv" id="o"></div></div>'+cv(320,260)+'</div><p class="small muted">Curve f(x) = x². The orange line joins the point to a point h to the right; its slope approximates the derivative. Shrink h and it approaches 2x.</p>';
 function d(){var x0=val(r,'x0'),h=val(r,'h'),f=function(t){return t*t;},sl2=(f(x0+h)-f(x0))/h,k=r.querySelector('canvas'),c=k.getContext('2d'),W=320,H=260;
  function X(t){return W/2+t*40;}function Y(t){return H-30-t*22;}c.clearRect(0,0,W,H);c.strokeStyle='#22e4ff';c.lineWidth=2;c.beginPath();for(var t=-3.4;t<=3.4;t+=0.05){var px=X(t),py=Y(f(t));t>-3.4?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();
  c.strokeStyle='#ffb224';c.beginPath();c.moveTo(X(x0-1.5),Y(f(x0)+sl2*-1.5));c.lineTo(X(x0+1.5),Y(f(x0)+sl2*1.5));c.stroke();c.fillStyle='#ffb224';c.beginPath();c.arc(X(x0),Y(f(x0)),5,0,7);c.fill();
  g(r,'o').innerHTML='<b>slope (numeric)</b><span>('+f(x0+h).toFixed(2)+' − '+f(x0).toFixed(2)+') / '+h+' = '+sl2.toFixed(3)+'</span><b>exact 2x</b><span>'+(2*x0).toFixed(3)+'</span><b>meaning</b><span>'+(x0>0?'loss rises as x rises':x0<0?'loss falls as x rises':'flat: the minimum')+'</span>';}
 wire(r,d);d();};
V.loss=function(r){r.innerHTML='<div class="grid g2"><div><p class="small"><b>Classification</b>: the true class is 1.</p>'+sl('p','Model says P(class 1) =',0.01,0.99,0.01,0.9)+'<p class="small"><b>Regression</b>: the true price is 3.</p>'+sl('y','Model predicts',0,6,0.1,2.5)+'<div class="kv" id="o"></div></div>'+cv(320,240)+'</div><p class="small muted">Curve: cross-entropy loss −ln(p) as the model\'s probability for the true class changes.</p>';
 function d(){var p=val(r,'p'),y=val(r,'y'),ce=-Math.log(p),mse=(y-3)*(y-3),k=r.querySelector('canvas'),c=k.getContext('2d'),W=320,H=240;c.clearRect(0,0,W,H);
  c.strokeStyle='#22e4ff';c.lineWidth=2;c.beginPath();for(var q=0.02;q<=0.99;q+=0.01){var px=20+q*280,py=H-20-Math.min(4,-Math.log(q))*50;q>0.02?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();c.fillStyle='#ffb224';c.beginPath();c.arc(20+p*280,H-20-Math.min(4,ce)*50,6,0,7);c.fill();
  g(r,'o').innerHTML='<b>cross-entropy</b><span>−ln('+p.toFixed(2)+') = '+ce.toFixed(3)+'</span><b>squared error</b><span>('+y+' − 3)² = '+mse.toFixed(2)+'</span><b>verdict</b><span>'+(ce>1.5?'confidently wrong: huge loss':ce<0.2?'confident and right: tiny loss':'in between')+'</span>';}
 wire(r,d);d();};
V.gd=function(r){var x,steps,path;r.innerHTML='<div class="grid g2"><div>'+sl('lr','Learning rate',0.02,1.1,0.02,0.1)+'<div class="row"><button class="btn" data-a="s" type="button">Step</button><button class="btn" data-a="r" type="button">Run 20</button><button class="btn" data-a="z" type="button">Reset</button></div><div class="kv" id="o" style="margin-top:8px"></div><div class="explain" id="m"></div></div>'+cv(320,260)+'</div><p class="small muted">Minimising f(x) = x² starting at x = 4. Each step: x ← x − lr × slope, where slope = 2x.</p>';
 function reset(){x=4;steps=0;path=[4];d();}
 function step(){x=x-val(r,'lr')*2*x;steps++;path.push(x);if(Math.abs(x)>1e6)x=1e6*Math.sign(x);d();}
 function d(){var k=r.querySelector('canvas'),c=k.getContext('2d'),W=320,H=260;function X(t){return W/2+Math.max(-4.2,Math.min(4.2,t))*34;}function Y(t){return H-30-Math.min(t*t,20)*10;}c.clearRect(0,0,W,H);
  c.strokeStyle='#22e4ff';c.lineWidth=2;c.beginPath();for(var t=-4.2;t<=4.2;t+=0.05){t>-4.2?c.lineTo(X(t),Y(t)):c.moveTo(X(t),Y(t));}c.stroke();
  c.strokeStyle='#ffb224';c.fillStyle='#ffb224';c.lineWidth=1;c.beginPath();path.slice(-30).forEach(function(p,i){i?c.lineTo(X(p),Y(p)):c.moveTo(X(p),Y(p));});c.stroke();path.slice(-30).forEach(function(p){c.beginPath();c.arc(X(p),Y(p),3,0,7);c.fill();});
  var lr=val(r,'lr'),m=lr<0.3?'Small steps: steady but slow.':lr<=0.5?'Good steps: heads for the bottom quickly (at lr 0.5 it lands exactly on it in one step).':lr<0.99?'Each step overshoots the bottom and lands on the other side, but the swings shrink, so it still converges.':lr<1.01?'Each step jumps exactly to the mirror point: it bounces forever and never settles.':'Steps too big: each step lands farther away than the last. It diverges.';
  g(r,'o').innerHTML='<b>step</b><span>'+steps+'</span><b>x</b><span>'+(Math.abs(x)>1e5?x.toExponential(2):x.toFixed(4))+'</span><b>loss x²</b><span>'+(Math.abs(x)>1e5?(x*x).toExponential(2):(x*x).toFixed(4))+'</span>';g(r,'m').textContent=m;}
 r.addEventListener('click',function(e){var a=e.target.getAttribute('data-a');if(a==='s')step();if(a==='r')for(var i=0;i<20;i++)step();if(a==='z')reset();});
 r.addEventListener('input',function(e){if(e.target.id==='lr'){g(r,'lr_o').textContent=e.target.value;reset();}});reset();};
/* least-squares polynomial fit for the overfitting lesson */
function polyfit(xs,ys,deg){var n=deg+1,A=[],i,j,k;for(i=0;i<n;i++){A.push(new Array(n+1).fill(0));}
 for(k=0;k<xs.length;k++){var pw=[1];for(i=1;i<2*n;i++)pw.push(pw[i-1]*xs[k]);for(i=0;i<n;i++){for(j=0;j<n;j++)A[i][j]+=pw[i+j];A[i][n]+=pw[i]*ys[k];}}
 for(i=0;i<n;i++)A[i][i]+=1e-9;
 for(i=0;i<n;i++){var p=i;for(j=i+1;j<n;j++)if(Math.abs(A[j][i])>Math.abs(A[p][i]))p=j;var t=A[i];A[i]=A[p];A[p]=t;for(j=i+1;j<n;j++){var f=A[j][i]/A[i][i];for(k=i;k<=n;k++)A[j][k]-=f*A[i][k];}}
 var c=new Array(n).fill(0);for(i=n-1;i>=0;i--){var s=A[i][n];for(j=i+1;j<n;j++)s-=A[i][j]*c[j];c[i]=s/A[i][i];}return c;}
function peval(c,x){var s=0;for(var i=c.length-1;i>=0;i--)s=s*x+c[i];return s;}
V.overfit=function(r){var rn=NS.rng(21),truth=function(x){return Math.sin(2.2*x);},tx=[],ty=[],vx=[],vy=[],i;
 for(i=0;i<12;i++){var x=-1+2*i/11;tx.push(x);ty.push(truth(x)+NS.gauss(rn)*0.25);}for(i=0;i<60;i++){var x2=-1+2*rn();vx.push(x2);vy.push(truth(x2)+NS.gauss(rn)*0.25);}
 r.innerHTML='<div class="grid g2"><div>'+sl('deg','Curve complexity (polynomial degree)',1,11,1,1)+'<div class="kv" id="o"></div><div class="explain" id="m"></div></div>'+cv(340,260)+'</div><p class="small muted">12 noisy training points (filled) and 60 unseen validation points (rings). The curve is a real least-squares fit to the training points only. Degree 1 is linear regression.</p>';
 function d(){var deg=val(r,'deg'),c=polyfit(tx,ty,deg),mse=function(X,Y){var s=0;X.forEach(function(x,i){var e=peval(c,x)-Y[i];s+=e*e;});return s/X.length;},tr=mse(tx,ty),va=mse(vx,vy),k=r.querySelector('canvas'),ct=k.getContext('2d'),W=340,H=260;
  function X(x){return 20+(x+1)/2*(W-40);}function Y(y){return H/2-Math.max(-2.2,Math.min(2.2,y))*50;}ct.clearRect(0,0,W,H);ct.strokeStyle='#1a3550';ct.beginPath();ct.moveTo(0,H/2);ct.lineTo(W,H/2);ct.stroke();
  ct.strokeStyle='#22e4ff';ct.lineWidth=2;ct.beginPath();for(var x=-1;x<=1.001;x+=0.01){x>-1?ct.lineTo(X(x),Y(peval(c,x))):ct.moveTo(X(x),Y(peval(c,x)));}ct.stroke();
  vx.forEach(function(x,i){ct.strokeStyle='#ffb224';ct.beginPath();ct.arc(X(x),Y(vy[i]),3,0,7);ct.stroke();});tx.forEach(function(x,i){ct.fillStyle='#ff5fd2';ct.beginPath();ct.arc(X(x),Y(ty[i]),4.5,0,7);ct.fill();});
  g(r,'o').innerHTML='<b>training error (MSE)</b><span>'+tr.toFixed(4)+'</span><b>validation error (MSE)</b><span>'+va.toFixed(4)+'</span>';
  g(r,'m').textContent=deg<=2?'Too simple to follow the wave: both errors are high (underfitting).':va>tr*2.2?'Training error is tiny but validation error is much larger: the curve is chasing noise (overfitting).':'A good balance: both errors are low and close.';}
 wire(r,d);d();};
V.neuron=function(r){r.innerHTML='<div class="grid g2"><div>'+sl('a','Input',-2,2,0.1,0.8)+sl('w','Weight',-3,3,0.1,1.5)+sl('b','Bias',-3,3,0.1,-0.5)+'</div><div class="kv" id="o" style="align-content:start"></div></div>';
 function d(){var a=val(r,'a'),w=val(r,'w'),b=val(r,'b'),z=a*w+b;g(r,'o').innerHTML='<b>1. multiply</b><span>'+a+' × '+w+' = '+(a*w).toFixed(2)+'</span><b>2. add bias</b><span>'+(a*w).toFixed(2)+' + '+b+' = '+z.toFixed(2)+'</span><b>3. sigmoid</b><span>'+(1/(1+Math.exp(-z))).toFixed(4)+'</span><b>or ReLU</b><span>'+Math.max(0,z).toFixed(4)+'</span><b>or tanh</b><span>'+Math.tanh(z).toFixed(4)+'</span>';}
 wire(r,d);d();};
V.activation=function(r){r.innerHTML='<div class="grid g2"><div>'+sl('z','Neuron total z',-5,5,0.1,1)+'<div class="kv" id="o"></div></div>'+cv(340,240)+'</div><p class="small muted">Cyan: sigmoid. Amber: tanh. Pink: ReLU. The dots mark the current z.</p>';
 function d(){var z=val(r,'z'),k=r.querySelector('canvas'),c=k.getContext('2d'),W=340,H=240,F=[['#22e4ff',function(t){return 1/(1+Math.exp(-t));}],['#ffb224',Math.tanh],['#ff5fd2',function(t){return Math.max(0,t)/2.5;}]];
  function X(t){return W/2+t*(W/10.5);}function Y(v){return H/2-v*(H/2-24);}c.clearRect(0,0,W,H);c.strokeStyle='#1a3550';c.beginPath();c.moveTo(0,Y(0));c.lineTo(W,Y(0));c.moveTo(W/2,0);c.lineTo(W/2,H);c.stroke();
  F.forEach(function(f){c.strokeStyle=f[0];c.lineWidth=2;c.beginPath();for(var t=-5;t<=5.001;t+=0.05){t>-5?c.lineTo(X(t),Y(f[1](t))):c.moveTo(X(t),Y(f[1](t)));}c.stroke();c.fillStyle=f[0];c.beginPath();c.arc(X(z),Y(f[1](z)),5,0,7);c.fill();});
  g(r,'o').innerHTML='<b>sigmoid</b><span>'+(1/(1+Math.exp(-z))).toFixed(3)+'</span><b>tanh</b><span>'+Math.tanh(z).toFixed(3)+'</span><b>ReLU</b><span>'+Math.max(0,z).toFixed(3)+'</span>';}
 wire(r,d);d();};
})();
