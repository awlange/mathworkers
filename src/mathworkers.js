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
 *  MathWorkers globally available data
 */
var global = {};

// Globally scoped useful variables, defaults
global.workerPool = [];
global.nWorkers = 1;
global.myWorkerId = 0;

// Log
global.logLevel = 1;

// If true, use loop unrolled versions of functions if available. If false, do not.
global.unrollLoops = true;

global.createPool = function(nWorkersInput, workerScriptName, logLevel) {
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

// Copyright 2014 Adrian W. Lange

/**
 *  General utility functions intended for internal use
 */
MW.util = {};

/**
 * Load balancing function.
 * Divides n up evenly among the number of workers in the pool.
 * Any remainder is distributed such that no worker has more than 1 extra piece in its range.
 */
MW.util.loadBalance = function(n) {
    var id = global.myWorkerId;
	var div = Math.floor(n / global.nWorkers);
	var rem = n % global.nWorkers;

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
 *  Verify that x is neither null nor undefined.
 */
MW.util.checkNullOrUndefined = function(x) {
    if (x === undefined || x === null) {
        throw new TypeError("Undefined or null variable.");
    }
};

/**
 *  Verify that x is a Number and not null or undefined
 */
MW.util.checkNumber = function(x) {
    MW.util.checkNullOrUndefined(x);
    if (typeof x != 'number') {
        throw new TypeError("Expected type Number but is type " + typeof x);
    }
};

/**
 *  Verify that x is a Function and not null or undefined
 */
MW.util.checkFunction = function(x) {
    MW.util.checkNullOrUndefined(x);
    if (typeof x != 'function') {
        throw new TypeError("Expected type Function but is type " + typeof x);
    }
};

/**
 *  Verify that x is an Array or Float64Array and not null or undefined
 */
MW.util.checkArray = function(x) {
    MW.util.checkNullOrUndefined(x);
    if (!(x instanceof Array || x instanceof Float64Array)) {
        throw new TypeError("Expected type Array but is type " + typeof x);
    }
};

/**
 *  Verify that x is a Float64Array and not null or undefined
 */
MW.util.checkFloat64Array = function(x) {
    MW.util.checkNullOrUndefined(x);
    if (!(x instanceof Float64Array)) {
        throw new TypeError("Expected type Float64Array but is type " + typeof x);
    }
};

/**
 *  Verify that v is a Vector and is not null or undefined
 */
MW.util.checkVector = function(v) {
    MW.util.checkNullOrUndefined(v);
    if (!(v instanceof MW.Vector)) {
        throw new TypeError("Expected type Vector but is not.");
    }
};

/**
 *  Verify that Vectors v and w are equal length and not null or undefined
 */
MW.util.checkVectors = function(v, w) {
    MW.util.checkVector(v);
    MW.util.checkVector(w);
    if (v.length !== w.length) {
        throw new Error("Vectors have unequal lengths.");
    }
};

/**
 *  Verify that Vector v and Matrix A are compatible for vector-matrix products
 *  and are both not null or undefined
 */
MW.util.checkVectorMatrix = function(v, A) {
    MW.util.checkVector(v);
    MW.util.checkMatrix(A);
    if (v.length !== A.nrows) {
        throw new Error("Vector length and number Matrix rows are unequal.");
    }
};

/**
 *  Verify that A is a Matrix and is not null or undefined
 */
MW.util.checkMatrix = function(A) {
    MW.util.checkNullOrUndefined(A);
    if (!(A instanceof MW.Matrix)) {
        throw new TypeError("Expected type Matrix but is not.");
    }
};

/**
 *  Verify that Matrix A and Matrix B have equal dimensions and are neither null nor undefined
 */
MW.util.checkMatrices = function(A, B) {
    MW.util.checkMatrix(A);
    MW.util.checkMatrix(B);
    if (!(A.nrows === B.nrows && A.ncols === B.ncols)) {
        throw new Error("Matrices do not have equal numbers of rows and columns.");
    }
};

/**
 *  Verify that Matrix A and Vector v are compatible for matrix-vector products
 *  and are both not null or undefined
 */
MW.util.checkMatrixVector = function(A, v) {
    MW.util.checkMatrix(A);
    MW.util.checkVector(v);
    if (v.length !== A.ncols) {
        throw new Error("Vector length and number Matrix columns are unequal.");
    }
};

/**
 *  Verify that Matrix A and Matrix B have compatible dimensions for matrix-matrix
 *  multiplication and are neither null nor undefined
 */
MW.util.checkMatrixMatrix = function(A, B) {
    MW.util.checkMatrix(A);
    MW.util.checkMatrix(B);
    if (A.ncols !== B.nrows) {
        throw new Error("Matrices do not have compatible dimensions for matrix-matrix multiplication.");
    }
};

// Copyright 2014 Adrian W. Lange

/**
 *  Custom event emitter
 */
function EventEmitter() {
    var events = {};

    this.on = function(name, callback) {
        events[name] = [callback];
    };

    this.emit = function(name, args) {
        events[name] = events[name] || [];
        args = args || [];
        events[name].forEach( function(fn) {
            fn.call(this, args);
        });
    };
}

// Copyright 2014 Adrian W. Lange

/**
 *  Coordinator for browser-side interface
 */
MW.Coordinator = function(nWorkersInput, workerScriptName, logLevel, unrollLoops) {
	var that = this;
	var objectBuffer = {};
	var messageDataBuffer = [];
	this.ready = false;

    // Set log level if specified
    if (logLevel !== undefined && logLevel !== null) {
        global.logLevel = logLevel;
    }

    // Whether or not to use loop unrolling in certain functions
    if (unrollLoops !== undefined && unrollLoops !== null) {
        global.unrollLoops = unrollLoops;
    }

	// Create the worker pool, which starts the workers
	global.createPool(nWorkersInput, workerScriptName);

	this.getBuffer = function() {
		return objectBuffer;
	};

	this.getMessageDataList = function() {
		return messageDataBuffer;
	};

	this.trigger = function(tag, args) {
		for (var wk = 0; wk < global.nWorkers; ++wk) {
			global.getWorker(wk).postMessage({handle: "_trigger", tag: tag, args: args});
		}
	};

	this.sendDataToWorkers = function(dat, tag) {
		for (var wk = 0; wk < global.nWorkers; ++wk) {
			global.getWorker(wk).postMessage({handle: "_broadcastData", tag: tag, data: dat});
		}
	};

	this.sendVectorToWorkers = function(vec, tag) {
		// Must make a copy of the vector for each worker for transferable object message passing
		for (var wk = 0; wk < global.nWorkers; ++wk) {
			var v = new Float64Array(vec.array);
			global.getWorker(wk).postMessage({handle: "_broadcastVector", tag: tag,
				vec: v.buffer}, [v.buffer]);
		}
	};

	this.sendMatrixToWorkers = function(mat, tag) {
		// Must make a copy of each matrix row for each worker for transferable object message passing
		for (var wk = 0; wk < global.nWorkers; ++wk) {
			var matObject = {handle: "_broadcastMatrix", tag: tag, nrows: mat.nrows};
			var matBufferList = [];
			for (var i = 0; i < mat.nrows; ++i) {
				var row = new Float64Array(mat.array[i]);
				matObject[i] = row.buffer;
				matBufferList.push(row.buffer);
			}
			global.getWorker(wk).postMessage(matObject, matBufferList);
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
 			 case "_gatherMatrixRows":
 				handleGatherMatrixRows(data);
 				break;
            case "_gatherMatrixColumns":
                handleGatherMatrixColumns(data);
                break;
  			case "_vectorNorm":
 				handleVectorNorm(data);
 				break;
  			case "_vectorSum":
 				handleVectorSum(data);
 				break;
 			default:
 				console.error("Invalid Coordinator handle: " + data.handle);
 		}
 	};

 	// Register the above onmessageHandler for each worker in the pool
 	// Also, initialize the message data buffer with empty objects
 	for (var wk = 0; wk < global.nWorkers; ++wk) {
 		global.getWorker(wk).onmessage = onmessageHandler;
 		messageDataBuffer.push({});
 	}

 	// Reduction function variables
 	var nWorkersReported = 0;
 	var tot = 0.0;
 	var gatherVector = {};
 	var gatherMatrix = {};

 	var handleWorkerReady = function() {
 		nWorkersReported += 1;
 		if (nWorkersReported == global.nWorkers) {
 			that.ready = true;
 			that.emit("_ready");
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	};

 	var handleSendData = function(data) {
 		messageDataBuffer[data.id] = data.data;
 		nWorkersReported += 1;
 		if (nWorkersReported == global.nWorkers) {
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
		if (nWorkersReported == global.nWorkers) {
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
		for (var i = 0; i < global.nWorkers; ++i) {
			for (var j = 0; j < gatherVector[i].length; ++j) {
				vec[offset + j] = gatherVector[i][j];
			}
			offset += gatherVector[i].length;
		}
		return vec;
	};

	var handleGatherMatrixRows = function(data) {
		// Reduce the matrix rows from each worker
        var offset = data.offset;
        if (nWorkersReported == 0) {
            objectBuffer = new MW.Matrix(data.nrows, data.ncols);
        }
        for (var i = 0; i < data.nrowsPart; ++i) {
			objectBuffer.array[offset + i] = new Float64Array(data[i]);
		}

		nWorkersReported += 1;
		if (nWorkersReported == global.nWorkers) {
			// build the full vector and save to buffer
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

    var handleGatherMatrixColumns = function(data) {
        // Reduce the matrix columns from each worker
        var i, k;
        if (nWorkersReported == 0) {
            objectBuffer = new MW.Matrix(data.nrows, data.ncols);
        }

        // array in data is transposed
        var tmpArray;
        var offset = data.offset;
        var offsetk;
        for (k = 0; k < data.nrowsPart; ++k) {
            tmpArray = new Float64Array(data[k]);
            offsetk = offset + k;
            for (i = 0; i < tmpArray.length; ++i) {
                objectBuffer.array[i][offsetk] = tmpArray[i];
            }
        }

        nWorkersReported += 1;
        if (nWorkersReported == global.nWorkers) {
            if (data.rebroadcast) {
                that.sendMatrixToWorkers(objectBuffer, data.tag);
            } else {
                // emit
                that.emit(data.tag);
            }
            //reset
            nWorkersReported = 0;
            tot = 0;
        }
    };

	var handleVectorNorm = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == global.nWorkers) {
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
		if (nWorkersReported == global.nWorkers) {
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
 		return global.myWorkerId;
 	};

 	this.getNumWorkers = function() {
 		return global.nWorkers;
 	};

	this.getBuffer = function() {
		return objectBuffer;
	};

 	this.sendDataToCoordinator = function(data, tag) {
 		self.postMessage({handle: "_sendData", id: global.myWorkerId, tag: tag, data: data});
 	};

    this.sendVectorToCoordinator = function(vec, tag) {
        // only id 0 does the sending actually
        if (global.myWorkerId == 0) {
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
        if (global.logLevel > 2) {
            console.log("registering trigger: " + tag);
        }
        triggers[tag] = [callback];
    };

 	var handleInit = function(data) {
        global.myWorkerId = data.id;
        global.nWorkers = data.nWorkers;
        global.unrollLoops = data.unrollLoops;
        global.logLevel = data.logLevel;
 		if (global.logLevel > 2) {
            console.log("Initialized MathWorker: " + global.myWorkerId + " of " + global.nWorkers + " workers.");
        }
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
			console.error("Unregistered trigger tag: " + data.tag);
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
    self.postMessage({handle: "_gatherVector", tag: tag, id: global.myWorkerId, rebroadcast: rebroadcast,
        len: vec.length, vectorPart: vec.buffer}, [vec.buffer]);
};

MW.MathWorker.gatherMatrixRows = function(mat, totalRows, offset, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    var matObject = {handle: "_gatherMatrixRows", tag: tag, id: global.myWorkerId, rebroadcast: rebroadcast,
        nrows: totalRows, ncols: mat[0].length, nrowsPart: mat.length, offset: offset};
    var matBufferList = [];
    for (var i = 0; i < mat.length; ++i) {
        matObject[i] = mat[i].buffer;
        matBufferList.push(mat[i].buffer);
    }
    self.postMessage(matObject, matBufferList);
};

MW.MathWorker.gatherMatrixColumns = function(mat, totalRows, totalCols, offset, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    var matObject = {handle: "_gatherMatrixColumns", tag: tag, id: global.myWorkerId, rebroadcast: rebroadcast,
        nrows: totalRows, ncols: totalCols, nrowsPart: mat.length, offset: offset};
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
 *  A wrapper around a Float64Array
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
    MW.util.checkArray(arr);
    var vec = new MW.Vector(arr.length);
    for (var i = 0; i < arr.length; ++i) {
        vec.array[i] = arr[i];
    }
    return vec;
};

MW.Vector.prototype.setVector = function(arr) {
    MW.util.checkFloat64Array(arr);
    this.array = arr;
    this.length = arr.length;
};

MW.Vector.randomVector = function(size) {
    var vec = new Vector(size);
    for (var i = 0; i < size; ++i) {
        vec.array[i] = Math.random();
    }
    return vec;
};

MW.Vector.prototype.toString = function() {
    var str = "[";
    for (var i = 0; i < this.length - 1; ++i) {
        str += this.array[i] + ", ";
    }
    return str + this.array[this.length-1] + "]";
};

MW.Vector.prototype.plus = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] + w.array[i];
    }
    return result;
};

MW.Vector.prototype.minus = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] - w.array[i];
    }
    return result;
};

MW.Vector.prototype.timesElementwise = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] * w.array[i];
    }
    return result;
};

