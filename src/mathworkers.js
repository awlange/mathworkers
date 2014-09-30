//Built: Mon Sep 29 21:57:07 CDT 2014
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

util.getTime = function() {
	return new Date().getTime();
}

util.deltaTime = function(time) {
	return new Date().getTime() - time;
}


/**
 *  Custom event emitter
 */
function EventEmitter() {
    var events = {};

    this.on = function(name, callback) {
        log.debug("registering event: " + name);
        events[name] = [callback];
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
	var messageBuffer = [];
	var walltime = 0;
	var logLevel = logLevel || 2;
	var ready = false;
	log.setLevel("coord", logLevel);

	// Create the worker pool, which starts the workers
	pool.create(nWorkersInput, workerScriptName, logLevel);

	this.isReady = function() {
		return ready;
	}

	this.getBuffer = function() {
		return objectBuffer;
	}

	this.getMessages = function() {
		return messageBuffer;
	}

	this.getWallTime = function() {
		return walltime;
	}

	this.newVector = function(size) {
		return new MW.Vector(size);
	}

	this.newVectorFromArray = function(arr) {
		return MW.Vector.fromArray(arr);
	}

	this.newMatrix = function(nrows, ncols) {
		return new MW.Matrix(nrows, ncols);
	}

	this.newMatrixFromArray = function(arr) {
		return MW.Matrix.fromArray(arr);
	}

	this.trigger = function(tag) {
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			pool.getWorker(wk).postMessage({handle: "trigger", tag: tag});
		}
	}

	this.sendVectorToWorkers = function(vec, tag) {
		// Must make a copy of the vector for each worker for transferrable object message passing
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			var v = new Float64Array(vec.getArray());
			pool.getWorker(wk).postMessage({handle: "broadcastVector", tag: tag, 
				vec: v.buffer}, [v.buffer]);
		}
	}

	// Route the message appropriately for the Worker
 	var onmessageHandler = function(event) {
 		var data = event.data;
 		switch (data.handle) {
 			case "workerReady":
 				handleWorkerReady();
 				break;
 			case "textFromWorker":
 				handleTextFromWorker(data);
 				break;
 			case "vectorSendToCoordinator":
 				handleVectorSendToCoordinator(data);
 				break;
 			case "gatherVector":
 				handleGatherVector(data);
 				break;
  			case "vectorNorm":
 				handleVectorNorm(data);
 				break;
  			case "vectorSum":
 				handleVectorSum(data);
 				break;
 			case "matrixSendToCoordinator":
 				handleMatrixSendToCoordinator(data);
 				break;
 			default:
 				log.error("Invalid Coordinator handle: " + data.handle);
 		}
 	}

 	// Register the above onmessageHandler for each worker in the pool
 	// Also, initialize the message buffer with empty strings
 	for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
 		pool.getWorker(wk).onmessage = onmessageHandler;
 		messageBuffer.push("");
 	}

 	// Reduction function variables
 	var nWorkersReported = 0;
 	var tot = 0.0;
 	var gatherVector = {};

 	var handleWorkerReady = function() {
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
 			ready = true;
 			that.emit("ready");
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	}

 	var handleTextFromWorker = function(data) {
 		messageBuffer[data.id] = data.text;
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
 			that.emit(data.tag);
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	}

	var handleVectorSendToCoordinator = function(data) {
		objectBuffer = new MW.Vector();
		objectBuffer.setVector(new Float64Array(data.vectorBuffer));
		walltime = util.deltaTime(data.time);
		that.emit(data.tag);
	}

	var handleMatrixSendToCoordinator = function(data) {
		var tmp = [];
		for (var i = 0; i < data.nrows; ++i) {
			tmp.push(new Float64Array(data[i]));
		}
		objectBuffer = new MW.Matrix();
		objectBuffer.setMatrix(tmp);
		walltime = util.deltaTime(data.time);
		that.emit(data.tag);
	}

	var handleGatherVector = function(data) {
		// Reduce the vector part from each worker
		// Collect each worker's part into an array
		var id = data.id;
		gatherVector[id] = new Float64Array(data.vectorPart);
		tot += data.len;

		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// build the full vector and save to buffer
			objectBuffer = new MW.Vector();
			objectBuffer.setVector(buildVectorFromParts(gatherVector, tot));

			// walltime
			walltime = util.deltaTime(data.time);

			// emit and reset
			that.emit(data.tag);
			nWorkersReported = 0;
			tot = 0;
			gatherVector = {};
		}
	}

	var buildVectorFromParts = function(gatherVector, totalLength) {
		var vec = new Float64Array(totalLength);
		var offset = 0;
		for (var i = 0; i < pool.getNumWorkers(); ++i) {
			for (var j = 0; j < gatherVector[i].length; ++j) {
				vec[offset + j] = gatherVector[i][j];
			}
			offset += gatherVector[i].length;
		}
		return vec;
	}

	var handleVectorNorm = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// save result to buffer and emit to the browser-side coordinator
			objectBuffer = Math.sqrt(tot);
			that.emit(data.tag);

			// wall time
			walltime = util.deltaTime(data.time);

			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	}

	var handleVectorSum = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// save result to buffer and emit to the browser-side coordinator
			objectBuffer = tot;
			that.emit(data.tag);

			// wall time
			walltime = util.deltaTime(data.time);

			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
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
 	var objectBuffer = {};
 	var logLevel = 2;
 	var triggers = {};

 	this.getId = function() {
 		return id;
 	}

 	this.getNumWorkers = function() {
 		return nWorkers;
 	}

	this.getBuffer = function() {
		return objectBuffer;
	}

	this.newVector = function(size) {
		return new MW.Vector(size, id, nWorkers);
	}

	this.newVectorFromArray = function(arr) {
		return MW.Vector.fromArray(arr, id, nWorkers);
	}

	this.newMatrix = function(nrows, ncols) {
		return new MW.Matrix(nrows, ncols, id, nWorkers);
	}

	this.newMatrixFromArray = function(arr) {
		return MW.Matrix.fromArray(arr, id, nWorkers);
	}

 	this.sendText = function(tag, message) {
 		self.postMessage({handle: "textFromWorker", id: id, tag: tag, text: message});
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
			case "broadcastVector":
				handleBroadcastVector(data);
				break;
 			default:
 				log.error("Invalid MathWorker handle: " + data.handle);
 		}
 	}

 	// registers the callback for a trigger
 	this.on = function(tag, callback) {
        log.debug("registering trigger: " + tag);
        triggers[tag] = [callback];
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

 	var handleBroadcastVector = function(data) {
 		objectBuffer = MW.Vector.fromArray(new Float64Array(data.vec));
 		handleTrigger(data);
 	}
}
MW.Coordinator.prototype = new EventEmitter();


