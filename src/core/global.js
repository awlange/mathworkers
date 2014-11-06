// Copyright 2014 Adrian W. Lange

// TODO: This can probably be combined with the var global
/**
 * Methods that affect global behavior of MathWorkers.
 *
 * @namespace MathWorkers.Global
 */
MathWorkers.Global = {};

/**
 *  Data available globally only within the MathWorkers class
 *  @ignore
 */
var global = {};

// Globally scoped useful variables, defaults
global.workerPool = [];
global.nWorkers = 1;
global.myWorkerId = 0;

global.logLevel = 1;
/**
* Sets the MathWorkers log level:
* 1 = warnings and errors only
* 2 = verbose logging
* Default is 1.
*
* @param {!number} logLevel level to be set
* @memberof MathWorkers.Global
* @function setLogLevel
*/
MathWorkers.Global.setLogLevel = function(logLevel) {
    if (!MathWorkers.util.nullOrUndefined(logLevel)) {
        global.logLevel = logLevel;
    }
};

global.unrollLoops = false;
/**
 * Loop unrolling option:
 * If true, use loop unrolled versions of functions if available.
 * If false, do not.
 * Default is false.
 *
 * @param {!boolean} unroll option to be set
 * @memberof MathWorkers.Global
 * @function setUnrollLoops
 */
MathWorkers.setUnrollLoops = function(unroll) {
    MathWorkers.util.checkNullOrUndefined(unroll);
    global.unrollLoops = unroll;
};

/**
 * Creates the internal Web Worker pool, if Web Worker supported.
 *
 * @ignore
 */
global.createPool = function(nWorkersInput, workerScriptName) {
    MathWorkers.util.checkWebWorkerSupport();
	for (var i = 0; i < nWorkersInput; ++i) {
		var worker = new Worker(workerScriptName);
		worker.postMessage({handle: "_init", id: i, nWorkers: nWorkersInput,
            logLevel: global.logLevel, unrollLoops: global.unrollLoops});
		this.workerPool.push(worker);
        this.nWorkers = this.workerPool.length;
	}

	this.getWorker = function(workerId) {
		return this.workerPool[workerId];
	};
};