MW.Vector.prototype.divide = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] / w.array[i];
    }
    return result;
};

MW.Vector.prototype.scale = function(alpha) {
    MW.util.checkNumber(alpha);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] * alpha;
    }
    return result;
};

MW.Vector.prototype.apply = function(fn) {
    MW.util.checkFunction(fn);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = fn(this.array[i]);
    }
    return result;
};

MW.Vector.prototype.dot = function(w) {
    MW.util.checkVectors(this, w);
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
    MW.util.checkVectorMatrix(this, A);
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
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] + w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkMinus = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] - w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkTimesElementwise = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkDivide = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] / w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkScale = function(alpha, tag, rebroadcast) {
    MW.util.checkNumber(alpha);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * alpha;
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkApply = function(fn, tag, rebroadcast) {
    MW.util.checkFunction(fn);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = fn(this.array[i]);
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkNorm = function(tag, rebroadcast) {
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i] * this.array[i];
    }
    MW.MathWorker.reduceVectorNorm(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkDot = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i] * w.array[i];
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkSum = function(tag, rebroadcast) {
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i];
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

// vector-matrix multiply: v.A
MW.Vector.prototype.wkTimesMatrix = function(A, tag, rebroadcast) {
    MW.util.checkVectorMatrix(this, A);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(A.ncols);
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


// Copyright 2014 Adrian W. Lange

/**
 *  Matrix class
 *
 *  A wrapper around an array of Float64Array objects
 */
MW.Matrix = function(nrows, ncols) {
    this.array = [];
    this.nrows = nrows || 0;
    this.ncols = ncols || 0;

    if (nrows > 0 && ncols > 0) {
        this.array = new Array(nrows);
        for (var r = 0; r < nrows; ++r) {
            this.array[r] = new Float64Array(ncols);
        }
    }
};

// Deep copy the array
MW.Matrix.fromArray = function(arr) {
    MW.util.checkArray(arr);
    var mat = new MW.Matrix(arr.length, arr[0].length);
    for (var i = 0; i < arr.length; ++i) {
        for (var j = 0; j < arr[i].length; ++j) {
            mat.array[i][j] = arr[i][j];
        }
    }
    return mat;
};

MW.Matrix.prototype.setMatrix = function(arr) {
    MW.util.checkArray(arr);
    MW.util.checkFloat64Array(arr[0]);
    this.array = arr;
    this.nrows = arr.length;
    this.ncols = arr[0].length;
};

MW.Matrix.prototype.copyColumn = function(j, vec) {
    for (var i = 0, ni = this.nrows; i < ni; ++i) {
        vec[i] = this.array[i][j];
    }
};

MW.Matrix.prototype.copyRow = function(i, vec) {
    for (var j = 0, nj = this.ncols; j < nj; ++j) {
        vec[j] = this.array[i][j];
    }
};

MW.Matrix.prototype.isSquare = function() {
    return this.nrows == this.ncols;
};

MW.Matrix.zeroes = function(n, m) {
    var mat = new MW.Matrix(n, m);
    for (var i = 0; i < n; ++i) {
        for (var j = 0; j < m; ++j) {
            mat.array[i][j] = 0.0;
        }
    }
    return mat;
};

MW.Matrix.identity = function(n) {
    var mat = new MW.Matrix(n, n);
    for (var i = 0; i < n; ++i) {
        for (var j = 0; j < n; ++j) {
            mat.array[i][j] = 0.0;
        }
        mat.array[i][i] = 1.0;
    }
    return mat;
};

MW.Matrix.randomMatrix = function(nrows, ncols) {
    var mat = new Matrix(nrows, ncols);
    for (var i = 0; i < nrows; ++i) {
        for (var j = 0; j < ncols; ++j) {
            mat.array[i][j] = Math.random();
        }
    }
    return mat;
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
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] + B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.minus = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] - B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.timesElementwise = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] * B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.divide = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] / B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.scale = function(alpha) {
    MW.util.checkNumber(alpha);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] * alpha;
        }
    }
    return C;
};

