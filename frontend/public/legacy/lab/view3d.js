/* 3D map. Every object is pickable: dots, wires, stage planes, labels, sparks, floor. */
(function(){
var NS=window.NS,C=NS.content,S=NS.S,u=NS.u,$=u.$,clamp=u.clamp,f2=u.f2,net=S.net,LAYERS=NS.sim.LAYERS;
NS.init3D=function(){
  var canvas=$('#gl'),stage=$('#stage'),tip=$('#tip');
  var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});renderer.setClearColor(0x000000,0);
  var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,0.1,200);
  var K={cyan:0x22e4ff,amber:0xffb224,green:0x37f5a5,red:0xff5470,dim:0x4a6275,pink:0xff5fd2};
  var rng=NS.sim.mulberry32(5);
  var gc=document.createElement('canvas');gc.width=gc.height=64;var gx=gc.getContext('2d');
  var gr=gx.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');
  gx.fillStyle=gr;gx.fillRect(0,0,64,64);var glow=new THREE.CanvasTexture(gc);
  var grid=new THREE.GridHelper(40,40,0x12405c,0x0c2438);grid.position.y=-6;grid.material.transparent=true;grid.material.opacity=0.55;scene.add(grid);
  var floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  floor.position.y=-6;floor.userData.floor=1;scene.add(floor);
  var dp=new Float32Array(260*3),i;for(i=0;i<260;i++){dp[i*3]=(rng()-.5)*50;dp[i*3+1]=(rng()-.5)*24;dp[i*3+2]=(rng()-.5)*40;}
  var dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
  scene.add(new THREE.Points(dg,new THREE.PointsMaterial({size:0.12,color:0x4aa3c2,transparent:true,opacity:.45,depthWrite:false})));
  function textSprite(text,color,w,h,fs){var c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);var tex=new THREE.CanvasTexture(c);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sp.scale.set(w,h,1);
    sp.userData.draw=function(t,col){var g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.font='600 '+fs+'px "Chakra Petch","JetBrains Mono",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=col;g.fillText(t,c.width/2,c.height/2);tex.needsUpdate=true;};
    sp.userData.draw(text,color);return sp;}
  /* input plane shows the REAL picture, cut into the 12 tiles */
  var pcv=document.createElement('canvas');pcv.width=C.IMG_W;pcv.height=C.IMG_H;var pg=pcv.getContext('2d'),ptex=new THREE.CanvasTexture(pcv);
  function drawInputTex(){pg.drawImage(NS.bc,0,0);net.layerNodes[0].forEach(function(n){var x=n.tc*C.IMG_W/C.TC,y=n.tr*C.IMG_H/C.TR;
    if(!n.active){pg.fillStyle='rgba(2,6,12,.85)';pg.fillRect(x,y,C.IMG_W/C.TC,C.IMG_H/C.TR);}});
    pg.strokeStyle='rgba(120,230,255,.55)';pg.lineWidth=2;for(var a=0;a<=C.TC;a++){pg.beginPath();pg.moveTo(a*C.IMG_W/C.TC,0);pg.lineTo(a*C.IMG_W/C.TC,C.IMG_H);pg.stroke();}
    for(var b=0;b<=C.TR;b++){pg.beginPath();pg.moveTo(0,b*C.IMG_H/C.TR);pg.lineTo(C.IMG_W,b*C.IMG_H/C.TR);pg.stroke();}ptex.needsUpdate=true;}
  var planes=[],edges=[],labels=[],sprites=[],lines=[],resLabels=[];
  LAYERS.forEach(function(L,li){
    var pw=li===0?L.cols*L.sz:(L.cols-1)*L.sz+2.4,ph=li===0?L.rows*L.sy:(L.rows-1)*L.sy+2.4;
    var geo=new THREE.PlaneGeometry(pw,ph);geo.rotateY(Math.PI/2);
    var mat=li===0?new THREE.MeshBasicMaterial({map:ptex,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false})
      :new THREE.MeshBasicMaterial({color:K.cyan,transparent:true,opacity:0.05,side:THREE.DoubleSide,depthWrite:false});
    var m=new THREE.Mesh(geo,mat);m.position.set(L.x,0,0);m.userData.layer=li;scene.add(m);planes.push(m);
    var e=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:K.cyan,transparent:true,opacity:0.45}));e.position.copy(m.position);scene.add(e);edges.push(e);
    var lb=textSprite((li+1)+'  '+L.name,'#8fe9fb',5.2,1.3,64);lb.position.set(L.x,ph/2+0.9,0);lb.userData.layer=li;scene.add(lb);labels.push(lb);});
  net.nodes.forEach(function(n){
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:K.cyan,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    sp.position.set(n.pos[0],n.pos[1],n.pos[2]);sp.userData.node=n;scene.add(sp);sprites.push(sp);n.sprite=sp;
    if(n.layer===4){var tl=textSprite('','#37f5a5',3.6,0.9,56);tl.position.set(n.pos[0]+2.8,n.pos[1],n.pos[2]);tl.userData.det=n.det;scene.add(tl);resLabels[n.det]=tl;labels.push(tl);}});
  net.threads.forEach(function(t){
    var a=new THREE.Vector3(t.a.pos[0],t.a.pos[1],t.a.pos[2]),b=new THREE.Vector3(t.b.pos[0],t.b.pos[1],t.b.pos[2]);
    var mid=a.clone().add(b).multiplyScalar(.5);mid.y+=(rng()-.5)*1.6;mid.z+=(rng()-.5)*1.6;
    var pts=new THREE.QuadraticBezierCurve3(a,mid,b).getPoints(20);
    var ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:K.cyan,transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending}));
    ln.userData.thread=t;t.pts=pts;t.line=ln;scene.add(ln);lines.push(ln);});
  var PN=80,pp=new Float32Array(PN*3),pulses=[],pg2=new THREE.BufferGeometry();pg2.setAttribute('position',new THREE.BufferAttribute(pp,3));
  pg2.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,0),40);
  var points=new THREE.Points(pg2,new THREE.PointsMaterial({size:0.55,map:glow,color:0xbff6ff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  points.frustumCulled=false;scene.add(points);
  function strength(t){return Math.abs(S.carry[t.id])/S.maxCarry[t.a.layer];}
  function pickThread(){for(var k=0;k<40;k++){var t=net.threads[Math.floor(Math.random()*net.threads.length)];if(!t.cut&&Math.random()<Math.pow(strength(t),.8)&&strength(t)>0.04)return t;}return null;}
  for(i=0;i<PN;i++)pulses.push({t:pickThread(),u:Math.random()});
  var cam={theta:0.45,phi:1.22,r:32,idle:0};
  function place(){camera.position.set(cam.r*Math.sin(cam.phi)*Math.sin(cam.theta),cam.r*Math.cos(cam.phi),cam.r*Math.sin(cam.phi)*Math.cos(cam.theta));camera.lookAt(2.2,0,0);}
  function resize(){var w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  if(window.ResizeObserver)new ResizeObserver(resize).observe(stage);window.addEventListener('resize',resize);resize();
  var ray=new THREE.Raycaster(),ndc=new THREE.Vector2();ray.params.Line.threshold=0.3;ray.params.Points.threshold=0.4;
  function pick(e){var r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
    var h=ray.intersectObjects(sprites,false);if(h.length)return {type:'node',ref:h[0].object.userData.node};
    h=ray.intersectObjects(labels,false);if(h.length){var d=h[0].object.userData;return d.det!==undefined?{type:'node',ref:S.resNodes[d.det]}:{type:'layer',ref:d.layer};}
    h=ray.intersectObject(points,false);if(h.length)return {type:'term',ref:'spark'};
    h=ray.intersectObjects(lines,false);if(h.length)return {type:'thread',ref:h[0].object.userData.thread};
    h=ray.intersectObjects(planes,false);if(h.length)return {type:'layer',ref:h[0].object.userData.layer};
    h=ray.intersectObject(floor,false);if(h.length)return {type:'term',ref:'decor'};
    return null;}
  function same(a,b){return !!a&&!!b&&a.type===b.type&&a.ref===b.ref;}
  function tipText(h){if(h.type==='node'){var n=h.ref;return n.layer===4?C.DETS[n.det].name+' result · '+f2(S.conf[n.det]):n.label+' · '+LAYERS[n.layer].name.toLowerCase()+' dot · value '+f2(S.val[n.i]);}
    if(h.type==='thread')return 'wire '+h.ref.a.label+' to '+h.ref.b.label+' · carries '+S.carry[h.ref.id].toFixed(2);
    if(h.type==='layer')return 'stage '+(h.ref+1)+' · '+LAYERS[h.ref].name.toLowerCase();return h.ref==='spark'?'a spark: animation only':'decoration';}
  var drag=null;
  canvas.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);cam.idle=0;});
  canvas.addEventListener('pointermove',function(e){
    if(drag){if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>5)drag.moved=true;
      if(drag.moved){cam.theta-=(e.clientX-drag.x)*0.006;cam.phi=clamp(cam.phi-(e.clientY-drag.y)*0.006,0.25,Math.PI-0.25);}
      drag.x=e.clientX;drag.y=e.clientY;cam.idle=0;tip.hidden=true;return;}
    var h=pick(e),r=stage.getBoundingClientRect();if(!same(h,S.hover)){S.hover=h;paint();}
    if(h){tip.textContent=tipText(h);tip.hidden=false;tip.style.left=Math.min(e.clientX-r.left+14,r.width-260)+'px';tip.style.top=(e.clientY-r.top+14)+'px';canvas.style.cursor='pointer';}
    else{tip.hidden=true;canvas.style.cursor='';}});
  canvas.addEventListener('pointerup',function(e){if(drag&&!drag.moved){var h=pick(e);if(h)NS.select(h);else NS.select(null);}drag=null;});
  canvas.addEventListener('pointerleave',function(){if(!drag){S.hover=null;tip.hidden=true;paint();}});
  canvas.addEventListener('wheel',function(e){e.preventDefault();cam.r=clamp(cam.r*(1+e.deltaY*0.001),12,60);cam.idle=0;},{passive:false});
  function selNode(n){return S.sel&&S.sel.type==='node'&&S.sel.ref===n;}
  function layerOn(li){var s=S.sel;return !!s&&((s.type==='layer'&&s.ref===li)||(s.type==='node'&&s.ref.layer===li)||(s.type==='thread'&&(s.ref.b.layer===li||s.ref.a.layer===li)));}
  function paint(){
    drawInputTex();
    net.nodes.forEach(function(n){var v=S.val[n.i],col=K.cyan,op=.3+.65*clamp(v,0,1),s=n.layer===0?1.2:(n.layer===4?2.2:1.4);
      if(!n.active){col=K.red;op=.5;s*=.8;}
      else if(n.layer===4){var on=S.conf[n.det]>=S.thr;col=on?K.green:K.dim;op=on?1:.55;if(S.hl[n.det])col=K.amber;}
      if(selNode(n)){col=K.amber;s*=1.5;op=1;}
      if(S.hover&&S.hover.type==='node'&&S.hover.ref===n)s*=1.25;
      n.sprite.material.color.setHex(col);n.sprite.material.opacity=op;n.sprite.scale.set(s,s,1);});
    net.threads.forEach(function(t){var m=t.line.material,str=strength(t),hov=S.hover&&S.hover.type==='thread'&&S.hover.ref===t;
      if(S.sel&&S.sel.type==='thread'&&S.sel.ref===t){m.color.setHex(K.amber);m.opacity=1;}
      else if(t.cut||!t.a.active||!t.b.active){m.color.setHex(K.red);m.opacity=hov?.7:.22;}
      else{m.color.setHex(t.kind==='weight'&&t.w<0?K.pink:K.cyan);m.opacity=clamp(.1+.7*Math.pow(str,.7)+(hov?.3:0),0,1);}});
    planes.forEach(function(p,li){var on=layerOn(li),hov=S.hover&&S.hover.type==='layer'&&S.hover.ref===li;
      if(li===0)p.material.opacity=on?1:(hov?.95:.85);else{p.material.color.setHex(on?K.amber:K.cyan);p.material.opacity=on?.1:(hov?.09:.05);}
      edges[li].material.color.setHex(on?K.amber:K.cyan);edges[li].material.opacity=on?.95:.45;});
    C.DETS.forEach(function(d,i){resLabels[i].userData.draw(d.name+' '+f2(S.conf[i]),S.conf[i]>=S.thr?'#37f5a5':'#6f8aa0');});}
  var last=performance.now();
  function frame(now){var dt=clamp((now-last)/1000,0,.05);last=now;points.visible=S.motion;
    if(S.motion){cam.idle+=dt;if(cam.idle>2.5&&!drag)cam.theta+=dt*0.07;
      for(var k=0;k<PN;k++){var p=pulses[k];if(!p.t||p.t.cut||strength(p.t)<=0.04){p.t=pickThread();p.u=0;}if(!p.t)continue;
        p.u+=dt*(0.2+0.3*strength(p.t));if(p.u>=1){p.t=pickThread();p.u=0;if(!p.t)continue;}
        var pts=p.t.pts,f=p.u*(pts.length-1),j=clamp(Math.floor(f),0,pts.length-2),a=pts[j],b=pts[j+1],q=f-j;
        pp[k*3]=a.x+(b.x-a.x)*q;pp[k*3+1]=a.y+(b.y-a.y)*q;pp[k*3+2]=a.z+(b.z-a.z)*q;}
      pg2.attributes.position.needsUpdate=true;}
    place();renderer.render(scene,camera);}
  function loop(now){try{frame(now);}catch(err){}requestAnimationFrame(loop);}
  cam.r=32*Math.max(1,1.25/camera.aspect);place();paint();requestAnimationFrame(loop);
  return {paint:paint};
};
})();
