/* 3D Neural Network Explorer: a real MLP drawn in three.js. Every number shown is computed by a forward pass. */
(function(){
var NS=window.NS,$=NS.$,el,M,cfg={hid:2,w:4,act:'tanh',x1:0.6,x2:-0.4,seed:4},sel=null,T,cache,nodes=[],wires=[],cam={th:1.25,ph:1.35,r:11,tx:0,ty:0},fireT=-1,raycaster,mouse,ren,scene,camera,pulse,dirty=true,tip;
function f(v){return Number(v).toFixed(3);}
function sizes(){var s=[2],i;for(i=0;i<cfg.hid;i++)s.push(cfg.w);s.push(1);return s;}
function buildNet(){M=new NS.MLP(sizes(),cfg.act,cfg.seed);sel=null;buildScene();update();}
function pos(l,j,n,L){var gap=3.2;return new THREE.Vector3((l-(L-1)/2)*gap,((n-1)/2-j)*1.15,0);}
function halo(c){var cv=document.createElement('canvas');cv.width=cv.height=64;var g=cv.getContext('2d'),gr=g.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(cv);}
function buildScene(){var s=M.sizes,L=s.length,l,j,i;
 while(scene.children.length)scene.remove(scene.children[0]);nodes=[];wires=[];
 for(l=0;l<L;l++){nodes[l]=[];for(j=0;j<s[l];j++){var p=pos(l,j,s[l],L),m=new THREE.Mesh(new THREE.SphereGeometry(0.3,20,14),new THREE.MeshBasicMaterial({color:0x22e4ff}));m.position.copy(p);m.userData={l:l,j:j};scene.add(m);
   var h=new THREE.Sprite(new THREE.SpriteMaterial({map:halo('rgba(34,228,255,0.9)'),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));h.scale.set(1.9,1.9,1);h.position.copy(p);scene.add(h);nodes[l][j]={m:m,h:h,p:p};}}
 for(l=0;l<L-1;l++){var pts=[],cols=[];for(j=0;j<s[l+1];j++)for(i=0;i<s[l];i++){var a=nodes[l][i].p,b=nodes[l+1][j].p;pts.push(a.x,a.y,a.z,b.x,b.y,b.z);cols.push(0,0,0,0,0,0);}
  var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  var ls=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(ls);wires[l]={ls:ls,geo:geo};}
 var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(900),3));pulse=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffffff,size:0.22,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false}));pulse.frustumCulled=false;pulse.visible=false;scene.add(pulse);
 var grid=new THREE.GridHelper(40,40,0x12304a,0x0b1d2e);grid.position.y=-5;scene.add(grid);}
/* recompute the real forward pass and repaint colours */
function update(){cache=M.forward([cfg.x1,cfg.x2]);var s=M.sizes,L=s.length,l,j,i;
 for(l=0;l<L;l++)for(j=0;j<s[l];j++){var v=cache.a[l][j],nd=nodes[l][j],isIn=l===0,k=Math.min(1,Math.abs(isIn?v:(l===L-1?v:Math.abs(v))));
  var c=new THREE.Color(isIn?0xffb224:(l===L-1?0x37f5a5:(v<0?0xff5fd2:0x22e4ff)));c.multiplyScalar(0.25+0.75*k);nd.m.material.color.copy(c);nd.h.material.color.copy(c);nd.h.material.opacity=0.25+0.75*k;
  var sc=(sel&&sel.l===l&&sel.j===j)?1.5:1;nd.m.scale.setScalar(sc*(0.8+0.5*k));nd.h.scale.setScalar(1.4+1.4*k);}
 for(l=0;l<L-1;l++){var col=wires[l].geo.attributes.color,q=0;for(j=0;j<s[l+1];j++)for(i=0;i<s[l];i++){var w=M.W[l][j*s[l]+i],mag=Math.min(1,Math.abs(w*cache.a[l][i])/1.5),hl=sel&&sel.l===l+1&&sel.j===j,r,g,b;
   if(w>=0){r=0.1;g=0.9;b=1;}else{r=1;g=0.37;b=0.82;}var m2=(hl?1:0.12+0.7*mag);if(hl){r=1;g=0.7;b=0.14;}
   col.setXYZ(q,r*m2,g*m2,b*m2);col.setXYZ(q+1,r*m2,g*m2,b*m2);q+=2;}col.needsUpdate=true;}
 panel();}
