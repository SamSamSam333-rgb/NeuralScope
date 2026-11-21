/* Draws the sample scene (an illustration, not a photo). */
(function(){
var NS=window.NS=window.NS||{};
NS.drawIllustration=function(g){
  var sky=g.createLinearGradient(0,0,0,250);sky.addColorStop(0,'#1d4163');sky.addColorStop(1,'#0f2740');
  g.fillStyle=sky;g.fillRect(0,0,640,400);
  g.fillStyle='#143452';
  [[0,160,90],[70,120,70],[410,150,85],[520,95,120]].forEach(function(b){g.fillRect(b[0],b[1],b[2],250-b[1]);});
  g.fillStyle='#1f4a6e';
  for(var y=170;y<240;y+=22){[10,38,80,108,425,455,540,575,605].forEach(function(x){g.fillRect(x,y,10,10);});}
  g.fillStyle='#0b1c2d';g.fillRect(0,250,640,150);
  g.fillStyle='#10263a';g.beginPath();g.moveTo(0,330);g.lineTo(640,300);g.lineTo(640,400);g.lineTo(0,400);g.closePath();g.fill();
  g.fillStyle='#2b4a64';for(var x=20;x<640;x+=90){g.fillRect(x,352-x*0.045,40,4);}
  g.fillStyle='#2d4a63';g.fillRect(300,100,6,150);g.fillStyle='#24415a';g.fillRect(290,70,26,60);
  g.fillStyle='#7a3040';g.beginPath();g.arc(303,82,6,0,7);g.fill();
  g.fillStyle='#7a6330';g.beginPath();g.arc(303,100,6,0,7);g.fill();
  g.fillStyle='#2fd0a0';g.beginPath();g.arc(303,118,6,0,7);g.fill();
  g.fillStyle='#2f5878';g.fillRect(360,255,185,50);
  g.fillStyle='#3a6a8e';g.beginPath();g.moveTo(395,255);g.lineTo(420,222);g.lineTo(505,222);g.lineTo(528,255);g.closePath();g.fill();
  g.fillStyle='#16324b';g.fillRect(428,230,34,22);g.fillRect(468,230,34,22);
  g.fillStyle='#08121c';[[402,305],[505,305]].forEach(function(w){g.beginPath();g.arc(w[0],w[1],17,0,7);g.fill();});
  g.fillStyle='#5b87a8';[[402,305],[505,305]].forEach(function(w){g.beginPath();g.arc(w[0],w[1],7,0,7);g.fill();});
  function person(cx,top,h,col){
    g.fillStyle=col;g.beginPath();g.arc(cx,top+h*0.09,h*0.09,0,7);g.fill();
    g.fillRect(cx-h*0.14,top+h*0.2,h*0.28,h*0.42);
    g.fillRect(cx-h*0.13,top+h*0.62,h*0.11,h*0.38);g.fillRect(cx+h*0.02,top+h*0.62,h*0.11,h*0.38);
  }
  person(130,155,165,'#4d7ea3');person(240,180,120,'#3f6c8f');
  g.fillStyle='#5a86a6';g.beginPath();g.ellipse(596,302,26,13,0,0,7);g.fill();
  g.beginPath();g.arc(624,290,9,0,7);g.fill();
  [[580,310],[592,310],[604,310],[614,310]].forEach(function(l){g.fillRect(l[0],l[1],5,12);});
  g.strokeStyle='#5a86a6';g.lineWidth=4;g.beginPath();g.moveTo(572,296);g.lineTo(566,284);g.stroke();
};
})();
