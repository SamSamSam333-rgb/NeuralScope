/* Small client for the NeuralScope Python API. The page works without it; Python features need the backend running. */
(function(){var NS=window.NS;
function json(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok)throw new Error(typeof j.detail==='string'?j.detail:(r.status+' '+r.statusText));return j;});}
NS.api={get:function(p){return fetch(p).then(json);},
 post:function(p,body){return fetch(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(json);},
 form:function(p,fd){return fetch(p,{method:'POST',body:fd}).then(json);}};})();
