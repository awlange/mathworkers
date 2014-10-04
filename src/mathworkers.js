//Built: Sat Oct  4 11:29:25 CDT 2014
/**
 *  MathWorkers.js
 *
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
	};

	this.error = function(message) {
		if (level >= 1) {
			console.error("ERROR:" + name + ": " + message);
		}
	};

	this.info = function(message) {
		if (level >= 1) {
			console.info("INFO:" + name + ": " + message);
		}
	};

	this.warn = function(message) {
		if (level >= 2) {
			console.warn("WARN:" + name + ": " + message);
		}
	};

	this.debug = function(message) {
		if (level >= 3) {
			console.log("DEBUG:" + name + ": " + message);
		}
	};
};

var log = new Logger();


/**
 *  General internal utility functions
 */
var util = {};
util.loadBalance = function(n, nWorkers, id) {
	var div = Math.floor(n / nWorkers);
	var rem = n % nWorkers;

	// distribute remainder as evenly as possible
	var ifrom;
	var ito;
	if (id < rem) {
		ifrom = id * (div + 1);
		ito = ifrom + div + 1;
	} else {
		ifrom = id * div + rem;
		ito = ifrom + div;
	}

	return {ifrom: ifrom, ito: ito};
};


/**
 *  Custom event emitter
 */
function EventEmitter() {
    var events = {};

    this.on = function(name, callback) {
        log.debug("registering event: " + name);
        events[name] = [callback];
    };

    this.emit = function(name, args) {
        log.debug("emitting event: " + name);
        events[name] = events[name] || [];
        args = args || [];
        events[name].forEach( function(fn) {
            fn.call(this, args);
        });
    };
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
	};

	this.getPool = function() {
		return pool;
	};

	this.getWorker = function(workerId) {
		return pool[workerId];
	};
};



/**
 *  Coordinator for browser-side interface
 */
