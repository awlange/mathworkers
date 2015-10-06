var MW = require("../../../dist/mathworkers.js");
MW.Global.setNode(true);
var MWI = MW.Interface;

var start;
var nRuns = 1;
var n = 0;
var times = [];

var size = 100;
//var A = MW.Matrix.randomMatrix(size, size);
var v = MW.Vector.randomVector(size);
var w = MW.Vector.randomVector(size);

//var B = MW.Matrix.fromArray([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]);
//var x = MW.Vector.fromArray([200.0, 200.0, 200.0]);

MWI.run("run_1", 4);

MWI.on("run_1", function() {
  n++;

  var next = (n <= nRuns) ? "run_1" : "run_done";
  if (n > 1) {
    times.push(new Date().getTime() - start);
  }

  start = new Date().getTime();
  MWI.vectorDotVector(w, v, next);
  //MWI.matrixDotVector(A, v, next);
  //MWI.matrixDotVector(B, x, next);

});

MWI.on("run_done", function(dot) {
  //console.log(dot);
  console.log(times);
  console.log(MW.Stats.summary(times));
  MWI.disconnect();
});
