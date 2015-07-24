var MW = require("../../../dist/mathworkers.js");
MW.Global.setNode(true);
var MWI = MW.Interface;

var start;
var nRuns = 10;
var n = 0;
var times = [];

var size = 500;
var A = MW.Matrix.randomMatrix(size, size);
var v = MW.Vector.randomVector(size);
var w = MW.Vector.randomVector(size);

MWI.run("run_1", 2);

MWI.on("run_1", function() {
  n++;

  var next = (n <= nRuns) ? "run_1" : "run_done";
  if (n > 1) {
    times.push(new Date().getTime() - start);
  }

  start = new Date().getTime();
  //MWI.vectorDotVector(w, v, next);
  MWI.matrixDotVector(A, v, next);

});

MWI.on("run_done", function(dot) {
  //console.log(dot);
  console.log(MW.Stats.summary(times));
  MWI.disconnect();
});