MW.Coordinator = function(nWorkersInput, workerScriptName, logLevel) {
	var that = this;
	var objectBuffer = {};
	var messageDataBuffer = [];
	var ready = false;

    logLevel = logLevel || 2;
	log.setLevel("coord", logLevel);

	// Create the worker pool, which starts the workers
	pool.create(nWorkersInput, workerScriptName, logLevel);

	this.isReady = function() {
		return ready;
	};

	this.getBuffer = function() {
		return objectBuffer;
	};

	this.getMessageDataList = function() {
		return messageDataBuffer;
	};

	this.newVector = function(size) {
		return new MW.Vector(size);
	};

	this.newVectorFromArray = function(arr) {
		return MW.Vector.fromArray(arr);
	};

	this.newMatrix = function(nrows, ncols) {
		return new MW.Matrix(nrows, ncols);
	};

	this.newMatrixFromArray = function(arr) {
		return MW.Matrix.fromArray(arr);
	};

	this.trigger = function(tag, args) {
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			pool.getWorker(wk).postMessage({handle: "trigger", tag: tag, args: args});
		}
	};

	this.sendDataToWorkers = function(dat, tag) {
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			pool.getWorker(wk).postMessage({handle: "broadcastData", tag: tag, data: dat});
		}
	};

	this.sendVectorToWorkers = function(vec, tag) {
		// Must make a copy of the vector for each worker for transferrable object message passing
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			var v = new Float64Array(vec.getArray());
			pool.getWorker(wk).postMessage({handle: "broadcastVector", tag: tag, 
				vec: v.buffer}, [v.buffer]);
		}
	};

	this.sendMatrixToWorkers = function(mat, tag) {
		// Must make a copy of each matrix row for each worker for transferrable object message passing
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			var matObject = {handle: "broadcastMatrix", tag: tag, nrows: mat.nrows};
			var matBufferList = [];
			for (var i = 0; i < mat.nrows; ++i) {
				var row = new Float64Array(mat.getRow(i));
				matObject[i] = row.buffer;
				matBufferList.push(row.buffer);
			}
			pool.getWorker(wk).postMessage(matObject, matBufferList);
		}
	};

	// Route the message appropriately for the Worker
 	var onmessageHandler = function(event) {
 		var data = event.data;
 		switch (data.handle) {
 			case "workerReady":
 				handleWorkerReady();
 				break;
 			case "sendData":
 				handleSendData(data);
 				break;
 			case "vectorSendToCoordinator":
 				handleVectorSendToCoordinator(data);
 				break;
 			case "gatherVector":
 				handleGatherVector(data);
 				break;
 			case "matrixSendToCoordinator":
 				handleMatrixSendToCoordinator(data);
 				break;
 			 case "gatherMatrix":
 				handleGatherMatrix(data);
 				break;
  			case "vectorNorm":
 				handleVectorNorm(data);
 				break;
  			case "vectorSum":
 				handleVectorSum(data);
 				break;
 			default:
 				log.error("Invalid Coordinator handle: " + data.handle);
 		}
 	};

 	// Register the above onmessageHandler for each worker in the pool
 	// Also, initialize the message data buffer with empty objects
 	for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
 		pool.getWorker(wk).onmessage = onmessageHandler;
 		messageDataBuffer.push({});
 	}

 	// Reduction function variables
 	var nWorkersReported = 0;
 	var tot = 0.0;
 	var gatherVector = {};
 	var gatherMatrix = {};

 	var handleWorkerReady = function() {
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
 			ready = true;
 			that.emit("ready");
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	};

 	var handleSendData = function(data) {
 		messageDataBuffer[data.id] = data.data;
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
 			that.emit(data.tag);
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	};

	var handleVectorSendToCoordinator = function(data) {
		objectBuffer = new MW.Vector();
		objectBuffer.setVector(new Float64Array(data.vectorBuffer));
		that.emit(data.tag);
	};

	var handleMatrixSendToCoordinator = function(data) {
		var tmp = [];
		for (var i = 0; i < data.nrows; ++i) {
			tmp.push(new Float64Array(data[i]));
		}
		objectBuffer = new MW.Matrix();
		objectBuffer.setMatrix(tmp);
		that.emit(data.tag);
	};

	var handleGatherVector = function(data) {
		// Reduce the vector parts from each worker
		var id = data.id;
		gatherVector[id] = new Float64Array(data.vectorPart);
		tot += data.len;

		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// build the full vector and save to buffer
			objectBuffer = new MW.Vector();
			objectBuffer.setVector(buildVectorFromParts(gatherVector, tot));
			if (data.rebroadcast) {
				that.sendVectorToWorkers(objectBuffer, data.tag);
			} else {
				// emit
				that.emit(data.tag);
			}
			// reset
			nWorkersReported = 0;
			tot = 0;
			gatherVector = {};
		}
	};

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
	};

	var handleGatherMatrix = function(data) {
		// Reduce the matrix rows from each worker
		var id = data.id;
		for (var i = 0; i < data.nrows; ++i) {
			gatherMatrix[data.offset + i] = new Float64Array(data[i]);
		}
		tot += data.nrows;

		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// build the full vector and save to buffer
			objectBuffer = new MW.Matrix();
			objectBuffer.setMatrix(buildMatrixFromParts(gatherMatrix, tot));
			if (data.rebroadcast) {
				that.sendMatrixToWorkers(objectBuffer, data.tag);
			} else {
				// emit
				that.emit(data.tag);
			}
			//reset
			nWorkersReported = 0;
			tot = 0;
			gatherMatrix = {};
		}
	};

	var buildMatrixFromParts = function(gatherMatrix, totalRows) {
		var result = [];
		for (var i = 0; i < totalRows; ++i) {
			result.push(gatherMatrix[i]);
		}
		return result;
	};

	var handleVectorNorm = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			objectBuffer = Math.sqrt(tot);
			if (data.rebroadcast) {
				// rebroadcast the result back to the workers
				that.sendDataToWorkers(objectBuffer, data.tag);
			} else {
				// save result to buffer and emit to the browser-side coordinator
				that.emit(data.tag);
			}

			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	};

	var handleVectorSum = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			objectBuffer = tot;
			if (data.rebroadcast) {
				// rebroadcast the result back to the workers
				that.sendDataToWorkers(objectBuffer, data.tag);
			} else {
				// save result to buffer and emit to the browser-side coordinator
				that.emit(data.tag);
			}
			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	};

};
MW.Coordinator.prototype = new EventEmitter();


/**
 *  MathWorker for worker-side interface
 */
