//Built: Tue Oct  7 23:10:54 CDT 2014
/**
 *  MathWorkers.js
 *
 *  A JavaScript math library that uses WebWorkers for parallelization
 *
 *  https://github.com/awlange/mathworkers
 *
 *  Copyright 2014 Adrian W. Lange
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
var MathWorkers = (function() {

// Global MathWorkers variables
var MW = {};

// Copyright 2014 Adrian W. Lange

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
	var level = 3;

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

// Copyright 2014 Adrian W. Lange

/**
 *  General internal utility functions
 */
var util = {};
util.loadBalance = function(n) {
    var id = pool.myWorkerId;
	var div = Math.floor(n / pool.nWorkers);
	var rem = n % pool.nWorkers;

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
 *  Verify that x is neither null or undefined.
 *  Throws Error if not.
 */
util.checkNotNullOrUndefined = function(x) {
    if (x === undefined || x === null) {
        throw new TypeError("Undefined or null variable.");
    }
};

/**
 *  Verify that x is a Number and not null or undefined
 */
util.checkNumber = function(x) {
    util.checkNotNullOrUndefined(x);
    if (typeof x != 'number') {
        throw new TypeError("Expected type Number but is type " + typeof x);
    }
};

/**
 *  Verify that x is a Function and not null or undefined
 */
util.checkFunction = function(x) {
    util.checkNotNullOrUndefined(x);
    if (typeof x != 'function') {
        throw new TypeError("Expected type Function but is type " + typeof x);
    }
};

/**
 *  Verify that x is an Array or Float64Array and not null or undefined
 */
util.checkArray = function(x) {
    util.checkNotNullOrUndefined(x);
    if (!(x instanceof Array || x instanceof Float64Array)) {
        throw new TypeError("Expected type Array but is type " + typeof x);
    }
};

/**
 *  Verify that x is a Float64Array and not null or undefined
 */
util.checkFloat64Array = function(x) {
    util.checkNotNullOrUndefined(x);
    if (!(x instanceof Float64Array)) {
        throw new TypeError("Expected type Float64Array but is type " + typeof x);
    }
};

// Copyright 2014 Adrian W. Lange

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

// Copyright 2014 Adrian W. Lange

/**
 *  Coordinator for browser-side interface
 */
MW.Coordinator = function(nWorkersInput, workerScriptName, logLevel) {
	var that = this;
	var objectBuffer = {};
	var messageDataBuffer = [];
	this.ready = false;

    logLevel = logLevel || 2;
	log.setLevel("coord", logLevel);

	// Create the worker pool, which starts the workers
	pool.create(nWorkersInput, workerScriptName, logLevel);

	this.getBuffer = function() {
		return objectBuffer;
	};

	this.getMessageDataList = function() {
		return messageDataBuffer;
	};

	this.trigger = function(tag, args) {
		for (var wk = 0; wk < pool.nWorkers; ++wk) {
			pool.getWorker(wk).postMessage({handle: "_trigger", tag: tag, args: args});
		}
	};

	this.sendDataToWorkers = function(dat, tag) {
		for (var wk = 0; wk < pool.nWorkers; ++wk) {
			pool.getWorker(wk).postMessage({handle: "_broadcastData", tag: tag, data: dat});
		}
	};

	this.sendVectorToWorkers = function(vec, tag) {
		// Must make a copy of the vector for each worker for transferable object message passing
		for (var wk = 0; wk < pool.nWorkers; ++wk) {
			var v = new Float64Array(vec.array);
			pool.getWorker(wk).postMessage({handle: "_broadcastVector", tag: tag,
				vec: v.buffer}, [v.buffer]);
		}
	};

	this.sendMatrixToWorkers = function(mat, tag) {
		// Must make a copy of each matrix row for each worker for transferable object message passing
		for (var wk = 0; wk < pool.nWorkers; ++wk) {
			var matObject = {handle: "_broadcastMatrix", tag: tag, nrows: mat.nrows};
			var matBufferList = [];
			for (var i = 0; i < mat.nrows; ++i) {
				var row = new Float64Array(mat.array[i]);
				matObject[i] = row.buffer;
				matBufferList.push(row.buffer);
			}
			pool.getWorker(wk).postMessage(matObject, matBufferList);
		}
	};

    // Convenience on ready to hide the handle
    this.onReady = function(callBack) {
        this.on("_ready", callBack);
    };

	// Route the message appropriately for the Worker
 	var onmessageHandler = function(event) {
 		var data = event.data;
 		switch (data.handle) {
 			case "_workerReady":
 				handleWorkerReady();
 				break;
 			case "_sendData":
 				handleSendData(data);
 				break;
 			case "_vectorSendToCoordinator":
 				handleVectorSendToCoordinator(data);
 				break;
 			case "_gatherVector":
 				handleGatherVector(data);
 				break;
 			case "_matrixSendToCoordinator":
 				handleMatrixSendToCoordinator(data);
 				break;
 			 case "_gatherMatrix":
 				handleGatherMatrix(data);
 				break;
  			case "_vectorNorm":
 				handleVectorNorm(data);
 				break;
  			case "_vectorSum":
 				handleVectorSum(data);
 				break;
 			default:
 				log.error("Invalid Coordinator handle: " + data.handle);
 		}
 	};

 	// Register the above onmessageHandler for each worker in the pool
 	// Also, initialize the message data buffer with empty objects
 	for (var wk = 0; wk < pool.nWorkers; ++wk) {
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
 		if (nWorkersReported == pool.nWorkers) {
 			that.ready = true;
 			that.emit("_ready");
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	};

 	var handleSendData = function(data) {
 		messageDataBuffer[data.id] = data.data;
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.nWorkers) {
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
		if (nWorkersReported == pool.nWorkers) {
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
		for (var i = 0; i < pool.nWorkers; ++i) {
			for (var j = 0; j < gatherVector[i].length; ++j) {
				vec[offset + j] = gatherVector[i][j];
			}
			offset += gatherVector[i].length;
		}
		return vec;
	};

	var handleGatherMatrix = function(data) {
		// Reduce the matrix rows from each worker
		for (var i = 0; i < data.nrows; ++i) {
			gatherMatrix[data.offset + i] = new Float64Array(data[i]);
		}
		tot += data.nrows;

		nWorkersReported += 1;
		if (nWorkersReported == pool.nWorkers) {
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
		if (nWorkersReported == pool.nWorkers) {
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
		if (nWorkersReported == pool.nWorkers) {
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

// Copyright 2014 Adrian W. Lange

/**
 *  MathWorker for worker-side interface
 */
MW.MathWorker = function() {
 	var objectBuffer = {};
 	var triggers = {};

 	this.getId = function() {
 		return pool.myWorkerId;
 	};

 	this.getNumWorkers = function() {
 		return pool.nWorkers;
 	};

	this.getBuffer = function() {
		return objectBuffer;
	};

 	this.sendDataToCoordinator = function(data, tag) {
 		self.postMessage({handle: "_sendData", id: pool.myWorkerId, tag: tag, data: data});
 	};

    this.sendVectorToCoordinator = function(vec, tag) {
        // only id 0 does the sending actually
        if (pool.myWorkerId == 0) {
            self.postMessage({handle: "_vectorSendToCoordinator", tag: tag,
                vectorBuffer: vec.array.buffer}, [vec.array.buffer]);
        }
    };

    this.sendMatrixToCoordinator = function(mat, tag) {
        // only id 0 does the sending actually
        if (id == 0) {
            var matObject = {handle: "_matrixSendToCoordinator", tag: tag, nrows: mat.nrows};
            var matBufferList = [];
            for (var i = 0; i < mat.nrows; ++i) {
                matObject[i] = mat.array[i].buffer;
                matBufferList.push(mat.array[i].buffer);
            }
            self.postMessage(matObject, matBufferList);
        }
    };

 	// Route the message appropriately for the Worker
	self.onmessage = function(event) {
		var data = event.data;
		switch (data.handle) {
			case "_init":
				handleInit(data);
				break;
			case "_trigger":
				handleTrigger(data);
				break;
			case "_broadcastData":
				handleBroadcastData(data);
				break;
			case "_broadcastVector":
				handleBroadcastVector(data);
				break;
			case "_broadcastMatrix":
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
        pool.myWorkerId = data.id;
        pool.nWorkers = data.nWorkers;
 		log.setLevel("w" + pool.myWorkerId, data.logLevel);
 		log.debug("Initialized MathWorker: " + pool.myWorkerId + " of " + pool.nWorkers + " workers.");
 		self.postMessage({handle: "_workerReady"});
 	};

 	var handleTrigger = function(data, obj) {
		if (triggers[data.tag]) {
			triggers[data.tag] = triggers[data.tag] || [];
			var args = data.data || obj || [];
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
MW.MathWorker.prototype = new EventEmitter();


/**
 * MathWorker static-like functions
 */
MW.MathWorker.gatherVector = function(vec, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_gatherVector", tag: tag, id: pool.myWorkerId, rebroadcast: rebroadcast,
        len: vec.length, vectorPart: vec.buffer}, [vec.buffer]);
};

MW.MathWorker.gatherMatrix = function(mat, offset, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    var matObject = {handle: "_gatherMatrix", tag: tag, id: pool.myWorkerId, rebroadcast: rebroadcast,
        nrows: mat.length, offset: offset};
    var matBufferList = [];
    for (var i = 0; i < mat.length; ++i) {
        matObject[i] = mat[i].buffer;
        matBufferList.push(mat[i].buffer);
    }
    self.postMessage(matObject, matBufferList);
};

MW.MathWorker.reduceVectorNorm = function(tot, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_vectorNorm", tag: tag, rebroadcast: rebroadcast, tot: tot});
};

MW.MathWorker.reduceVectorSum = function(tot, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_vectorSum", tag: tag, rebroadcast: rebroadcast, tot: tot});
};


// Copyright 2014 Adrian W. Lange

/**
 *  Vector class
 *
 *  A wrapper around an array
 */
MW.Vector = function(size) {
    this.array = null;
    this.length = size || 0;
    if (size > 0) {
        this.array = new Float64Array(size);
    }
};

// Deep copy the array
MW.Vector.fromArray = function(arr) {
    util.checkArray(arr);
    var vec = new MW.Vector(arr.length);
    for (var i = 0; i < arr.length; ++i) {
        vec.array[i] = arr[i];
    }
    return vec;
};

MW.Vector.prototype.setVector = function(arr) {
    util.checkFloat64Array(arr);
    this.array = arr;
    this.length = arr.length;
};

MW.Vector.prototype.toString = function() {
    var str = "[";
    for (var i = 0; i < this.length - 1; ++i) {
        str += this.array[i] + ", ";
    }
    return str + this.array[this.length-1] + "]";
};

MW.Vector.prototype.plus = function(w) {
    checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] + w.array[i];
    }
    return result;
};

MW.Vector.prototype.minus = function(w) {
    checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] - w.array[i];
    }
    return result;
};

MW.Vector.prototype.timesElementwise = function(w) {
    checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] * w.array[i];
    }
    return result;
};

MW.Vector.prototype.divide = function(w) {
    checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] / w.array[i];
    }
    return result;
};

MW.Vector.prototype.scale = function(alpha) {
    util.checkNumber(alpha);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] * alpha;
    }
    return result;
};

