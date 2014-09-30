importScripts("../src/mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;

var id;
var nworkers;

function getRandomVector(size) {
	var vec = new Vector(size, id, nworkers);
	for (var i = 0; i < size; ++i) {
		vec.set(i, Math.random());
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
var A;

MW.on("set", function() {
	id = MW.getId();
	nworkers = MW.getNumWorkers();
	v = getRandomVector(20000);
	w = getRandomVector(20000);
	x = getRandomVector(3000);
	A = getRandomMatrix(3000, 3000);
});

MW.on("run_hello", function() {
	MW.sendText("hello", "Hello from worker " + MW.getId() + " of " + MW.getNumWorkers() + " workers.");
});

MW.on("run_vectorDot", function() {
	v.wkDot(w, "vectorDot");
});

MW.on("run_vectorMatrixProduct", function() {
	x.wkTimesMatrix(A, "vectorMatrixProduct");
});