MW.MathWorker = function() {
	var that = this;
 	var id;
 	var nWorkers;
 	var objectBuffer = {};
 	var triggers = {};

 	this.getId = function() {
 		return id;
 	};

 	this.getNumWorkers = function() {
 		return nWorkers;
 	};

	this.getBuffer = function() {
		return objectBuffer;
	};

	this.newVector = function(size) {
		return new MW.Vector(size, id, nWorkers);
	};

	this.newVectorFromArray = function(arr) {
		return MW.Vector.fromArray(arr, id, nWorkers);
	};

	this.newMatrix = function(nrows, ncols) {
		return new MW.Matrix(nrows, ncols, id, nWorkers);
	};

	this.newMatrixFromArray = function(arr) {
		return MW.Matrix.fromArray(arr, id, nWorkers);
	};

 	this.sendDataToCoordinator = function(data, tag) {
 		self.postMessage({handle: "sendData", id: id, tag: tag, data: data});
 	};

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
			case "broadcastData":
				handleBroadcastData(data);
				break;
			case "broadcastVector":
				handleBroadcastVector(data);
				break;
			case "broadcastMatrix":
				handleBroadcastMatrix(data);
				break;
 			default:
 				log.error("Invalid MathWorker handle: " + data.handle);
 		}
 	};

 	// registers the callback for a trigger
 	this.on = function(tag, callback) {
        log.debug("registering trigger: " + tag);
        triggers[tag] = [callback];
    };

 	var handleInit = function(data) {
 		id = data.id;
 		nWorkers = data.nWorkers;
 		log.setLevel("w" + id, data.logLevel);
 		log.debug("Initialized MathWorker: " + id + " of " + nWorkers + " workers.");
 		self.postMessage({handle: "workerReady"});
 	};

 	var handleTrigger = function(data, obj) {
		if (data.tag in triggers) {
			triggers[data.tag] = triggers[data.tag] || [];
			args = data.data || obj || [];
			triggers[data.tag].forEach( function(fn) {
				fn.call(this, args);
			});
		} else {
			log.error("Unregistered trigger tag: " + data.tag);
		}
 	};

 	var handleBroadcastData = function(data) {
 		objectBuffer = data.data;
 		handleTrigger(data);
 	};

 	var handleBroadcastVector = function(data) {
 		objectBuffer = MW.Vector.fromArray(new Float64Array(data.vec));
 		handleTrigger(data, objectBuffer);
 	};

 	var handleBroadcastMatrix = function(data) {
 		var tmp = [];
		for (var i = 0; i < data.nrows; ++i) {
			tmp.push(new Float64Array(data[i]));
		}
		objectBuffer = new MW.Matrix();
		objectBuffer.setMatrix(tmp);
 		handleTrigger(data, objectBuffer);
 	};
};
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
	};

	this.set = function(i, val) {
		v[i] = val;
	};

	this.getArray = function() {
		return v;
	};

	this.setVector = function(w) {
		v = w;
		that.length = w.length;
	};

	this.toString = function() {
		var str = "[";
		for (var i = 0; i < that.length - 1; ++i) {
			str += v[i] + ", ";
		}
		return str + v[that.length-1] + "]";
	};

	this.sendToCoordinator = function(tag) {
		// only id 0 does the sending actually
		if (id == 0) {
			self.postMessage({handle: "vectorSendToCoordinator", tag: tag,
				vectorBuffer: v.buffer}, [v.buffer]);
		}
	};

	this.plus = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] + w.get(i));
		}
		return result;
	};

	this.minus = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] - w.get(i));
		}
		return result;
	};

	this.times = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] * w.get(i));
		}
		return result;
	};

	this.dividedBy = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] / w.get(i));
		}
		return result;
	};

	this.scale = function(alpha) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] * alpha);
		}
		return result;		
	};

	this.apply = function(fn) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, fn(v[i]));
		}
		return result;		
	};

	this.dot = function(w) {
		var tot = 0.0;
		for (var i = 0; i < that.length; ++i) {
			tot += v[i] * w.get(i);
		}
		return tot;
	};

	this.norm = function() {
		var result = 0.0;
		for (var i = 0.0; i < that.length; ++i) {
			result += v[i] * v[i];
		}
		return Math.sqrt(result);
	};

	this.sum = function() {
		var result = 0.0;
		for (var i = 0.0; i < that.length; ++i) {
			result += v[i];
		}
		return result;
	};

	var gatherVector = function(vec, tag, rebroadcast) {
		self.postMessage({handle: "gatherVector", tag: tag, id: id, rebroadcast: rebroadcast,
			len: vec.length, vectorPart: vec.buffer}, [vec.buffer]);
	};

	this.wkPlus = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] + w.get(i);
		}
		gatherVector(x, tag, rebroadcast);
	};

	this.wkMinus = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] - w.get(i);
		}
		gatherVector(x, tag, rebroadcast);
	};

	this.wkTimes = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] * w.get(i);
		}
		gatherVector(x, tag, rebroadcast);
	};

	this.wkDividedBy = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] / w.get(i);
		}
		gatherVector(x, tag, rebroadcast);
	};

	this.wkScale = function(alpha, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] * alpha;
		}
		gatherVector(x, tag, rebroadcast);
	};

	this.wkApply = function(fn, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = fn(v[i]);
		}
		gatherVector(x, tag, rebroadcast);
	};

	this.wkNorm = function(tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * v[i];
		}
		self.postMessage({handle: "vectorNorm", tag: tag, rebroadcast: rebroadcast, tot: tot});
	};

	this.wkDot = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * w.get(i);
		}
		self.postMessage({handle: "vectorSum", tag: tag, rebroadcast: rebroadcast, tot: tot});
	};

	this.wkSum = function(tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i];
		}
		self.postMessage({handle: "vectorSum", tag: tag, tot: tot, rebroadcast: rebroadcast});
	};

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
	};

	// vector-matrix multiply: v.A
	this.wkTimesMatrix = function(A, tag, rebroadcast) {
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
		gatherVector(w, tag, rebroadcast);
	};
};

