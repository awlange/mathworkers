importScripts("../src/mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;

// Some vectors and matrices to play with
var v, w, x;
var A, B;

MW.on("set", function() {
	v = Vector.randomVector(2000);
	w = Vector.randomVector(2000);
	x = Vector.randomVector(400);
	A = Matrix.randomMatrix(400, 400);
	B = Matrix.randomMatrix(400, 400);
});

MW.on("run_vectorDot", function() {
	v.wkDot(w, "vectorDot");
});

MW.on("run_vectorMatrixProduct", function() {
	x.wkTimesMatrix(A, "vectorMatrixProduct");
});

MW.on("run_matrixMatrixProduct", function() {
	A.wkTimesMatrix(B, "matrixMatrixProduct");
});

MW.on("run_matrixMatrixPlus", function() {
    var C = Matrix.randomMatrix(400, 400);
    var alpha = 0.5;
    var beta = 0.96;
    MathWorkers.BatchOperation.wkMatrixMatrixPlus(alpha, A, B, "matrixMatrixPlus", false, beta, C);
});