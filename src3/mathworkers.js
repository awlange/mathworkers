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
 *  MathWorker Pool 
 *  Does this need to be exposed to the web browser? I think not. Only coordindator, yes?
 */
// MW.Pool = function(nWorkers, workerScriptName) {
var pool = {};
pool.create = function(nWorkersInput, workerScriptName) {

	var pool = [];
	for (var i = 0; i < nWorkersInput; ++i) {
		var worker = new Worker(workerScriptName);
		worker.postMessage({handle: "init", id: i, nWorkers: nWorkersInput});
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
 *  Logging controller
 *
 *  levels:
 *  < 1 = no printing
 *  1   = error + info 
 *  2   = error + info + warning (the default level)
 *  > 2 = error + info + warning + debug
 */
Logger = function() {
	var level = 2;

	this.setLevel = function(val) {
		if (val !== undefined && val !== null) {
			level = val;
		}
	}

	this.error = function(message) {
		if (level >= 1) {
			console.log("ERROR: " + message);
		}
	}

	this.info = function(message) {
		if (level >= 1) {
			console.log("INFO: " + message);
		}
	}

	this.warn = function(message) {
		if (level >= 2) {
			console.log("WARN: " + message);
		}
	}

	this.debug = function(message) {
		if (level >= 3) {
			console.log("DEBUG: " + message);
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
 *  MathWorker for worker-side coding
 */
MW.MathWorker = function(logLevel) {
	var that = this;
 	var id;
 	var nWorkers;
 	var triggers = {};

 	log.setLevel(logLevel);

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
				if (data.tag in triggers) {
					triggers[data.tag] = triggers[data.tag] || [];
					triggers[data.tag].forEach( function(fn) {
						fn.call(this);
					});
				} else {
					log.error("Unregistered trigger tag: " + data.tag);
				}
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
 		log.info("Initialized MathWorker: " + id + " of " + nWorkers + " workers.");
 		self.postMessage({handle: "workerReady"});
 	}
}


/**
 *  Coordinator for browser-side coding
 */
MW.Coordinator = function(nWorkersInput, workerScriptName, logLevel) {
	var that = this;
	var objectBuffer = {};

	log.setLevel(logLevel);

	this.getBuffer = function() {
		return objectBuffer;
	}

	this.trigger = function(tag) {
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			pool.getWorker(wk).postMessage({handle: "trigger", tag: tag});
		}
	}

	// Create pool after all the above
	pool.create(nWorkersInput, workerScriptName);

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
 			default:
 				log.error("Invalid Coordinator handle: " + data.handle);
 		}
 	}

 	// Register the above onmessage switches for each worker in the pool
 	for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
 		pool.getWorker(wk).onmessage = onmessageHandler;
 	}

 	// Reduction function variables
 	var nWorkersReported = 0;
 	var dot = 0.0;

 	var handleWorkerReady = function() {
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
 			that.emit("ready");
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	} 

	var handleVectorDot = function(data) {
		dot += data.dot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// save result to buffer and emit to the browser-side coordinator
			objectBuffer = dot;
			that.emit(data.tag);
			// reset for next message
			nWorkersReported = 0;
			dot = 0.0;
		}
	}

	var handleVectorSendToCoordinator = function(data) {
		objectBuffer = data.vectorBuffer;
		that.emit(data.tag);
	}
}
MW.Coordinator.prototype = new EventEmitter();

/**
 *  Vector class
 */
MW.Vector = function(size, mathWorkerId, nWorkersInput) {
	var that = this;
	var id = mathWorkerId;
	var nWorkers = nWorkersInput;
	var v = new Float64Array(size);

	this.length = size;

	this.get = function(i) {
		return v[i];
	}

	this.set = function(i, val) {
		v[i] = val;
	}

	this.getArray = function() {
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
		var obj = util.loadBalance(size, nWorkers, id);
		var tot = 0.0;
		for (var i = obj.ifrom; i < obj.ito; ++i) {
			tot += v[i] * w.get(i);
		}
		self.postMessage({handle: "vectorDot", tag: tag, dot: tot});
	}
}

return MW;
}());