MW.Vector.fromArray = function(arr, mathWorkerId, nWorkersInput) {
	var vec = new MW.Vector(arr.length, mathWorkerId, nWorkersInput);
	for (var i = 0; i < arr.length; ++i) {
		vec.set(i, arr[i]);
	}
	return vec;
};


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
	};

	this.set = function(i, j, val) {
		A[i][j] = val;
	};

	this.getRow = function(i) {
		return A[i];
	};

	this.getArray = function() {
		return A;
	};

	// B is array of Float64Arrays, like A is in the class Matrix
	this.setMatrix = function(B) {
		A = B;
		that.nrows = B.length;
		that.ncols = B[0].length;
	};

	this.isSquare = function() {
		return that.nrows == that.ncols;
	};

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
	};

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
	};

	this.plus = function(B) {
		var C = new MW.Matrix(that.nrows, that.ncols);
		for (var i = 0; i < that.nrows; ++i) {
			for (var j = 0; j < that.ncols; ++j) {
				C.set(i, j, A[i][j] + B.get(i, j));
			}
		}
		return C;		
	};

	this.minus = function(B) {
		var C = new MW.Matrix(that.nrows, that.ncols);
		for (var i = 0; i < that.nrows; ++i) {
			for (var j = 0; j < that.ncols; ++j) {
				C.set(i, j, A[i][j] - B.get(i, j));
			}
		}
		return C;		
	};

	this.times = function(B) {
		var C = new MW.Matrix(that.nrows, that.ncols);
		for (var i = 0; i < that.nrows; ++i) {
			for (var j = 0; j < that.ncols; ++j) {
				C.set(i, j, A[i][j] * B.get(i, j));
			}
		}
		return C;		
	};

	this.dividedBy = function(B) {
		var C = new MW.Matrix(that.nrows, that.ncols);
		for (var i = 0; i < that.nrows; ++i) {
			for (var j = 0; j < that.ncols; ++j) {
				C.set(i, j, A[i][j] / B.get(i, j));
			}
		}
		return C;		
	};

	this.scale = function(alpha) {
		var C = new MW.Matrix(that.nrows, that.ncols);
		for (var i = 0; i < that.nrows; ++i) {
			for (var j = 0; j < that.ncols; ++j) {
				C.set(i, j, alpha * A[i][j]);
			}
		}
		return C;		
	};

	this.apply = function(fn) {
		var C = new MW.Matrix(that.nrows, that.ncols);
		for (var i = 0; i < that.nrows; ++i) {
			for (var j = 0; j < that.ncols; ++j) {
				C.set(i, j, fn(A[i][j]));
			}
		}
		return C;		
	};

	// Allocate new matrix and return to allow for arbitrary shaped matrices
	this.transpose = function() {
		var B = new MW.Matrix(that.ncols, that.nrows, that.id, that.nWorkers);
		for (var i = 0; i < that.nrows; ++i) {
			for (var j = 0; j < that.ncols; ++j) {
				B.set(j, i, A[i][j]);
			}
		}
		return B;
	};

	// Only works for square matrices
	this.transposeInPlace = function() {
		if (that.isSquare()) {
			for (var i = 0; i < that.nrows; ++i) {
				for (var j = i + 1; j < that.ncols; ++j) {
					var tmp = A[i][j];
					A[i][j] = A[j][i];
					A[j][i] = tmp;
				}
			}			
		}
		return that;
	};

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
	};

	// matrix-matrix multiply: A.B
	// TODO: if alpha is specified: alpha * A.B
	this.timesMatrix = function(B) {
		var C = new MW.Matrix(that.nrows, B.ncols, that.id, that.nWorkers);
		// Transpose B for better row-major memory access
		var Bt = B.transpose();
		for (var i = 0; i < that.nrows; ++i) {
			for (var j = 0; j < B.ncols; ++j) {
				var tot = 0.0;
				for (var k = 0; k < that.ncols; ++k) {
					tot += A[i][k] * Bt.get(j, k);
				}
				C.set(i, j, tot);
			}
		}
		return C;
	};

	var gatherVector = function(vec, tag, rebroadcast) {
		self.postMessage({handle: "gatherVector", tag: tag, id: id, rebroadcast: rebroadcast,
			len: vec.length, vectorPart: vec.buffer}, [vec.buffer]);
	};

	var gatherMatrix = function(mat, offset, tag, rebroadcast) {
		var matObject = {handle: "gatherMatrix", tag: tag, id: id, rebroadcast: rebroadcast,
						 nrows: mat.length, offset: offset};
		var matBufferList = [];
		for (var i = 0; i < mat.length; ++i) {
			matObject[i] = mat[i].buffer;
			matBufferList.push(mat[i].buffer);
		}
		self.postMessage(matObject, matBufferList);
	};

	this.wkPlus = function(B, tag, rebroadcast) {
		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var C = [];
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			C.push(new Float64Array(that.ncols));
			for (var j = 0; j < that.ncols; ++j) {
				C[offset][j] = A[i][j] + B.get(i, j);
			}
			++offset;
		}
		gatherMatrix(C, lb.ifrom, tag, rebroadcast);
	};

	this.wkMinus = function(B, tag, rebroadcast) {
		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var C = [];
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			C.push(new Float64Array(that.ncols));
			for (var j = 0; j < that.ncols; ++j) {
				C[offset][j] = A[i][j] - B.get(i, j);
			}
			++offset;
		}
		gatherMatrix(C, lb.ifrom, tag, rebroadcast);
	};

	this.wkTimes = function(B, tag, rebroadcast) {
		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var C = [];
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			C.push(new Float64Array(that.ncols));
			for (var j = 0; j < that.ncols; ++j) {
				C[offset][j] = A[i][j] * B.get(i, j);
			}
			++offset;
		}
		gatherMatrix(C, lb.ifrom, tag, rebroadcast);
	};

	this.wkDividedBy = function(B, tag, rebroadcast) {
		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var C = [];
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			C.push(new Float64Array(that.ncols));
			for (var j = 0; j < that.ncols; ++j) {
				C[offset][j] = A[i][j] / B.get(i, j);
			}
			++offset;
		}
		gatherMatrix(C, lb.ifrom, tag, rebroadcast);
	};

	this.wkScale = function(alpha, tag, rebroadcast) {
		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var C = [];
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			C.push(new Float64Array(that.ncols));
			for (var j = 0; j < that.ncols; ++j) {
				C[offset][j] = alpha * A[i][j];
			}
			++offset;
		}
		gatherMatrix(C, lb.ifrom, tag, rebroadcast);
	};

	this.wkApply = function(fn, tag, rebroadcast) {
		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var C = [];
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			C.push(new Float64Array(that.ncols));
			for (var j = 0; j < that.ncols; ++j) {
				C[offset][j] = fn(A[i][j]);
			}
			++offset;
		}
		gatherMatrix(C, lb.ifrom, tag, rebroadcast);
	};

	// matrix-vector multiply: A.v
	this.wkTimesVector = function(v, tag, rebroadcast) {
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
		gatherVector(w, tag, rebroadcast);
	};

	// C = A.B
	this.wkTimesMatrix = function(B, tag, rebroadcast) {
		// Transpose B for better row-major memory access
		// If square, save on memory by doing an in-place transpose
		var Bt = B.isSquare() ? B.transposeInPlace() : B.transpose();

		var lb = util.loadBalance(that.nrows, nWorkers, id);
		var C = [];
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			C.push(new Float64Array(B.ncols));
			for (var j = 0; j < B.ncols; ++j) {
				var tot = 0.0;
				for (var k = 0; k < that.ncols; ++k) {
					tot += A[i][k] * Bt.get(j, k);
				}
				C[offset][j] = tot;
			}
			++offset;
		}

		// restore B
		if (B.isSquare) {
			B.transposeInPlace();
		}

		gatherMatrix(C, lb.ifrom, tag, rebroadcast);
	};
};

MW.Matrix.fromArray = function(arr, mathWorkerId, nWorkersInput) {
	var mat = new MW.Matrix(arr.length, arr[0].length, mathWorkerId, nWorkersInput);
	for (var i = 0; i < arr.length; ++i) {
		for (var j = 0; j < arr[i].length; ++j) {
			mat.set(i, j, arr[i][j]);
		}
	}
	return mat;
};



return MW;
}());