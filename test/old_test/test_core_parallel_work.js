importScripts("../../dist/mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;
var Batch = MathWorkers.Batch;

var EPSILON = 10e-12;

var id;
var nworkers;

MW.on("run_sendDataToCoordinator", function() {
	id = MW.getId();
	nworkers = MW.getNumWorkers();
	MW.sendDataToCoordinator("Hello from worker " + id + " of " + nworkers + " workers.", "sendDataToCoordinator");
});

MW.on("run_sendDataToWorkers", function(arg) {
	id = MW.getId();
	MW.sendDataToCoordinator("Data received by worker " + id  + ": " + arg, "sendDataToWorkers");
});

MW.on("run_sendVectorToCoordinator", function() {
	var v = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	MW.sendVectorToCoordinator(v, "sendVectorToCoordinator");
});

MW.on("run_sendMatrixToCoordinator", function() {
	var A = Matrix.fromArray([[0.0, 1.0], [2.0, 3.0]]);
	MW.sendMatrixToCoordinator(A, "sendMatrixToCoordinator");
});

MW.on("run_sendVectorToWorkers", function() {
	MW.sendDataToCoordinator(MW.getBuffer().toString(), "sendVectorToWorkers");
});

MW.on("run_sendMatrixToWorkers", function() {
	MW.sendDataToCoordinator(MW.getBuffer().toString(), "sendMatrixToWorkers");
});

MW.on("run_vectorDotVector", function() {
	var v = Vector.fromArray([0.0, 2.0, 4.0, 6.0, 8.0]);
	var w = Vector.fromArray([1.0, 1.0, 1.0, 1.0, 1.0]);
	v.workerDotVector(w, "vectorDotVector");
});

MW.on("run_vectorSum", function() {
    var v = Vector.fromArray([100.0, 200.0, 300.0, 400.0, 500.0]);
    v.workerSum("vectorSum");
});

MW.on("run_vectorProduct", function() {
    var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
    v.workerProduct("vectorProduct");
});

MW.on("run_vectorPlus", function() {
	var v = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	var w = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.workerPlus(w, "vectorPlus");
});

MW.on("run_vectorMinus", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	var w = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.workerMinus(w, "vectorMinus");
});

MW.on("run_vectorTimes", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	var w = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.workerTimes(w, "vectorTimes");
});

MW.on("run_vectorDivide", function() {
	var v = Vector.fromArray([0.0, 4.0, -8.0, 1.0, 5.0]);
	var w = Vector.fromArray([1.0, 2.0, 4.0, 4.0, 5.0]);
	v.workerDivide(w, "vectorDivide");
});

MW.on("run_vectorScale", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	v.workerScale(2.0, "vectorScale");
});

MW.on("run_vectorApply", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	v.workerApply(Math.sqrt, "vectorApply");
});

MW.on("run_vectorDotMatrix", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0]);
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	v.workerDotMatrix(A, "vectorDotMatrix");
});

MW.on("run_matrixDotVector", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0]);
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.workerDotVector(v, "matrixDotVector");
});

MW.on("run_matrixPlus", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.workerPlus(B, "matrixPlus");
});

MW.on("run_matrixMinus", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.workerMinus(B, "matrixMinus");
});

MW.on("run_matrixTimes", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.workerTimes(B, "matrixTimes");
});

MW.on("run_matrixDivide", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.workerDivide(B, "matrixDivide");
});

MW.on("run_matrixScale", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.workerScale(3.0, "matrixScale");
});

MW.on("run_matrixApply", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.workerApply(Math.sqrt, "matrixApply");
});

MW.on("run_matrixDotMatrix1", function() {
	var A = Matrix.fromArray([[1.0, 2.0],
							  [2.0, 3.0]]);
	var B = Matrix.fromArray([[-3.0, 2.0],
							  [1.0, -2.0]]);
	A.workerDotMatrix(B, "matrixDotMatrix1");
});

MW.on("run_matrixDotMatrix2", function() {
    var A = Matrix.fromArray([[1.0, 2.0], [2.0, 3.0]]);
    var B = Matrix.fromArray([[-3.0, 2.0], [1.0, -2.0]]);
    B.workerDotMatrix(A, "matrixDotMatrix2");
});

MW.on("run_matrixDotMatrix3", function() {
    var A = Matrix.fromArray([[1.0, 2.0],
        [2.0, 3.0]]);
    var C = Matrix.fromArray([[1.0, 0.0, -2.0],
        [0.0, 1.0, 1.0]]);
    A.workerDotMatrix(C, "matrixDotMatrix3");
});

