importScripts("../mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;

var id;
var nworkers;

MW.on("run_hello", function() {
	id = MW.getId();
	nworkers = MW.getNumWorkers();
	MW.sendText("hello", "Hello from worker " + id + " of " + nworkers + " workers.");
});

MW.on("run_sendVectorToCoordinator", function() {
	var v = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0], id, nworkers);
	v.sendToCoordinator("sendVectorToCoordinator");
});

MW.on("run_sendVectorToWorkers", function() {
	MW.sendText("sendVectorToWorkers", MW.getBuffer().toString());
});

MW.on("run_vectorDot", function() {
	var v = Vector.fromArray([0.0, 2.0, 4.0, 6.0, 8.0], id, nworkers);
	var w = Vector.fromArray([0.0, 1.0 / 3.0, 4.0 / 3.0, 9.0 / 3.0, 16.0 / 3.0], id, nworkers);
	v.wkDot(w, "vectorDot");
});

MW.on("run_vectorPlus", function() {
	var v = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0], id, nworkers);
	var w = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0], id, nworkers);
	v.wkPlus(w, "vectorPlus");
});

MW.on("run_vectorMinus", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0], id, nworkers);
	var w = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0], id, nworkers);
	v.wkMinus(w, "vectorMinus");
});

MW.on("run_vectorTimes", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0], id, nworkers);
	var w = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0], id, nworkers);
	v.wkTimes(w, "vectorTimes");
});

MW.on("run_vectorDividedBy", function() {
	var v = Vector.fromArray([0.0, 4.0, -8.0, 1.0, 5.0], id, nworkers);
	var w = Vector.fromArray([1.0, 2.0, 4.0, 4.0, 5.0], id, nworkers);
	v.wkDividedBy(w, "vectorDividedBy");
});

MW.on("run_vectorScale", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0], id, nworkers);
	v.wkScale(2.0, "vectorScale");
});

MW.on("run_vectorApply", function() {
	var v = Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0], id, nworkers);
	v.wkApply(Math.sqrt, "vectorApply");
});

MW.on("run_vectorNorm", function() {
	var v = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0], id, nworkers);
	v.wkNorm("vectorNorm");
});

