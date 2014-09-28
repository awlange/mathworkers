
/**
 *  MathWorker Pool 
 *  Does this need to be exposed to the web browser? I think not. Only coordindator, yes?
 */
var pool = {};
pool.create = function(nWorkersInput, workerScriptName, logLevel) {

	var pool = [];
	for (var i = 0; i < nWorkersInput; ++i) {
		var worker = new Worker(workerScriptName);
		worker.postMessage({handle: "init", id: i, 
			nWorkers: nWorkersInput, logLevel: logLevel});
		pool.push(worker);
	}

	this.getNumWorkers = function() {
		return pool.length;
	}

	this.getPool = function() {
		return pool;
	}

	this.getWorker = function(workerId) {
		return pool[workerId];
	}
}

