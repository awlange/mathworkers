var Worker = require('webworker-threads').Worker;

var nWorkers = 2;

var pool = []
for (var n = 0; n < nWorkers; n++) {
	pool.push(new Worker("work.js"));
}

setTimeout( function() {

	console.time("workers");

    // Reduce kernel
	var total = 0;
	var nWorkersReported = 0;
	var reduceKernel = function(event) {
		total += event.data.myDot;
		nWorkersReported += 1;
		if (nWorkersReported == nWorkers) {
			console.timeEnd("workers");
			console.log("total: " + total);

			// reset?
			//workerStart = window.performance.now();
			nWorkersReported = 0;
			total = 0;
		}
	};

	for (var n = 0; n < nWorkers; n++) {
		pool[n].onmessage = reduceKernel;
		pool[n].postMessage({functionId: 1, workerId: n, nWorkers: nWorkers});
	}

}, 1000);

// serial
setTimeout( function() {
	console.time("serial");

	var vlen = 2000;
	var vec = new Float64Array(vlen);

	for (var i = 0; i < vlen; i++) {
		vec[i] = i * 0.0001;
	}

	/*
	var myDot = 0.0;
	for (var nt = 0; nt < 1; nt++) {
	for (var i = 0; i < vlen; i++) {
		for (var j = 0; j < vlen; j++) {
			myDot += Math.exp(-(vec[i] * vec[j]));
		}
	}
	}
	console.timeEnd("serial");
	console.log("total: " + myDot);
	*/

        var resultVector = new Float64Array(vlen);
        for (var i = 0; i < vlen; i++) {
                var tmp = 0.0;
                for (var j = 0; j < vlen; j++) {
                        tmp += mat[i*vlen + j] * vec[j];
                }
                resultVector[i] = tmp;
        }

	console.timeEnd("serial");
	console.log("total: " + myDot);
}, 2000);
