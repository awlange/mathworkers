importScripts("../mathworkers.js");

var MW = new MathWorkers.MathWorker();

var id;
var nworkers;

MW.on("run", function() {
	id = MW.getId();
	nworkers = MW.getNumWorkers();
	MW.sendText("hello", "Hello from worker " + id + " of " + nworkers + " workers.");
});