MW.Vector.prototype.apply = function(fn) {
    util.checkFunction(fn);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = fn(this.array[i]);
    }
    return result;
};

MW.Vector.prototype.dot = function(w) {
    checkVectors(this, w);
    var tot = 0.0;
    for (var i = 0; i < this.length; ++i) {
        tot += this.array[i] * w.array[i];
    }
    return tot;
};

MW.Vector.prototype.norm = function() {
    var result = 0.0;
    for (var i = 0.0; i < this.length; ++i) {
        result += this.array[i] * this.array[i];
    }
    return Math.sqrt(result);
};

MW.Vector.prototype.sum = function() {
    var result = 0.0;
    for (var i = 0.0; i < this.length; ++i) {
        result += this.array[i];
    }
    return result;
};

// vector-matrix multiply: v.A
MW.Vector.prototype.timesMatrix = function(A) {
    checkVectorMatrix(this, A);
    var w = new MW.Vector(A.ncols);
    for (var i = 0; i < A.ncols; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.length; ++j) {
            tot += this.array[j] * A.array[j][i];
        }
        w.array[i] = tot;
    }
    return w;
};

MW.Vector.prototype.wkPlus = function(w, tag, rebroadcast) {
    checkVectors(this, w);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] + w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkMinus = function(w, tag, rebroadcast) {
    checkVectors(this, w);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] - w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkTimes = function(w, tag, rebroadcast) {
    checkVectors(this, w);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkDividedBy = function(w, tag, rebroadcast) {
    checkVectors(this, w);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] / w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkScale = function(alpha, tag, rebroadcast) {
    util.checkNumber(alpha);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * alpha;
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkApply = function(fn, tag, rebroadcast) {
    util.checkFunction(fn);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = fn(this.array[i]);
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkNorm = function(tag, rebroadcast) {
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i] * this.array[i];
    }
    MW.MathWorker.reduceVectorNorm(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkDot = function(w, tag, rebroadcast) {
    checkVectors(this, w);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i] * w.array[i];
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkSum = function(tag, rebroadcast) {
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i];
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

// vector-matrix multiply: v.A
MW.Vector.prototype.wkTimesMatrix = function(A, tag, rebroadcast) {
    checkVectorMatrix(this, A);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(A.ncols);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.length; ++j) {
            tot += this.array[j] * A.array[j][i];
        }
        w[offset++] = tot;
    }
    MW.MathWorker.gatherVector(w, tag, rebroadcast);
};


/**
 *  Vector helper functions
 */

/**
 *  Verify that v is a Vector and is not null or undefined
 */
function checkVector(v) {
    util.checkNotNullOrUndefined(v);
    if (!(v instanceof Vector)) {
        throw new TypeError("Expected type Vector but is not.");
    }
}

/**
 *  Verify that Vectors v and w are equal length and not null or undefined
 */
function checkVectors(v, w) {
    checkVector(v);
    checkVector(w);
    if (v.length !== w.length) {
        throw new Error("Vectors have unequal lengths.");
    }
}

/**
 *  Verify that Vector v and Matrix A are compatible for vector-matrix products
 *  and are both not null or undefined
 */
function checkVectorMatrix(v, A) {
    checkVector(v);
    checkMatrix(A);
    if (v.length !== A.nrows) {
        throw new Error("Vector length and number Matrix rows are unequal.");
    }
}


// Copyright 2014 Adrian W. Lange

/**
 *  Matrix class
 */
MW.Matrix = function(nrows, ncols) {
    this.array = [];
    this.nrows = nrows || 0;
    this.ncols = ncols || 0;

    if (nrows > 0 && ncols > 0) {
        for (var r = 0; r < nrows; ++r) {
            this.array.push(new Float64Array(ncols));
        }
    }
};

// Deep copy the array
MW.Matrix.fromArray = function(arr) {
    util.checkArray(arr);
    var mat = new MW.Matrix(arr.length, arr[0].length);
    for (var i = 0; i < arr.length; ++i) {
        for (var j = 0; j < arr[i].length; ++j) {
            mat.array[i][j] = arr[i][j];
        }
    }
    return mat;
};

MW.Matrix.prototype.setMatrix = function(arr) {
    util.checkArray(arr);
    util.checkFloat64Array(arr[0]);
    this.array = arr;
    this.nrows = arr.length;
    this.ncols = arr[0].length;
};

MW.Matrix.prototype.isSquare = function() {
    return this.nrows == this.ncols;
};

MW.Matrix.prototype.toString = function() {
    var str = "";
    for (var i = 0; i < this.nrows; ++i) {
        var row = "[";
        for (var j = 0; j < this.ncols - 1; ++j) {
            row += this.array[i][j] + ", ";
        }
        str += row + this.array[i][this.ncols-1] + "]";
        if (i != this.nrows - 1) {
            str += "\n";
        }
    }
    return str;
};

MW.Matrix.prototype.plus = function(B) {
    checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] + B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.minus = function(B) {
    checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] - B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.timesElementwise = function(B) {
    checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] * B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.divide = function(B) {
    checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] / B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.scale = function(alpha) {
    util.checkNumber(alpha);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] * alpha;
        }
    }
    return C;
};

