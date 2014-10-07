importScripts("../src/mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;
var Batch = MathWorkers.BatchOperation;

var EPSILON = 0.00000001;

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

MW.on("run_vectorDot", function() {
	var v = Vector.fromArray([0.0, 2.0, 4.0, 6.0, 8.0]);
	var w = Vector.fromArray([1.0, 1.0, 1.0, 1.0, 1.0]);
	v.wkDot(w, "vectorDot");
});

MW.on("run_vectorPlus", function() {
	var v = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	var w = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.wkPlus(w, "vectorPlus");
});

MW.on("run_vectorMinus", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	var w = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.wkMinus(w, "vectorMinus");
});

MW.on("run_vectorTimesElementwise", function() {
	var v = MW.newVectorFromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	var w = MW.newVectorFromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.wkTimesElementwise(w, "vectorTimesElementwise");
});

MW.on("run_vectorDivide", function() {
	var v = MW.newVectorFromArray([0.0, 4.0, -8.0, 1.0, 5.0]);
	var w = MW.newVectorFromArray([1.0, 2.0, 4.0, 4.0, 5.0]);
	v.wkDivide(w, "vectorDivide");
});

MW.on("run_vectorScale", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	v.wkScale(2.0, "vectorScale");
});

MW.on("run_vectorApply", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	v.wkApply(Math.sqrt, "vectorApply");
});

MW.on("run_vectorNorm", function() {
	var v = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.wkNorm("vectorNorm");
});

MW.on("run_vectorSum", function() {
	var v = Vector.fromArray([100.0, 200.0, 300.0, 400.0, 500.0]);
	v.wkSum("vectorSum");
});

MW.on("run_vectorTimesMatrix", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0]);
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	v.wkTimesMatrix(A, "vectorTimesMatrix");
});

MW.on("run_matrixTimesVector", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0]);
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.wkTimesVector(v, "matrixTimesVector");
});

MW.on("run_matrixPlus", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.wkPlus(B, "matrixPlus");
});

MW.on("run_matrixMinus", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.wkMinus(B, "matrixMinus");
});

MW.on("run_matrixTimesElementwise", function() {
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = MW.newMatrixFromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.wkTimesElementwise(B, "matrixTimesElementwise");
});

MW.on("run_matrixDivide", function() {
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = MW.newMatrixFromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.wkDivide(B, "matrixDivide");
});

MW.on("run_matrixScale", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.wkScale(3.0, "matrixScale");
});

MW.on("run_matrixApply", function() {
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.wkApply(Math.sqrt, "matrixApply");
});

MW.on("run_matrixTimesMatrix1", function() {
	var A = Matrix.fromArray([[1.0, 2.0], 
							  	   [2.0, 3.0]]);
	var B = Matrix.fromArray([[-3.0, 2.0],
							       [1.0, -2.0]]);
	A.wkTimesMatrix(B, "matrixTimesMatrix1");
});

MW.on("run_vectorDotRebroadcast", function() {
	var v = Vector.fromArray([100.0, 200.0, 300.0, 400.0, 500.0]);
	var w = Vector.fromArray([10.0, 10.0, 10.0, 10.0, 10.0]);
	v.wkDot(w, "vdotre", true);
});
MW.on("vdotre", function(dot) {
	MW.sendDataToCoordinator(dot, "vectorDotRebroadcast");
});

MW.on("run_vectorTimesMatrixRebroadcast", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0]);
	var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	v.wkTimesMatrix(A, "vtmre", true);
});
MW.on("vtmre", function(vec) {
	var expected = [30.0, 36.0, 42.0];
	var pass = vec instanceof Vector && vec.length == 3;
	for (var i = 0; i < 3 && pass; ++i) {
		pass = pass && vec.array[i] - expected[i] < EPSILON;
	}
	MW.sendDataToCoordinator(pass, "vectorTimesMatrixRebroadcast");
});

MW.on("run_matrixLinearCombination", function() {
    var matrices = [
        MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]),
        MW.newMatrixFromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]),
        MW.newMatrixFromArray([[30.0, 20.0, 10.0], [60.0, 50.0, 40.0], [90.0, 80.0, 70.0]])];
    var coefficients = [0.5, 20.0, -1.0];
    Batch.wkMatrixLinearCombination(matrices, coefficients, "matrixLinearCombination");
});

