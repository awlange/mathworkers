importScripts("../mathworkers.js");

var MW = new MathWorkers.MathWorker();

var id;
var nworkers;

MW.on("run_hello", function() {
	id = MW.getId();
	nworkers = MW.getNumWorkers();
	MW.sendText("hello", "Hello from worker " + id + " of " + nworkers + " workers.");
});

MW.on("run_sendVectorToCoordinator", function() {
	var v = new MathWorkers.Vector(5, id, nworkers);
	for (var i = 0; i < v.length; ++i) {
		v.set(i, i * 1.0);
	}
	v.sendToCoordinator("sendVectorToCoordinator");
});

MW.on("run_vectorDot", function() {
	var v = new MathWorkers.Vector(5, id, nworkers);
	var w = new MathWorkers.Vector(5, id, nworkers);
	for (var i = 0; i < v.length; ++i) {
		v.set(i, i * 2.0);
		w.set(i, (i*i) / 3.0);
	}
	v.wkDot(w, "vectorDot");
});