importScripts("mathworkers.js");

var MW = new MathWorkers.MathWorker();

MW.on("hello", function() {
	console.log("Hello from worker: " + MW.getId());
});

MW.on("go", function() {
	var v = new MathWorkers.Vector(10, MW.getId(), MW.getNumWorkers());
	for (var i = 0; i < v.length; ++i) {
		v.set(i, i * 1.0);
	}
	v.dot(v, "dot1");
});

