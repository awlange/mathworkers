importScripts("../src/mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;

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
	var v = MW.newVectorFromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.sendToCoordinator("sendVectorToCoordinator");
});

MW.on("run_sendMatrixToCoordinator", function() {
	var A = MW.newMatrixFromArray([[0.0, 1.0], [2.0, 3.0]]);
	A.sendToCoordinator("sendMatrixToCoordinator");
});

MW.on("run_sendVectorToWorkers", function() {
	MW.sendDataToCoordinator(MW.getBuffer().toString(), "sendVectorToWorkers");
});

MW.on("run_sendMatrixToWorkers", function() {
	MW.sendDataToCoordinator(MW.getBuffer().toString(), "sendMatrixToWorkers");
});

MW.on("run_vectorDot", function() {
	var v = MW.newVectorFromArray([0.0, 2.0, 4.0, 6.0, 8.0]);
	var w = MW.newVectorFromArray([1.0, 1.0, 1.0, 1.0, 1.0]);
	v.wkDot(w, "vectorDot");
});

MW.on("run_vectorPlus", function() {
	var v = MW.newVectorFromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	var w = MW.newVectorFromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.wkPlus(w, "vectorPlus");
});

MW.on("run_vectorMinus", function() {
	var v = MW.newVectorFromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	var w = MW.newVectorFromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.wkMinus(w, "vectorMinus");
});

MW.on("run_vectorTimes", function() {
	var v = MW.newVectorFromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	var w = MW.newVectorFromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.wkTimes(w, "vectorTimes");
});

MW.on("run_vectorDividedBy", function() {
	var v = MW.newVectorFromArray([0.0, 4.0, -8.0, 1.0, 5.0]);
	var w = MW.newVectorFromArray([1.0, 2.0, 4.0, 4.0, 5.0]);
	v.wkDividedBy(w, "vectorDividedBy");
});

MW.on("run_vectorScale", function() {
	var v = MW.newVectorFromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	v.wkScale(2.0, "vectorScale");
});

MW.on("run_vectorApply", function() {
	var v = MW.newVectorFromArray([1.0, 2.0, 3.0, 4.0, 5.0]);
	v.wkApply(Math.sqrt, "vectorApply");
});

MW.on("run_vectorNorm", function() {
	var v = MW.newVectorFromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
	v.wkNorm("vectorNorm");
});

MW.on("run_vectorSum", function() {
	var v = MW.newVectorFromArray([100.0, 200.0, 300.0, 400.0, 500.0]);
	v.wkSum("vectorSum");
});

MW.on("run_vectorTimesMatrix", function() {
	var v = MW.newVectorFromArray([1.0, 2.0, 3.0]);
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	v.wkTimesMatrix(A, "vectorTimesMatrix");
});

MW.on("run_matrixTimesVector", function() {
	var v = MW.newVectorFromArray([1.0, 2.0, 3.0]);
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.wkTimesVector(v, "matrixTimesVector");
});

MW.on("run_matrixPlus", function() {
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = MW.newMatrixFromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.wkPlus(B, "matrixPlus");
});

MW.on("run_matrixMinus", function() {
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = MW.newMatrixFromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.wkMinus(B, "matrixMinus");
});

MW.on("run_matrixTimes", function() {
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = MW.newMatrixFromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.wkTimes(B, "matrixTimes");
});

MW.on("run_matrixDividedBy", function() {
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	var B = MW.newMatrixFromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
	A.wkDividedBy(B, "matrixDividedBy");
});

MW.on("run_matrixScale", function() {
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.wkScale(3.0, "matrixScale");
});

MW.on("run_matrixApply", function() {
	var A = MW.newMatrixFromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
	A.wkApply(Math.sqrt, "matrixApply");
});

// Experimental for testing coordinator broadcasting result
// MW.on("run_exp", function() {
// 	var v = MW.newVectorFromArray([100.0, 200.0, 300.0, 400.0, 500.0]);
// 	v.wkSum("exp", true);
// });
// MW.on("exp", function(args) {
// 	console.log(args[0]);
// });

