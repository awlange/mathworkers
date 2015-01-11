// Worker code for node.js
var MathWorkers = require("../../lib/mathworkers.js");
MathWorkers.Global.setNode(true);

var MWs = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;

// Some vectors and matrices to play with
var v, w, x;
var A, B;
var N = 200;
var M = 100;

MWs.on("set", function() {
    v = Vector.randomVector(M);
    w = Vector.randomVector(M);
    x = Vector.randomVector(N);
    A = Matrix.randomMatrix(N, N);
    B = Matrix.randomMatrix(N, N);
});

MWs.on("foo", function() {
    MWs.sendDataToCoordinator("Hello from process: " + process.pid, "bar");
});

MWs.on("run_vectorDot", function() {
    v.workerDotVector(w, "vectorDot");
});

MWs.on("run_vectorMatrixProduct", function() {
    x.workerDotMatrix(A, "vectorMatrixProduct");
});

MWs.on("run_matrixMatrixProduct", function() {
    A.workerDotMatrix(B, "matrixMatrixProduct");
});

MWs.on("run_matrixMatrixPlus", function() {
    var C = Matrix.randomMatrix(N, N);
    var alpha = 0.5;
    var beta = 0.96;
    MathWorkers.Batch.workerMatrixMatrixPlus(alpha, A, B, "matrixMatrixPlus", false, beta, C);
});