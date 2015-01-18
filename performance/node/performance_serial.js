// TODO: node.js tests
var MWs = require("../../dist/mathworkers.js");
var Vector = MWs.Vector;
var Matrix = MWs.Matrix;

var n = 400;
var A = MWs.Matrix.randomMatrix(n, n);
var B = MWs.Matrix.randomMatrix(n, n);

var times = [];
for (var r = 0; r < 25; ++r) {
    var start = new Date().getTime();
    A.dotMatrix(B);
    times.push(new Date().getTime() - start);
}
var stats = MWs.Stats.summary(times);
console.log(stats);