MW.Matrix.prototype.apply = function(fn) {
    MW.util.checkFunction(fn);
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
    MW.util.checkMatrixVector(this, v);
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
MW.Matrix.prototype.timesMatrix = function(B) {
    MW.util.checkMatrixMatrix(this, B);
    var C = new MW.Matrix(this.nrows, B.ncols);

    var i, j, k, tot;
    var ni = this.nrows;
    var nj = this.ncols;
    var nk = B.ncols;

    var nj1 = nj - 3;

    var Bk = new Float64Array(nj);
    if (global.unrollLoops) {
        for (k = 0; k < nk; ++k) {
            B.copyColumn(k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                for (j = 0; j < nj1; j += 4) {
                    tot += this.array[i][j] * Bk[j]
                        + this.array[i][j + 1] * Bk[j + 1]
                        + this.array[i][j + 2] * Bk[j + 2]
                        + this.array[i][j + 3] * Bk[j + 3];
                }
                for (; j < nj; ++j) {
                    tot += this.array[i][j] * Bk[j];
                }
                C.array[i][k] = tot;
            }
        }
    } else {
        for (k = 0; k < nk; ++k) {
            B.copyColumn(k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                for (j = 0; j < nj; ++j) {
                    tot += this.array[i][j] * Bk[j];
                }
                C.array[i][k] = tot;
            }
        }
    }
    return C;
};

MW.Matrix.prototype.wkPlus = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] + B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkMinus = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] - B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkTimesElementwise = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] * B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkDivide = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] / B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkScale = function(alpha, tag, rebroadcast) {
    MW.util.checkNumber(alpha);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = alpha * this.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkApply = function(fn, tag, rebroadcast) {
    MW.util.checkFunction(fn);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = fn(this.array[i][j]);
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

// matrix-vector multiply: A.v
MW.Matrix.prototype.wkTimesVector = function(v, tag, rebroadcast) {
    MW.util.checkMatrixVector(this, v);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
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
    MW.util.checkMatrixMatrix(this, B);
    MW.util.checkNullOrUndefined(tag);

    var i, j, k, tot;
    var ni = this.nrows;
    var nj = this.ncols;
    var lb = MW.util.loadBalance(B.ncols);
    var nk = lb.ito - lb.ifrom;

    var nj1 = nj - 3;

    // transposed
    var C = new Array(nk);
    for (k = 0; k < nk; ++k) {
        C[k] = new Float64Array(ni);
    }

    var Bk = new Float64Array(nj);
    if (global.unrollLoops) {
        for (k = 0; k < nk; ++k) {
            B.copyColumn(lb.ifrom + k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                for (j = 0; j < nj1; j += 4) {
                    tot += this.array[i][j] * Bk[j]
                        + this.array[i][j + 1] * Bk[j + 1]
                        + this.array[i][j + 2] * Bk[j + 2]
                        + this.array[i][j + 3] * Bk[j + 3];
                }
                for (; j < nj; ++j) {
                    tot += this.array[i][j] * Bk[j];
                }
                C[k][i] = tot;
            }
        }
    } else {
        for (k = 0; k < nk; ++k) {
            B.copyColumn(lb.ifrom + k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                for (j = 0; j < nj; ++j) {
                    tot += this.array[i][j] * Bk[j];
                }
                C[k][i] = tot;
            }
        }
    }

    MW.MathWorker.gatherMatrixColumns(C, this.nrows, B.ncols, lb.ifrom, tag, rebroadcast);
};


// Copyright 2014 Adrian W. Lange

/**
 *  Batch-operation methods
 *
 *  Combine multiple primitive Vector and/or Matrix operations into a single
 *  method call, reducing some overhead, especially with regard to communication.
 */

MW.BatchOperation = {};

MW.BatchOperation.wkVectorLinearCombination = function(vectors, coefficients, tag, rebroadcast) {
    MW.util.checkNumber(coefficients[0]);
    MW.util.checkVector(vectors[0]);
    MW.util.checkNullOrUndefined(tag);

    // First combo initializes x
    var offset = 0;
    var vec = vectors[0];
    var coeff = coefficients[0];
    var lb = MW.util.loadBalance(vec.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = coeff * vec.array[i];
    }

    // Remaining combos
    for (var a = 1; a < vectors.length; ++a) {
        offset = 0;
        vec = vectors[a];
        coeff = coefficients[a];
        MW.util.checkNumber(coeff);
        MW.util.checkVectors(vectors[a-1], vec);
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] += coeff * vec.array[i];
        }
    }

    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.BatchOperation.wkMatrixLinearCombination = function(matrices, coefficients, tag, rebroadcast) {
    MW.util.checkNumber(coefficients[0]);
    MW.util.checkMatrix(matrices[0]);
    MW.util.checkNullOrUndefined(tag);

    // First combo initializes M
    var M = [];
    var offset = 0;
    var mat = matrices[0];
    var coeff = coefficients[0];
    var lb = MW.util.loadBalance(matrices[0].nrows);
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        M.push(new Float64Array(mat.ncols));
        for (var j = 0; j < mat.ncols; ++j) {
            M[offset][j] = coeff * mat.array[i][j];
        }
        ++offset;
    }

    // Remaining combos
    for (var a = 1; a < matrices.length; ++a) {
        offset = 0;
        mat = matrices[a];
        coeff = coefficients[a];
        MW.util.checkNumber(coeff);
        MW.util.checkMatrices(matrices[a-1], mat);
        for (i = lb.ifrom; i < lb.ito; ++i) {
            for (j = 0; j < mat.ncols; ++j) {
                M[offset][j] += coeff * mat.array[i][j]
            }
            ++offset;
        }
    }

    MW.MathWorker.gatherMatrixRows(M, mat.nrows, lb.ifrom, tag, rebroadcast);
};

