importScripts("../src/mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;

// Some vectors and matrices to play with
var v, w, x;
var A, B;
var N = 800;

MW.on("set", function() {
	v = Vector.randomVector(2000);
	w = Vector.randomVector(2000);
	x = Vector.randomVector(N);
	A = Matrix.randomMatrix(N, N);
	B = Matrix.randomMatrix(N, N);
});

MW.on("run_vectorDot", function() {
	v.wkDotVector(w, "vectorDot");
});

MW.on("run_vectorMatrixProduct", function() {
	x.wkDotMatrix(A, "vectorMatrixProduct");
});

MW.on("run_matrixMatrixProduct", function() {
	A.wkDotMatrix(B, "matrixMatrixProduct");
});

MW.on("run_matrixMatrixPlus", function() {
    var C = Matrix.randomMatrix(N, N);
    var alpha = 0.5;
    var beta = 0.96;
    MathWorkers.BatchOperation.wkMatrixMatrixPlus(alpha, A, B, "matrixMatrixPlus", false, beta, C);
});