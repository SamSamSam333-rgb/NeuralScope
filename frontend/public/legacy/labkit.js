/* Mounts the "Show me" bar, intro card and "?" buttons on each lab page. */
window.addEventListener('DOMContentLoaded',function(){var N=window.NS,H=window.NSH;if(!N||!H)return;
 [['explorer','ex'],['trainer','tr'],['playground','pg']].forEach(function(p){try{H.mount(N.$('#v-'+p[0]),p[1]);}catch(e){}});});
