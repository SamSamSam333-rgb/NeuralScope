/* Real classical ML algorithms: KNN, K-means (Lloyd), decision tree (CART, Gini). */
(function(){var NS=window.NS;
function knn(X,Y,K){return function(p){var d=X.map(function(q,i){var dx=q[0]-p[0],dy=q[1]-p[1];return [dx*dx+dy*dy,Y[i]];});d.sort(function(a,b){return a[0]-b[0];});
  var v=0,k=Math.min(K,d.length);for(var i=0;i<k;i++)v+=d[i][1];return v/k;};}
/* K-means: returns every iteration so the user can step through. init = k-means++ with a seed. */
function kmeans(X,K,seed,maxIter){var r=NS.rng(seed),C=[X[Math.floor(r()*X.length)].slice()],i,j,it,hist=[];
 while(C.length<K){var d=X.map(function(p){var m=1e9;C.forEach(function(c){m=Math.min(m,Math.pow(p[0]-c[0],2)+Math.pow(p[1]-c[1],2));});return m;}),tot=d.reduce(function(a,b){return a+b;},0),t=r()*tot,acc=0,pick=0;
  for(i=0;i<d.length;i++){acc+=d[i];if(acc>=t){pick=i;break;}}C.push(X[pick].slice());}
 var asg=new Array(X.length).fill(0);
 for(it=0;it<(maxIter||30);it++){var changed=0,inertia=0;
  for(i=0;i<X.length;i++){var best=0,bd=1e9;for(j=0;j<K;j++){var dd=Math.pow(X[i][0]-C[j][0],2)+Math.pow(X[i][1]-C[j][1],2);if(dd<bd){bd=dd;best=j;}}if(asg[i]!==best)changed++;asg[i]=best;inertia+=bd;}
  hist.push({C:C.map(function(c){return c.slice();}),asg:asg.slice(),inertia:inertia,changed:changed});
  var S=C.map(function(){return [0,0,0];});for(i=0;i<X.length;i++){S[asg[i]][0]+=X[i][0];S[asg[i]][1]+=X[i][1];S[asg[i]][2]++;}
  for(j=0;j<K;j++)if(S[j][2])C[j]=[S[j][0]/S[j][2],S[j][1]/S[j][2]];
  if(it>0&&changed===0)break;}
 return hist;}
function gini(a,b){var n=a+b;return n?1-Math.pow(a/n,2)-Math.pow(b/n,2):0;}
function tree(X,Y,maxDepth,minLeaf){minLeaf=minLeaf||2;var nodes=0;
 function build(idx,depth){var n1=0,i;idx.forEach(function(k){n1+=Y[k];});var n0=idx.length-n1,node={n:idx.length,n0:n0,n1:n1,depth:depth,p:idx.length?n1/idx.length:0};nodes++;
  if(depth>=maxDepth||n0===0||n1===0||idx.length<2*minLeaf)return node;
  var best=null,parent=gini(n0,n1);
  for(var f=0;f<2;f++){var s=idx.slice().sort(function(a,b){return X[a][f]-X[b][f];}),l1=0,l0=0;
   for(i=0;i<s.length-1;i++){if(Y[s[i]])l1++;else l0++;if(X[s[i]][f]===X[s[i+1]][f])continue;var nl=i+1,nr=s.length-nl;if(nl<minLeaf||nr<minLeaf)continue;
    var g=parent-(nl/s.length)*gini(l0,l1)-(nr/s.length)*gini(n0-l0,n1-l1);if(!best||g>best.gain)best={gain:g,f:f,t:(X[s[i]][f]+X[s[i+1]][f])/2};}}
  if(!best||best.gain<=1e-9)return node;
  node.f=best.f;node.t=best.t;node.gain=best.gain;
  node.L=build(idx.filter(function(k){return X[k][best.f]<=best.t;}),depth+1);node.R=build(idx.filter(function(k){return X[k][best.f]>best.t;}),depth+1);return node;}
 var root=build(X.map(function(_,i){return i;}),0);
 function pred(p){var n=root;while(n.L)n=p[n.f]<=n.t?n.L:n.R;return n.p;}
 pred.root=root;pred.nodes=nodes;return pred;}
function accOf(f,X,Y){var ok=0;X.forEach(function(p,i){if((f(p)>=0.5?1:0)===Y[i])ok++;});return ok/Math.max(1,X.length);}
NS.ml={knn:knn,kmeans:kmeans,tree:tree,accOf:accOf};
})();