function actPlot(z,out){var cv=$('#ex-actcv',el);if(!cv)return;var g=cv.getContext('2d'),W=cv.width,H=cv.height,A=NS.ACT[sel&&sel.l===M.sizes.length-1?'sigmoid':cfg.act];g.clearRect(0,0,W,H);g.strokeStyle='#1a3550';g.beginPath();g.moveTo(0,H/2);g.lineTo(W,H/2);g.moveTo(W/2,0);g.lineTo(W/2,H);g.stroke();
 g.strokeStyle='#22e4ff';g.lineWidth=2;g.beginPath();for(var x=0;x<=W;x++){var zz=(x/W-0.5)*8,y=A.f(zz),py=H/2-y*(H/2-8)/1.2;x?g.lineTo(x,py):g.moveTo(x,py);}g.stroke();
 var zc=Math.max(-4,Math.min(4,z));g.fillStyle='#93acc0';g.font='10px monospace';g.fillText('sum z: -4',2,H-3);g.fillText('+4',W-18,H-3);g.fillText('output',2,10);g.fillText('0',W/2+3,H/2-3);g.fillStyle='#ffb224';g.beginPath();g.arc((zc/8+0.5)*W,H/2-A.f(zc)*(H/2-8)/1.2,6,0,7);g.fill();}
function panel(){var box=$('#ex-info',el),s=M.sizes,L=s.length;$('#ex-out',el).innerHTML=out();drawMap();
 if(!sel){box.innerHTML='<p class="muted">Click any sphere in the 3D picture to open it here. Then you will see exactly how that one neuron turns its incoming numbers into its own number, step by step, and you can change its weights and bias with the sliders.</p><p class="small muted">Orange spheres are inputs, cyan and pink are hidden neurons, green is the final answer.</p>';return;}
 var l=sel.l,j=sel.j;
 if(l===0){box.innerHTML='<h3>Input slot x'+(j+1)+'</h3><p class="small">This is not a calculating neuron. It is just a slot that holds one number you chose with the <b>Input x'+(j+1)+'</b> slider. Right now it holds <b data-help="ex.in.hold">'+f(cache.a[0][j])+'</b>. It copies that number onto every wire that leaves it, and the next layer does the real work.</p>';return;}
 var nin=s[l-1],rows='',z=M.b[l-1][j],i,A=NS.ACT[l===L-1?'sigmoid':cfg.act],an=l===L-1?'sigmoid':A.name;
 for(i=0;i<nin;i++){var w=M.W[l-1][j*nin+i],x=cache.a[l-1][i];z+=w*x;rows+='<tr><td>'+(l===1?'input x'+(i+1):'neuron '+(i+1)+' (prev. layer)')+'</td><td>'+f(x)+'</td><td><input type="range" min="-3" max="3" step="0.05" value="'+w.toFixed(2)+'" data-w="'+(j*nin+i)+'" aria-label="weight '+(i+1)+'" style="width:90px;accent-color:#22e4ff"></td><td id="ex-w'+i+'">'+f(w)+'</td><td>'+f(w*x)+'</td></tr>';}
 var zv=cache.z[l-1][j],ov=cache.a[l][j],slope=A.d(ov),zone=Math.abs(slope)<0.15?'a <b>flat</b> part of the curve (the neuron is "saturated": nudging its sum hardly changes its output, so it is hard to teach)':(Math.abs(slope)>0.6?'the <b>steep</b> part of the curve (small changes in the sum change the output a lot)':'a gently sloping part of the curve');
 if(an==='ReLU'||an==='relu')zone=zv<=0?'the <b>flat zero</b> part: the sum is negative, so the neuron is switched off and outputs 0':'the <b>straight rising</b> part: the neuron is on and passes its sum straight through';
 box.innerHTML='<h3>'+(l===L-1?'Output neuron (the network\'s final answer)':'Hidden neuron '+(j+1)+' in hidden layer '+l)+'</h3>'+
  '<p class="small"><b>Step 1.</b> Multiply every incoming value by its weight. <b>Step 2.</b> Add all those products, then add the bias: that is the sum <b>z</b>. <b>Step 3.</b> Push z through the <b>'+an+'</b> curve to get this neuron\'s output.</p>'+
  '<table class="tbl"><tr><th data-help="ex.in.from">comes from</th><th data-help="ex.in.val">its value</th><th data-help="ex.in.w">weight (drag me)</th><th></th><th data-help="ex.in.prod">value &times; weight</th></tr>'+rows+'<tr><td data-help="ex.in.b">bias</td><td></td><td><input type="range" min="-3" max="3" step="0.05" value="'+M.b[l-1][j].toFixed(2)+'" data-b="'+j+'" aria-label="bias" style="width:90px;accent-color:#22e4ff"></td><td id="ex-bv">'+f(M.b[l-1][j])+'</td><td></td></tr></table>'+
  '<div class="kv" style="margin-top:6px"><b data-help="ex.z">Sum z</b><span>'+f(zv)+' &nbsp;(add the last column, then the bias)</span><b data-help="ex.actname">Activation</b><span>'+an+'</span><b data-help="ex.o">Output</b><span>'+f(ov)+' = '+an+'('+f(zv)+')</span></div>'+
  '<canvas id="ex-actcv" data-help="ex.curve" class="cv" width="300" height="110" style="margin-top:8px"></canvas>'+
  '<p class="small">Reading the curve: the <b>horizontal</b> axis is the sum z, the <b>vertical</b> axis is what comes out. The orange dot sits at this neuron\'s own sum ('+f(zv)+') across, and at its own output ('+f(ov)+') up. It is on '+zone+'.</p>';
 actPlot(zv);}