MW.Matrix.prototype.apply = function(fn) {
    util.checkFunction(fn);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = fn(this.array[i][j]);
        }
    }
    return C;
};

// Allocate new matrix and return to allow for arbitrary shaped matrices
MW.Matrix.prototype.transpose = function() {
    var B = new MW.Matrix(this.ncols, this.nrows);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            B.array[j][i] = this.array[i][j];
        }
    }
    return B;
};

// Only works for square matrices
MW.Matrix.prototype.transposeInPlace = function() {
    if (this.isSquare()) {
        for (var i = 0; i < this.nrows; ++i) {
            for (var j = i + 1; j < this.ncols; ++j) {
                var tmp = this.array[i][j];
                this.array[i][j] = this.array[j][i];
                this.array[j][i] = tmp;
            }
        }
    }
    return this;
};

// matrix-vector multiply: A.v
MW.Matrix.prototype.timesVector = function(v) {
    checkMatrixVector(this, v);
    var w = new MW.Vector(this.nrows);
    for (var i = 0; i < this.nrows; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.ncols; ++j) {
            tot += this.array[i][j] * v.array[j];
        }
        w.array[i] = tot;
    }
    return w;
};

// matrix-matrix multiply: A.B
// TODO: if alpha is specified: alpha * A.B
MW.Matrix.prototype.timesMatrix = function(B) {
    checkMatrixMatrix(this, B);
    var C = new MW.Matrix(this.nrows, B.ncols);
    // Transpose B for better row-major memory access
    var Bt = B.transpose();
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < B.ncols; ++j) {
            var tot = 0.0;
            for (var k = 0; k < this.ncols; ++k) {
                tot += this.array[i][k] * Bt.array[j][k];
            }
            C.array[i][j] = tot;
        }
    }
    return C;
};

