var MW = require("../../../dist/mathworkers.js");
MW.Global.setNode(true);
var MWI = MW.Interface;

var start;
var nRuns = 20;
var n = 0;
var times = [];

var size = 1000000;
//var A = MW.Matrix.randomMatrix(size, size);
var v = MW.Vector.randomVector(size);
var w = MW.Vector.randomVector(size);

//var B = MW.Matrix.fromArray([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]);
//var x = MW.Vector.fromArray([200.0, 200.0, 200.0]);

for (var i = 0; i < nRuns; ++i) {
  start = new Date().getTime();
  v.dotVector(w);
  //A.dotVector(v);
  times.push(new Date().getTime() - start);
}
console.log(times);

console.log(MW.Stats.summary(times));