function out(){var p=cache.a[M.sizes.length-1][0];return '<div class="kv"><b data-help="ex.outin">Your input</b><span>x1 = '+cfg.x1.toFixed(2)+', x2 = '+cfg.x2.toFixed(2)+'</span><b data-help="ex.outnet">Network output</b><span>'+f(p)+' &rarr; leans '+(p>=0.5?'<b style="color:#22e4ff">cyan group</b> (0.5 or more)':'<b style="color:#ff5fd2">pink group</b> (below 0.5)')+'</span></div><div class="bar" style="margin-top:6px"><i style="width:'+Math.round(p*100)+'%"></i></div>';}
/* map of the network's answer for every possible (x1,x2); marker = your current input */
function drawMap(){var cv=$('#ex-map',el);if(!cv||!M)return;var g=cv.getContext('2d'),W=cv.width,R=36,off=document.createElement('canvas');off.width=R;off.height=R;var og=off.getContext('2d'),im=og.createImageData(R,R),i,j;
 for(j=0;j<R;j++)for(i=0;i<R;i++){var p=M.predict([(i+0.5)/R*2-1,1-(j+0.5)/R*2]),k=(j*R+i)*4,a=Math.abs(p-0.5)*2;im.data[k]=p>=0.5?34:255;im.data[k+1]=p>=0.5?228:95;im.data[k+2]=p>=0.5?255:210;im.data[k+3]=50+Math.round(a*150);}
 og.putImageData(im,0,0);g.fillStyle='#06101b';g.fillRect(0,0,W,W);g.imageSmoothingEnabled=true;g.drawImage(off,0,0,W,W);
 g.strokeStyle='#1a3550';g.beginPath();g.moveTo(W/2,0);g.lineTo(W/2,W);g.moveTo(0,W/2);g.lineTo(W,W/2);g.stroke();
 var px=(cfg.x1+1)/2*W,py=(1-cfg.x2)/2*W;g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(px,py,7,0,7);g.stroke();g.fillStyle='#ffb224';g.beginPath();g.arc(px,py,3.5,0,7);g.fill();
 g.fillStyle='#93acc0';g.font='11px monospace';g.fillText('x1 →',W-40,W/2-4);g.fillText('x2 ↑',W/2+4,12);}
function explainEdit(msg){$('#ex-exp',el).innerHTML=msg;}
/* signal animation: tokens flow layer by layer */
function fire(){fireT=performance.now();pulse.visible=true;}
function animatePulse(now){if(fireT<0)return;var s=M.sizes,L=s.length,el2=(now-fireT)/1000,seg=0.9,l=Math.floor(el2/seg);if(l>=L-1){fireT=-1;pulse.visible=false;return;}
 var u=(el2-l*seg)/seg,arr=pulse.geometry.attributes.position.array,q=0,j,i;
 for(j=0;j<s[l+1];j++)for(i=0;i<s[l];i++){if(q+3>arr.length)break;var a=nodes[l][i].p,b=nodes[l+1][j].p;arr[q++]=a.x+(b.x-a.x)*u;arr[q++]=a.y+(b.y-a.y)*u;arr[q++]=a.z+(b.z-a.z)*u;}
 pulse.geometry.setDrawRange(0,q/3);pulse.geometry.attributes.position.needsUpdate=true;}
