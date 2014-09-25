/**
 *  MathWorkers.js 
 *  A JavaScript math library that use WebWorkers for parallelization
 *
 *  Adrian W. Lange, 2014
 */
var MathWorkers = (function() {

// Global MathWorkers variables
var MW = {};

/**
 *  Logging controller
 *
 *  levels:
 *  < 1 = no printing
 *  1   = error + info 
 *  2   = error + info + warning (the default level)
 *  > 2 = error + info + warning + debug
 */
Logger = function() {
	var name = "";
	var level = 2;

	this.setLevel = function(nameInput, val) {
		if (val !== undefined && val !== null) {
			name = nameInput;
			level = val;
		}
	}

	this.error = function(message) {
		if (level >= 1) {
			console.error("ERROR:" + name + ": " + message);
		}
	}

	this.info = function(message) {
		if (level >= 1) {
			console.info("INFO:" + name + ": " + message);
		}
	}

	this.warn = function(message) {
		if (level >= 2) {
			console.warn("WARN:" + name + ": " + message);
		}
	}

	this.debug = function(message) {
		if (level >= 3) {
			console.log("DEBUG:" + name + ": " + message);
		}
	}
}
var log = new Logger();


/**
 *  General internal utility functions
 */
var util = {}
util.loadBalance = function(n, nWorkers, id) {
	var div = Math.floor(n / nWorkers);
	var rem = n % nWorkers;
	var ifrom = id * div;
	var ito = (id + 1) * div;
	if (id == nWorkers-1) {
		ito += rem;  // simple minded way for now
	}
	return {ifrom: ifrom, ito: ito};
}


/**
 *  Custom event emitter
 */
function EventEmitter() {
    var events = {};

    this.on = function(name, callback) {
        log.debug("registering event: " + name);
        events[name] = events[name] || [];
        events[name].push(callback);
    }

    this.emit = function(name, args) {
        log.debug("emitting event: " + name);
        events[name] = events[name] || [];
        args = args || [];
        events[name].forEach( function(fn) {
        	fn.call(this, args);
        });
    }
}


/**
 *  MathWorker Pool 
 *  Does this need to be exposed to the web browser? I think not. Only coordindator, yes?
 */
// MW.Pool = function(nWorkers, workerScriptName) {
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


/**
 *  Coordinator for browser-side interface
 */
MW.Coordinator = function(nWorkersInput, workerScriptName, logLevel) {
	var that = this;
	var objectBuffer = {};
	var logLevel = logLevel || 2;
	log.setLevel("coord", logLevel);

	// Create the worker pool, which starts the workers
	pool.create(nWorkersInput, workerScriptName, logLevel);

	this.getBuffer = function() {
		return objectBuffer;
	}

	this.trigger = function(tag) {
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			pool.getWorker(wk).postMessage({handle: "trigger", tag: tag});
		}
	}

	// Route the message appropriately for the Worker
 	var onmessageHandler = function(event) {
 		var data = event.data;
 		switch (data.handle) {
 			case "workerReady":
 				handleWorkerReady();
 				break;
 			case "vectorSendToCoordinator":
 				handleVectorSendToCoordinator(data);
 				break;
 			case "vectorDot":
 				handleVectorDot(data);
 				break;
 			case "matrixSendToCoordinator":
 				handleMatrixSendToCoordinator(data);
 				break;
 			case "matrixVectorProduct":
 				handleMatrixVectorProduct(data);
 				break;
 			default:
 				log.error("Invalid Coordinator handle: " + data.handle);
 		}
 	}

 	// Register the above onmessageHandler for each worker in the pool
 	for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
 		pool.getWorker(wk).onmessage = onmessageHandler;
 	}

 	// Reduction function variables
 	var nWorkersReported = 0;
 	var tot = 0.0;

 	var handleWorkerReady = function() {
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
 			that.emit("ready");
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	} 

	var handleVectorDot = function(data) {
		tot += data.dot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// save result to buffer and emit to the browser-side coordinator
			objectBuffer = tot;
			that.emit(data.tag);
			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	}

	// TODO: these should probably return Matrix and Vector objects
	var handleVectorSendToCoordinator = function(data) {
		objectBuffer = new Float64Array(data.vectorBuffer);
		that.emit(data.tag);
	}

	var handleMatrixSendToCoordinator = function(data) {
		objectBuffer = [];
		for (var i = 0; i < data.nrows; ++i) {
			objectBuffer.push(new Float64Array(data[i]));
		}
		that.emit(data.tag);
	}

	var vectorParts = {};
	var handleMatrixVectorProduct = function(data) {
		// Reduce the vector part from each worker
		// Collect each worker's part into an array
		var id = data.id;
		vectorParts[id] = [];
		vectorParts[id].push(new Float64Array(data.vectorPart));
		tot += data.len;

		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// build the full vector and save to buffer
			var vec = new Float64Array(tot);
			var offset = 0;
			for (var i = 0; i < pool.getNumWorkers(); ++i) {
				var part = vectorParts[i];
				for (var j = 0; j < part.length; ++j) {
					vec[offset + j] = part[j];
				}
				offset += part.length;
			}
			objectBuffer = vec;

			// emit and reset
			that.emit(data.tag);
			nWorkersReported = 0;
			tot = 0;
			vectorParts = {};
		}
	}
}
MW.Coordinator.prototype = new EventEmitter();