MW.on("run_matrixDotMatrix4", function() {
    var C = Matrix.fromArray([[1.0, 0.0, -2.0],
                                   [0.0, 1.0, 1.0]]);
    var D = Matrix.fromArray([[3.0, 1.0],
                                   [-1.0, -2.0],
                                   [1.0, 1.0]]);
    C.workerDotMatrix(D, "matrixDotMatrix4");
});

MW.on("run_matrixDotMatrix5", function() {
    var C = Matrix.fromArray([[1.0, 0.0, -2.0],
        [0.0, 1.0, 1.0]]);
    var D = Matrix.fromArray([[3.0, 1.0],
        [-1.0, -2.0],
        [1.0, 1.0]]);
    D.workerDotMatrix(C, "matrixDotMatrix5");
});

MW.on("run_vectorDotRebroadcast", function() {
	var v = Vector.fromArray([100.0, 200.0, 300.0, 400.0, 500.0]);
	var w = Vector.fromArray([10.0, 10.0, 10.0, 10.0, 10.0]);
	v.workerDotVector(w, "vdotre", true);
});
MW.on("vdotre", function(dot) {
	MW.sendDataToCoordinator(dot, "vectorDotRebroadcast");
});

MW.on("run_vectorTimesMatrixRebroadcast", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0]);
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	v.workerDotMatrix(A, "vtmre", true);
});
MW.on("vtmre", function(vec) {
	var expected = [30.0, 36.0, 42.0];
	var pass = vec instanceof Vector && vec.length == 3;
	for (var i = 0; i < 3 && pass; ++i) {
		pass = pass && vec.array[i] - expected[i] < EPSILON;
	}
	MW.sendDataToCoordinator(pass, "vectorTimesMatrixRebroadcast");
});

MW.on("run_vectorLinearCombination", function() {
    var vectors = [
        Vector.fromArray([1.0, 2.0, 3.0]),
        Vector.fromArray([5.0, 8.0, 22.0]),
        Vector.fromArray([-1.0, 200.0, -30.0])
    ];
    var coefficients = [0.5, 20.0, -7.7];
    Batch.workerVectorLinearCombination(vectors, coefficients, "vectorLinearCombination");
});

MW.on("run_matrixLinearCombination", function() {
    var matrices = [
        Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]),
        Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]),
        Matrix.fromArray([[30.0, 20.0, 10.0], [60.0, 50.0, 40.0], [90.0, 80.0, 70.0]])];
    var coefficients = [0.5, 20.0, -1.0];
    Batch.workerMatrixLinearCombination(matrices, coefficients, "matrixLinearCombination");
});

MW.on("run_matrixMatrixPlus1", function() {
    var A = Matrix.fromArray([
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [7.0, 8.0, 9.0]
    ]);
    var B = Matrix.fromArray([
        [3.0, 2.0, 1.0],
        [6.0, 5.0, 4.0],
        [9.0, 8.0, 7.0]
    ]);
    var C = Matrix.fromArray([
        [30.0, 20.0, 10.0],
        [60.0, 50.0, 40.0],
        [90.0, 80.0, 70.0]
    ]);
    var alpha = 0.38;
    var beta = -0.77;
    Batch.workerMatrixMatrixPlus(alpha, A, B, "matrixMatrixPlus1", false, beta, C);
});

MW.on("run_matrixMatrixPlus2", function() {
    var A = Matrix.fromArray([
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [7.0, 8.0, 9.0]
    ]);
    var B = Matrix.fromArray([
        [3.0, 2.0, 1.0],
        [6.0, 5.0, 4.0],
        [9.0, 8.0, 7.0]
    ]);
    var alpha = 0.38;
    Batch.workerMatrixMatrixPlus(alpha, A, B, "matrixMatrixPlus2");
});

MW.on("run_matrixVectorPlus1", function() {
    var A = Matrix.fromArray([
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [7.0, 8.0, 9.0]
    ]);
    var x = Vector.fromArray([2.0, 4.0, 8.0]);
    var y = Vector.fromArray([-5.0, -7.0, -9.0]);
    var alpha = 0.45;
    var beta = -10.0;
    Batch.workerMatrixVectorPlus(alpha, A, x, "matrixVectorPlus1", false, beta, y);
});

MW.on("run_matrixVectorPlus2", function() {
    var A = Matrix.fromArray([
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [7.0, 8.0, 9.0]
    ]);
    var x = Vector.fromArray([2.0, 4.0, 8.0]);
    var alpha = 0.45;
    Batch.workerMatrixVectorPlus(alpha, A, x, "matrixVectorPlus2");
});
