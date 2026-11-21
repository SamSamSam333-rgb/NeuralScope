/* Training Lab: real mini-batch training (backprop + SGD/momentum/Adam) with live boundary, loss curves, save-and-compare. */
(function(){
var NS=window.NS,$=NS.$,esc=NS.esc,el,cfg,D,S,M,H,rnd,playing=false,raf=0,spent=0,snapA=null,pyMap=null,done=false,LAB={data:'Dataset',noise:'Noise',n:'Samples',layers:'Hidden layers',width:'Neurons per layer',act:'Activation',opt:'Optimizer',loss:'Loss',lrexp:'Learning rate',batch:'Batch size',l2:'L2 regularisation',epochs:'Epochs'};
var DEF={data:'moons',noise:0.2,n:300,layers:2,width:8,act:'tanh',opt:'adam',loss:'bce',lrexp:-1.7,batch:16,l2:0,epochs:200,seed:7};
function lr(c){return Math.pow(10,c.lrexp);}
function f(v){return Number(v).toFixed(3);}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function build(){D=NS.data.make(cfg.data,cfg.n,cfg.noise,cfg.seed);S=NS.data.split(D,0.75,cfg.seed);var sz=[2],i;for(i=0;i<cfg.layers;i++)sz.push(cfg.width);sz.push(1);
 M=new NS.MLP(sz,cfg.act,cfg.seed);H={tl:[],vl:[],ta:[],va:[],g:[]};pyMap=null;var ps=$('#tr-pystat',el);if(ps)ps.textContent='';rnd=NS.rng(cfg.seed+5);spent=0;done=false;playing=false;cancelAnimationFrame(raf);paint();}
function epoch(){pyMap=null;var n=S.Xtr.length,idx=shuffle(S.Xtr.map(function(_,i){return i;})),bs=cfg.batch>=999?n:cfg.batch,o={lr:lr(cfg),opt:cfg.opt,loss:cfg.loss,l2:cfg.l2},g=0,b;
 var t0=performance.now();for(b=0;b<n;b+=bs){M.step(S.Xtr,S.Ytr,idx.slice(b,b+bs),o);g=M.lastGrad;}spent+=performance.now()-t0;
 H.tl.push(M.loss(S.Xtr,S.Ytr,cfg.loss));H.vl.push(M.loss(S.Xva,S.Yva,cfg.loss));H.ta.push(M.acc(S.Xtr,S.Ytr));H.va.push(M.acc(S.Xva,S.Yva));H.g.push(g);}
function toHalf(h){for(var i=0;i<h.tl.length;i++)if(h.tl[i]<=h.tl[0]/2)return i+1;return null;}
function steps(){var bs=cfg.batch>=999?S.Xtr.length:cfg.batch;return H.tl.length*Math.ceil(S.Xtr.length/bs);}
function finish(){if(done||!H.tl.length)return;done=true;playing=false;cancelAnimationFrame(raf);paint();NS.logExp('Training: '+cfg.data+', '+cfg.layers+'x'+cfg.width+' '+cfg.act+', '+cfg.opt+', lr '+lr(cfg).toPrecision(2),H.tl.length+' epochs, val acc '+Math.round(H.va[H.va.length-1]*100)+'%, val loss '+f(H.vl[H.vl.length-1]));}
function frame(){if(!playing)return;for(var k=0;k<2&&H.tl.length<cfg.epochs;k++)epoch();paint();if(H.tl.length>=cfg.epochs){finish();return;}raf=requestAnimationFrame(frame);}
function snap(){var n=H.tl.length;return {cfg:JSON.parse(JSON.stringify(cfg)),tl:H.tl.slice(),vl:H.vl.slice(),ta:H.ta[n-1],va:H.va[n-1],ftl:H.tl[n-1],fvl:H.vl[n-1],n:n,ms:spent,half:toHalf(H),g:H.g[n-1]};}
/* ---------- drawing ---------- */
function X2(x,W){return (x+1.6)/3.2*W;}function Y2(y,W){return W-(y+1.6)/3.2*W;}
function boundary(){var cv=$('#tr-b',el),g=cv.getContext('2d'),W=cv.width,R=48,off=document.createElement('canvas');off.width=R;off.height=R;var og=off.getContext('2d'),im=og.createImageData(R,R),i,j;
 for(j=0;j<R;j++)for(i=0;i<R;i++){var p=pyMap?pyMap[j*R+i]:M.predict([(i+0.5)/R*3.2-1.6,1.6-(j+0.5)/R*3.2]),k=(j*R+i)*4,a=Math.abs(p-0.5)*2;
  im.data[k]=p>=0.5?34:255;im.data[k+1]=p>=0.5?228:95;im.data[k+2]=p>=0.5?255:210;im.data[k+3]=40+Math.round(a*120);}
 og.putImageData(im,0,0);g.clearRect(0,0,W,W);g.fillStyle='#06101b';g.fillRect(0,0,W,W);g.imageSmoothingEnabled=true;g.drawImage(off,0,0,W,W);
 function pts(Xs,Ys,ring){Xs.forEach(function(p,q){g.beginPath();g.arc(X2(p[0],W),Y2(p[1],W),ring?4.5:3.2,0,7);var c=Ys[q]?'#22e4ff':'#ff5fd2';if(ring){g.strokeStyle=c;g.lineWidth=2;g.stroke();}else{g.fillStyle=c;g.fill();}});}
 pts(S.Xtr,S.Ytr,false);pts(S.Xva,S.Yva,true);}
function paint(){if(!el)return;boundary();var n=H.tl.length;
 NS.lineChart($('#tr-l',el),[{v:H.tl,c:'#22e4ff',n:'train loss'},{v:H.vl,c:'#ffb224',n:'val loss'}].concat(snapA?[{v:snapA.vl,c:'#8aa0b5',n:'A val'}]:[]),{xl:'epoch',max:Math.max(0.8,H.tl[0]||0)});
 var last=function(a){return a.length?a[a.length-1]:null;};
 $('#tr-m',el).innerHTML=[['Epoch|epoch',n+' / '+cfg.epochs],['Updates (steps)|steps',n?steps():0],['Train loss|tl',n?f(last(H.tl)):'-'],['Validation loss|vl',n?f(last(H.vl)):'-'],['Train accuracy|ta',n?(last(H.ta)*100).toFixed(1)+'%':'-'],['Validation accuracy|va',n?(last(H.va)*100).toFixed(1)+'%':'-'],['Gradient size|grad',n?last(H.g).toExponential(2):'-'],['Compute time|ms',spent.toFixed(0)+' ms (measured)'],['Parameters|par',M.W.reduce(function(a,w,l){return a+w.length+M.b[l].length;},0)]].map(function(r){var p=r[0].split('|');return '<b data-help="tr.m.'+p[1]+'">'+p[0]+'</b><span>'+r[1]+'</span>';}).join('');
 $('#tr-play',el).textContent=playing?'Pause':(n&&n<cfg.epochs?'Resume':'Play');
 $('#tr-exp',el).innerHTML=done||n>=5?explainRun():'<span class="muted">Press Play. When the run has enough epochs, an explanation based on the measured curves appears here.</span>';
 compare();}
/* ---------- explanations built from measured numbers ---------- */
function explainRun(){var n=H.tl.length,tl=H.tl,i,up=0,o=[];if(n<2)return '';
 for(i=1;i<n;i++)if(tl[i]>tl[i-1]*1.05)up++;
 o.push('Training loss went from <b>'+f(tl[0])+'</b> to <b>'+f(tl[n-1])+'</b> in '+n+' epochs ('+steps()+' weight updates). Accuracy: train <b>'+(H.ta[n-1]*100).toFixed(1)+'%</b>, validation <b>'+(H.va[n-1]*100).toFixed(1)+'%</b>.');
 if(up>(n-1)*0.15)o.push('The loss went UP in '+up+' of '+(n-1)+' epochs. That zig-zag is what a step size that is too large looks like: each update overshoots the valley. Your learning rate is '+lr(cfg).toPrecision(2)+'. Try a smaller one and compare.');
 else if(n>=20&&tl[n-1]>0.9*tl[0])o.push('The loss has barely moved ('+(100*(1-tl[n-1]/tl[0])).toFixed(1)+'% lower). Steps are probably too small (learning rate '+lr(cfg).toPrecision(2)+') or the optimizer is too slow for this setting. Try a larger rate or Adam.');
 else if(toHalf(H))o.push('The loss halved after <b>'+toHalf(H)+'</b> epochs, which is a measure of how fast this setting learns.');
 var gap=H.ta[n-1]-H.va[n-1];
 if(gap>0.08)o.push('Train accuracy is '+(gap*100).toFixed(1)+' points above validation accuracy. That gap is overfitting: the network is memorising training points. Fewer neurons, more noise-robust settings, L2 regularisation or fewer epochs can narrow it.');
 else if(H.ta[n-1]<0.85&&n>=40)o.push('Even the training accuracy is only '+(H.ta[n-1]*100).toFixed(1)+'%. That is underfitting: the model has not captured the pattern. More layers or neurons, more epochs, or a better learning rate may help.');
 else if(n>=40&&Math.abs(gap)<=0.05)o.push('Train and validation accuracy are close, so the model is generalising to points it has not trained on.');
 return o.map(function(t){return '<p>'+t+'</p>';}).join('');}
function diffs(a,b){var r=[],k;for(k in LAB){if(a.cfg[k]!==b.cfg[k])r.push(k);}return r;}
function fv(k,c){return k==='lrexp'?lr(c).toPrecision(2):(k==='batch'&&c.batch>=999?'full':c[k]);}
function compare(){var box=$('#tr-cmp',el),n=H.tl.length;
 if(!snapA){box.innerHTML='<p class="muted small">Run an experiment, press <b>Save as A</b>, change any setting, run again, and the two runs are compared here with an explanation built from the measured results.</p>';return;}
 if(!n){box.innerHTML='<p class="muted small">A is saved. Change settings and run to compare.</p>';return;}
 var B=snap(),A=snapA,d=diffs(A,B),row=function(l,a,b,better){var c=better===undefined?'':(better?'up':'down');return '<tr><td>'+l+'</td><td>'+a+'</td><td class="'+c+'">'+b+'</td></tr>';};
 var h='<table class="tbl"><tr><th></th><th>A (saved)</th><th>B (now)</th></tr>';
 d.forEach(function(k){h+='<tr><td>'+LAB[k]+'</td><td>'+esc(fv(k,A.cfg))+'</td><td>'+esc(fv(k,B.cfg))+'</td></tr>';});
 if(!d.length)h+='<tr><td colspan="3" style="text-align:center">Settings are identical</td></tr>';
 h+=row('Epochs run',A.n,B.n)+row('Final train loss',f(A.ftl),f(B.ftl),B.ftl<A.ftl)+row('Final validation loss',f(A.fvl),f(B.fvl),B.fvl<A.fvl)+row('Validation accuracy',(A.va*100).toFixed(1)+'%',(B.va*100).toFixed(1)+'%',B.va>A.va)+row('Epochs to halve loss',A.half||'never',B.half||'never')+row('Compute time',A.ms.toFixed(0)+' ms',B.ms.toFixed(0)+' ms')+'</table>';
 var why=[];if(A.cfg.loss!==B.cfg.loss)why.push('The loss functions differ, so loss values are not directly comparable. Compare accuracy instead.');
 if(d.indexOf('lrexp')>=0){var q=lr(B.cfg)/lr(A.cfg);why.push('B takes steps '+(q>1?q.toFixed(1)+'x larger':(1/q).toFixed(1)+'x smaller')+' per update. Measured: loss halved after '+(A.half||'never')+' epochs in A and '+(B.half||'never')+' in B; final validation loss '+f(A.fvl)+' vs '+f(B.fvl)+'. '+(q>1?'Bigger steps reach lower loss sooner but can overshoot.':'Smaller steps are steadier but slower.'));}
 if(d.indexOf('opt')>=0)why.push('Optimizer changed from '+A.cfg.opt+' to '+B.cfg.opt+'. They use the same gradients but turn them into updates differently (momentum keeps a running direction; Adam scales each weight\'s step by its recent gradient size). Compare the epochs-to-halve row.');
 if(d.indexOf('act')>=0)why.push('Activation changed from '+A.cfg.act+' to '+B.cfg.act+', which changes both the shape of the decision boundary and how gradients flow backward. Validation accuracy: '+(A.va*100).toFixed(1)+'% vs '+(B.va*100).toFixed(1)+'%.');
 if(d.indexOf('width')>=0||d.indexOf('layers')>=0)why.push('Network size changed, so capacity (how complex a boundary it can draw) changed. Gap between train and validation accuracy: A '+((A.ta-A.va)*100).toFixed(1)+' points, B '+((B.ta-B.va)*100).toFixed(1)+' points. A bigger gap means more overfitting.');
 if(d.indexOf('batch')>=0)why.push('Batch size changed. Smaller batches give more (noisier) updates per epoch; larger batches give fewer, smoother updates. Compute time: '+A.ms.toFixed(0)+' ms vs '+B.ms.toFixed(0)+' ms.');
 if(d.indexOf('l2')>=0)why.push('L2 regularisation penalises large weights, which usually smooths the boundary. Train-validation accuracy gap: A '+((A.ta-A.va)*100).toFixed(1)+' vs B '+((B.ta-B.va)*100).toFixed(1)+' points.');
 if(d.indexOf('data')>=0||d.indexOf('noise')>=0||d.indexOf('n')>=0)why.push('The data itself changed, so differences partly reflect an easier or harder problem, not only the model.');
 box.innerHTML=h+(why.length?'<div class="explain">'+why.join('<br><br>')+'</div>':'');}
/* ---------- UI ---------- */
var BATCH=[['1','1 (pure SGD)'],['8','8'],['16','16'],['32','32'],['999','Full batch']];
function ui(){var c=cfg,lrf=function(v){return Math.pow(10,v).toPrecision(2);};
 return '<h1>Training Lab</h1><p class="muted">Train a real neural network in your browser. Every number comes from actual forward passes, backpropagation and weight updates.</p>'+NS.cycle(['LEARN','EXPERIMENT','VISUALIZE','COMPARE','UNDERSTAND'])+
 '<div class="split"><div class="card"><div class="lbl">Experiment settings</div>'+
 NS.sel({id:'data',label:'Dataset',value:c.data,opts:NS.data.kinds.map(function(k){return [k,k];}),why:'The example problem: predict whether a dot is cyan or pink from its position. These are generated practice shapes, not real data. Each one teaches something different.'})+
 NS.ctl({id:'noise',label:'Noise',min:0,max:0.5,step:0.05,value:c.noise,why:'Higher noise blurs the classes; harder problem and easier to overfit.'})+
 NS.ctl({id:'layers',label:'Hidden layers',min:1,max:4,step:1,value:c.layers,why:'More layers can draw more complex boundaries.'})+
 NS.ctl({id:'width',label:'Neurons per layer',min:2,max:16,step:1,value:c.width,why:'More neurons means more capacity (and more risk of overfitting).'})+
 NS.sel({id:'act',label:'Activation',value:c.act,opts:[['tanh','tanh'],['relu','ReLU'],['sigmoid','sigmoid']],why:'The squashing rule inside each hidden neuron.'})+
 NS.sel({id:'opt',label:'Optimizer',value:c.opt,opts:[['sgd','SGD'],['momentum','Momentum'],['adam','Adam']],why:'How gradients become weight updates.'})+
 NS.sel({id:'loss',label:'Loss function',value:c.loss,opts:[['bce','Cross-entropy'],['mse','Mean squared error']],why:'What "wrong" means numerically.'})+
 NS.ctl({id:'lrexp',label:'Learning rate',min:-3,max:0,step:0.1,value:c.lrexp,fmt:lrf,why:'Step size. Too small is slow; too large overshoots and zig-zags.'})+
 NS.sel({id:'batch',label:'Batch size',value:String(c.batch),opts:BATCH,why:'How many samples are used for each update.'})+
 NS.ctl({id:'l2',label:'L2 regularisation',min:0,max:0.05,step:0.005,value:c.l2,why:'Penalty on big weights; fights overfitting.'})+
 NS.ctl({id:'epochs',label:'Epochs',min:20,max:600,step:20,value:c.epochs,why:'Passes over the training data.'})+
 '<p class="small muted">Changing a setting rebuilds the model and restarts training with the same random seed, so runs are reproducible.</p></div>'+
 '<div><div class="grid g2"><div class="card"><div class="lbl">Decision boundary (live). Filled = train, ring = validation</div><canvas id="tr-b" class="cv" width="420" height="420" aria-label="Decision boundary"></canvas></div>'+
 '<div class="card"><div class="lbl">Loss curves</div><canvas id="tr-l" class="cv" width="420" height="240" aria-label="Loss curves"></canvas><div class="kv" id="tr-m" style="margin-top:8px"></div></div></div>'+
 '<div class="row" style="margin:10px 0"><button class="btn primary" id="tr-play" type="button">Play</button><button class="btn" id="tr-step" type="button">Step 1 epoch</button><button class="btn" id="tr-end" type="button">Run to end</button><button class="btn" id="tr-reset" type="button">Reset</button><button class="btn" id="tr-save" type="button">Save as A</button><button class="btn" id="tr-py" type="button" data-help="tr.py">Run on Python (PyTorch)</button><span class="muted small" id="tr-pystat" style="margin-left:8px"></span></div>'+
 '<div class="grid g2"><div class="card"><div class="lbl" data-help="tr.explain">Understand: what the run shows</div><div id="tr-exp"></div></div><div class="card"><div class="lbl" data-help="tr.compare">Compare: A vs B</div><div id="tr-cmp"></div></div></div></div></div>';}
function readCfg(){var g=function(i){return $('#'+i,el);};cfg={data:g('data').value,noise:+g('noise').value,n:DEF.n,layers:+g('layers').value,width:+g('width').value,act:g('act').value,opt:g('opt').value,loss:g('loss').value,lrexp:+g('lrexp').value,batch:+g('batch').value,l2:+g('l2').value,epochs:+g('epochs').value,seed:DEF.seed};}
NS.mods.trainer={init:function(root){el=root;cfg=JSON.parse(JSON.stringify(DEF));root.innerHTML=ui();build();
 root.addEventListener('input',function(e){var t=e.target;if(!t.id||t.id.indexOf('tr-')===0)return;var o=$('#'+t.id+'_o',el);if(o)o.textContent=t.id==='lrexp'?Math.pow(10,+t.value).toPrecision(2):t.value;readCfg();build();});
 root.addEventListener('change',function(e){var t=e.target;if(t.tagName==='SELECT'){readCfg();build();}});
 $('#tr-play',el).onclick=function(){if(playing){playing=false;cancelAnimationFrame(raf);paint();return;}if(H.tl.length>=cfg.epochs)build();done=false;playing=true;frame();};
 $('#tr-step',el).onclick=function(){playing=false;cancelAnimationFrame(raf);if(H.tl.length<cfg.epochs)epoch();paint();if(H.tl.length>=cfg.epochs)finish();};
 $('#tr-end',el).onclick=function(){playing=false;cancelAnimationFrame(raf);while(H.tl.length<cfg.epochs)epoch();finish();paint();};
 $('#tr-reset',el).onclick=function(){build();};
 $('#tr-py',el).onclick=function(){var b=$('#tr-py',el),st=$('#tr-pystat',el);if(!NS.api){return;}
 playing=false;cancelAnimationFrame(raf);b.disabled=true;st.textContent='Training on the Python server...';
 var c=cfg,full=c.batch>=999;
 NS.api.post('/api/train',{cfg:{layers:c.layers,width:c.width,act:c.act,opt:c.opt,loss:c.loss,lr:lr(c),batch:full?100000:c.batch,l2:c.l2,epochs:c.epochs,seed:c.seed},Xtr:S.Xtr,Ytr:S.Ytr,Xva:S.Xva,Yva:S.Yva,grid:48,lim:1.6}).then(function(r){
  H={tl:r.tl,vl:r.vl,ta:r.ta,va:r.va,g:r.g};pyMap=r.map;done=true;spent=r.ms;
  st.textContent='PyTorch '+r.torch+' on '+r.device+': '+r.params+' parameters, '+r.ms.toFixed(0)+' ms. The curves and map above are now the Python run.';
  paint();}).catch(function(e){st.textContent='Could not reach the Python server: '+e.message;}).then(function(){b.disabled=false;});};
$('#tr-save',el).onclick=function(){if(H.tl.length){snapA=snap();paint();}};
 NS.trainer={cfg:function(){return cfg;},H:function(){return H;},M:function(){return M;},set:function(k,v){var i=$('#'+k,el);i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));},end:function(){$('#tr-end',el).click();},save:function(){$('#tr-save',el).click();}};},
 show:function(){paint();}};
})();
