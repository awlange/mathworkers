// Copyright 2014 Adrian W. Lange

/**
 *  MathWorkers globally available data
 */
var global = {};

// Globally scoped useful variables, defaults
global.workerPool = [];
global.nWorkers = 1;
global.myWorkerId = 0;

/**
 * Log level
 * 1 = warnings and errors only
 * 2 = verbose logging
 */
global.logLevel = 1;
MW.setLogLevel = function(logLevel) {
    if (!MW.util.nullOrUndefined(logLevel)) {
        global.logLevel = logLevel;
    }
};

/**
 * Loop unrolling option
 * If true, use loop unrolled versions of functions if available. If false, do not.
 * Off by default.
 */
global.unrollLoops = false;
MW.setUnrollLoops = function(unroll) {
    MW.util.checkNullOrUndefined(unroll);
    global.unrollLoops = unroll;
};

global.createPool = function(nWorkersInput, workerScriptName) {
	for (var i = 0; i < nWorkersInput; ++i) {
		var worker = new Worker(workerScriptName);
		worker.postMessage({handle: "_init", id: i,
			nWorkers: nWorkersInput, logLevel: global.logLevel, unrollLoops: global.unrollLoops});
		this.workerPool.push(worker);
        this.nWorkers = this.workerPool.length;
	}

	this.getWorker = function(workerId) {
		return this.workerPool[workerId];
	};
};

