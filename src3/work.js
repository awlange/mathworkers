importScripts("mathworkers.js");

var MW = new MathWorkers.MathWorker();

MW.on("hello", function() {
	console.log("Hello from worker: " + MW.getId());
});

MW.on("go", function() {
	var v = new MathWorkers.Vector(4, MW.getId(), MW.getNumWorkers());
	for (var i = 0; i < v.length; ++i) {
		v.set(i, i * 1.0);
	}
	v.dot(v, "dot1");
});

MW.on("sendV", function() {
	var v = new MathWorkers.Vector(10, MW.getId(), MW.getNumWorkers());
	for (var i = 0; i < v.length; ++i) {
		v.set(i, i * 1.0);
	}
	v.sendToCoordinator("sentV");
});

MW.on("sendMat", function() {
	var A = new MathWorkers.Matrix(3, 3, MW.getId(), MW.getNumWorkers());
	for (var i = 0; i < 3; ++i) {
		for (var j = 0; j < 3; ++j) {
			A.set(i, j, 0.0);
		}
		A.set(i, i, 1.0);
	}
	A.sendToCoordinator("sentMat");
});

MW.on("MatVec", function() {
	var n = 2000;
	var v = new MathWorkers.Vector(n, MW.getId(), MW.getNumWorkers());
	var A = new MathWorkers.Matrix(n, n, MW.getId(), MW.getNumWorkers());
	for (var i = 0; i < n; ++i) {
		v.set(i, (i+1) * 1.0);
		for (var j = 0; j < n; ++j) {
			A.set(i, j, 0.0);
		}
		A.set(i, i, 1.0);
	}
	A.timesVector(v, "computedMatVec");
});