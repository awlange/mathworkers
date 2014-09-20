/**
 *  Thread pool class to be initialized at start of program
 */
var threadPool = function() {};

MW.ThreadPool = function(nWorkers) {
	var that = this;
	this.workers = [];

	for (var i = 0; i < nWorkers; ++i) {
		var wk = new Worker(util.workerScript);
		this.workers.push(wk);
		console.log("created worker: " + i);
	}

	this.getWorkers = function() {
		return that.workers;
	}

	this.getWorker = function(i) {
		return that.workers[i];
	}

	threadPool = this;
};
