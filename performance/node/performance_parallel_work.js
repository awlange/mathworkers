// Worker code for node.js
var MathWorkers = require("../../dist/mathworkers.js");
MathWorkers.Global.setNode(true);

var worker = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;

// Some vectors and matrices to play with
var v, w, x;
var A, B;
var N = 10000000;
var M = 400;

worker.on("set", function() {
    v = Vector.randomVector(N);
    w = Vector.randomVector(N);
    x = Vector.randomVector(M);
    A = Matrix.randomMatrix(M, M);
    B = Matrix.randomMatrix(M, M);
});

worker.on("foo", function() {
    worker.sendDataToCoordinator("Hello from process: " + process.pid, "bar");
});

worker.on("run_vectorDot", function() {
    v.workerDotVector(w, "vectorDot");
});

worker.on("run_vectorMatrixProduct", function() {
    x.workerDotMatrix(A, "vectorMatrixProduct");
});

worker.on("run_matrixMatrixProduct", function() {
    A.workerDotMatrix(B, "matrixMatrixProduct");
});

worker.on("run_matrixMatrixPlus", function() {
    var C = Matrix.randomMatrix(N, N);
    var alpha = 0.5;
    var beta = 0.96;
    MathWorkers.Batch.workerMatrixMatrixPlus(alpha, A, B, "matrixMatrixPlus", false, beta, C);
});
