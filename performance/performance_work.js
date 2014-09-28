importScripts("../src/mathworkers.js");

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;

var id;
var nworkers;

MW.on("run_hello", function() {
	id = MW.getId();
	nworkers = MW.getNumWorkers();
	MW.sendText("hello", "Hello from worker " + id + " of " + nworkers + " workers.");
});