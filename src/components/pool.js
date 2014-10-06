// Copyright 2014 Adrian W. Lange

/**
 *  MathWorker Pool 
 */
var pool = {};

// Globally scoped useful variables, defaults
pool.workerPool = [];
pool.nWorkers = 1;
pool.myWorkerId = 0;

pool.create = function(nWorkersInput, workerScriptName, logLevel) {
	for (var i = 0; i < nWorkersInput; ++i) {
		var worker = new Worker(workerScriptName);
		worker.postMessage({handle: "_init", id: i,
			nWorkers: nWorkersInput, logLevel: logLevel});
		this.workerPool.push(worker);
        this.nWorkers = this.workerPool.length;
	}

	this.getWorker = function(workerId) {
		return this.workerPool[workerId];
	};
};

