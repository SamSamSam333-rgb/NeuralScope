/* Words and fixed data. Terms in {braces} become clickable glossary buttons. */
(function(){
var NS=window.NS=window.NS||{};
var DETS=[
  {name:'person',base:0.92,box:[95,150,165,320]},
  {name:'person',base:0.78,box:[215,175,265,300]},
  {name:'car',base:0.88,box:[345,205,555,320]},
  {name:'dog',base:0.64,box:[565,265,630,322]},
  {name:'traffic light',base:0.35,box:[288,70,318,150]}
];
function bl(n){var a=[];for(var i=0;i<9;i++)a.push(n);return a;}
var KDEF=[
 ['Vertical edge',[-1,0,1,-2,0,2,-1,0,1]],['Horizontal edge',[-1,-2,-1,0,0,0,1,2,1]],
 ['Diagonal edge /',[0,1,2,-1,0,1,-2,-1,0]],['Diagonal edge \\',[2,1,0,1,0,-1,0,-1,-2]],
 ['Vertical edge (flipped)',[1,0,-1,2,0,-2,1,0,-1]],['Horizontal edge (flipped)',[1,2,1,0,0,0,-1,-2,-1]],
 ['Diagonal edge / (flipped)',[0,-1,-2,1,0,-1,2,1,0]],['Diagonal edge \\ (flipped)',[-2,-1,0,-1,0,1,0,1,2]],
 ['Outline',[0,-1,0,-1,4,-1,0,-1,0]],['Sharpen',[0,-1,0,-1,5,-1,0,-1,0]],
 ['Blur (box)',bl(1/9)],['Blur (soft)',[1/16,2/16,1/16,2/16,4/16,2/16,1/16,2/16,1/16]],
 ['Emboss NW',[-2,-1,0,-1,1,1,0,1,2]],['Emboss NE',[0,-1,-2,1,1,-1,2,1,0]],
 ['Emboss SW',[0,1,2,-1,1,1,-2,-1,0]],['Emboss SE',[2,1,0,1,1,-1,0,-1,-2]],
 ['Top edge',[1,1,1,0,0,0,-1,-1,-1]],['Bottom edge',[-1,-1,-1,0,0,0,1,1,1]],
 ['Left edge',[1,0,-1,1,0,-1,1,0,-1]],['Right edge',[-1,0,1,-1,0,1,-1,0,1]]
];
var PRESETS={'Vertical edge':KDEF[0][1],'Horizontal edge':KDEF[1][1],'Blur':KDEF[10][1],'Sharpen':KDEF[9][1],'All zeros':[0,0,0,0,0,0,0,0,0]};

var STAGE=[
 {s:"Your picture is just a grid of {pixel}s, and every pixel is three numbers (red, green, blue). This sketch cuts the picture into 12 {tile}s. Each {dot} is one tile, and its {value} is how bright that tile is on average.",
  t:"The image is a 640 x 400 x 3 array of 0 to 255 values. Here it is split into a 4 x 3 grid of tiles; each unit holds the tile's mean brightness. Real YOLO takes every pixel, resized to 640 x 640.",
  real:"Here: 12 tiles. Real YOLO: all pixels."},
 {s:"{filter}s hunt for simple patterns such as edges and blurs. A filter is a tiny 3 x 3 grid of numbers that slides over the picture. Each dot is one filter, and its value says how much of its pattern was found. Its {wire}s come from the 5 tiles where it reacts most.",
  t:"20 hand-made 3 x 3 convolution kernels applied to the grayscale image. Unit value = mean absolute response over each of its 5 strongest tiles, summed, then scaled so the strongest filter is 1.",
  real:"Here: 20 hand-made filters. Real YOLO: thousands of filters learned from data."},
 {s:"Mixes the pattern clues. Each dot adds up its incoming wires (value x {weight}), adds a {bias}, and squashes the total into 0 to 1 with an {activation}.",
  t:"Weighted sum plus bias through a sigmoid. Stands in for the multi-scale feature fusion of a real neck. Weights here are random and fixed, not trained.",
  real:"Here: random weights. Real YOLO: trained weights."},
 {s:"Turns the mixed clues into guesses about objects. It works exactly like the neck: add up, nudge, squash.",
  t:"Same unit type as the neck. A real YOLO head outputs box coordinates and class scores for every location on its feature maps.",
  real:"Here: 12 units. Real YOLO: box and class outputs per grid cell."},
 {s:"One dot per detected object. Its value is the {confidence}: how strongly the network reacted. Objects below the {cutoff} are hidden.",
  t:"Final sigmoid outputs. Their biases are set so the sample detections start at fixed confidences. Confidence is a score, not a guaranteed probability.",
  real:"Here: 5 fixed objects. Real YOLO: whatever it finds in your photo."}
];
var NODE=[
 {s:"One rectangle of the picture. Its number is the average brightness of that rectangle.",t:"Input patch: mean grayscale brightness of one tile."},
 {s:"One {filter}. It slides a 3 x 3 grid of numbers over the picture. Its number says how much of its pattern it found.",t:"Convolution kernel unit: summed mean absolute response over its 5 strongest tiles."},
 {s:"Adds up its incoming wires, nudges the total by its {bias}, and squashes it to 0 to 1.",t:"Sigmoid unit: sigmoid(sum of weight x input + bias)."},
 {s:"Adds up its incoming wires, nudges the total by its bias, and squashes it to 0 to 1. Its output guesses part of an object.",t:"Sigmoid unit in the detection head."},
 {s:"The answer slot for one detected object. Its number is the {confidence}.",t:"Output unit; its value is the confidence for one detection."}
];
function G(label,s,t,lab,see){return {label:label,s:s,t:t,lab:lab,see:see||[]};}
var GL={
 dot:G("dot","One dot holds one number, usually between 0 and 1. A brighter dot holds a bigger number.","A unit (artificial neuron) holding a single activation value.","A test tube holding one measurement.",['value','wire','plane']),
 wire:G("wire","A wire carries a number from one dot to the next. On the way it is multiplied by the wire's {weight}. Cyan wires boost the next dot, pink wires push it down, red wires are cut.","A weighted connection: downstream input = upstream value x weight. Negative weights inhibit.","A pipe that scales whatever flows through it.",['weight','spark','cut']),
 plane:G("plane (stage)","A plane is one stage: a group of dots that do the same kind of job. Numbers flow from the INPUT plane on the left to the RESULTS plane on the right.","A layer. Units within a layer are computed in parallel from the previous layer.","One step of an experiment, done on a whole rack of test tubes at once.",['dot','schematic']),
 spark:G("spark","The moving sparks are an animation of numbers travelling along wires. They are not extra data. Faster sparks run on stronger wires.","Visual only: particles interpolated along each wire, sampled in proportion to its carried magnitude.","Bubbles rising in a pipe to show something is flowing.",['wire']),
 value:G("value","The number a dot holds. For image tiles it is brightness. For filters it is how much pattern was found. For result dots it is the {confidence}.","The activation of a unit.","The reading on a test tube.",['dot','confidence']),
 weight:G("weight","A number on a wire. A big positive weight passes a lot of the signal, a negative weight pushes the next dot down, and a weight near 0 ignores the wire. Learning means adjusting weights.","A learned scalar multiplied with the input along a connection.","The valve setting on a pipe.",['wire','bias']),
 bias:G("bias","A built-in nudge a dot adds to its total before deciding, like a default leaning.","A scalar added to the weighted sum before the activation function.","The starting level in a test tube before anything is poured in.",['weight','activation']),
 activation:G("activation","A squashing rule applied after adding things up. Here it is the sigmoid, which turns any number into one between 0 and 1, so a dot can never blow up.","Sigmoid: 1 / (1 + e^-z). Smooth, bounded, monotonic.","A thermostat: no matter how hard you heat, the reading stays between 0 and 1.",['bias','value']),
 filter:G("filter","A filter (also called a kernel) is a 3 x 3 grid of numbers. It slides over the picture. At each spot it multiplies the 9 pixels under it by its 9 numbers and adds them up. A big result means its pattern is there.","A 3 x 3 convolution kernel. Output at (x, y) = sum of pixel x weight over the neighbourhood.","A reagent that only reacts with one kind of pattern.",['featuremap','pixel']),
 featuremap:G("feature map","The picture you get after sliding a filter over the whole image. It is bright where the filter's pattern was found.","The output of a convolution: one response value per location.","The colour change in a test tube, shown across the whole sample.",['filter']),
 pixel:G("pixel","One speck of the picture, stored as three numbers from 0 to 255 for red, green and blue. A picture is nothing more than a big table of these numbers.","An RGB triple of 8-bit intensities.","One atom of the image.",['tile']),
 tile:G("tile","A rectangle of the picture. This sketch uses 12 tiles. Real YOLO looks at every pixel.","A spatial patch of the input.","A slide cut from a larger sample.",['pixel']),
 confidence:G("confidence","How strongly the network reacted for an object, from 0 to 1. A high score means a strong reaction. It is not a promise that the object is really there.","A model score, not a calibrated probability of correctness.","How strongly the reaction fizzed.",['cutoff','value']),
 cutoff:G("cutoff","Detections below the cutoff are hidden. Raising it removes the least sure objects.","Confidence threshold applied after inference.","Ignore any reaction weaker than this line.",['confidence']),
 box:G("box","A rectangle drawn around a detected object, given as x1, y1, x2, y2 in pixels from the top-left corner.","Axis-aligned bounding box in image coordinates.","A frame around the interesting patch.",['confidence']),
 mute:G("mute","Muting switches a dot off: its number becomes 0. Everything that depended on it changes. It is the quickest way to see what a dot is for.","Zeroing a unit's activation (an ablation).","Removing one test tube from the experiment.",['cut']),
 cut:G("cut","Cutting removes one wire, so nothing flows along it.","Ablating a single connection.","Closing one valve.",['mute','wire']),
 schematic:G("how accurate is this sketch?","This 3D map is a teaching sketch. REAL here: the brightness of each tile, the filter maths on the sample picture, and the arithmetic inside every dot. SIMPLIFIED: only 5 tiles feed each filter, the filters are hand-made, and neck and head weights are random. Real YOLO learns millions of weights.","Faithful arithmetic, toy architecture. No trained parameters are used.","A model of a molecule: the shape is right enough to learn from, but it is not the molecule.",['plane','dot']),
 decor:G("floor grid and dust","The floor grid and floating dust are decoration only. They carry no data and mean nothing.","Purely cosmetic scene elements.","The lab bench itself.",[])
};
var STAGEKEYS={input:0,backbone:1,neck:2,head:3,results:4};
GL.input=G("input stage",STAGE[0].s,STAGE[0].t,"",[]);GL.backbone=G("backbone stage",STAGE[1].s,STAGE[1].t,"",[]);
GL.neck=G("neck stage",STAGE[2].s,STAGE[2].t,"",[]);GL.head=G("head stage",STAGE[3].s,STAGE[3].t,"",[]);GL.results=G("results stage",STAGE[4].s,STAGE[4].t,"",[]);
NS.content={DETS:DETS,KDEF:KDEF,PRESETS:PRESETS,STAGE:STAGE,NODE:NODE,GL:GL,STAGEKEYS:STAGEKEYS,IMG_W:640,IMG_H:400,KW:160,KH:100,TC:4,TR:3};
})();