/**
 *  Vector class
 */
MW.Vector = function(size, mathWorkerId, nWorkersInput) {
	var that = this;
	var id = mathWorkerId || 0;
	var nWorkers = nWorkersInput || 1;
	var v = null;
	this.length = size;

	if (size !== undefined && size > 0) {
		v = new Float64Array(size);
	}

	this.get = function(i) {
		return v[i];
	}

	this.set = function(i, val) {
		v[i] = val;
	}

	this.getArray = function() {
		return v;
	}

	this.setVector = function(w) {
		v = w;
		that.length = w.length;
	}

	this.toString = function() {
		var str = "[";
		for (var i = 0; i < that.length - 1; ++i) {
			str += v[i] + ", ";
		}
		return str + v[that.length-1] + "]";
	}

	this.sendToCoordinator = function(tag) {
		// only id 0 does the sending actually
		if (id == 0) {
			var time = util.getTime();
			self.postMessage({handle: "vectorSendToCoordinator", tag: tag, time: time,
				vectorBuffer: v.buffer}, [v.buffer]);
		}
	}

	this.plus = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] + w.get(i));
		}
		return result;
	}

	this.minus = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] - w.get(i));
		}
		return result;
	}

	this.times = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] * w.get(i));
		}
		return result;
	}

	this.dividedBy = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] / w.get(i));
		}
		return result;
	}

	this.scale = function(alpha) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] * alpha);
		}
		return result;		
	}

	this.apply = function(fn) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, fn(v[i]));
		}
		return result;		
	}

	this.dot = function(w) {
		var tot = 0.0;
		for (var i = 0; i < that.length; ++i) {
			tot += v[i] * w.get(i);
		}
		return tot;
	}

	this.norm = function() {
		var result = 0.0;
		for (var i = 0.0; i < that.length; ++i) {
			result += v[i] * v[i];
		}
		return Math.sqrt(result);
	}

	this.sum = function() {
		var result = 0.0;
		for (var i = 0.0; i < that.length; ++i) {
			result += v[i];
		}
		return result;
	}

	this.wkPlus = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] + w.get(i);
		}
		self.postMessage({handle: "gatherVector", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkMinus = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] - w.get(i);
		}
		self.postMessage({handle: "gatherVector", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkTimes = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] * w.get(i);
		}
		self.postMessage({handle: "gatherVector", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkDividedBy = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] / w.get(i);
		}
		self.postMessage({handle: "gatherVector", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkScale = function(alpha, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] * alpha;
		}
		self.postMessage({handle: "gatherVector", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkApply = function(fn, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = fn(v[i]);
		}
		self.postMessage({handle: "gatherVector", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkNorm = function(tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * v[i];
		}
		self.postMessage({handle: "vectorNorm", tag: tag, time: time, tot: tot});
	}

	this.wkDot = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * w.get(i);
		}
		self.postMessage({handle: "vectorSum", tag: tag, time: time, tot: tot});
	}

	this.wkSum = function(tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i];
		}
		self.postMessage({handle: "vectorSum", tag: tag, time: time, tot: tot});
	}

	// vector-matrix multiply: v.A
	this.timesMatrix = function(A) {
		var w = new MW.Vector(A.ncols);
		for (var i = 0; i < A.ncols; ++i) {
			var tot = 0.0;
			for (var j = 0; j < that.length; ++j) {
				tot += v[j] * A.get(j, i);
			}
			w.set(i, tot);
		}
		return w;
	}

	// vector-matrix multiply: v.A
	this.wkTimesMatrix = function(A, tag) {
		var time = util.getTime();  // for timing
		var lb = util.loadBalance(A.ncols, nWorkers, id);
		var w = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			var tot = 0.0;
			for (var j = 0; j < that.length; ++j) {
				tot += v[j] * A.get(j, i);
			}
			w[offset++] = tot;
		}
		self.postMessage({handle: "gatherVector", tag: tag, id: id,
			time: time, len: w.length, vectorPart: w.buffer}, [w.buffer]);
	}
}

