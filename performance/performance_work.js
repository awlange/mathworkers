importScripts("../src/mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;

var id;
var nworkers;

function getRandomVector(size) {
	var vec = new Vector(size);
	for (var i = 0; i < size; ++i) {
		vec.array[i] = Math.random();
	}
	return vec;
}

function getRandomMatrix(nrows, ncols) {
	var mat = new Matrix(nrows, ncols, id, nworkers);
	for (var i = 0; i < nrows; ++i) {
		for (var j = 0; j < ncols; ++j) {
			mat.set(i, j, Math.random());
		}
	}
	return mat;
}

// Some vectors and matrices to play with
var v, w, x;
var A, B;

MW.on("set", function() {
	id = MW.getId();
	nworkers = MW.getNumWorkers();
	v = getRandomVector(2000);
	w = getRandomVector(2000);
	x = getRandomVector(400);
	A = getRandomMatrix(400, 400);
	B = getRandomMatrix(400, 400);
});

MW.on("run_vectorDot", function() {
    console.log(v.toString());
	v.wkDot(w, "vectorDot");
});

MW.on("run_vectorMatrixProduct", function() {
	x.wkTimesMatrix(A, "vectorMatrixProduct");
});

MW.on("run_matrixMatrixProduct", function() {
	A.wkTimesMatrix(B, "matrixMatrixProduct");
});