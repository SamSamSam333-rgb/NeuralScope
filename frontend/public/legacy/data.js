/* Seeded 2-D datasets (real generated points). */
(function(){var NS=window.NS;
function make(kind,n,noise,seed){var r=NS.rng(seed),g=function(){return NS.gauss(r)*noise;},X=[],Y=[],i,t;
 for(i=0;i<n;i++){var c=i%2,x,y;
  if(kind==='moons'){t=r()*Math.PI;if(c===0){x=Math.cos(t);y=Math.sin(t);}else{x=1-Math.cos(t);y=0.5-Math.sin(t);}x=(x-0.5)*1.3;y=(y-0.25)*1.6;}
  else if(kind==='circles'){t=r()*2*Math.PI;var rad=c?0.9:0.4;x=rad*Math.cos(t);y=rad*Math.sin(t);}
  else if(kind==='xor'){x=(r()<0.5?-1:1)*(0.2+0.7*r());y=(r()<0.5?-1:1)*(0.2+0.7*r());c=(x*y>0)?1:0;}
  else if(kind==='spiral'){t=0.3+r()*2.6;var a=t*2.2+c*Math.PI;x=0.32*t*Math.cos(a);y=0.32*t*Math.sin(a);}
  else{x=(c?0.5:-0.5)+r()*0.01;y=(c?0.4:-0.4);}
  if(kind==='blobs'){x=(c?0.55:-0.55)+NS.gauss(r)*0.28;y=(c?0.45:-0.45)+NS.gauss(r)*0.28;X.push([x,y]);}else X.push([x+g(),y+g()]);
  Y.push(c);}
 return {X:X,Y:Y};}
function split(d,frac,seed){var r=NS.rng(seed+99),idx=d.X.map(function(_,i){return i;}),i;
 for(i=idx.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=idx[i];idx[i]=idx[j];idx[j]=t;}
 var k=Math.round(idx.length*frac),tr=idx.slice(0,k),va=idx.slice(k);
 return {Xtr:tr.map(function(i){return d.X[i];}),Ytr:tr.map(function(i){return d.Y[i];}),Xva:va.map(function(i){return d.X[i];}),Yva:va.map(function(i){return d.Y[i];})};}
NS.data={make:make,split:split,kinds:['moons','circles','xor','spiral','blobs']};
})();