function loop(now){requestAnimationFrame(loop);if(!el||!$('#v-explorer').classList.contains('on'))return;try{
 var x=cam.r*Math.sin(cam.ph)*Math.cos(cam.th),y=cam.r*Math.cos(cam.ph),z=cam.r*Math.sin(cam.ph)*Math.sin(cam.th);camera.position.set(cam.tx+x,cam.ty+y,z);camera.lookAt(cam.tx,cam.ty,0);animatePulse(now);ren.render(scene,camera);}catch(e){}}
function resize(){var st=$('#ex-stage',el),w=st.clientWidth,h=st.clientHeight;if(!w)return;ren.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function pick(e){var st=$('#ex-stage',el),r=st.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(mouse,camera);
 var objs=[];nodes.forEach(function(L){L.forEach(function(n){objs.push(n.m);});});var h=raycaster.intersectObjects(objs)[0];return h?h.object.userData:null;}
function ui(){return '<h1>3D Neural Network Explorer</h1><p class="muted">A real, tiny neural network drawn in 3D. Colour and brightness come from an actual calculation; change anything and every number is recomputed.</p>'+NS.cycle(['LEARN','EXPERIMENT','VISUALIZE','UNDERSTAND'])+
 '<div class="split"><div class="card"><div class="lbl">1. Choose the input and the shape</div>'+
 NS.ctl({id:'ex-x1',label:'Input x1',min:-1,max:1,step:0.05,value:cfg.x1})+NS.ctl({id:'ex-x2',label:'Input x2',min:-1,max:1,step:0.05,value:cfg.x2})+
 NS.ctl({id:'ex-hid',label:'Hidden layers',min:1,max:4,step:1,value:cfg.hid})+NS.ctl({id:'ex-w',label:'Neurons per hidden layer',min:2,max:8,step:1,value:cfg.w})+
 NS.sel({id:'ex-act',label:'Activation function',value:cfg.act,opts:[['tanh','tanh'],['relu','ReLU'],['sigmoid','sigmoid']]})+
 '<div class="lbl" style="margin-top:12px">2. Do something with it</div><div class="row"><button class="btn primary" id="ex-fire" type="button">Fire signal</button><button class="btn" id="ex-train" type="button">Train it (XOR)</button><button class="btn" id="ex-new" type="button">New random weights</button><button class="btn" id="ex-cam" type="button">Reset camera</button></div>'+
 '<div class="lbl" style="margin-top:12px">3. What the network says</div><div id="ex-out"></div><div id="ex-exp" class="explain" style="display:none"></div>'+
 '<div class="lbl" style="margin-top:12px">Where your input sits</div><canvas id="ex-map" class="cv" data-help="ex.map" width="240" height="240" aria-label="Map of the network answer for every x1,x2"></canvas></div>'+
 '<div><div class="lbl" data-help="ex.stage" style="margin-bottom:6px">The network in 3D (drag to rotate, scroll to zoom, click a sphere)</div><div class="stage3d" id="ex-stage"><canvas id="ex-cv" aria-label="3D neural network"></canvas><div class="tip" id="ex-tip" style="display:none"></div></div><div class="card" style="margin-top:12px"><div class="lbl">Inspector: open one neuron and see how it works</div><div id="ex-info"></div></div></div></div>';}
NS.mods.explorer={init:function(root){el=root;root.innerHTML=ui();
 try{ren=new THREE.WebGLRenderer({canvas:$('#ex-cv',el),antialias:true,alpha:true});}catch(e){$('#ex-stage',el).innerHTML='<p class="muted" style="padding:20px">3D graphics are not available in this browser.</p>';return;}
 ren.setPixelRatio(Math.min(devicePixelRatio||1,2));scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(45,1,0.1,200);raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();
 buildNet();resize();window.addEventListener('resize',resize);
 var st=$('#ex-stage',el),drag=null,moved=0;
 st.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey};moved=0;st.setPointerCapture(e.pointerId);});
 st.addEventListener('contextmenu',function(e){e.preventDefault();});
 st.addEventListener('pointermove',function(e){if(drag){var dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;if(drag.pan){cam.tx-=dx*0.02;cam.ty+=dy*0.02;}else{cam.th-=dx*0.006;cam.ph=Math.max(0.2,Math.min(2.9,cam.ph-dy*0.006));}return;}
  var h=pick(e),t=$('#ex-tip',el);if(h){var r=st.getBoundingClientRect();t.style.display='block';t.style.left=(e.clientX-r.left+12)+'px';t.style.top=(e.clientY-r.top+12)+'px';t.textContent=(h.l===0?'input x'+(h.j+1):h.l===M.sizes.length-1?'output':'hidden L'+h.l+' N'+(h.j+1))+' = '+f(cache.a[h.l][h.j]);}else t.style.display='none';});
 st.addEventListener('pointerup',function(e){if(drag&&moved<5){var h=pick(e);sel=h;update();}drag=null;});
 st.addEventListener('wheel',function(e){e.preventDefault();cam.r=Math.max(5,Math.min(40,cam.r*(1+e.deltaY*0.001)));},{passive:false});
 root.addEventListener('input',function(e){var t=e.target;
  if(t.id==='ex-x1'||t.id==='ex-x2'){cfg[t.id.slice(3)]=+t.value;$('#'+t.id+'_o',el).textContent=t.value;update();}
  else if(t.id==='ex-hid'||t.id==='ex-w'){cfg[t.id==='ex-hid'?'hid':'w']=+t.value;$('#'+t.id+'_o',el).textContent=t.value;buildNet();}
  else if(t.hasAttribute('data-w')){var k=+t.getAttribute('data-w'),o=M.W[sel.l-1][k];M.W[sel.l-1][k]=+t.value;var before=out0(),a=cache.a[M.sizes.length-1][0];update();var af=cache.a[M.sizes.length-1][0];explainEdit('Weight changed from '+o.toFixed(2)+' to '+(+t.value).toFixed(2)+'. The network output moved from '+f(before)+' to '+f(af)+'. This weight multiplies its input, so the change reaches this neuron\'s sum, then its output, then every later layer.');$('#ex-exp',el).style.display='block';}
  else if(t.hasAttribute('data-b')){var jj=+t.getAttribute('data-b'),ob=M.b[sel.l-1][jj],bf=out0();M.b[sel.l-1][jj]=+t.value;update();explainEdit('Bias changed from '+ob.toFixed(2)+' to '+(+t.value).toFixed(2)+'. The bias is added to the sum before the activation, so it shifts how easily this neuron switches on. Network output: '+f(bf)+' to '+f(cache.a[M.sizes.length-1][0])+'.');$('#ex-exp',el).style.display='block';}});
 function out0(){return cache.a[M.sizes.length-1][0];}
 root.addEventListener('change',function(e){if(e.target.id==='ex-act'){var before=out0();cfg.act=e.target.value;M.act=cfg.act;update();explainEdit('Activation changed to '+NS.ACT[cfg.act].name+'. All hidden neurons were recomputed with the same weights. Output: '+f(before)+' to '+f(out0())+'.');$('#ex-exp',el).style.display='block';}});
 $('#ex-fire',el).onclick=fire;$('#ex-new',el).onclick=function(){cfg.seed=cfg.seed+1;buildNet();explainEdit('Made a brand-new network with fresh random weights (seed '+cfg.seed+'). Same shape, different starting numbers, so it will answer differently and, if you train it, may settle on a different solution.');$('#ex-exp',el).style.display='block';};$('#ex-cam',el).onclick=function(){cam={th:1.25,ph:1.35,r:11,tx:0,ty:0};};
 $('#ex-train',el).onclick=function(){var d=NS.data.make('xor',200,0.05,9),idx=d.X.map(function(_,i){return i;}),b=M.loss(d.X,d.Y,'bce');var t0=performance.now();for(var e=0;e<300;e++)M.step(d.X,d.Y,idx,{lr:0.03,opt:'adam',loss:'bce'});
  update();explainEdit('Ran 300 real Adam epochs on 200 XOR points in '+(performance.now()-t0).toFixed(0)+' ms. Loss fell from '+f(b)+' to '+f(M.loss(d.X,d.Y,'bce'))+', accuracy '+(M.acc(d.X,d.Y)*100).toFixed(0)+'%. Try x1 and x2 with the same sign (output near 1) and opposite signs (near 0), then fire a signal.');$('#ex-exp',el).style.display='block';};
 NS.explorer={get:function(){return {M:M,cache:cache,sel:sel};},select:function(l,j){sel={l:l,j:j};update();}};
 requestAnimationFrame(loop);},
 show:function(){setTimeout(resize,30);}};
})();