MW.Matrix.prototype.wkPlus = function(B, tag, rebroadcast) {
    checkMatrices(this, B);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] + B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkMinus = function(B, tag, rebroadcast) {
    checkMatrices(this, B);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] - B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkTimes = function(B, tag, rebroadcast) {
    checkMatrices(this, B);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] * B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkDividedBy = function(B, tag, rebroadcast) {
    checkMatrices(this, B);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] / B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkScale = function(alpha, tag, rebroadcast) {
    util.checkNumber(alpha);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = alpha * this.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkApply = function(fn, tag, rebroadcast) {
    util.checkFunction(fn);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = fn(this.array[i][j]);
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

// matrix-vector multiply: A.v
MW.Matrix.prototype.wkTimesVector = function(v, tag, rebroadcast) {
    checkMatrixVector(this, v);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.ncols; ++j) {
            tot += this.array[i][j] * v.array[j];
        }
        w[offset++] = tot;
    }
    MW.MathWorker.gatherVector(w, tag, rebroadcast);
};

// C = A.B
MW.Matrix.prototype.wkTimesMatrix = function(B, tag, rebroadcast) {
    checkMatrixMatrix(this, B);
    util.checkNotNullOrUndefined(tag);

    // Transpose B for better row-major memory access
    // If square, save on memory by doing an in-place transpose
    var Bt = B.isSquare() ? B.transposeInPlace() : B.transpose();

    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(B.ncols));
        for (var j = 0; j < B.ncols; ++j) {
            var tot = 0.0;
            for (var k = 0; k < this.ncols; ++k) {
                tot += this.array[i][k] * Bt.array[j][k];
            }
            C[offset][j] = tot;
        }
        ++offset;
    }

    // restore B
    if (B.isSquare) {
        B.transposeInPlace();
    }

    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};


