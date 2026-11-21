/* Academy (lessons) and Quizzes & Progress. Quiz answers are computed in code, not hard-coded. */
(function(){
var NS=window.NS,$=NS.$,esc=NS.esc,Q,sig=function(z){return 1/(1+Math.exp(-z));};
var sig0=1;
/* ---------- quiz ---------- */
function makeQs(){var r=NS.rng(Date.now()%100000),pick=function(a){return a[Math.floor(r()*a.length)];},qs=[];
 var a=pick([0.5,1,1.5,2]),w=pick([1,2,-1,-2]),b=pick([0.5,-0.5,1]),z=a*w+b;
 function opts(c,fn){var set={},o=[c];while(o.length<4){var v=+(c+(r()-0.5)*2).toFixed(3);if(!set[v]&&v!==c){set[v]=1;o.push(v);}}return o.sort(function(){return r()-0.5;});}
 var ans=+sig(z).toFixed(3);qs.push({q:'A neuron has input '+a+', weight '+w+' and bias '+b+'. It uses the sigmoid activation. What is its output (3 decimals)?',o:opts(ans).map(String),c:String(ans),e:'z = '+a+' x '+w+' + '+b+' = '+z.toFixed(3)+'. sigmoid('+z.toFixed(3)+') = '+ans+'.'});
 var zr=pick([-2.3,-0.4,1.7,3.2]);qs.push({q:'A ReLU neuron has a sum z = '+zr+'. What is its output?',o:['0',String(zr),String(Math.abs(zr)),'1'],c:String(Math.max(0,zr)),e:'ReLU(z) = max(0, z), so '+Math.max(0,zr)+'.'});
 var d=NS.data.make('moons',200,0.3,3),s=NS.data.split(d,0.75,3),f=NS.ml.knn(s.Xtr,s.Ytr,1),ta=NS.ml.accOf(f,s.Xtr,s.Ytr);
 qs.push({q:'KNN with K = 1 is evaluated on its own training points. Its training accuracy (measured live on a moons dataset) is...',o:['Exactly 100%','About 50%','About 75%','It cannot be measured'],c:'Exactly 100%',e:'Measured here: '+(ta*100).toFixed(1)+'%. Each training point is its own nearest neighbour, so it is always right on training data. Validation accuracy is what matters.'});
 qs.push({q:'During training the loss keeps going up and down wildly. Which change is most likely to help?',o:['Lower the learning rate','Raise the learning rate','Add more noise to the data','Remove the validation set'],c:'Lower the learning rate',e:'Zig-zagging loss is the signature of steps that overshoot. Smaller steps settle into the valley.'});
 qs.push({q:'Training accuracy is 99% but validation accuracy is 78%. This is...',o:['Overfitting','Underfitting','A perfect model','A bug in the loss'],c:'Overfitting',e:'A big gap means the model memorised the training set instead of learning a pattern that generalises.'});
 qs.push({q:'In K-Means, increasing K always makes inertia (total squared distance to centres)...',o:['Smaller or equal','Larger','Unchanged','Random'],c:'Smaller or equal',e:'More centres can only sit closer to the points, so inertia never rises. That is why you look for the elbow, not the minimum.'});
 return qs;}
var st={i:0,score:0,ans:null};
NS.mods.quiz={init:function(root){Q=root;Q.addEventListener('click',function(e){var b=e.target.closest('[data-opt]');if(b&&st.ans===null){var q=NS.mods.quiz.qs[st.i],v=b.getAttribute('data-opt');st.ans=v;if(v===q.c)st.score++;NS.mods.quiz.draw();}
  if(e.target.closest('#q-next')){if(st.i<NS.mods.quiz.qs.length-1){st.i++;st.ans=null;}else{var best=NS.store.get('best',0),pc=Math.round(100*st.score/NS.mods.quiz.qs.length);if(pc>best)NS.store.set('best',pc);NS.store.set('quizzes',NS.store.get('quizzes',0)+1);NS.logExp('Quiz',st.score+' / '+NS.mods.quiz.qs.length+' correct');st.i=-1;}NS.mods.quiz.draw();}
  if(e.target.closest('#q-again')){NS.mods.quiz.start();}});this.start();},
 start:function(){this.qs=makeQs();st={i:0,score:0,ans:null};this.draw();},
 refresh:function(){this.draw();},show:function(){this.draw();},
 draw:function(){var qs=this.qs,l=NS.store.get('lessons',{}),nl=Object.keys(l).filter(function(k){return l[k];}).length,ne=NS.store.get('exps',[]).length,best=NS.store.get('best',null);
  var ach=[['First lesson',nl>=1],['All lessons',nl>=NS.LESSONS.length],['First experiment',ne>=1],['5 experiments',ne>=5],['Quiz 80%+',best!==null&&best>=80]];
  var prog='<div class="card"><div class="lbl">Your progress (saved in this browser)</div><div class="kv"><b>Lessons</b><span>'+nl+' / '+NS.LESSONS.length+'</span><b>Experiments logged</b><span>'+ne+'</span><b>Best quiz score</b><span>'+(best===null?'none yet':best+'%')+'</span></div><div class="bar" style="margin:8px 0"><i style="width:'+Math.round(100*nl/NS.LESSONS.length)+'%"></i></div><div class="row">'+ach.map(function(a){return '<span class="cycle"><span>'+(a[1]?'<b>':'')+esc(a[0])+(a[1]?' (earned)</b>':'')+'</span></span>';}).join('')+'</div></div>';
  var body;if(st.i<0){body='<div class="card"><h2>Finished: '+st.score+' / '+qs.length+'</h2><p class="muted">Questions are regenerated with fresh numbers each time.</p><button class="btn primary" id="q-again" type="button">Try again</button></div>';}
  else{var q=qs[st.i];body='<div class="card"><div class="lbl">Question '+(st.i+1)+' of '+qs.length+' &middot; predict the output</div><h3 style="margin-bottom:10px">'+esc(q.q)+'</h3>'+q.o.map(function(o){var c=st.ans===null?'':(o===q.c?' ok':(o===st.ans?' no':''));return '<button type="button" class="opt'+c+'" data-opt="'+esc(o)+'">'+esc(o)+'</button>';}).join('')+(st.ans!==null?'<div class="explain">'+(st.ans===q.c?'Correct. ':'Not quite. ')+esc(q.e)+'</div><div style="margin-top:10px"><button class="btn primary" id="q-next" type="button">'+(st.i<qs.length-1?'Next question':'Finish')+'</button></div>':'')+'</div>';}
  Q.innerHTML='<h1>Quizzes &amp; Progress</h1><p class="muted">Answers are computed by the same maths the labs use.</p><div class="grid g2">'+body+prog+'</div>';}};
})();