MW.Vector.fromArray = function(arr, mathWorkerId, nWorkersInput) {
	var vec = new MW.Vector(arr.length, mathWorkerId, nWorkersInput);
	for (var i = 0; i < arr.length; ++i) {
		vec.set(i, arr[i]);
	}
	return vec;
}


/**
 *  Matrix class
 */
MW.Matrix = function(nrows, ncols, mathWorkerId, nWorkersInput) {
	var that = this;
	var id = mathWorkerId || 0;
	var nWorkers = nWorkersInput || 1;
	this.nrows = nrows || 0;
	this.ncols = ncols || 0;

	var A = [];
	if (nrows > 0 && ncols > 0) {
		for (var r = 0; r < nrows; ++r) {
			A.push(new Float64Array(ncols));
		}
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

	this.getArray = function() {
		return A;
	}

	// B is array of Float64Arrays, like A is in the class Matrix
	this.setMatrix = function(B) {
		A = B;
		that.nrows = B.length;
		that.ncols = B[0].length;
	}

	this.toString = function() {
		var str = "";
		for (var i = 0; i < that.nrows; ++i) {
			var row = "[";
			for (var j = 0; j < that.ncols - 1; ++j) {
				row += A[i][j] + ", ";
			}
			str += row + A[i][that.ncols-1] + "]";
			if (i != that.nrows - 1) {
				str += "\n";
			}
		}
		return str;
	}

	this.sendToCoordinator = function(tag) {
		// only id 0 does the sending actually
		if (id == 0) {
			var time = util.getTime();  // for timing
			var matObject = {handle: "matrixSendToCoordinator", tag: tag, time: time, nrows: that.nrows};
			var matBufferList = [];
			for (var i = 0; i < that.nrows; ++i) {
				matObject[i] = A[i].buffer;
				matBufferList.push(A[i].buffer);
			}

			self.postMessage(matObject, matBufferList);
		}
	}

	// matrix-vector multiply: A.v
	this.timesVector = function(v) {
		var w = new MW.Vector(that.nrows);
		for (var i = 0; i < that.nrows; ++i) {
			var tot = 0.0;
			for (var j = 0; j < that.ncols; ++j) {
				tot += A[i][j] * v.get(j);
			}
			w.set(i, tot);
		}
		return w;
	}

	// matrix-vector multiply: A.v
	this.wkTimesVector = function(v, tag) {
		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var w = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			var tot = 0.0;
			for (var j = 0; j < that.ncols; ++j) {
				tot += A[i][j] * v.get(j);
			}
			w[offset++] = tot;
		}
		self.postMessage({handle: "gatherVector", tag: tag, id: id,
			len: w.length, vectorPart: w.buffer}, [w.buffer]);
	}
}

MW.Matrix.fromArray = function(arr, mathWorkerId, nWorkersInput) {
	var mat = new MW.Matrix(arr.length, arr[0].length, mathWorkerId, nWorkersInput);
	for (var i = 0; i < arr.length; ++i) {
		for (var j = 0; j < arr[i].length; ++j) {
			mat.set(i, j, arr[i][j]);
		}
	}
	return mat;
}



return MW;
}());