// z <- alpha * A.x + beta * y
MW.BatchOperation.wkMatrixVectorPlus = function(alpha, A, x, tag, rebroadcast, beta, y) {
    MW.util.checkNumber(alpha);
    MW.util.checkMatrixVector(A, x);
    MW.util.checkNullOrUndefined(tag);

    var lb = MW.util.loadBalance(A.nrows);
    var z = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    if (beta && y) {
        MW.util.checkNumber(beta);
        MW.util.checkVectors(x, y);
        for (var i = lb.ifrom; i < lb.ito; ++i) {
            var tot = 0.0;
            for (var j = 0; j < this.ncols; ++j) {
                tot += A.array[i][j] * v.array[j];
            }
            z[offset++] = alpha * tot + beta * y[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot = 0.0;
            for (j = 0; j < this.ncols; ++j) {
                tot += A.array[i][j] * v.array[j];
            }
            z[offset++] = alpha * tot;
        }
    }
    MW.MathWorker.gatherVector(z, tag, rebroadcast);


};


// D = alpha * A.B + beta * C
MW.BatchOperation.wkMatrixMatrixPlus = function(alpha, A, B, tag, rebroadcast, beta, C) {
    MW.util.checkNumber(alpha);
    MW.util.checkMatrixMatrix(A, B);
    MW.util.checkNullOrUndefined(tag);

    // Transpose B for better row-major memory access
    // If square, save on memory by doing an in-place transpose
    var Bt = B.isSquare() ? B.transposeInPlace() : B.transpose();
    var lb = MW.util.loadBalance(A.nrows);
    var D = [];
    var offset = 0;

    if (beta && C) {
        MW.util.checkNumber(beta);
        MW.util.checkMatrix(C);
        if (!(A.nrows === C.nrows && B.ncols === C.ncols)) {
            throw new Error("Matrix dimensions not compatible for addition.");
        }

        for (var i = lb.ifrom; i < lb.ito; ++i) {
            D.push(new Float64Array(B.ncols));
            for (var j = 0; j < B.ncols; ++j) {
                var tot = 0.0;
                for (var k = 0; k < A.ncols; ++k) {
                    tot += A.array[i][k] * Bt.array[j][k];
                }
                D[offset][j] = alpha * tot + beta * C.array[i][j];
            }
            ++offset;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            D.push(new Float64Array(B.ncols));
            for (j = 0; j < B.ncols; ++j) {
                tot = 0.0;
                for (k = 0; k < A.ncols; ++k) {
                    tot += A.array[i][k] * Bt.array[j][k];
                }
                D[offset][j] = alpha * tot;
            }
            ++offset;
        }
    }

    // restore B
    if (B.isSquare) {
        B.transposeInPlace();
    }

    MW.MathWorker.gatherMatrixRows(D, A.nrows, lb.ifrom, tag, rebroadcast);
};


return MW;
}());