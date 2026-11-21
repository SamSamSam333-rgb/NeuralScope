/* Real neural-network engine: forward pass, backpropagation, SGD / momentum / Adam. No fake numbers anywhere. */
(function(){
var NS=window.NS=window.NS||{};
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){var u=Math.max(r(),1e-9),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
var ACT={
 tanh:{f:Math.tanh,d:function(y){return 1-y*y;},name:'tanh'},
 relu:{f:function(x){return x>0?x:0;},d:function(y){return y>0?1:0;},name:'ReLU'},
 sigmoid:{f:function(x){return 1/(1+Math.exp(-x));},d:function(y){return y*(1-y);},name:'sigmoid'},
 linear:{f:function(x){return x;},d:function(){return 1;},name:'linear'}};
function MLP(sizes,act,seed){this.sizes=sizes.slice();this.act=act;this.seed=seed;this.t=0;this.init();}
MLP.prototype.init=function(){var r=rng(this.seed),s=this.sizes;this.W=[];this.b=[];this.mW=[];this.vW=[];this.mb=[];this.vb=[];this.t=0;
 for(var l=0;l<s.length-1;l++){var n=s[l+1]*s[l],w=new Float64Array(n),sc=Math.sqrt(2/(s[l]+s[l+1]));for(var i=0;i<n;i++)w[i]=gauss(r)*sc;
  this.W.push(w);this.b.push(new Float64Array(s[l+1]));this.mW.push(new Float64Array(n));this.vW.push(new Float64Array(n));this.mb.push(new Float64Array(s[l+1]));this.vb.push(new Float64Array(s[l+1]));}};
/* forward: returns {a:[activations per layer], z:[pre-activations per layer>=1]} */
MLP.prototype.forward=function(x){var s=this.sizes,a=[Array.prototype.slice.call(x)],z=[],L=s.length-1;
 for(var l=0;l<L;l++){var zl=new Array(s[l+1]),al=new Array(s[l+1]),W=this.W[l],b=this.b[l],ain=a[l],nin=s[l];
  for(var j=0;j<s[l+1];j++){var sum=b[j];for(var i=0;i<nin;i++)sum+=W[j*nin+i]*ain[i];zl[j]=sum;
   al[j]=(l===L-1)?ACT.sigmoid.f(sum):ACT[this.act].f(sum);}
  z.push(zl);a.push(al);}
 return {a:a,z:z};};
MLP.prototype.predict=function(x){var c=this.forward(x);return c.a[c.a.length-1][0];};
MLP.prototype.loss=function(X,Y,kind){var e=0,n=X.length;for(var k=0;k<n;k++){var p=this.predict(X[k]),y=Y[k];
  if(kind==='mse')e+=(p-y)*(p-y);else{p=Math.min(Math.max(p,1e-9),1-1e-9);e+=-(y*Math.log(p)+(1-y)*Math.log(1-p));}}return e/Math.max(n,1);};
MLP.prototype.acc=function(X,Y){var ok=0;for(var k=0;k<X.length;k++)if((this.predict(X[k])>=0.5?1:0)===Y[k])ok++;return ok/Math.max(X.length,1);};
/* one optimisation step on the samples X[idx], Y[idx]; returns the batch loss measured BEFORE the update */
MLP.prototype.step=function(X,Y,idx,o){var s=this.sizes,L=s.length-1,gW=[],gb=[],l,i,j,k,loss=0;
 for(l=0;l<L;l++){gW.push(new Float64Array(this.W[l].length));gb.push(new Float64Array(s[l+1]));}
 for(k=0;k<idx.length;k++){var c=this.forward(X[idx[k]]),y=Y[idx[k]],p=c.a[L][0],d=[];
  if(o.loss==='mse'){loss+=(p-y)*(p-y);d[L-1]=[(p-y)*p*(1-p)];}else{var pc=Math.min(Math.max(p,1e-9),1-1e-9);loss+=-(y*Math.log(pc)+(1-y)*Math.log(1-pc));d[L-1]=[p-y];}
  for(l=L-1;l>=0;l--){var nin=s[l],dl=d[l],W=this.W[l];
   for(j=0;j<s[l+1];j++){gb[l][j]+=dl[j];for(i=0;i<nin;i++)gW[l][j*nin+i]+=dl[j]*c.a[l][i];}
   if(l>0){var dp=new Array(nin);for(i=0;i<nin;i++){var sum=0;for(j=0;j<s[l+1];j++)sum+=W[j*nin+i]*dl[j];dp[i]=sum*ACT[this.act].d(c.a[l][i]);}d[l-1]=dp;}}}
 var n=idx.length,lr=o.lr,l2=o.l2||0;this.t++;this.lastGrad=0;
 for(l=0;l<L;l++){var upd=function(P,G,M,V,self){for(var q=0;q<P.length;q++){var g=G[q]/n+l2*P[q];self.lastGrad+=g*g;
   if(o.opt==='sgd')P[q]-=lr*g;
   else if(o.opt==='momentum'){M[q]=0.9*M[q]+g;P[q]-=lr*M[q];}
   else{M[q]=0.9*M[q]+0.1*g;V[q]=0.999*V[q]+0.001*g*g;var mh=M[q]/(1-Math.pow(0.9,self.t)),vh=V[q]/(1-Math.pow(0.999,self.t));P[q]-=lr*mh/(Math.sqrt(vh)+1e-8);}}};
  upd(this.W[l],gW[l],this.mW[l],this.vW[l],this);upd(this.b[l],gb[l],this.mb[l],this.vb[l],this);}
 this.lastGrad=Math.sqrt(this.lastGrad);return loss/n;};
NS.rng=rng;NS.gauss=gauss;NS.ACT=ACT;NS.MLP=MLP;
})();