/**
 *  MathWorker for worker-side interface
 */
MW.MathWorker = function() {
	var that = this;
 	var id;
 	var nWorkers;
 	var logLevel = 2;
 	var triggers = {};

 	this.getId = function() {
 		return id;
 	}

 	this.getNumWorkers = function() {
 		return nWorkers;
 	}

 	// Route the message appropriately for the Worker
	self.onmessage = function(event) {
		var data = event.data;
		switch (data.handle) {
			case "init":
				handleInit(data);
				break;
			case "trigger":
				handleTrigger(data);
				break;
 			default:
 				log.error("Invalid MathWorker handle: " + data.handle);
 		}
 	}

 	// registers the callback for a trigger
 	this.on = function(tag, callback) {
        log.debug("registering trigger: " + tag);
        triggers[tag] = triggers[tag] || [];
        triggers[tag].push(callback);
    }

 	var handleInit = function(data) {
 		id = data.id;
 		nWorkers = data.nWorkers;
 		log.setLevel("w" + id, data.logLevel);
 		log.debug("Initialized MathWorker: " + id + " of " + nWorkers + " workers.");
 		self.postMessage({handle: "workerReady"});
 	}

 	var handleTrigger = function(data) {
		if (data.tag in triggers) {
			triggers[data.tag] = triggers[data.tag] || [];
			triggers[data.tag].forEach( function(fn) {
				fn.call(this);
			});
		} else {
			log.error("Unregistered trigger tag: " + data.tag);
		}
 	}
}


/**
 *  Vector class
 */
MW.Vector = function(size, mathWorkerId, nWorkersInput) {
	var that = this;
	var id = mathWorkerId || 0;
	var nWorkers = nWorkersInput || 1;
	var v = new Float64Array(size);

	this.length = size;

	this.get = function(i) {
		return v[i];
	}

	this.set = function(i, val) {
		v[i] = val;
	}

	this.getVector = function() {
		return v;
	}

	this.sendToCoordinator = function(tag) {
		// only id 0 does the sending actually
		if (id == 0) {
			self.postMessage({handle: "vectorSendToCoordinator", tag: tag,
				vectorBuffer: v.buffer}, [v.buffer]);
		}
	}

	this.dot = function(w, tag) {
		var lb = util.loadBalance(size, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * w.get(i);
		}
		self.postMessage({handle: "vectorDot", tag: tag, dot: tot});
	}
}

/**
 *  Matrix class
 */
MW.Matrix = function(nrows, ncols, mathWorkerId, nWorkersInput) {
	var that = this;
	var id = mathWorkerId;
	var nWorkers = nWorkersInput;
	this.nrows = nrows;
	this.ncols = ncols;

	var A = [];
	for (var r = 0; r < nrows; ++r) {
		A.push(new Float64Array(ncols));
	}

	this.get = function(i, j) {
		return A[i][j];
	}

	this.set = function(i, j, val) {
		A[i][j] = val;
	}

	this.getRow = function(i) {
		return A[i];
	}

	this.getMatrix = function() {
		return A;
	}

	this.sendToCoordinator = function(tag) {
		// only id 0 does the sending actually
		if (id == 0) {
			var matObject = {handle: "matrixSendToCoordinator", tag: tag, nrows: that.nrows};
			var matBufferList = [];
			for (var i = 0; i < that.nrows; ++i) {
				matObject[i] = A[i].buffer;
				matBufferList.push(A[i].buffer);
			}

			self.postMessage(matObject, matBufferList);
		}
	}

	this.timesVector = function(v, tag) {
		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var w = new Float64Array(lb.ito - lb.ifrom);
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			var tot = 0.0;
			for (var j = 0; j < that.ncols; ++j) {
				tot += A[i][j] * v.get(j);
			}
			w[i] = tot;
		}
		self.postMessage({handle: "matrixVectorProduct", tag: tag, id: id,
			len: w.length, vectorPart: w.buffer}, [w.buffer]);
	}
}


return MW;
}());