/* Pure network logic: no DOM. Dots = units, wires carry value (x weight). */
(function(){
var NS=typeof window!=='undefined'?(window.NS=window.NS||{}):(global.NS=global.NS||{});
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function sigmoid(z){return 1/(1+Math.exp(-z));}
function logit(p){p=Math.min(0.999,Math.max(0.001,p));return Math.log(p/(1-p));}
var LAYERS=[
  {id:'input',code:'IN',name:'INPUT',cols:4,rows:3,x:-9,sz:1.8,sy:1.5},
  {id:'backbone',code:'BB',name:'BACKBONE',cols:4,rows:5,x:-4.5,sz:1.5,sy:1.5},
  {id:'neck',code:'NK',name:'NECK',cols:4,rows:4,x:0,sz:1.5,sy:1.5},
  {id:'head',code:'HD',name:'HEAD',cols:3,rows:4,x:4.5,sz:1.5,sy:1.5},
  {id:'result',code:'OUT',name:'RESULTS',cols:1,rows:5,x:9,sz:1.5,sy:1.9}
];
/* topTiles[k] = the 5 image tiles wired into filter k */
function buildNet(topTiles,seed){
  var rng=mulberry32(seed||11),nodes=[],layerNodes=[],threads=[],tileNode=[];
  LAYERS.forEach(function(L,li){
    var arr=[];
    for(var c=0;c<L.cols;c++)for(var r=0;r<L.rows;r++){
      var idx=arr.length;
      var n={i:nodes.length,layer:li,idx:idx,pos:[L.x,-(r-(L.rows-1)/2)*L.sy,(c-(L.cols-1)/2)*L.sz],
             active:true,b:0,b0:0,inT:[],outT:[],label:L.code+'-'+(idx<9?'0':'')+(idx+1)};
      if(li===0){n.tc=L.cols-1-c;n.tr=r;n.tile=n.tr*L.cols+n.tc;tileNode[n.tile]=n;}
      arr.push(n);nodes.push(n);
    }
    layerNodes.push(arr);
  });
  var seen={};
  function link(a,b,kind,w){var k=a.i+'-'+b.i;if(seen[k])return;seen[k]=1;
    var t={id:threads.length,a:a,b:b,kind:kind,w:w,w0:w,cut:false};threads.push(t);a.outT.push(t);b.inT.push(t);}
  function sw(){return (rng()<0.72?1:-1)*(0.8+rng()*1.7);}
  layerNodes[1].forEach(function(f,k){topTiles[k].forEach(function(tile){link(tileNode[tile],f,'contrib',0);});});
  for(var l=1;l<LAYERS.length-1;l++){
    var src=layerNodes[l],dst=layerNodes[l+1];
    src.forEach(function(a){
      var picks={},cnt=0;while(cnt<2){var j=Math.floor(rng()*dst.length);if(!picks[j]){picks[j]=1;cnt++;}}
      Object.keys(picks).forEach(function(j){link(a,dst[+j],'weight',sw());});
    });
    dst.forEach(function(b){var g=0;while(b.inT.length<2&&g++<60)link(src[Math.floor(rng()*src.length)],b,'weight',sw());});
  }
  return {nodes:nodes,layerNodes:layerNodes,threads:threads,tileNode:tileNode,rng:rng};
}
/* calib(n) -> target output; when given, biases are set so the ideal state hits the targets */
function forward(net,bright,calib){
  var val=new Array(net.nodes.length).fill(0),carry=new Array(net.threads.length).fill(0);
  net.layerNodes[0].forEach(function(n){val[n.i]=n.active?bright[n.tile]:0;});
  net.layerNodes[1].forEach(function(n){var s=0;
    n.inT.forEach(function(t){var c=(!t.cut&&t.a.active)?t.w:0;carry[t.id]=c;s+=c;});
    n.z=s;val[n.i]=n.active?s:0;});
  for(var l=2;l<net.layerNodes.length;l++)net.layerNodes[l].forEach(function(n){
    var z=0;n.inT.forEach(function(t){var c=(!t.cut&&t.a.active)?t.w*val[t.a.i]:0;carry[t.id]=c;z+=c;});
    if(calib){n.b=logit(calib(n))-z;n.b0=n.b;}
    n.z=z+n.b;val[n.i]=n.active?sigmoid(n.z):0;});
  return {val:val,carry:carry};
}
NS.sim={mulberry32:mulberry32,sigmoid:sigmoid,logit:logit,LAYERS:LAYERS,buildNet:buildNet,forward:forward};
})();