/**
 *  Matrix helper functions
 */

/**
 *  Verify that A is a Matrix and is not null or undefined
 */
function checkMatrix(A) {
    util.checkNotNullOrUndefined(A);
    if (!(A instanceof Matrix)) {
        throw new TypeError("Expected type Matrix but is not.");
    }
}

/**
 *  Verify that Matrix A and Matrix B have equal dimensions and are neither null nor undefined
 */
function checkMatrices(A, B) {
    checkMatrix(A);
    checkMatrix(B);
    if (!(A.nrows === B.nrows && A.ncols === B.ncols)) {
        throw new Error("Matrices do not have equal numbers of rows and columns.");
    }
}

/**
 *  Verify that Matrix A and Vector v are compatible for matrix-vector products
 *  and are both not null or undefined
 */
function checkMatrixVector(A, v) {
    checkMatrix(A);
    checkVector(v);
    if (v.length !== A.ncols) {
        throw new Error("Vector length and number Matrix columns are unequal.");
    }
}

/**
 *  Verify that Matrix A and Matrix B have compatible dimensions for matrix-matrix
 *  multiplication and are neither null nor undefined
 */
function checkMatrixMatrix(A, B) {
    checkMatrix(A);
    checkMatrix(B);
    if (A.ncols !== B.nrows) {
        throw new Error("Matrices do not have compatible dimensions for matrix-matrix multiplication.");
    }
}


return MW;
}());